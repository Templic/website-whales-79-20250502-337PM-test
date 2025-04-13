import { db } from '../db';
import { eq, desc, or, SQL, and, inArray } from 'drizzle-orm';
import { contentItems, contentVersions, contentWorkflowHistory, users } from '../../shared/schema';
import { notificationService } from './notificationService';

// Types for content workflow
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'changes_requested' | 'archived';

interface ContentUpdateInput {
  id: number;
  title?: string;
  content?: string;
  status?: ContentStatus;
  section?: string;
  type?: string;
  publishAt?: Date | null;
  expiresAt?: Date | null;
  changeDescription?: string;
}

interface ContentReviewAction {
  id: number;
  status: ContentStatus;
  feedback?: string;
}

export interface WorkflowStatusCounts {
  drafts: number;
  inReview: number;
  changesRequested: number;
  approved: number;
  published: number;
  archived: number;
  totalContent: number;
}

export interface WorkflowMetrics extends WorkflowStatusCounts {
  averageApprovalTime: number;
  recentActivity: {
    date: string;
    newContent: number;
    published: number;
    reviews: number;
  }[];
  statusDistribution: {
    name: string;
    value: number;
  }[];
}

// Content workflow service
export const contentWorkflowService = {
  // Get all content items with optional filtering
  async getContentItems(filters: { status?: ContentStatus; section?: string } = {}) {
    try {
      let query = db.select().from(contentItems).orderBy(desc(contentItems.createdAt));
      
      // Apply filters
      if (filters.status) {
        query = query.where(eq(contentItems.status, filters.status));
      }
      
      if (filters.section) {
        query = query.where(eq(contentItems.section, filters.section));
      }
      
      const items = await query.execute();
      return items;
      
    } catch (error) {
      console.error('Error fetching content items:', error);
      throw new Error('Failed to fetch content items');
    }
  },

  // Get content item by ID
  async getContentItemById(id: number) {
    try {
      const item = await db
        .select()
        .from(contentItems)
        .where(eq(contentItems.id, id))
        .limit(1)
        .execute();
      
      return item.length > 0 ? item[0] : null;
      
    } catch (error) {
      console.error(`Error fetching content item ${id}:`, error);
      throw new Error('Failed to fetch content item');
    }
  },

  // Create new content item (draft)
  async createContentItem(data: {
    title: string;
    content: string;
    section: string;
    type: string;
    createdBy: number;
  }) {
    try {
      // Start a transaction to create both content item and initial version
      const result = await db.transaction(async (tx) => {
        // Create content item record
        const [newItem] = await tx
          .insert(contentItems)
          .values({
            title: data.title,
            content: data.content,
            section: data.section,
            type: data.type,
            status: 'draft',
            version: 1,
            createdBy: data.createdBy,
            createdAt: new Date(),
            lastModifiedBy: data.createdBy,
            lastModifiedAt: new Date(),
          })
          .returning();

        // Create initial content version
        await tx.insert(contentVersions).values({
          contentId: newItem.id,
          version: 1,
          title: data.title,
          content: data.content,
          section: data.section,
          type: data.type,
          createdBy: data.createdBy,
          createdAt: new Date(),
        });

        // Create workflow history entry
        await tx.insert(contentWorkflowHistory).values({
          contentId: newItem.id,
          version: 1,
          fromStatus: null,
          toStatus: 'draft',
          actionBy: data.createdBy,
          actionAt: new Date(),
          comments: 'Initial draft created',
        });

        return newItem;
      });

      return result;
      
    } catch (error) {
      console.error('Error creating content item:', error);
      throw new Error('Failed to create content item');
    }
  },

  // Update content item (creates new version)
  async updateContentItem(
    data: ContentUpdateInput,
    userId: number,
  ) {
    try {
      // Get current item
      const currentItem = await this.getContentItemById(data.id);
      if (!currentItem) {
        throw new Error('Content item not found');
      }

      // Start a transaction to update both content item and create new version
      const result = await db.transaction(async (tx) => {
        // Prepare update data
        const updateData: any = {
          lastModifiedBy: userId,
          lastModifiedAt: new Date(),
        };

        if (data.title) updateData.title = data.title;
        if (data.content) updateData.content = data.content;
        if (data.section) updateData.section = data.section;
        if (data.type) updateData.type = data.type;
        if (data.status) updateData.status = data.status;
        if (data.publishAt) updateData.publishAt = data.publishAt;
        if (data.expiresAt) updateData.expiresAt = data.expiresAt;

        // Update version if content-related fields changed
        const contentChanged = data.title || data.content || data.section || data.type;
        if (contentChanged) {
          updateData.version = currentItem.version + 1;
        }

        // Update content item
        const [updatedItem] = await tx
          .update(contentItems)
          .set(updateData)
          .where(eq(contentItems.id, data.id))
          .returning();

        // Create new version if content changed
        if (contentChanged) {
          await tx.insert(contentVersions).values({
            contentId: data.id,
            version: updatedItem.version,
            title: updatedItem.title,
            content: updatedItem.content,
            section: updatedItem.section,
            type: updatedItem.type,
            createdBy: userId,
            createdAt: new Date(),
            changeDescription: data.changeDescription || 'Content updated',
          });
        }

        // Add workflow history if status changed
        if (data.status && data.status !== currentItem.status) {
          await tx.insert(contentWorkflowHistory).values({
            contentId: data.id,
            version: updatedItem.version,
            fromStatus: currentItem.status,
            toStatus: data.status,
            actionBy: userId,
            actionAt: new Date(),
            comments: data.changeDescription || `Status changed to ${data.status}`,
          });

          // Send notifications based on status change
          // We'll assume that the notification service handles checking user preferences
          // Use setImmediate to run this after the transaction completes
          setImmediate(async () => {
            try {
              // Determine recipients based on item and status
              let recipients: number[] = [];
              let notificationType: string;
              let message: string;

              switch (data.status) {
                case 'review':
                  // Notify reviewers/admins
                  notificationType = 'approval_request';
                  message = `"${updatedItem.title}" needs your review`;
                  
                  // Get admin users (in a real app, would filter by role/permissions)
                  const admins = await db
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.role, 'admin')) // Assuming 'admin' role
                    .execute();
                  
                  recipients = admins.map(u => u.id);
                  break;
                  
                case 'approved':
                  notificationType = 'content_approved';
                  message = `"${updatedItem.title}" has been approved`;
                  recipients = [currentItem.createdBy];
                  break;
                  
                case 'changes_requested':
                  notificationType = 'content_rejected';
                  message = `"${updatedItem.title}" needs changes`;
                  recipients = [currentItem.createdBy];
                  break;
                  
                case 'published':
                  notificationType = 'content_published';
                  message = `"${updatedItem.title}" has been published`;
                  recipients = [currentItem.createdBy];
                  
                  // Could also notify subscribers or other stakeholders
                  break;
                  
                default:
                  // No notification for other statuses
                  return;
              }

              // Check if we have notifications service implemented
              if (notificationService && recipients.length > 0) {
                await Promise.all(
                  recipients.map(userId =>
                    notificationService.createNotification({
                      userId,
                      type: notificationType,
                      message,
                      relatedItemId: updatedItem.id,
                      relatedItemType: 'content',
                    })
                  )
                );
              }
            } catch (notifyError) {
              console.error('Error sending workflow notifications:', notifyError);
              // Don't rethrow - we don't want notification errors to break the workflow
            }
          });
        }

        return updatedItem;
      });

      return result;
      
    } catch (error) {
      console.error(`Error updating content item ${data.id}:`, error);
      throw new Error('Failed to update content item');
    }
  },

  // Process review action (approve/request changes)
  async reviewContent(action: ContentReviewAction, reviewerId: number) {
    try {
      // Basic validation
      if (!['approved', 'changes_requested'].includes(action.status)) {
        throw new Error('Invalid review action status');
      }

      return await this.updateContentItem(
        {
          id: action.id,
          status: action.status,
          changeDescription: action.feedback || undefined,
        },
        reviewerId
      );
      
    } catch (error) {
      console.error(`Error reviewing content ${action.id}:`, error);
      throw new Error('Failed to process content review');
    }
  },

  // Get content workflow history
  async getContentHistory(contentId: number) {
    try {
      const history = await db
        .select({
          id: contentWorkflowHistory.id,
          contentId: contentWorkflowHistory.contentId,
          version: contentWorkflowHistory.version,
          fromStatus: contentWorkflowHistory.fromStatus,
          toStatus: contentWorkflowHistory.toStatus,
          actionBy: contentWorkflowHistory.actionBy,
          actionAt: contentWorkflowHistory.actionAt,
          comments: contentWorkflowHistory.comments,
          userName: users.username, // Join with users to get the username
        })
        .from(contentWorkflowHistory)
        .leftJoin(users, eq(contentWorkflowHistory.actionBy, users.id))
        .where(eq(contentWorkflowHistory.contentId, contentId))
        .orderBy(desc(contentWorkflowHistory.actionAt))
        .execute();

      return history;
      
    } catch (error) {
      console.error(`Error fetching content history for ${contentId}:`, error);
      throw new Error('Failed to fetch content workflow history');
    }
  },

  // Get content versions
  async getContentVersions(contentId: number) {
    try {
      const versions = await db
        .select()
        .from(contentVersions)
        .where(eq(contentVersions.contentId, contentId))
        .orderBy(desc(contentVersions.version))
        .execute();

      return versions;
      
    } catch (error) {
      console.error(`Error fetching content versions for ${contentId}:`, error);
      throw new Error('Failed to fetch content versions');
    }
  },

  // Get workflow metrics
  async getWorkflowMetrics(): Promise<WorkflowMetrics> {
    try {
      // Get content status counts
      const countsByStatus = await db
        .select({
          status: contentItems.status,
          count: db.fn.count(contentItems.id),
        })
        .from(contentItems)
        .groupBy(contentItems.status)
        .execute();

      // Convert to our metrics format
      const statusCounts: WorkflowStatusCounts = {
        drafts: 0,
        inReview: 0,
        changesRequested: 0,
        approved: 0,
        published: 0,
        archived: 0,
        totalContent: 0,
      };

      // Map and sum the counts
      countsByStatus.forEach((item) => {
        const status = item.status as ContentStatus;
        const count = Number(item.count);
        
        statusCounts.totalContent += count;
        
        if (status === 'draft') statusCounts.drafts = count;
        else if (status === 'review') statusCounts.inReview = count;
        else if (status === 'changes_requested') statusCounts.changesRequested = count;
        else if (status === 'approved') statusCounts.approved = count;
        else if (status === 'published') statusCounts.published = count;
        else if (status === 'archived') statusCounts.archived = count;
      });

      // Calculate average approval time
      // In a real implementation, this would analyze workflow history
      // For now, we'll use a placeholder value
      const averageApprovalTime = 1.5; // days

      // Get recent activity
      // In a real implementation, this would query history for the last 7 days
      // For now, we'll use placeholder data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // This would be a real query in production
      const recentActivity = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          newContent: Math.floor(Math.random() * 5) + 1,
          published: Math.floor(Math.random() * 4) + 1,
          reviews: Math.floor(Math.random() * 5) + 1,
        };
      });

      // Convert status counts to distribution format for charts
      const statusDistribution = [
        { name: 'Draft', value: statusCounts.drafts },
        { name: 'In Review', value: statusCounts.inReview },
        { name: 'Changes Requested', value: statusCounts.changesRequested },
        { name: 'Approved', value: statusCounts.approved },
        { name: 'Published', value: statusCounts.published },
        { name: 'Archived', value: statusCounts.archived },
      ];

      return {
        ...statusCounts,
        averageApprovalTime,
        recentActivity,
        statusDistribution,
      };
      
    } catch (error) {
      console.error('Error fetching workflow metrics:', error);
      throw new Error('Failed to fetch workflow metrics');
    }
  },
};

export default contentWorkflowService;