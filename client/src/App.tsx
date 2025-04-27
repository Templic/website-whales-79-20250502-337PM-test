import { Switch, Route, useLocation, Router } from "wouter";
// import { lazy } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ToastProvider } from "@/hooks/toast-context";
import Layout from "./components/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "./pages/not-found";
import { useEffect } from "react";
import { initializeGA, trackPageView } from "@/lib/analytics";
import { ErrorBoundary } from "react-error-boundary";
import StarBackground from "@/components/cosmic/StarBackground";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { ChatProvider } from "@/contexts/ChatContext";
import ChatWidget from "@/components/chat/ChatWidget";
import TaskadeWidget from "@/components/chat/TaskadeWidget";
import CookieConsent from "@/components/common/CookieConsent";
import ServiceWorkerManager from "@/components/common/ServiceWorkerManager";
import StylesProvider from "@/components/common/StylesProvider";
import FontLoader from "@/components/common/FontLoader";
import { ThemeController } from "@/components/ui/ThemeController";

// Pages
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ArchivedMusicPage from "@/pages/music/ArchivedMusic";
import TourPage from "@/pages/TourPage";
import EngagePage from "@/pages/EngagePage";
import NewsletterPage from "@/pages/NewsletterPage";
import BlogPage from "@/pages/blog/BlogPage";
import BlogPostPage from "@/pages/blog/BlogPostPage";
import CollaborationPage from "@/pages/CollaborationPage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/AuthPage";
import AdminPortalPage from "@/pages/admin/AdminPortalPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import EnhancedAnalyticsPage from "@/pages/admin/EnhancedAnalyticsPage";
import SecuritySettingsPage from "@/pages/admin/SecuritySettingsPage";
import SecurityAlertsPage from "@/pages/admin/SecurityAlertsPage";
import SecurityDashboardPage from "@/pages/SecurityDashboardPage";
import SecurityTestPage from "@/pages/SecurityTestPage";
import RoleManagementPage from "@/pages/admin/RoleManagementPage";
import UserActivityPage from "@/pages/admin/UserActivityPage";
import ContentSchedulerPage from "@/pages/admin/ContentSchedulerPage";
import PasswordRecoveryPage from "@/pages/PasswordRecoveryPage";
import UserPortal from "@/pages/user-portal";
import SitemapPage from "@/pages/SitemapPage";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import DataRequestPage from "@/pages/DataRequest";
import FAQPage from "@/pages/FAQPage";
import CosmicTest from "@/pages/test/CosmicTest";
import CosmicComponentsDemo from "@/pages/test/demo/CosmicComponentsDemo";
import TypeSystemDemo from "@/pages/TypeSystemDemo";
import ButtonDemo from "@/pages/test/ButtonDemo";
import CommunityPage from "@/pages/community/CommunityPage";
import EnhancedCommunityPage from "@/pages/community/EnhancedCommunityPage";
import AIChatMenuPage from "@/pages/AIChatMenuPage";

// Resource Pages
import ResourcesPage from "@/pages/resources/ResourcesPage";
import FrequencyGuidePage from "@/pages/resources/FrequencyGuidePage";
import SacredGeometryPage from "@/pages/resources/SacredGeometryPage";
import SoundHealingPage from "@/pages/resources/SoundHealingPage";
import MeditationTechniquesPage from "@/pages/resources/MeditationTechniquesPage";

// Shop Pages
import ShopPage from "@/pages/shop/ShopPage";
import ProductDetailPage from "@/pages/shop/ProductPage";
import CheckoutPage from "@/pages/shop/CheckoutPage";
import CartPage from "@/pages/shop/CartPage";
import OrderConfirmationPage from "@/pages/shop/OrderConfirmationPage";
import OrderTrackingPage from "@/pages/shop/OrderTrackingPage";
import CollaborativeShoppingPage from "@/pages/shop/CollaborativeShoppingPage";

// Imported Pages
import CosmicConnectivityPage from "@/pages/experience/CosmicConnectivityPage";
import CosmicExperiencePage from "@/pages/CosmicExperiencePage";
import ImmersivePage from "./pages/ImmersivePage";
import CosmicImmersivePage from "./pages/old-pages/CosmicExperienceImmersivePage_old"; // Legacy page
import ArchivePage from "@/pages/ArchivePage";
import CosmicMerchandisePage from "@/pages/shop/CosmicMerchandisePage";
import TestCosmicComponentsDemo from "@/pages/test/CosmicComponentsDemo";
import AudioComponentsDemo from "@/pages/test/AudioComponentsDemo";
import { NewComponentsDemo } from "@/pages/test/NewComponentsDemo";
import ComponentsCatalog from "@/pages/test/demo/ComponentsCatalog";


