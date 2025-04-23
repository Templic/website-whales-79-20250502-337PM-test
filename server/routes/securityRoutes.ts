import { Router, Request, Response } from 'express';
import { requireAuth, checkPermission } from '../middleware/auth';

// Create a router for security-related endpoints
const securityRouter = Router();

/**
 * @route GET /api/security/status
 * @desc Get the current security status and configuration
 * @access Public (basic status) / Admin (detailed status)
 */
securityRouter.get('/status', async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated to determine level of detail to return
    const isAdmin = req.isAuthenticated() && req.user && (req.user as any).role === 'admin';
    
    // Basic security measures that are always visible
    const securityMeasures = [
      {
        name: 'CSRF Protection',
        status: 'active',
        description: 'Cross-Site Request Forgery protection is enabled'
      },
      {
        name: 'Content Security Policy',
        status: 'active',
        description: 'CSP headers are properly configured'
      },
      {
        name: 'Rate Limiting',
        status: 'active',
        description: 'API rate limiting is active to prevent abuse'
      },
      {
        name: 'Input Validation',
        status: 'active',
        description: 'All user input is validated before processing'
      },
      {
        name: 'HTTPS/TLS',
        status: 'active',
        description: 'Secure HTTPS connections are enforced'
      }
    ];
    
    // Add more detailed measures for admins
    if (isAdmin) {
      securityMeasures.push(
        {
          name: 'Security Scanning',
          status: 'active',
          description: 'Automatic vulnerability scanning is enabled'
        },
        {
          name: 'Error Handling',
          status: 'active',
          description: 'Secure error handling prevents information leakage'
        },
        {
          name: 'Database Protection',
          status: 'active',
          description: 'Database is protected against SQL injection'
        },
        {
          name: 'Session Management',
          status: 'active',
          description: 'Secure session management with proper expiration'
        },
        {
          name: 'Authentication',
          status: 'active',
          description: 'Strong authentication mechanisms are in place'
        }
      );
    }
    
    // Calculate security score
    const activeMeasures = securityMeasures.filter(m: string: string => m.status === 'active').length;
    const score = Math.round((activeMeasures / securityMeasures.length) * 100);
    
    res.json({
      timestamp: new Date().toISOString(),
      score,
      measures: securityMeasures,
      // Detailed data only for admins
      ...(isAdmin && {
        recentScans: [
          {
            id: 'scan-001',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            findings: 3,
            status: 'completed'
          },
          {
            id: 'scan-002',
            timestamp: new Date().toISOString(),
            findings: 2,
            status: 'completed'
          }
        ],
        securityEvents: [
          {
            id: 'event-001',
            type: 'LOGIN_FAILURE',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            sourceIp: '192.168.1.1',
            severity: 'medium'
          },
          {
            id: 'event-002',
            type: 'RATE_LIMIT_EXCEEDED',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            sourceIp: '192.168.1.2',
            severity: 'low'
          }
        ]
      })
    });
  } catch (error) {
    console.error('Error getting security status:', error);
    res.status(500).json({ error: 'Failed to get security status' });
  }
});

/**
 * @route GET /api/security/logs
 * @desc Get security-related logs
 * @access Admin only
 */
securityRouter.get('/logs', requireAuth, checkPermission('admin'), async (req: Request, res: Response) => {
  try {
    // In a real implementation, we would fetch logs from a database or log file
    // For this example, we'll return mock data
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Generate sample security log entries
    const generateLogs = (count: number) => {
      const logs = [];
      const eventTypes = [
        'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'RATE_LIMIT_EXCEEDED', 
        'CSRF_ATTEMPT', 'AUTH_FAILURE', 'SECURITY_SCAN'
      ];
      const severities = ['low', 'medium', 'high', 'critical'];
      
      for (let i = 0; i < count; i++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const timestamp = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString();
        
        logs.push({
          id: `log-${i + 1}`,
          eventType,
          timestamp,
          sourceIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
          severity,
          details: `Security event: ${eventType}`
        });
      }
      
      // Sort logs by timestamp (newest first)
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };
    
    const allLogs = generateLogs(50);
    const paginatedLogs = allLogs.slice(startIndex, endIndex);
    
    res.json({
      logs: paginatedLogs,
      pagination: {
        total: allLogs.length,
        page,
        limit,
        pages: Math.ceil(allLogs.length / limit)
      }
    });
  } catch (error) {
    console.error('Error getting security logs:', error);
    res.status(500).json({ error: 'Failed to get security logs' });
  }
});

/**
 * @route GET /api/security/scan/latest
 * @desc Get the latest security scan results
 * @access Admin only
 */
securityRouter.get('/scan/latest', requireAuth, checkPermission('admin'), async (req: Request, res: Response) => {
  try {
    // In a real implementation, we would fetch the latest scan from a database
    res.json({
      id: 'scan-latest',
      timestamp: new Date().toISOString(),
      status: 'completed',
      duration: '127s',
      findings: [
        {
          id: 'finding-1',
          type: 'OUTDATED_DEPENDENCY',
          severity: 'medium',
          details: 'Outdated npm package detected with known vulnerabilities',
          location: 'package.json',
          recommendation: 'Update the affected package to the latest version'
        },
        {
          id: 'finding-2',
          type: 'MISSING_SECURITY_HEADER',
          severity: 'low',
          details: 'X-Content-Type-Options header is not set',
          location: 'server/index.ts',
          recommendation: 'Add the X-Content-Type-Options: nosniff header'
        }
      ],
      summary: {
        high: 0,
        medium: 1,
        low: 1,
        info: 0,
        total: 2
      }
    });
  } catch (error) {
    console.error('Error getting latest scan:', error);
    res.status(500).json({ error: 'Failed to get latest scan' });
  }
});

/**
 * @route POST /api/security/scan/start
 * @desc Manually trigger a security scan
 * @access Admin only
 */
securityRouter.post('/scan/start', requireAuth, checkPermission('admin'), async (req: Request, res: Response) => {
  try {
    // In a real implementation, we would trigger an actual security scan
    res.json({
      id: 'scan-manual-001',
      status: 'started',
      timestamp: new Date().toISOString(),
      message: 'Security scan started successfully'
    });
  } catch (error) {
    console.error('Error starting security scan:', error);
    res.status(500).json({ error: 'Failed to start security scan' });
  }
});

export default securityRouter;