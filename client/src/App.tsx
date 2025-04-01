import { Switch, Route, useLocation } from "wouter";
// import { lazy } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "./components/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "./pages/not-found";
import { useEffect } from "react";
import { initializeGA, trackPageView } from "@/lib/analytics";

// Pages
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import NewMusicPage from "@/pages/MusicReleasePage";
import ArchivedMusicPage from "@/pages/MusicArchivePage";
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

// Imported Pages
import CosmicExperiencePage from "@/pages/imported-pages/CosmicExperiencePage";
import ImmersivePage from "@/pages/imported-pages/ImmersivePage";
import ArchivePage from "@/pages/imported-pages/ArchivePage";
import CommunityPage from "@/pages/imported-pages/CommunityPage";

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
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/music-release" component={NewMusicPage} />
        <Route path="/archived-music" component={ArchivedMusicPage} />
        <Route path="/tour" component={TourPage} />
        <Route path="/engage" component={EngagePage} />
        <Route path="/newsletter" component={NewsletterPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/blog/:id" component={BlogPostPage} />
        <Route path="/collaboration" component={CollaborationPage} />
        <Route path="/contact" component={ContactPage} />
        <ProtectedRoute path="/admin" component={AdminPortalPage} />
        <ProtectedRoute path="/admin/analytics" component={AnalyticsPage} />
        <ProtectedRoute path="/admin/users" component={UsersPage} />
        <ProtectedRoute path="/admin/posts" component={PostsPage} />
        <ProtectedRoute path="/admin/music" component={MusicPage} />
        <ProtectedRoute path="/portal" component={UserPortal} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/recover-password" component={PasswordRecoveryPage} />
        <Route path="/reset-password" component={PasswordRecoveryPage} />
        <Route path="/sitemap" component={SitemapPage} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/cosmic-experience" component={CosmicExperiencePage} />
        <Route path="/immersive" component={ImmersivePage} />
        <Route path="/music-archive" component={ArchivePage} />
        <Route path="/community" component={CommunityPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    initializeGA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;