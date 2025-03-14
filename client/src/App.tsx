import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "./components/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "./pages/not-found";

// Pages
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import MusicReleasePage from "@/pages/MusicReleasePage";
import MusicArchivePage from "@/pages/MusicArchivePage";
import TourPage from "@/pages/TourPage";
import EngagePage from "@/pages/EngagePage";
import NewsletterPage from "@/pages/NewsletterPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import CollaborationPage from "@/pages/CollaborationPage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/AuthPage";
import AdminPortalPage from "@/pages/AdminPortalPage";
import PasswordRecoveryPage from "@/pages/PasswordRecoveryPage";
import UserPortal from "@/pages/user-portal";
import SitemapPage from "@/pages/SitemapPage";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/music-release" component={MusicReleasePage} />
        <Route path="/archived-music" component={MusicArchivePage} />
        <Route path="/tour" component={TourPage} />
        <Route path="/engage" component={EngagePage} />
        <Route path="/newsletter" component={NewsletterPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/blog/:id" component={BlogPostPage} />
        <Route path="/collaboration" component={CollaborationPage} />
        <Route path="/contact" component={ContactPage} />
        <ProtectedRoute path="/admin" component={AdminPortalPage} />
        <ProtectedRoute path="/portal" component={UserPortal} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/recover-password" component={PasswordRecoveryPage} />
        <Route path="/reset-password" component={PasswordRecoveryPage} />
        <Route path="/sitemap" component={SitemapPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
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