/**
 * Layout Component Index
 * 
 * Exports primary layout components for use throughout the application.
 */

import { MainLayout } from './MainLayout';
import { MainHeader } from './MainHeader';
import { MainFooter } from './MainFooter';
import { MainNavigation } from './MainNavigation';
import { Footer } from './Footer';
import { Header } from './Header';

// Default export is MainLayout for backwards compatibility
export default MainLayout;

// Named exports for specific components
export {
  MainLayout,
  MainHeader,
  MainFooter,
  MainNavigation,
  Footer,
  Header
};