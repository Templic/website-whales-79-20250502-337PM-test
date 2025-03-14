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

function Router() {
  return (
    <Layout>
      <Switch>
        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/about" component={AboutPage} />
        <ProtectedRoute path="/music-release" component={MusicReleasePage} />
        <ProtectedRoute path="/archived-music" component={MusicArchivePage} />
        <ProtectedRoute path="/tour" component={TourPage} />
        <ProtectedRoute path="/engage" component={EngagePage} />
        <ProtectedRoute path="/newsletter" component={NewsletterPage} />
        <ProtectedRoute path="/blog" component={BlogPage} />
        <ProtectedRoute path="/blog/:id" component={BlogPostPage} />
        <ProtectedRoute path="/collaboration" component={CollaborationPage} />
        <ProtectedRoute path="/contact" component={ContactPage} />
        <ProtectedRoute path="/admin" component={AdminPortalPage} />
        <ProtectedRoute path="/portal" component={UserPortal} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/recover-password" component={PasswordRecoveryPage} />
        <Route path="/reset-password" component={PasswordRecoveryPage} />
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