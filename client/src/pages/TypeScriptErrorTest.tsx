import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

/**
 * TypeScript Error Test Page
 * 
 * This page tests the TypeScript error management API endpoints
 * directly from the client side, where CSRF tokens are automatically handled.
 */
export function TypeScriptErrorTest() {
  const [testResponse, setTestResponse] = useState<any>(null);
  const [scanResponse, setScanResponse] = useState<any>(null);
  const [loading, setLoading] = useState({
    test: false,
    scan: false
  });
  const [error, setError] = useState({
    test: '',
    scan: ''
  });

  // Test the API endpoints
  const testEndpoint = async () => {
    setLoading(prev => ({ ...prev, test: true }));
    setError(prev => ({ ...prev, test: '' }));
    
    try {
      const response = await fetch('/api/admin/typescript-errors/test');
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestResponse(data);
    } catch (err) {
      setError(prev => ({ ...prev, test: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, test: false }));
    }
  };

  // Create a new scan
  const createScan = async () => {
    setLoading(prev => ({ ...prev, scan: true }));
    setError(prev => ({ ...prev, scan: '' }));
    
    try {
      const response = await fetch('/api/admin/typescript-errors/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ aiEnabled: true })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setScanResponse(data);
    } catch (err) {
      setError(prev => ({ ...prev, scan: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, scan: false }));
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">TypeScript Error API Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Endpoint */}
        <Card>
          <CardHeader>
            <CardTitle>Test Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testEndpoint} 
              disabled={loading.test}
            >
              {loading.test ? 'Testing...' : 'Test /api/admin/typescript-errors/test'}
            </Button>
            
            {error.test && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
                {error.test}
              </div>
            )}
            
            {testResponse && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Response:</h3>
                <pre className="bg-gray-100 p-3 rounded-md overflow-auto text-sm">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Create Scan */}
        <Card>
          <CardHeader>
            <CardTitle>Create TypeScript Scan</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createScan} 
              disabled={loading.scan}
              variant="outline"
            >
              {loading.scan ? 'Creating...' : 'Create New Scan (with AI)'}
            </Button>
            
            {error.scan && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
                {error.scan}
              </div>
            )}
            
            {scanResponse && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Response:</h3>
                <pre className="bg-gray-100 p-3 rounded-md overflow-auto text-sm">
                  {JSON.stringify(scanResponse, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TypeScriptErrorTest;