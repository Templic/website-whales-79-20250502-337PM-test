import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "./components/layout/MainLayout";
import NotFound from "./pages/not-found";

// Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import MusicReleasePage from "./pages/MusicReleasePage";
import MusicArchivePage from "./pages/MusicArchivePage";
import TourPage from "./pages/TourPage";
import EngagePage from "./pages/EngagePage";
import NewsletterPage from "./pages/NewsletterPage";
import BlogPage from "./pages/BlogPage";
import CollaborationPage from "./pages/CollaborationPage";
import ContactPage from "./pages/ContactPage";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/music-release" component={MusicReleasePage} />
        <Route path="/archived-music" component={MusicArchivePage} />
        <Route path="/tour" component={TourPage} />
        <Route path="/engage" component={EngagePage} />
        <Route path="/newsletter" component={NewsletterPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/collaboration" component={CollaborationPage} />
        <Route path="/contact" component={ContactPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;