// Admin Pages
import UsersPage from "@/pages/admin/UsersPage";
import PostsPage from "@/pages/admin/PostsPage";
import MusicPage from "@/pages/admin/MusicPage";
import MediaPage from "@/pages/admin/MediaPage";
import GalleryPage from "@/pages/admin/GalleryPage";
import VideoPage from "@/pages/admin/VideoPage";
import AudioPage from "@/pages/admin/AudioPage";
import ContentManagementPage from "@/pages/admin/ContentManagementPage";
import ContentWorkflowPage from "@/pages/admin/ContentWorkflowPage";
import ShopManagementPage from "@/pages/admin/ShopManagementPage";
import CommentsManagementPage from "@/pages/admin/CommentsManagementPage";
import NewsletterManagementPage from "@/pages/admin/NewsletterManagementPage";
import { LoginPage } from '@/pages/Login'; //Import added here
// Convert FC component to match ProtectedRoute's expected type
import EditButtonPageFC from '@/pages/admin/EditButtonPage';
const EditButtonPage = () => <EditButtonPageFC />;

// TypeScript Error Management
import TypeScriptErrorDashboard from "@/pages/admin/TypeScriptErrorDashboard";

// Search Pages
import SearchPage from "@/pages/SearchPage";
import MusicSearchPage from "@/pages/music/MusicSearchPage";
import ShopSearchPage from "@/pages/shop/ShopSearchPage";

// Demo Pages
import DynamicContentDemo from "@/pages/demo/DynamicContentDemo";
import PerformanceDemoPage from "@/pages/PerformanceDemoPage";

// MainHeader is now included in MainLayout, no longer needed here


