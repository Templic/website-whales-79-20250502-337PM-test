/**
 * Quantum Cryptography Test Component
 * 
 * A test-only component that demonstrates quantum-resistant cryptography operations
 * using the test-only API endpoints that bypass CSRF protection.
 * 
 * NOTE: This is for TESTING PURPOSES ONLY and should not be used in production!
 */
import React from "react";


import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// URL of the test server (running on a different port)
const TEST_API_URL = 'http://localhost:5001/api/test-only';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export default function QuantumCryptoTester() {
  const [algorithm, setAlgorithm] = useState('kyber');
  const [strength, setStrength] = useState('high');
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [plaintext, setPlaintext] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptedData, setDecryptedData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // Generate a new quantum-resistant key pair
  const generateKeyPair = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${TEST_API_URL}/quantum/generate-keys`, {
        algorithm,
        strength
      });
      
      setKeyPair(response.data);
      setPublicKey(response.data.publicKey);
      setPrivateKey(response.data.privateKey);
      setResult(response.data);
      
      setLoading(false);
    } catch (err: unknown) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || 'Failed to generate key pair');
      console.error('Key generation error:', err);
    }
  };

  // Encrypt data using a public key
  const encryptData = async () => {
    if (!plaintext || !publicKey) {
      setError('Please provide both plaintext and a public key');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${TEST_API_URL}/quantum/encrypt`, {
        data: plaintext,
        publicKey,
        algorithm
      });
      
      setEncryptedData(response.data.encrypted);
      setResult(response.data);
      
      setLoading(false);
    } catch (err: unknown) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || 'Failed to encrypt data');
      console.error('Encryption error:', err);
    }
  };

  // Decrypt data using a private key
  const decryptData = async () => {
    if (!encryptedData || !privateKey) {
      setError('Please provide both encrypted data and a private key');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${TEST_API_URL}/quantum/decrypt`, {
        encrypted: encryptedData,
        privateKey,
        algorithm
      });
      
      setDecryptedData(response.data.decrypted);
      setResult(response.data);
      
      setLoading(false);
    } catch (err: unknown) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || 'Failed to decrypt data');
      console.error('Decryption error:', err);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>TEST MODE ONLY</AlertTitle>
        <AlertDescription>
          This is a test component using separate test endpoints that bypass CSRF protection.
          This should never be used in production environments as it weakens security.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Quantum-Resistant Cryptography Tester</CardTitle>
          <CardDescription>
            Test quantum-resistant cryptography operations without CSRF protection
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="generate">Generate Keys</TabsTrigger>
              <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
              <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
            </TabsList>
            
            {/* Key Generation Tab */}
            <TabsContent value="generate">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Algorithm</label>
                    <Select 
                      value={algorithm} 
                      onValueChange={setAlgorithm}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kyber">Kyber</SelectItem>
                        <SelectItem value="dilithium">Dilithium</SelectItem>
                        <SelectItem value="falcon">Falcon</SelectItem>
                        <SelectItem value="sphincs">SPHINCS+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Security Strength</label>
                    <Select 
                      value={strength} 
                      onValueChange={setStrength}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select strength" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (faster)</SelectItem>
                        <SelectItem value="medium">Medium (balanced)</SelectItem>
                        <SelectItem value="high">High (more secure)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={generateKeyPair} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Generating...' : 'Generate Quantum-Resistant Key Pair'}
                </Button>
                
                {keyPair && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Public Key</label>
                      <Input 
                        value={keyPair.publicKey} 
                        readOnly 
                        className="font-mono text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Private Key</label>
                      <Input 
                        value={keyPair.privateKey} 
                        readOnly 
                        className="font-mono text-xs mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Encryption Tab */}
            <TabsContent value="encrypt">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Public Key</label>
                  <Input 
                    value={publicKey} 
                    onChange={(e) => setPublicKey(e.target.value)} 
                    placeholder="Enter or paste public key" 
                    className="font-mono text-xs mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Plaintext Data</label>
                  <Textarea 
                    value={plaintext} 
                    onChange={(e) => setPlaintext(e.target.value)} 
                    placeholder="Enter data to encrypt" 
                    className="mt-1"
                    rows={4}
                  />
                </div>
                
                <Button 
                  onClick={encryptData} 
                  disabled={loading || !publicKey || !plaintext}
                  className="w-full"
                >
                  {loading ? 'Encrypting...' : 'Encrypt Data'}
                </Button>
                
                {encryptedData && (
                  <div>
                    <label className="text-sm font-medium">Encrypted Result</label>
                    <Input 
                      value={encryptedData} 
                      readOnly 
                      className="font-mono text-xs mt-1"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Decryption Tab */}
            <TabsContent value="decrypt">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Private Key</label>
                  <Input 
                    value={privateKey} 
                    onChange={(e) => setPrivateKey(e.target.value)} 
                    placeholder="Enter or paste private key" 
                    className="font-mono text-xs mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Encrypted Data</label>
                  <Input 
                    value={encryptedData} 
                    onChange={(e) => setEncryptedData(e.target.value)} 
                    placeholder="Enter encrypted data" 
                    className="font-mono text-xs mt-1"
                  />
                </div>
                
                <Button 
                  onClick={decryptData} 
                  disabled={loading || !privateKey || !encryptedData}
                  className="w-full"
                >
                  {loading ? 'Decrypting...' : 'Decrypt Data'}
                </Button>
                
                {decryptedData && (
                  <div>
                    <label className="text-sm font-medium">Decrypted Result</label>
                    <Input 
                      value={decryptedData} 
                      readOnly 
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col">
          <div className="w-full">
            <p className="text-sm font-medium mb-2">API Response:</p>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <pre className="text-xs font-mono">
                {result ? JSON.stringify(result, null, 2) : 'No response yet'}
              </pre>
            </ScrollArea>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}