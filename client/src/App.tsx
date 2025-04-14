import React from 'react';
import { Route, Switch } from 'wouter';
import AccessibilityPage from './pages/accessibility/AccessibilityPage';
import AIChatPage from './pages/ai-chat/AIChatPage';
import MainLayout from './components/layout/MainLayout';

// Import other pages as needed
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <Switch>
      <Route path="/accessibility" component={AccessibilityPage} />
      <Route path="/ai-chat" component={AIChatPage} />
      
      {/* Home page */}
      <Route path="/">
        <MainLayout>
          <HomePage />
        </MainLayout>
      </Route>
      
      {/* 404 Fallback */}
      <Route>
        <MainLayout>
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
            <p className="text-lg text-white/70 mb-6">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>
        </MainLayout>
      </Route>
    </Switch>
  );
}