function AppRouter() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return (
    <Router>
      <Layout>
        <Switch>
          {/* Main Pages */}
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/tour" component={TourPage} />
          <Route path="/engage" component={EngagePage} />
          <Route path="/newsletter" component={NewsletterPage} />
          <Route path="/collaboration" component={CollaborationPage} />
          <Route path="/search" component={SearchPage} />
          {/* Community Pages */}
          <Route path="/community" component={CommunityPage} />
          <Route path="/enhanced-community" component={EnhancedCommunityPage} />

          {/* Music & Experience */}
          <Route path="/music-release" component={ArchivedMusicPage} />
          <Route path="/archived-music" component={ArchivedMusicPage} />
          <Route path="/music-archive" component={ArchivedMusicPage} />
          <Route path="/music/search" component={MusicSearchPage} />
          {/* Experience Routes */}
          <Route path="/cosmic-connectivity" component={CosmicConnectivityPage} />
          <Route path="/experience/cosmic-connectivity" component={CosmicConnectivityPage} />
          <Route path="/cosmic-experience" component={CosmicExperiencePage} />
          <Route path="/cosmic-immersive" component={CosmicImmersivePage} />
          <Route path="/cosmic-immersive-experience" component={CosmicImmersivePage} />
          <Route path="/cosmic-experience-immersive" component={CosmicImmersivePage} />
          {/* Archived Page - /archive */}
          {/* <Route path="/archive" component={ArchivePage} /> */}

          {/* Blog */}
          <Route path="/blog" component={BlogPage} />
          <Route path="/blog/:id" component={BlogPostPage} />

          {/* Shop Routes */}
          <Route path="/shop" component={ShopPage} />
          <Route path="/shop/product/:productId" component={ProductDetailPage} />
          <Route path="/shop/search" component={ShopSearchPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/shop/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/shop/checkout" component={CheckoutPage} />
          <Route path="/shop/order/:orderId" component={OrderConfirmationPage} />
          <Route path="/shop/track-order" component={OrderTrackingPage} />
          <Route path="/collaborative-shopping" component={CollaborativeShoppingPage} />
          <Route path="/shop/collaborative" component={CollaborativeShoppingPage} />
          <Route path="/shop/collaborative/room/:roomId" component={CollaborativeShoppingPage} />
          {/* Cosmic Shop is now integrated into the main ShopPage */}

          {/* User Account */}
          <Route path="/auth" component={AuthPage} />
          <Route path="/recover-password" component={PasswordRecoveryPage} />
          <Route path="/reset-password" component={PasswordRecoveryPage} />
          <ProtectedRoute path="/portal" component={UserPortal} requiredRole="user" />
          <Route path="/login" component={LoginPage}/>

          {/* Admin Routes - require admin or super_admin role */}
          <ProtectedRoute path="/admin" component={AdminPortalPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/analytics" component={AnalyticsPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/enhanced-analytics" component={EnhancedAnalyticsPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/security" component={SecuritySettingsPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/security/alerts" component={SecurityAlertsPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/security/dashboard" component={SecurityDashboardPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/users" component={UsersPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/users/roles" component={RoleManagementPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/users/activity" component={UserActivityPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/posts" component={PostsPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/music" component={MusicPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/content" component={ContentManagementPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/content-workflow" component={ContentWorkflowPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/content-scheduler" component={ContentSchedulerPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/shop" component={ShopManagementPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/comments" component={CommentsManagementPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/newsletter" component={NewsletterManagementPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/database" component={AdminPortalPage} requiredRole="super_admin" />
          <ProtectedRoute path="/admin/settings" component={AdminPortalPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/media" component={MediaPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/media/gallery" component={GalleryPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/media/video" component={VideoPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/media/audio" component={AudioPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/edit-button" component={EditButtonPage} requiredRole="admin" />
          <ProtectedRoute path="/admin/typescript-errors" component={TypeScriptErrorDashboard} requiredRole="super_admin" />

          {/* Resource Pages */}
          <Route path="/resources" component={ResourcesPage} />
          <Route path="/resources/frequency-guide" component={FrequencyGuidePage} />
          <Route path="/resources/sacred-geometry" component={SacredGeometryPage} />
          <Route path="/resources/sound-healing" component={SoundHealingPage} />
          <Route path="/resources/meditation" component={MeditationTechniquesPage} />
          
          {/* Legal & Info */}
          <Route path="/sitemap" component={SitemapPage} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/faq" component={FAQPage} />
          <Route path="/data-request" component={DataRequestPage} />
          
          {/* AI Chat */}
          <Route path="/chat" component={AIChatMenuPage} />
          <Route path="/ai-assistant" component={AIChatMenuPage} />
          <Route path="/taskade" component={AIChatMenuPage} />

          {/* Demo Pages */}
          <Route path="/components" component={ComponentsCatalog} />
          <Route path="/test/cosmic" component={TestCosmicComponentsDemo} />
          <Route path="/cosmic-components" component={CosmicComponentsDemo} />
          <Route path="/test/audio" component={AudioComponentsDemo} />
          <Route path="/test/new" component={NewComponentsDemo} />
          <Route path="/cosmic-test" component={CosmicTest} />
          <Route path="/type-system-demo" component={TypeSystemDemo} />
          <Route path="/dynamic-content-demo" component={DynamicContentDemo} />
          <Route path="/performance" component={PerformanceDemoPage} />
          <Route path="/test/binaural-beat-performance" component={
            () => import('./pages/tests/binaural-beat-performance-test').then(module => {
              const Page = module.default;
              return <Page />;
            })
          } />
          {/* Security Testing Pages */}
          <Route path="/security-test" component={SecurityTestPage} />
          <Route path="/security-dashboard" component={SecurityDashboardPage} />
          {/* Archived Page - /button-demo */}
          {/* <Route path="/button-demo" component={ButtonDemo} /> */}


          {/* 404 Route */}
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  );
}

function ErrorFallback({error, resetErrorBoundary}: {error: Error; resetErrorBoundary: () => void}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <pre className="text-sm mb-4">{error.message}</pre>
        <button 
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    initializeGA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AccessibilityProvider>
            <ChatProvider>
                {/* Add StylesProvider to optimize CSS-in-JS rendering */}
                <StylesProvider
                  extractCritical={true}
                  optimizeSheets={true}
                  injectIntoHead={true}
                  deduplicate={true}
                  delayNonCritical={100}
                >
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <StarBackground starCount={150} />
                  
                  {/* Add ThemeController - a wrapper that safely uses the theme context */}
                  <ThemeController />
                  
                  <AppRouter />
                  <ChatWidget />
                  {/* Temporarily disable Taskade widget to prevent overlapping AI assistant buttons */}
                  {/* <TaskadeWidget /> */}
                  <CookieConsent />
                  <ToastProvider />
                  {/* Add Font optimization */}
                  <FontLoader
                    fonts={[
                      { family: 'Orbitron', display: 'swap' },
                      { family: 'Space Grotesk', display: 'swap' },
                      { family: 'Cinzel', display: 'swap' },
                      { family: 'Exo 2', display: 'swap' },
                      { family: 'Gruppo', display: 'swap' },
                      { family: 'Michroma', display: 'swap' },
                      { family: 'Poiret One', display: 'swap' },
                      { family: 'Syncopate', display: 'swap' }
                    ]}
                    display="swap"
                    preload={true}
                    addBodyClass={true}
                  />
                  {/* Service Worker for offline capabilities */}
                  <ServiceWorkerManager 
                    registerOnMount={true}
                    showUpdateNotification={true} 
                    showOfflineNotification={true}
                  />
                </ErrorBoundary>
                </StylesProvider>
              </ChatProvider>
            </AccessibilityProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
}

export default App;