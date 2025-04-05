/**
 * DEPRECATED: This layout is now superseded by MainLayout.tsx
 * Please use the MainLayout component instead for all new pages.
 */

import React from 'react';
import { MainLayout } from './layout/MainLayout';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Now just passes through to the new MainLayout component
  return <MainLayout>{children}</MainLayout>;
};

export default Layout;