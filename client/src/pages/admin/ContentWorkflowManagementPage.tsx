import React from 'react';
import { Helmet } from 'react-helmet';
import AdminLayout from '@/components/layouts/AdminLayout';
import ContentWorkflowManager from '@/components/admin/ContentWorkflowManager';

export default function ContentWorkflowManagementPage() {
  return (
    <AdminLayout>
      <Helmet>
        <title>Content Workflow Management | Admin Portal</title>
      </Helmet>
      <ContentWorkflowManager />
    </AdminLayout>
  );
}