/**
 * DataRequest.tsx
 * 
 * A page for users to submit data subject access requests (DSARs)
 * as required by GDPR, CCPA, and other privacy regulations.
 */

import React from 'react';
import DataRequestForm from '@/components/features/privacy/DataRequestForm';

const DataRequestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Data Rights</h1>
      <p className="text-center mb-8 max-w-3xl mx-auto">
        We respect your privacy rights and are committed to providing you with control over your personal data.
        Use this form to submit a request regarding your data, and we will respond within 30 days as required
        by applicable privacy regulations.
      </p>
      
      <DataRequestForm />
    </div>
  );
};

export default DataRequestPage;