/**
 * TypeScriptErrorsPage.tsx
 * 
 * Admin page for managing TypeScript errors and configuring the error scanner
 */
import { Suspense } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import TypeScriptErrorScanner from "@/components/admin/TypeScriptErrorScanner";
import { Helmet } from "react-helmet";

export default function TypeScriptErrorsPage() {
  return (
    <AdminLayout>
      <Helmet>
        <title>TypeScript Errors | Admin Portal</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">TypeScript Error Management</h1>
        </div>
        <div className="flex flex-col gap-8">
          <p className="text-muted-foreground max-w-3xl">
            Scan the codebase for TypeScript errors, view detailed reports, and manage fixes with AI-powered assistance.
          </p>
          
          <Suspense fallback={<TypeScriptErrorScannerSkeleton />}>
            <TypeScriptErrorScanner />
          </Suspense>
        </div>
      </div>
    </AdminLayout>
  );
}

// Skeleton loading state for the scanner component
function TypeScriptErrorScannerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="w-full h-12 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="w-full h-10 rounded-lg" />
        <Skeleton className="w-full h-64 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="w-full h-24 rounded-lg" />
        <Skeleton className="w-full h-24 rounded-lg" />
        <Skeleton className="w-full h-24 rounded-lg" />
        <Skeleton className="w-full h-24 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-full h-12 rounded-lg" />
        <Skeleton className="w-full h-12 rounded-lg" />
        <Skeleton className="w-full h-12 rounded-lg" />
      </div>
    </div>
  );
}