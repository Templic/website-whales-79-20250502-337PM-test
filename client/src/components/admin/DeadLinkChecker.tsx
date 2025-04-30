import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeadLink {
  url: string;
  parentUrl: string | null;
  status: number;
  message: string;
  type: string;
  element: string;
  suggestion?: string;
}

interface DeadEndButton {
  url: string;
  element: string;
  text: string;
  location: string;
}

interface ComponentIssue {
  file: string;
  line: number;
  content: string;
  suggestion: string;
}

interface ScanResults {
  meta: {
    baseUrl: string;
    timestamp: string;
    visitedUrls: string[];
    validRoutes: string[];
  };
  summary: {
    visitedUrls: number;
    brokenLinks: number;
    deadEndButtons: number;
    componentsWithIssues: number;
  };
  brokenLinks: DeadLink[];
  deadEndButtons: DeadEndButton[];
  componentsWithIssues: ComponentIssue[];
}

export const DeadLinkChecker = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [activeTab, setActiveTab] = useState('broken-links');
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [fixingLink, setFixingLink] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if a saved report exists
    const loadPreviousResults = async () => {
      setLoadingPrevious(true);
      try {
        const response = await axios.get('/api/deadlinks/latest');
        if (response.data) {
          setResults(response.data);
        }
      } catch (error) {
        console.error('Failed to load previous results', error);
      } finally {
        setLoadingPrevious(false);
      }
    };

    loadPreviousResults();
  }, []);

  // Simulate progress during scan
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (scanning) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 - prev) * 0.05;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanning]);

  const startScan = async () => {
    setScanning(true);
    setProgress(0);
    setResults(null);

    try {
      // Start the scan process on the server
      const response = await axios.post('/api/deadlinks/scan');
      
      // Polling for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`/api/deadlinks/status/${response.data.scanId}`);
          
          if (statusResponse.data.status === 'completed') {
            clearInterval(pollInterval);
            setResults(statusResponse.data.results);
            setScanning(false);
            setProgress(100);
            
            toast({
              title: 'Scan Completed',
              description: 'Dead link scanning has completed.',
              variant: 'default',
            });
          } else if (statusResponse.data.status === 'error') {
            clearInterval(pollInterval);
            setScanning(false);
            
            toast({
              title: 'Scan Failed',
              description: statusResponse.data.message || 'An error occurred during scanning.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error checking scan status', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to start scan', error);
      setScanning(false);
      
      toast({
        title: 'Scan Failed',
        description: 'Failed to start the dead link scan.',
        variant: 'destructive',
      });
    }
  };

  const fixLink = async (link: DeadLink) => {
    setFixingLink(link.url);
    
    try {
      // If it's an internal link, we can try to fix it
      const isInternal = link.url.includes(window.location.hostname) || 
                          link.url.startsWith('/') || 
                          !link.url.startsWith('http');
      
      if (isInternal) {
        const response = await axios.post('/api/deadlinks/fix', {
          url: link.url,
          parentUrl: link.parentUrl,
          suggestion: link.suggestion
        });
        
        if (response.data.success) {
          toast({
            title: 'Link Fixed',
            description: `Successfully created a placeholder for ${link.url}`,
            variant: 'default',
          });
          
          // Update the results by removing the fixed link
          if (results) {
            setResults({
              ...results,
              brokenLinks: results.brokenLinks.filter(item => item.url !== link.url),
              summary: {
                ...results.summary,
                brokenLinks: results.summary.brokenLinks - 1
              }
            });
          }
        }
      } else {
        toast({
          title: 'Cannot Fix External Link',
          description: 'External links cannot be automatically fixed.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fix link', error);
      
      toast({
        title: 'Fix Failed',
        description: 'Failed to fix the broken link.',
        variant: 'destructive',
      });
    } finally {
      setFixingLink(null);
    }
  };

  const fixDeadEndButton = async (button: DeadEndButton) => {
    setFixingLink(button.location);
    
    try {
      const response = await axios.post('/api/deadlinks/fix-button', {
        url: button.url,
        element: button.element,
        text: button.text,
        location: button.location
      });
      
      if (response.data.success) {
        toast({
          title: 'Button Fixed',
          description: `Successfully added an action to the button "${button.text}"`,
          variant: 'default',
        });
        
        // Update the results by removing the fixed button
        if (results) {
          setResults({
            ...results,
            deadEndButtons: results.deadEndButtons.filter(item => item.location !== button.location),
            summary: {
              ...results.summary,
              deadEndButtons: results.summary.deadEndButtons - 1
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to fix button', error);
      
      toast({
        title: 'Fix Failed',
        description: 'Failed to fix the dead-end button.',
        variant: 'destructive',
      });
    } finally {
      setFixingLink(null);
    }
  };

  // For running the CLI version directly
  const runCliVersion = async () => {
    try {
      setScanning(true);
      
      const response = await axios.post('/api/deadlinks/run-cli');
      
      setScanning(false);
      toast({
        title: 'CLI Script Executed',
        description: 'The command line script has been executed. Check console output for results.',
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Failed to run CLI script', error);
      setScanning(false);
      
      toast({
        title: 'CLI Script Failed',
        description: 'Failed to execute the command line script.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Dead Link Checker</CardTitle>
          <CardDescription>
            Scan your website for broken links, dead-end buttons, and component issues
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!scanning && !results && !loadingPrevious && (
            <div className="text-center py-8">
              <p className="mb-6 text-muted-foreground">
                Click the button below to scan the website for dead-end links and buttons.
              </p>
              <Button onClick={startScan} size="lg">
                Start Scanning
              </Button>
              <Button 
                onClick={runCliVersion} 
                variant="outline"
                className="ml-4"
              >
                Run CLI Version
              </Button>
            </div>
          )}
          
          {(scanning || loadingPrevious) && (
            <div className="py-8">
              <h3 className="text-lg font-medium mb-2">
                {scanning ? 'Scanning in progress...' : 'Loading previous results...'}
              </h3>
              <Progress value={scanning ? progress : 50} className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
              </div>
            </div>
          )}
          
          {results && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">URLs Visited</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.summary.visitedUrls}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Broken Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{results.summary.brokenLinks}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Dead-End Buttons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-500">{results.summary.deadEndButtons}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Component Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-500">{results.summary.componentsWithIssues}</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mb-4">
                <Alert>
                  <AlertTitle>Scan completed on {new Date(results.meta.timestamp).toLocaleString()}</AlertTitle>
                  <AlertDescription>
                    Base URL: {results.meta.baseUrl}
                  </AlertDescription>
                </Alert>
              </div>
              
              <Tabs defaultValue="broken-links" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="broken-links">
                    Broken Links
                    <Badge variant="destructive" className="ml-2">{results.summary.brokenLinks}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="dead-end-buttons">
                    Dead-End Buttons
                    <Badge variant="secondary" className="ml-2">{results.summary.deadEndButtons}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="component-issues">
                    Component Issues
                    <Badge variant="outline" className="ml-2">{results.summary.componentsWithIssues}</Badge>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="broken-links">
                  <Card>
                    <CardHeader>
                      <CardTitle>Broken Links</CardTitle>
                      <CardDescription>
                        Links that resulted in errors or 404 when attempting to access them
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>URL</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Found On</TableHead>
                              <TableHead>Suggestion</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.brokenLinks.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  No broken links found
                                </TableCell>
                              </TableRow>
                            ) : (
                              results.brokenLinks.map((link, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{link.url}</TableCell>
                                  <TableCell>
                                    <Badge variant={link.status >= 400 ? "destructive" : "outline"}>
                                      {link.status || 'Error'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{link.parentUrl || 'Direct'}</TableCell>
                                  <TableCell>{link.suggestion || 'Create new page'}</TableCell>
                                  <TableCell>
                                    <Button 
                                      size="sm"
                                      disabled={fixingLink === link.url}
                                      onClick={() => fixLink(link)}
                                    >
                                      {fixingLink === link.url ? 'Fixing...' : 'Fix'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="dead-end-buttons">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dead-End Buttons</CardTitle>
                      <CardDescription>
                        Buttons without event handlers or links
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Element</TableHead>
                              <TableHead>Text</TableHead>
                              <TableHead>Found On</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.deadEndButtons.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  No dead-end buttons found
                                </TableCell>
                              </TableRow>
                            ) : (
                              results.deadEndButtons.map((button, index) => (
                                <TableRow key={index}>
                                  <TableCell>{button.element}</TableCell>
                                  <TableCell className="font-medium">
                                    {button.text || '[No Text]'}
                                  </TableCell>
                                  <TableCell>{button.url}</TableCell>
                                  <TableCell>{button.location}</TableCell>
                                  <TableCell>
                                    <Button 
                                      size="sm"
                                      disabled={fixingLink === button.location}
                                      onClick={() => fixDeadEndButton(button)}
                                    >
                                      {fixingLink === button.location ? 'Fixing...' : 'Fix'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="component-issues">
                  <Card>
                    <CardHeader>
                      <CardTitle>Component Issues</CardTitle>
                      <CardDescription>
                        Issues found in component source files
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>File</TableHead>
                              <TableHead>Line</TableHead>
                              <TableHead>Content</TableHead>
                              <TableHead>Suggestion</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.componentsWithIssues.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4">
                                  No component issues found
                                </TableCell>
                              </TableRow>
                            ) : (
                              results.componentsWithIssues.map((issue, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{issue.file}</TableCell>
                                  <TableCell>{issue.line}</TableCell>
                                  <TableCell className="max-w-md whitespace-normal break-words">
                                    <code className="text-xs bg-muted p-1 rounded">{issue.content}</code>
                                  </TableCell>
                                  <TableCell>{issue.suggestion}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {results && (
            <>
              <Button variant="outline" onClick={() => window.open('/deadlinks-report.json', '_blank')}>
                Download Report
              </Button>
              <Button onClick={startScan} disabled={scanning}>
                Scan Again
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default DeadLinkChecker;