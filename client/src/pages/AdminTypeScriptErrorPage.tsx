import React from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import TypeScriptErrorScanner from '@/components/admin/TypeScriptErrorScanner';

const AdminTypeScriptErrorPage: React.FC = () => {
  return (
    <AdminLayout>
      <TypeScriptErrorScanner />
    </AdminLayout>
  );
};

export default AdminTypeScriptErrorPage;