/**
 * Security Dashboard Page
 * 
 * Main administrative interface for security operations, monitoring, and management.
 * Provides a comprehensive view of the system's security posture with real-time
 * updates, alerts, and management capabilities.
 */

import React, { useState, useEffect } from 'react';
import { SecurityThemeProvider } from '../components/security/ui/theme/SecurityThemeProvider';
import { SecurityDashboardLayout } from '../components/security/ui/core/SecurityDashboardLayout';
import { SecurityBox } from '../components/security/ui/core/SecurityBox';
import { SecurityEventCard, SecurityEvent } from '../components/security/ui/core/SecurityEventCard';

// Mock security events for initial development
// In production, these would come from the API
const mockSecurityEvents: SecurityEvent[] = [
  {
    id: 'evt-001',
    timestamp: Date.now() - 300000, // 5 minutes ago
    severity: 'MEDIUM',
    category: 'ANOMALY',
    message: 'Unusual API access pattern detected from IP 192.168.1.105',
    source: 'Anomaly Detection',
    metadata: {
      ipAddress: '192.168.1.105',
      apiEndpoint: '/api/user/profile',
      requestCount: 45,
      timeWindow: '60 seconds',
      normalBaseline: 5
    }
  },
  {
    id: 'evt-002',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    severity: 'LOW',
    category: 'AUTHENTICATION',
    message: 'Multiple failed login attempts',
    source: 'Auth Service',
    metadata: {
      username: 'admin@example.com',
      attemptCount: 3,
      ipAddress: '192.168.1.110'
    }
  },
  {
    id: 'evt-003',
    timestamp: Date.now() - 7200000, // 2 hours ago
    severity: 'INFO',
    category: 'CRYPTO',
    message: 'New quantum-resistant key pair generated',
    source: 'Key Management',
    metadata: {
      keyId: 'key-12345',
      algorithm: 'CRYSTAL-Kyber-1024',
      purpose: 'API Encryption',
      expiresAt: Date.now() + 7776000000 // 90 days
    }
  },
  {
    id: 'evt-004',
    timestamp: Date.now() - 86400000, // 1 day ago
    severity: 'HIGH',
    category: 'INTEGRITY',
    message: 'File integrity check failed for system configuration',
    source: 'Integrity Monitor',
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: Date.now() - 85000000,
    metadata: {
      file: '/etc/app/config.json',
      expectedHash: 'sha256:e8c82deb2e2a5295c8733234995c57381b4c598fbd38d72d66e85d8281f9e23a',
      actualHash: 'sha256:a1c82deb2e2a5295c8733234995c57381b4c598fbd38d72d66e85d8281f9e23b'
    }
  },
  {
    id: 'evt-005',
    timestamp: Date.now() - 172800000, // 2 days ago
    severity: 'CRITICAL',
    category: 'ATTACK',
    message: 'SQL Injection attempt blocked',
    source: 'RASP',
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: Date.now() - 170000000,
    metadata: {
      payload: "admin' OR 1=1--",
      endpoint: '/api/users',
      ipAddress: '192.168.1.210',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }
];

// Security Dashboard Page component
export default function SecurityDashboardPage() {
  // State for sidebar expansion
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  // State for event list filtering
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  
  // State for selected event
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  
  // State for theme mode
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'high-contrast'>('light');
  
  // Initialize filtered events
  useEffect(() => {
    setFilteredEvents(mockSecurityEvents);
  }, []);
  
  // Handle event selection
  const handleEventClick = (event: SecurityEvent) => {
    setSelectedEvent(prevSelected => 
      prevSelected && prevSelected.id === event.id ? null : event
    );
  };
  
  // Handle event acknowledgment
  const handleEventAcknowledge = (event: SecurityEvent) => {
    // In a real implementation, this would call an API
    const updatedEvents = filteredEvents.map(evt => 
      evt.id === event.id ? {
        ...evt,
        acknowledged: true,
        acknowledgedBy: 'current-user',
        acknowledgedAt: Date.now()
      } : evt
    );
    
    setFilteredEvents(updatedEvents);
    
    // Update selected event if it's the acknowledged one
    if (selectedEvent && selectedEvent.id === event.id) {
      setSelectedEvent({
        ...selectedEvent,
        acknowledged: true,
        acknowledgedBy: 'current-user',
        acknowledgedAt: Date.now()
      });
    }
  };
  
  // Toggle theme mode
  const toggleTheme = () => {
    setThemeMode(current => 
      current === 'light' ? 'dark' :
      current === 'dark' ? 'high-contrast' : 'light'
    );
  };
  
  // Sidebar content
  const sidebarContent = (
    <div>
      <h2 style={{ 
        fontSize: '1.25rem', 
        marginBottom: '1rem',
        textAlign: sidebarExpanded ? 'left' : 'center',
        whiteSpace: sidebarExpanded ? 'normal' : 'nowrap'
      }}>
        {sidebarExpanded ? 'Security Operations' : 'Sec'}
      </h2>
      
      {sidebarExpanded && (
        <nav>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0 
          }}>
            <li style={{ 
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '0.375rem',
              fontWeight: 'bold'
            }}>
              Events & Alerts
            </li>
            <li style={{ 
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem'
            }}>
              Key Management
            </li>
            <li style={{ 
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem'
            }}>
              Security Scans
            </li>
            <li style={{ 
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem'
            }}>
              Anomaly Detection
            </li>
            <li style={{ 
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem'
            }}>
              Blockchain Logs
            </li>
            <li style={{ 
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem'
            }}>
              Configuration
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
  
  // Header actions
  const headerActions = (
    <>
      <button 
        onClick={toggleTheme}
        style={{
          backgroundColor: 'transparent',
          border: '1px solid #cbd5e1',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer'
        }}
      >
        Theme: {themeMode}
      </button>
      
      <button 
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer'
        }}
      >
        Run Security Scan
      </button>
    </>
  );
  
  return (
    <SecurityThemeProvider initialMode={themeMode}>
      <SecurityDashboardLayout
        title="Security Operations Center"
        subtitle="Real-time security monitoring and operations"
        sidebar={sidebarContent}
        sidebarExpanded={sidebarExpanded}
        onSidebarExpandedChange={setSidebarExpanded}
        actions={headerActions}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <SecurityBox
            variant="elevated"
            title="System Security Status"
            bordered
            shadowed
          >
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '1rem',
              padding: '0.5rem'
            }}>
              <div style={{ 
                flex: '1 1 200px',
                padding: '1rem',
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid rgba(22, 163, 74, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Cryptographic Health</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>97%</div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>All key systems operational</p>
              </div>
              
              <div style={{ 
                flex: '1 1 200px',
                padding: '1rem',
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Recent Anomalies</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>3</div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Minor anomalies detected</p>
              </div>
              
              <div style={{ 
                flex: '1 1 200px',
                padding: '1rem',
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Security Scan</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>8h ago</div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Last comprehensive scan</p>
              </div>
              
              <div style={{ 
                flex: '1 1 200px',
                padding: '1rem',
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                border: '1px solid rgba(79, 70, 229, 0.3)'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Blockchain Integrity</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>100%</div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>132 blocks verified</p>
              </div>
            </div>
          </SecurityBox>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100% - 200px)' }}>
          <div style={{ flex: '2', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SecurityBox
              title="Security Events"
              variant="default"
              bordered
              shadowed
              style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Recent Events</span>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    ({filteredEvents.length})
                  </span>
                </div>
                
                <div>
                  <select 
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                  
                  <select
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      marginLeft: '0.5rem'
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="anomaly">Anomaly</option>
                    <option value="authentication">Authentication</option>
                    <option value="crypto">Cryptographic</option>
                    <option value="integrity">Integrity</option>
                    <option value="attack">Attack</option>
                  </select>
                </div>
              </div>
              
              <div style={{ 
                overflowY: 'auto', 
                flex: '1',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem'
              }}>
                {filteredEvents.map(event => (
                  <SecurityEventCard
                    key={event.id}
                    event={event}
                    selected={selectedEvent?.id === event.id}
                    onClick={handleEventClick}
                    onAcknowledge={!event.acknowledged ? handleEventAcknowledge : undefined}
                  />
                ))}
              </div>
            </SecurityBox>
          </div>
          
          <div style={{ flex: '1', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SecurityBox
              title={selectedEvent ? "Event Details" : "Security Insights"}
              variant="default"
              bordered
              shadowed
              style={{ height: '100%', overflow: 'auto' }}
            >
              {selectedEvent ? (
                <div>
                  <div style={{ 
                    padding: '0.75rem', 
                    backgroundColor: 'rgba(243, 244, 246, 0.7)',
                    borderRadius: '0.375rem',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                      {selectedEvent.message}
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <span>ID: {selectedEvent.id}</span>
                      <span>{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      display: 'flex',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ width: '120px', fontWeight: 'bold' }}>Severity:</div>
                      <div>{selectedEvent.severity}</div>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ width: '120px', fontWeight: 'bold' }}>Category:</div>
                      <div>{selectedEvent.category}</div>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ width: '120px', fontWeight: 'bold' }}>Source:</div>
                      <div>{selectedEvent.source || 'Unknown'}</div>
                    </div>
                    {selectedEvent.acknowledged && (
                      <div style={{ 
                        display: 'flex',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ width: '120px', fontWeight: 'bold' }}>Acknowledged:</div>
                        <div>
                          By {selectedEvent.acknowledgedBy} at{' '}
                          {selectedEvent.acknowledgedAt ? 
                            new Date(selectedEvent.acknowledgedAt).toLocaleString() : 
                            'Unknown'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedEvent.metadata && (
                    <div>
                      <h4 style={{ 
                        margin: '1rem 0 0.5rem 0', 
                        fontSize: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '0.5rem'
                      }}>
                        Event Metadata
                      </h4>
                      <pre style={{ 
                        backgroundColor: 'rgba(243, 244, 246, 0.7)',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {!selectedEvent.acknowledged && (
                    <div style={{ marginTop: '1rem' }}>
                      <button
                        onClick={() => handleEventAcknowledge(selectedEvent)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer'
                        }}
                      >
                        Acknowledge Event
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p>Select an event to view details or use these security insights:</p>
                  
                  <div style={{ 
                    padding: '0.75rem', 
                    backgroundColor: 'rgba(243, 244, 246, 0.7)',
                    borderRadius: '0.375rem',
                    marginTop: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Recent Activity Summary</h4>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '1.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <li>1 Critical event in the last 48 hours</li>
                      <li>1 High severity event in the last 24 hours</li>
                      <li>3 Medium/Low events in the last 12 hours</li>
                    </ul>
                  </div>
                  
                  <div style={{ 
                    padding: '0.75rem', 
                    backgroundColor: 'rgba(243, 244, 246, 0.7)',
                    borderRadius: '0.375rem',
                    marginTop: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Security Recommendations</h4>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '1.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <li>Run a comprehensive security scan</li>
                      <li>Review authentication logs for suspicious activity</li>
                      <li>Verify integrity of system configuration files</li>
                    </ul>
                  </div>
                </div>
              )}
            </SecurityBox>
          </div>
        </div>
      </SecurityDashboardLayout>
    </SecurityThemeProvider>
  );
}