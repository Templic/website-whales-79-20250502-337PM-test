import { Switch, Route, useLocation } from "wouter";
// import { lazy } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "./pages/not-found";
import { useEffect } from "react";
import { initializeGA, trackPageView } from "@/lib/analytics";
import { ErrorBoundary } from "react-error-boundary";
import StarBackground from "@/components/cosmic/StarBackground";

// Pages
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import NewMusicPage from "@/pages/MusicReleasePage";
import ArchivedMusicPage from "@/pages/ArchivedMusic";
import TourPage from "@/pages/TourPage";
import EngagePage from "@/pages/EngagePage";
import NewsletterPage from "@/pages/NewsletterPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import CollaborationPage from "@/pages/CollaborationPage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/AuthPage";
import AdminPortalPage from "@/pages/AdminPortalPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import PasswordRecoveryPage from "@/pages/PasswordRecoveryPage";
import UserPortal from "@/pages/user-portal";
import SitemapPage from "@/pages/SitemapPage";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CosmicTest from "@/pages/test/CosmicTest";
import CosmicComponentsDemo from "@/pages/test/demo/CosmicComponentsDemo";
import ButtonDemo from "@/pages/test/ButtonDemo";
import CommunityPage from "@/pages/CommunityPage";
import EnhancedCommunityPage from "@/pages/EnhancedCommunityPage";

// Shop Pages
import ShopPage from "@/pages/ShopPage";
import ProductPage from "@/pages/ProductPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import CollaborativeShoppingPage from "@/pages/CollaborativeShoppingPage";

// Imported Pages
import CosmicConnectivityPage from "@/pages/CosmicConnectivityPage";
import CosmicExperiencePage from "@/pages/CosmicExperiencePage";
import ImmersivePage from "@/pages/ImmersivePage";
import ArchivePage from "@/pages/ArchivePage";
import CosmicMerchandisePage from "@/pages/CosmicMerchandisePage";
import TestCosmicComponentsDemo from "@/pages/test/CosmicComponentsDemo";
import AudioComponentsDemo from "@/pages/test/AudioComponentsDemo";
import { NewComponentsDemo } from "@/pages/test/NewComponentsDemo";
import ComponentsCatalog from "@/pages/test/demo/ComponentsCatalog";


// Admin Pages
import UsersPage from "@/pages/admin/UsersPage";
import PostsPage from "@/pages/admin/PostsPage";
import MusicPage from "@/pages/admin/MusicPage";

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return (
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
        {/* Community Pages */}
        <Route path="/community" component={CommunityPage} />
        <Route path="/enhanced-community" component={EnhancedCommunityPage} />

        {/* Music & Experience */}
        <Route path="/music-release" component={NewMusicPage} />
        <Route path="/archived-music" component={ArchivedMusicPage} />
        <Route path="/music-archive" component={ArchivedMusicPage} />
        {/* Experience Routes */}
        <Route path="/cosmic-connectivity" component={CosmicConnectivityPage} />
        <Route path="/cosmic-experience" component={CosmicExperiencePage} />
        <Route path="/immersive" component={ImmersivePage} />
        <Route path="/archive" component={ArchivePage} />

        {/* Blog */}
        <Route path="/blog" component={BlogPage} />
        <Route path="/blog/:id" component={BlogPostPage} />

        {/* Shop Routes */}
        <Route path="/shop" component={ShopPage} />
        <Route path="/shop/product/:slug" component={ProductPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/shop/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/shop/checkout" component={CheckoutPage} />
        <Route path="/collaborative-shopping" component={CollaborativeShoppingPage} />
        <Route path="/shop/collaborative" component={CollaborativeShoppingPage} />
        <Route path="/shop/collaborative/room/:roomId" component={CollaborativeShoppingPage} />
        {/* Cosmic Shop is now integrated into the main ShopPage */}

        {/* User Account */}
        <Route path="/auth" component={AuthPage} />
        <Route path="/recover-password" component={PasswordRecoveryPage} />
        <Route path="/reset-password" component={PasswordRecoveryPage} />
        <ProtectedRoute path="/portal" component={UserPortal} />

        {/* Admin Routes */}
        <ProtectedRoute path="/admin" component={AdminPortalPage} />
        <ProtectedRoute path="/admin/analytics" component={AnalyticsPage} />
        <ProtectedRoute path="/admin/users" component={UsersPage} />
        <ProtectedRoute path="/admin/posts" component={PostsPage} />
        <ProtectedRoute path="/admin/music" component={MusicPage} />

        {/* Legal & Info */}
        <Route path="/sitemap" component={SitemapPage} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/privacy" component={PrivacyPolicy} />

        {/* Demo Pages */}
        <Route path="/components" component={ComponentsCatalog} />
        <Route path="/test/cosmic" component={TestCosmicComponentsDemo} />
        <Route path="/cosmic-components" component={CosmicComponentsDemo} />
        <Route path="/test/audio" component={AudioComponentsDemo} />
        <Route path="/test/new" component={NewComponentsDemo} />
        <Route path="/cosmic-test" component={CosmicTest} />
        <Route path="/button-demo" component={ButtonDemo} />


        {/* 404 Route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <StarBackground starCount={150} />
          <Router />
          <Toaster />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;