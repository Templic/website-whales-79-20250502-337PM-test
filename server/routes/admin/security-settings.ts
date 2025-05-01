/**
 * Admin Security Settings API Routes
 * 
 * Provides endpoints for managing security settings and viewing security events
 */
import express from 'express';
import { db } from '../../db';
import { 
  securitySettings, 
  securityEvents, 
  securityScans, 
  users 
} from '../../../shared/schema';
import { eq, and, desc, asc, sql, like, not, gt, lt, isNotNull, isNull } from 'drizzle-orm';
import { runSecurityScan } from '../../securityScan';

const router = express.Router();

// Authentication middleware for admin-only access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // @ts-ignore: User role property should exist
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  
  next();
};

// Super admin only middleware
const requireSuperAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // @ts-ignore: User role property should exist
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin role required' });
  }
  
  next();
};

/**
 * GET /api/admin/security/settings
 * 
 * Retrieve all security settings
 */
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    // Get all security settings
    const settings = await db.select().from(securitySettings);
    
    // Group settings by category
    const groupedSettings: Record<string, any[]> = {};
    
    settings.forEach(setting => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = [];
      }
      groupedSettings[setting.category].push(setting);
    });
    
    // Format response
    const response = {
      settings: groupedSettings,
      categories: Object.keys(groupedSettings)
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ error: 'Failed to fetch security settings' });
  }
});

/**
 * PUT /api/admin/security/settings/:id
 * 
 * Update a security setting
 */
router.put('/settings/:id', requireAdmin, async (req, res) => {
  try {
    const settingId = parseInt(req.params.id);
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Setting value is required' });
    }
    
    // Get the current setting
    const [existingSetting] = await db
      .select()
      .from(securitySettings)
      .where(eq(securitySettings.id, settingId));
    
    if (!existingSetting) {
      return res.status(404).json({ error: 'Security setting not found' });
    }
    
    // Validate setting value based on its type
    let validatedValue = value;
    
    if (existingSetting.type === 'boolean') {
      if (typeof value !== 'boolean') {
        return res.status(400).json({ error: 'Value must be a boolean for this setting' });
      }
    } else if (existingSetting.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return res.status(400).json({ error: 'Value must be a number for this setting' });
      }
      validatedValue = numValue;
    } else if (existingSetting.type === 'string' && existingSetting.options) {
      // If setting has predefined options, validate against them
      const options = existingSetting.options as string[];
      if (!options.includes(value)) {
        return res.status(400).json({ 
          error: `Value must be one of the allowed options: ${options.join(', ')}` 
        });
      }
    }
    
    // Update the setting
    const [updatedSetting] = await db
      .update(securitySettings)
      .set({
        value: validatedValue,
        updatedAt: new Date(),
        updatedBy: req.user?.id
      })
      .where(eq(securitySettings.id, settingId))
      .returning();
    
    // Log security event
    await db.insert(securityEvents)
      .values({
        eventType: 'security_setting_changed',
        severity: 'info',
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        details: {
          settingId,
          settingKey: existingSetting.key,
          oldValue: existingSetting.value,
          newValue: validatedValue
        },
        timestamp: new Date()
      });
    
    res.json(updatedSetting);
  } catch (error) {
    console.error(`Error updating security setting with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update security setting' });
  }
});

/**
 * GET /api/admin/security/events
 * 
 * Retrieve security events with pagination and filtering
 */
router.get('/events', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'timestamp';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const eventType = req.query.eventType as string | undefined;
    const severity = req.query.severity as string | undefined;
    const userId = req.query.userId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    
    // Build the query
    let query = db.select({
      ...securityEvents,
      username: users.username
    }).from(securityEvents)
      .leftJoin(users, eq(securityEvents.userId, users.id));
    
    // Apply filters
    const conditions = [];
    
    if (eventType) {
      conditions.push(eq(securityEvents.eventType, eventType));
    }
    
    if (severity) {
      conditions.push(eq(securityEvents.severity, severity));
    }
    
    if (userId) {
      conditions.push(eq(securityEvents.userId, userId));
    }
    
    if (fromDate) {
      conditions.push(sql`${securityEvents.timestamp} >= ${new Date(fromDate)}`);
    }
    
    if (toDate) {
      conditions.push(sql`${securityEvents.timestamp} <= ${new Date(toDate)}`);
    }
    
    if (conditions.length > 0) {
      query = query.where(sql.and(...conditions));
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityEvents)
      .where(() => conditions.length > 0 ? sql.and(...conditions) : undefined);
    
    // Apply sorting and pagination to the query
    if (sortField === 'timestamp') {
      query = query.orderBy(sortOrder(securityEvents.timestamp));
    } else if (sortField === 'eventType') {
      query = query.orderBy(sortOrder(securityEvents.eventType));
    } else if (sortField === 'severity') {
      query = query.orderBy(sortOrder(securityEvents.severity));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const events = await query;
    
    // Return events with pagination metadata
    res.json({
      events,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

/**
 * GET /api/admin/security/scans
 * 
 * Retrieve security scans with pagination
 */
router.get('/scans', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Build the query
    const query = db.select({
      ...securityScans,
      initiatedByUsername: users.username
    }).from(securityScans)
      .leftJoin(users, eq(securityScans.initiatedBy, users.id))
      .orderBy(desc(securityScans.startTime))
      .limit(limit)
      .offset(offset);
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityScans);
    
    // Execute the query
    const scans = await query;
    
    // Return scans with pagination metadata
    res.json({
      scans,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching security scans:', error);
    res.status(500).json({ error: 'Failed to fetch security scans' });
  }
});

/**
 * GET /api/admin/security/scans/:id
 * 
 * Retrieve a specific security scan by ID
 */
router.get('/scans/:id', requireAdmin, async (req, res) => {
  try {
    const scanId = parseInt(req.params.id);
    
    // Get the scan with the initiator's username
    const [scan] = await db.select({
      ...securityScans,
      initiatedByUsername: users.username
    }).from(securityScans)
      .leftJoin(users, eq(securityScans.initiatedBy, users.id))
      .where(eq(securityScans.id, scanId));
    
    if (!scan) {
      return res.status(404).json({ error: 'Security scan not found' });
    }
    
    res.json(scan);
  } catch (error) {
    console.error(`Error fetching security scan with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch security scan' });
  }
});

