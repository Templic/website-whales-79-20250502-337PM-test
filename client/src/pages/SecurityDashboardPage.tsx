import React from 'react';
import { Helmet } from 'react-helmet';
import SecurityPerformanceDashboard from '@/components/security/SecurityPerformanceDashboard';

const SecurityDashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Security Performance Dashboard</title>
        <meta name="description" content="Monitor and optimize security components performance" />
      </Helmet>
      
      <SecurityPerformanceDashboard />
    </div>
  );
};

export default SecurityDashboardPage;