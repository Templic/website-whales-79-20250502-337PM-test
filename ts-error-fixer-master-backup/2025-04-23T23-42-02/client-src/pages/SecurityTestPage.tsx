/**
 * Security Test Page
 * 
 * This is a test-only page that demonstrates quantum-resistant cryptography operations
 * using bypass endpoints that don't enforce CSRF protection.
 * 
 * WARNING: This page is for TESTING PURPOSES ONLY and should not be used in production!
 */
import React from "react";


import QuantumCryptoTester from "@/components/security/QuantumCryptoTester";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Shield, ShieldAlert } from "lucide-react";

export default function SecurityTestPage() {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col items-start gap-4 mb-8">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <h1 className="text-3xl font-bold">Security Testing Environment</h1>
        </div>
        
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Test Environment Only</AlertTitle>
          <AlertDescription>
            This page uses test-only endpoints that bypass CSRF protection for easier testing.
            Never use these endpoints in production as they significantly reduce security.
          </AlertDescription>
        </Alert>
        
        <p className="text-muted-foreground">
          This testing environment allows you to experiment with quantum-resistant cryptography
          operations without the need for CSRF tokens. The endpoints used here are served
          from a separate test server running on a different port.
        </p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded w-full">
          <Shield className="h-4 w-4" />
          <span>
            Test server URL: <code className="bg-background px-1 py-0.5 rounded text-xs">http://localhost:5001/api/test-only</code>
          </span>
        </div>
      </div>
      
      <div className="mb-8">
        <QuantumCryptoTester />
      </div>
      
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">About Quantum-Resistant Cryptography</h2>
        <p className="text-muted-foreground mb-4">
          Quantum-resistant (or post-quantum) cryptography uses algorithms that are believed to be secure
          against attacks from quantum computers. Traditional cryptographic algorithms (like RSA and ECC)
          could be broken by sufficiently powerful quantum computers using Shor's algorithm.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-2">Supported Algorithms</h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            <strong>Kyber</strong> - A key encapsulation mechanism based on module lattices
          </li>
          <li>
            <strong>Dilithium</strong> - A digital signature algorithm based on module lattices
          </li>
          <li>
            <strong>Falcon</strong> - A digital signature algorithm based on NTRU lattices
          </li>
          <li>
            <strong>SPHINCS+</strong> - A stateless hash-based signature scheme
          </li>
        </ul>
      </div>
    </div>
  );
}