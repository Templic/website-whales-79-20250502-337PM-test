/**
 * ContentManagementPage.tsx
 * 
 * Admin page for managing website content
 * Provides an interface for editing text and images across the site
 */
import AdminLayout from "@/components/layouts/AdminLayout";
import AdminEditor from "@/components/admin/AdminEditor";

export default function ContentManagementPage() {
  return (
    <AdminLayout>
      <AdminEditor />
    </AdminLayout>
  );
}