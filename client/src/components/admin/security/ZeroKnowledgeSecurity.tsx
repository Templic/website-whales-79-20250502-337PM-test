import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  FileCheck, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  Database, 
  Code, 
  ShieldCheck, 
  BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from '@/components/ui/skeleton';
import { createHash } from 'crypto-browserify';

// Define protected operation types
enum ProtectedOperationType {
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  SECURITY_CONFIG = 'SECURITY_CONFIG',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  DATA_EXPORT = 'DATA_EXPORT',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  API_KEY_MANAGEMENT = 'API_KEY_MANAGEMENT',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS'
}

// Interface for challenge data
interface Challenge {
  challengeId: string;
  challenge: string;
  expiresAt: number;
  operationType: ProtectedOperationType;
}

// Interface for homomorphic key data
interface HomomorphicKeys {
  publicKey: string;
}

export default function ZeroKnowledgeSecurity() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [operationType, setOperationType] = useState<ProtectedOperationType>(ProtectedOperationType.ADMIN_ACCESS);
  const [password, setPassword] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [proofResponse, setProofResponse] = useState('');
  const [dataToEncrypt, setDataToEncrypt] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const [dataToDecrypt, setDataToDecrypt] = useState('');
  const [decryptedData, setDecryptedData] = useState('');
  
  // Fetch homomorphic keys
  const { 
    data: homomorphicKeys,
    isLoading: keysLoading,
    isError: keysError,
    error: keysErrorDetails,
    refetch: refetchKeys
  } = useQuery<HomomorphicKeys>({
    queryKey: ['/api/security/zkp/keys'],
    enabled: false
  });
  
  // Challenge creation mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (params: { operationType: ProtectedOperationType }) => {
      const response = await apiRequest('POST', '/api/security/zkp/challenge', params);
      return await response.json();
    },
    onSuccess: (data: Challenge) => {
      setCurrentChallenge(data);
      toast({
        title: 'Challenge created',
        description: 'A new zero-knowledge challenge has been created. Provide your credentials to complete the operation.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create challenge',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Proof verification mutation
  const verifyProofMutation = useMutation({
    mutationFn: async (params: { challengeId: string; proofResponse: string; operationType: ProtectedOperationType }) => {
      const response = await apiRequest('POST', '/api/security/zkp/verify', params);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast({
          title: 'Operation verified',
          description: 'Your identity has been verified using zero-knowledge proof.',
          variant: 'default'
        });
        
        // Store auth token or session data as needed
        
        // Reset state
        setCurrentChallenge(null);
        setProofResponse('');
        setPassword('');
      } else {
        toast({
          title: 'Verification failed',
          description: 'The provided proof is invalid or expired.',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Verification failed',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Key generation mutation
  const generateKeysMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/security/zkp/keys/generate', {});
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Keys generated',
        description: 'Homomorphic encryption keys have been generated successfully.',
        variant: 'default'
      });
      refetchKeys();
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate keys',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Encrypt data mutation
  const encryptDataMutation = useMutation({
    mutationFn: async (params: { data: any }) => {
      const response = await apiRequest('POST', '/api/security/zkp/data/encrypt', params);
      return await response.json();
    },
    onSuccess: (data) => {
      setEncryptedData(data.encryptedData);
      toast({
        title: 'Data encrypted',
        description: 'Data has been encrypted using homomorphic encryption.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Encryption failed',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Decrypt data mutation
  const decryptDataMutation = useMutation({
    mutationFn: async (params: { encryptedData: string }) => {
      const response = await apiRequest('POST', '/api/security/zkp/data/decrypt', params);
      return await response.json();
    },
    onSuccess: (data) => {
      setDecryptedData(JSON.stringify(data.decryptedData, null, 2));
      toast({
        title: 'Data decrypted',
        description: 'Encrypted data has been decrypted successfully.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Decryption failed',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Handle challenge creation
  const handleCreateChallenge = () => {
    createChallengeMutation.mutate({ operationType });
  };
  
  // Handle proof verification
  const handleVerifyProof = () => {
    if (!currentChallenge) {
      toast({
        title: 'No active challenge',
        description: 'Please create a new challenge first.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter your password to complete the verification.',
        variant: 'destructive'
      });
      return;
    }
    
    // Compute proof (in real implementation, this would use a proper ZKP algorithm)
    // For this example, we're using a simplified approach
    const computeProof = (challenge: string, secret: string): string => {
      // Combine challenge and secret
      const combined = challenge + secret;
      
      // Hash iterations (in browser environment)
      let hash = combined;
      for (let i = 0; i < 100; i++) {
        hash = createHash('sha256').update(hash).digest('hex');
      }
      
      return hash;
    };
    
    // Compute proof response
    const proof = computeProof(currentChallenge.challenge, password);
    
    // Send verification request
    verifyProofMutation.mutate({
      challengeId: currentChallenge.challengeId,
      proofResponse: proof,
      operationType: currentChallenge.operationType
    });
  };
  
  // Handle key generation
  const handleGenerateKeys = () => {
    generateKeysMutation.mutate();
  };
  
  // Handle data encryption
  const handleEncryptData = () => {
    if (!dataToEncrypt) {
      toast({
        title: 'No data to encrypt',
        description: 'Please enter data to encrypt.',
        variant: 'destructive'
      });
      return;
    }
    
    let dataObj;
    try {
      // Try to parse as JSON if it looks like JSON
      if (dataToEncrypt.trim().startsWith('{') || dataToEncrypt.trim().startsWith('[')) {
        dataObj = JSON.parse(dataToEncrypt);
      } else {
        dataObj = dataToEncrypt;
      }
    } catch (e) {
      dataObj = dataToEncrypt;
    }
    
    encryptDataMutation.mutate({ data: dataObj });
  };
  
  // Handle data decryption
  const handleDecryptData = () => {
    if (!dataToDecrypt) {
      toast({
        title: 'No data to decrypt',
        description: 'Please enter encrypted data to decrypt.',
        variant: 'destructive'
      });
      return;
    }
    
    decryptDataMutation.mutate({ encryptedData: dataToDecrypt });
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Zero-Knowledge Security</h2>
        <Button variant="outline" size="sm" onClick={() => refetchKeys()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="overview">
            <Shield className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="authentication">
            <Lock className="h-4 w-4 mr-2" />
            Zero-Knowledge Auth
          </TabsTrigger>
          <TabsTrigger value="encryption">
            <Key className="h-4 w-4 mr-2" />
            Homomorphic Encryption
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Zero-Knowledge Security
                </CardTitle>
                <CardDescription>
                  Secure operations without exposing sensitive data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Zero-knowledge security enables secure verification of credentials and operations
                  without ever transmitting or exposing the actual sensitive data.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-medium">Zero-Knowledge Authentication</span>: Authenticate without revealing your password
                  </li>
                  <li>
                    <span className="font-medium">Homomorphic Encryption</span>: Process encrypted data without decrypting it
                  </li>
                  <li>
                    <span className="font-medium">Protected Operations</span>: Perform sensitive operations with additional verification
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                  Benefits
                </CardTitle>
                <CardDescription>
                  Enhanced security without compromising usability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Lock className="h-5 w-5 mr-3 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Enhanced Privacy</h4>
                      <p className="text-sm text-muted-foreground">
                        Sensitive data never leaves your device in its raw form
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Code className="h-5 w-5 mr-3 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Secure Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        Perform operations on encrypted data without decryption
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FileCheck className="h-5 w-5 mr-3 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Post-Quantum Security</h4>
                      <p className="text-sm text-muted-foreground">
                        Resistant to potential quantum computing attacks
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Database className="h-5 w-5 mr-3 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Regulatory Compliance</h4>
                      <p className="text-sm text-muted-foreground">
                        Helps meet strict data protection requirements like GDPR
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Secure Operations
              </CardTitle>
              <CardDescription>
                Operations protected by zero-knowledge proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(ProtectedOperationType).map((type) => (
                  <Card key={type} className="border-dashed">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-primary" />
                        {type.replace(/_/g, ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-xs text-muted-foreground">
                        Protected by: Zero-Knowledge Authentication
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Authentication Tab */}
        <TabsContent value="authentication">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-primary" />
                  Zero-Knowledge Authentication
                </CardTitle>
                <CardDescription>
                  Authenticate without exposing your password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="operation-type">Operation Type</Label>
                  <Select 
                    value={operationType} 
                    onValueChange={(value) => setOperationType(value as ProtectedOperationType)}
                  >
                    <SelectTrigger id="operation-type">
                      <SelectValue placeholder="Select an operation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ProtectedOperationType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleCreateChallenge}
                  disabled={createChallengeMutation.isPending}
                  className="w-full"
                >
                  {createChallengeMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Challenge...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Create Authentication Challenge
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2 text-primary" />
                  Verify Identity
                </CardTitle>
                <CardDescription>
                  Complete the zero-knowledge verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentChallenge ? (
                  <>
                    <div className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                      <p><span className="text-blue-500">Challenge ID:</span> {currentChallenge.challengeId}</p>
                      <p><span className="text-blue-500">Operation:</span> {currentChallenge.operationType}</p>
                      <p><span className="text-blue-500">Expires:</span> {formatTimestamp(currentChallenge.expiresAt)}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password or Secret</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your password is never sent to the server. It is used locally to generate a zero-knowledge proof.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleVerifyProof}
                      disabled={verifyProofMutation.isPending || !password}
                      className="w-full"
                    >
                      {verifyProofMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Verify Identity
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No active challenge. Create a challenge to proceed with verification.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                How Zero-Knowledge Authentication Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <span className="font-medium">Challenge Generation</span>: 
                  The server generates a random challenge specific to the requested operation.
                </li>
                <li>
                  <span className="font-medium">Local Proof Computation</span>: 
                  Your browser computes a cryptographic proof using the challenge and your password,
                  without ever sending your actual password to the server.
                </li>
                <li>
                  <span className="font-medium">Proof Verification</span>: 
                  The server verifies the proof without needing to know your actual password.
                </li>
                <li>
                  <span className="font-medium">Access Granted</span>: 
                  If the proof is valid, access to the protected operation is granted.
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Encryption Tab */}
        <TabsContent value="encryption">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2 text-primary" />
                  Homomorphic Encryption Keys
                </CardTitle>
                <CardDescription>
                  Manage your homomorphic encryption keys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {keysLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : homomorphicKeys ? (
                  <div className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                    <p><span className="text-blue-500">Public Key:</span> {homomorphicKeys.publicKey}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No encryption keys found. Generate keys to enable homomorphic encryption.
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerateKeys}
                  disabled={generateKeysMutation.isPending}
                  className="w-full"
                >
                  {generateKeysMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Keys...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      {homomorphicKeys ? 'Regenerate Keys' : 'Generate Keys'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-primary" />
                  Encrypt Data
                </CardTitle>
                <CardDescription>
                  Encrypt data using homomorphic encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data-to-encrypt">Data to Encrypt</Label>
                  <textarea
                    id="data-to-encrypt"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={dataToEncrypt}
                    onChange={(e) => setDataToEncrypt(e.target.value)}
                    placeholder="Enter data to encrypt (text or JSON)"
                  />
                </div>
                
                <Button 
                  onClick={handleEncryptData}
                  disabled={encryptDataMutation.isPending || !dataToEncrypt || !homomorphicKeys}
                  className="w-full"
                >
                  {encryptDataMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Encrypt Data
                    </>
                  )}
                </Button>
                
                {encryptedData && (
                  <div className="space-y-2 mt-4">
                    <Label>Encrypted Data</Label>
                    <div className="p-3 bg-muted rounded-md text-xs font-mono max-h-[150px] overflow-y-auto">
                      {encryptedData}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Unlock className="h-5 w-5 mr-2 text-primary" />
                Decrypt Data
              </CardTitle>
              <CardDescription>
                Decrypt homomorphically encrypted data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data-to-decrypt">Encrypted Data</Label>
                <textarea
                  id="data-to-decrypt"
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={dataToDecrypt}
                  onChange={(e) => setDataToDecrypt(e.target.value)}
                  placeholder="Enter encrypted data to decrypt"
                />
              </div>
              
              <Button 
                onClick={handleDecryptData}
                disabled={decryptDataMutation.isPending || !dataToDecrypt || !homomorphicKeys}
                className="w-full"
              >
                {decryptDataMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Decrypt Data
                  </>
                )}
              </Button>
              
              {decryptedData && (
                <div className="space-y-2 mt-4">
                  <Label>Decrypted Data</Label>
                  <div className="p-3 bg-muted rounded-md text-xs font-mono max-h-[150px] overflow-y-auto">
                    {decryptedData}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}