/**
 * POST /api/admin/security/scan
 * 
 * Start a new security scan
 */
router.post('/scan', requireAdmin, async (req, res) => {
  try {
    const { scanTypes = ['all'] } = req.body;
    
    // Create a new scan record
    const [scan] = await db.insert(securityScans)
      .values({
        scanTypes,
        startTime: new Date(),
        status: 'in_progress',
        initiatedBy: req.user?.id,
        results: {}
      })
      .returning();
    
    // Start the security scan in the background
    runSecurityScan(scan.id, scanTypes, req.user?.id)
      .then(() => {
        console.log(`Security scan ${scan.id} completed`);
      })
      .catch(error => {
        console.error(`Error in security scan ${scan.id}:`, error);
        
        // Update the scan status to failed
        db.update(securityScans)
          .set({
            status: 'failed',
            endTime: new Date(),
            error: error.message
          })
          .where(eq(securityScans.id, scan.id))
          .execute()
          .catch(updateError => {
            console.error(`Error updating failed scan ${scan.id}:`, updateError);
          });
      });
    
    res.status(201).json({
      message: 'Security scan started',
      scan: {
        id: scan.id,
        status: scan.status,
        startTime: scan.startTime
      }
    });
  } catch (error) {
    console.error('Error starting security scan:', error);
    res.status(500).json({ error: 'Failed to start security scan' });
  }
});

/**
 * GET /api/admin/security/stats
 * 
 * Get security statistics for the admin dashboard
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get count of security events by severity
    const eventsBySeverity = await db
      .select({
        severity: securityEvents.severity,
        count: sql<number>`count(*)`
      })
      .from(securityEvents)
      .groupBy(securityEvents.severity);
    
    // Format severity counts
    const severityCounts: Record<string, number> = {
      info: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    eventsBySeverity.forEach(item => {
      if (item.severity) {
        severityCounts[item.severity] = item.count;
      }
    });
    
    // Get count of security events in the last 24 hours
    const [recentEvents] = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityEvents)
      .where(sql`${securityEvents.timestamp} >= NOW() - INTERVAL '24 hours'`);
    
    // Get the most recent security scan
    const [latestScan] = await db
      .select()
      .from(securityScans)
      .orderBy(desc(securityScans.startTime))
      .limit(1);
    
    // Get count of security settings by status
    const [settingsStats] = await db
      .select({
        total: sql<number>`count(*)`,
        enabled: sql<number>`sum(case when ${securitySettings.value}::text = 'true' then 1 else 0 end)`,
        disabled: sql<number>`sum(case when ${securitySettings.value}::text = 'false' then 1 else 0 end)`
      })
      .from(securitySettings)
      .where(eq(securitySettings.type, 'boolean'));
    
    // Return combined statistics
    res.json({
      events: {
        total: eventsBySeverity.reduce((sum, item) => sum + item.count, 0),
        bySeverity: severityCounts,
        last24Hours: recentEvents.count
      },
      scans: {
        latest: latestScan || null
      },
      settings: {
        total: settingsStats.total || 0,
        enabled: settingsStats.enabled || 0,
        disabled: settingsStats.disabled || 0
      }
    });
  } catch (error) {
    console.error('Error fetching security statistics:', error);
    res.status(500).json({ error: 'Failed to fetch security statistics' });
  }
});

export default router;