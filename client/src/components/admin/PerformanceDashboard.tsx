/**
 * Performance Dashboard
 * 
 * An administrative dashboard for monitoring application performance metrics
 * with visualizations, historical data, and actionable insights.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getMemoryReport } from '../../lib/memory-leak-detector';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  TimeScale,
  ChartOptions
} from 'chart.js';
import './PerformanceDashboard.css';

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

/**
 * Performance metric data structure
 */
interface PerformanceMetric {
  timestamp: number;
  value: number;
  label?: string;
}

/**
 * Component render time info
 */
interface ComponentRenderInfo {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  maxRenderTime: number;
}

/**
 * API request timing info
 */
interface ApiTimingInfo {
  endpoint: string;
  method: string;
  callCount: number;
  averageTime: number;
  lastTime: number;
  maxTime: number;
  errorCount: number;
}

/**
 * Resource timing info
 */
interface ResourceTimingInfo {
  name: string;
  type: string;
  loadTime: number;
  size: number;
}

/**
 * Performance Dashboard Component Props
 */
interface PerformanceDashboardProps {
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Whether to auto-refresh */
  autoRefresh?: boolean;
  /** Custom chart options */
  chartOptions?: Partial<ChartOptions<'line' | 'bar'>>;
  /** Admin user permissions level */
  permissionLevel?: 'view' | 'admin';
}

/**
 * Performance Dashboard Component for monitoring app performance
 */
const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  refreshInterval = 5000,
  autoRefresh = true,
  chartOptions = {},
  permissionLevel = 'admin'
}) => {
  // State for main metrics
  const [memoryUsage, setMemoryUsage] = useState<PerformanceMetric[]>([]);
  const [cpuUsage, setCpuUsage] = useState<PerformanceMetric[]>([]);
  const [frameRate, setFrameRate] = useState<PerformanceMetric[]>([]);
  const [domSize, setDomSize] = useState<PerformanceMetric[]>([]);
  
  // State for component metrics
  const [componentRenderTimes, setComponentRenderTimes] = useState<ComponentRenderInfo[]>([]);
  
  // State for API metrics
  const [apiTimings, setApiTimings] = useState<ApiTimingInfo[]>([]);
  
  // State for resource metrics
  const [resourceTimings, setResourceTimings] = useState<ResourceTimingInfo[]>([]);
  
  // State for selected view
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'api' | 'resources' | 'memory'>('overview');
  
  // State for memory report
  const [memoryReport, setMemoryReport] = useState<string>('');
  
  // State for manual refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      // In a real app, this would call an API endpoint
      // For this example, we'll generate synthetic data based on real browser metrics
      
      // Get memory usage from browser performance API
      if ('performance' in window && 'memory' in (performance as any)) {
        const memory = (performance as any).memory;
        const usedHeapSizeMB = memory.usedJSHeapSize / (1024 * 1024);
        
        setMemoryUsage(prevUsage => {
          const newPoint: PerformanceMetric = {
            timestamp: Date.now(),
            value: usedHeapSizeMB,
          };
          
          // Keep last 60 data points
          const updatedUsage = [...prevUsage, newPoint];
          if (updatedUsage.length > 60) {
            return updatedUsage.slice(updatedUsage.length - 60);
          }
          return updatedUsage;
        });
      }
      
      // Get CPU usage (approximated)
      const cpuStartTime = performance.now();
      let counter = 0;
      for (let i = 0; i < 1000000; i++) {
        counter += i;
      }
      const cpuEndTime = performance.now();
      const cpuLoad = Math.min(100, Math.round((cpuEndTime - cpuStartTime) * 5)); // Rough approximation
      
      setCpuUsage(prevUsage => {
        const newPoint: PerformanceMetric = {
          timestamp: Date.now(),
          value: cpuLoad,
        };
        
        // Keep last 60 data points
        const updatedUsage = [...prevUsage, newPoint];
        if (updatedUsage.length > 60) {
          return updatedUsage.slice(updatedUsage.length - 60);
        }
        return updatedUsage;
      });
      
      // Get frame rate
      let frames = 0;
      let lastFrameTimestamp = performance.now();
      
      const frameCallback = () => {
        frames++;
      };
      
      // Register for a few frames
      requestAnimationFrame(frameCallback);
      requestAnimationFrame(frameCallback);
      requestAnimationFrame(frameCallback);
      
      // Calculate FPS after a short delay
      setTimeout(() => {
        const currentTime = performance.now();
        const elapsedTime = currentTime - lastFrameTimestamp;
        const fps = Math.round((frames / elapsedTime) * 1000);
        
        setFrameRate(prevFps => {
          const newPoint: PerformanceMetric = {
            timestamp: Date.now(),
            value: fps,
          };
          
          // Keep last 60 data points
          const updatedFps = [...prevFps, newPoint];
          if (updatedFps.length > 60) {
            return updatedFps.slice(updatedFps.length - 60);
          }
          return updatedFps;
        });
      }, 100);
      
      // Get DOM size
      const domNodeCount = document.querySelectorAll('*').length;
      
      setDomSize(prevSize => {
        const newPoint: PerformanceMetric = {
          timestamp: Date.now(),
          value: domNodeCount,
        };
        
        // Keep last 60 data points
        const updatedSize = [...prevSize, newPoint];
        if (updatedSize.length > 60) {
          return updatedSize.slice(updatedSize.length - 60);
        }
        return updatedSize;
      });
      
      // Get component render times (would normally come from an API)
      // Here we'll simulate some data based on random components
      const sampleComponents = [
        'BinauralBeatGenerator', 
        'ProductListing', 
        'CosmicJourney',
        'AudioVisualizer', 
        'ShoppingCart', 
        'MediaPlayer'
      ];
      
      const componentRenderData: ComponentRenderInfo[] = sampleComponents.map(name => ({
        name,
        renderCount: Math.floor(Math.random() * 100) + 1,
        averageRenderTime: Math.random() * 20 + 2,
        lastRenderTime: Math.random() * 30 + 1,
        maxRenderTime: Math.random() * 50 + 20,
      }));
      
      setComponentRenderTimes(componentRenderData);
      
      // Get API timings (would normally come from an API)
      // Here we'll simulate some data based on common endpoints
      const sampleEndpoints = [
        { endpoint: '/api/products', method: 'GET' },
        { endpoint: '/api/products/:id', method: 'GET' },
        { endpoint: '/api/cart', method: 'GET' },
        { endpoint: '/api/cart', method: 'POST' },
        { endpoint: '/api/checkout', method: 'POST' },
        { endpoint: '/api/user/profile', method: 'GET' }
      ];
      
      const apiTimingData: ApiTimingInfo[] = sampleEndpoints.map(({ endpoint, method }) => ({
        endpoint,
        method,
        callCount: Math.floor(Math.random() * 200) + 1,
        averageTime: Math.random() * 300 + 50,
        lastTime: Math.random() * 250 + 40,
        maxTime: Math.random() * 1000 + 200,
        errorCount: Math.floor(Math.random() * 5),
      }));
      
      setApiTimings(apiTimingData);
      
      // Get resource timings
      const resources = performance.getEntriesByType('resource').slice(0, 10) as PerformanceResourceTiming[];
      
      const resourceTimingData: ResourceTimingInfo[] = resources.map(resource => {
        // Get resource type from the initiatorType or guess from URL
        let type = resource.initiatorType;
        if (type === 'link' && resource.name.match(/\.(css)$/i)) {
          type = 'stylesheet';
        } else if (type === 'script' || resource.name.match(/\.(js)$/i)) {
          type = 'script';
        } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          type = 'image';
        } else if (resource.name.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
          type = 'font';
        }
        
        // Calculate load time
        const loadTime = resource.responseEnd - resource.startTime;
        
        // Get resource size if available
        const size = resource.transferSize || resource.decodedBodySize || 0;
        
        // Shorten name for display
        const name = resource.name.split('/').pop() || resource.name;
        
        return {
          name,
          type,
          loadTime,
          size,
        };
      });
      
      setResourceTimings(resourceTimingData);
      
      // Get memory leak report
      if (activeTab === 'memory') {
        const report = getMemoryReport();
        setMemoryReport(report);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  }, [activeTab]);
  
  // Refresh data on interval
  useEffect(() => {
    fetchPerformanceData();
    
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(fetchPerformanceData, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchPerformanceData, refreshInterval, autoRefresh, refreshTrigger]);
  
  // Prepare chart data
  const memoryChartData = {
    labels: memoryUsage.map(point => new Date(point.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Memory Usage (MB)',
        data: memoryUsage.map(point => point.value),
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
      },
    ],
  };
  
  const cpuChartData = {
    labels: cpuUsage.map(point => new Date(point.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU Load (%)',
        data: cpuUsage.map(point => point.value),
        fill: true,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.4,
      },
    ],
  };
  
  const fpsChartData = {
    labels: frameRate.map(point => new Date(point.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Frames Per Second',
        data: frameRate.map(point => point.value),
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.4,
      },
    ],
  };
  
  const domSizeChartData = {
    labels: domSize.map(point => new Date(point.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'DOM Nodes Count',
        data: domSize.map(point => point.value),
        fill: true,
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        tension: 0.4,
      },
    ],
  };
  
  const componentChartData = {
    labels: componentRenderTimes.map(component => component.name),
    datasets: [
      {
        label: 'Average Render Time (ms)',
        data: componentRenderTimes.map(component => component.averageRenderTime),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Max Render Time (ms)',
        data: componentRenderTimes.map(component => component.maxRenderTime),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      },
    ],
  };
  
  const apiChartData = {
    labels: apiTimings.map(api => `${api.method} ${api.endpoint}`),
    datasets: [
      {
        label: 'Average Response Time (ms)',
        data: apiTimings.map(api => api.averageTime),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Max Response Time (ms)',
        data: apiTimings.map(api => api.maxTime),
        backgroundColor: 'rgba(255, 206, 86, 0.7)',
      },
    ],
  };
  
  const resourceChartData = {
    labels: resourceTimings.map(resource => resource.name),
    datasets: [
      {
        label: 'Load Time (ms)',
        data: resourceTimings.map(resource => resource.loadTime),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      },
    ],
  };
  
  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    ...chartOptions,
  };
  
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
      },
      legend: {
        position: 'top' as const,
      },
    },
    ...chartOptions,
  };
  
  // Manual refresh handler
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h1>Performance Dashboard</h1>
        <div className="dashboard-controls">
          <button onClick={handleRefresh} className="refresh-button">
            Refresh Data
          </button>
          <div className="auto-refresh-toggle">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => autoRefresh = e.target.checked}
              />
              Auto-refresh ({refreshInterval / 1000}s)
            </label>
          </div>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          Components
        </button>
        <button
          className={`tab-button ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API Requests
        </button>
        <button
          className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>
        <button
          className={`tab-button ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          Memory Analysis
        </button>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="chart-grid">
              <div className="chart-container">
                <h2>Memory Usage</h2>
                <div className="chart-wrapper">
                  <Line data={memoryChartData} options={lineChartOptions} />
                </div>
              </div>
              
              <div className="chart-container">
                <h2>CPU Usage</h2>
                <div className="chart-wrapper">
                  <Line data={cpuChartData} options={lineChartOptions} />
                </div>
              </div>
              
              <div className="chart-container">
                <h2>Frame Rate</h2>
                <div className="chart-wrapper">
                  <Line data={fpsChartData} options={lineChartOptions} />
                </div>
              </div>
              
              <div className="chart-container">
                <h2>DOM Size</h2>
                <div className="chart-wrapper">
                  <Line data={domSizeChartData} options={lineChartOptions} />
                </div>
              </div>
            </div>
            
            <div className="metrics-summary">
              <h2>Performance Summary</h2>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>Memory</h3>
                  <div className="metric-value">
                    {memoryUsage.length > 0 ? `${memoryUsage[memoryUsage.length - 1].value.toFixed(2)} MB` : 'Loading...'}
                  </div>
                </div>
                
                <div className="metric-card">
                  <h3>CPU Load</h3>
                  <div className="metric-value">
                    {cpuUsage.length > 0 ? `${cpuUsage[cpuUsage.length - 1].value.toFixed(1)}%` : 'Loading...'}
                  </div>
                </div>
                
                <div className="metric-card">
                  <h3>Frame Rate</h3>
                  <div className="metric-value">
                    {frameRate.length > 0 ? `${frameRate[frameRate.length - 1].value} FPS` : 'Loading...'}
                  </div>
                </div>
                
                <div className="metric-card">
                  <h3>DOM Nodes</h3>
                  <div className="metric-value">
                    {domSize.length > 0 ? domSize[domSize.length - 1].value : 'Loading...'}
                  </div>
                </div>
              </div>
              
              <div className="insights-section">
                <h3>Performance Insights</h3>
                <ul className="insights-list">
                  {memoryUsage.length > 3 && memoryUsage[memoryUsage.length - 1].value > memoryUsage[memoryUsage.length - 3].value * 1.1 && (
                    <li className="insight warning">
                      <span className="icon">⚠️</span>
                      <span className="text">Memory usage increasing rapidly (10%+ growth). Possible memory leak.</span>
                    </li>
                  )}
                  
                  {frameRate.length > 0 && frameRate[frameRate.length - 1].value < 30 && (
                    <li className="insight warning">
                      <span className="icon">⚠️</span>
                      <span className="text">Low frame rate detected. UI animations may appear jerky.</span>
                    </li>
                  )}
                  
                  {cpuUsage.length > 0 && cpuUsage[cpuUsage.length - 1].value > 80 && (
                    <li className="insight critical">
                      <span className="icon">🔴</span>
                      <span className="text">High CPU usage detected. Application may become unresponsive.</span>
                    </li>
                  )}
                  
                  {domSize.length > 0 && domSize[domSize.length - 1].value > 1000 && (
                    <li className="insight warning">
                      <span className="icon">⚠️</span>
                      <span className="text">Large DOM size detected ({domSize[domSize.length - 1].value} nodes). Consider virtualizing large lists.</span>
                    </li>
                  )}
                  
                  {/* Add more insights based on your metrics */}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'components' && (
          <div className="components-tab">
            <div className="chart-container wide">
              <h2>Component Render Times</h2>
              <div className="chart-wrapper">
                <Bar data={componentChartData} options={barChartOptions} />
              </div>
            </div>
            
            <div className="table-container">
              <h2>Component Performance Details</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Render Count</th>
                    <th>Avg Render Time</th>
                    <th>Last Render Time</th>
                    <th>Max Render Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {componentRenderTimes.map((component, index) => (
                    <tr key={index} className={component.maxRenderTime > 50 ? 'warning-row' : ''}>
                      <td>{component.name}</td>
                      <td>{component.renderCount}</td>
                      <td>{component.averageRenderTime.toFixed(2)} ms</td>
                      <td>{component.lastRenderTime.toFixed(2)} ms</td>
                      <td>{component.maxRenderTime.toFixed(2)} ms</td>
                      <td>
                        {component.maxRenderTime > 50 ? (
                          <span className="status warning">Optimize</span>
                        ) : component.maxRenderTime > 20 ? (
                          <span className="status warning">Review</span>
                        ) : (
                          <span className="status good">Good</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="optimization-tips">
              <h3>Component Optimization Tips</h3>
              <ul>
                <li>Use React.memo for components that render often but with the same props</li>
                <li>Move expensive calculations out of render functions with useMemo</li>
                <li>Avoid unnecessary re-renders by optimizing state updates</li>
                <li>Implement virtualization for long lists with VirtualizedList</li>
                <li>Use LazyLoad for components that are not immediately visible</li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'api' && (
          <div className="api-tab">
            <div className="chart-container wide">
              <h2>API Response Times</h2>
              <div className="chart-wrapper">
                <Bar data={apiChartData} options={barChartOptions} />
              </div>
            </div>
            
            <div className="table-container">
              <h2>API Request Details</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Call Count</th>
                    <th>Avg Time</th>
                    <th>Last Time</th>
                    <th>Max Time</th>
                    <th>Errors</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apiTimings.map((api, index) => (
                    <tr key={index} className={api.averageTime > 500 ? 'warning-row' : ''}>
                      <td>{api.endpoint}</td>
                      <td>{api.method}</td>
                      <td>{api.callCount}</td>
                      <td>{api.averageTime.toFixed(2)} ms</td>
                      <td>{api.lastTime.toFixed(2)} ms</td>
                      <td>{api.maxTime.toFixed(2)} ms</td>
                      <td>{api.errorCount}</td>
                      <td>
                        {api.averageTime > 500 ? (
                          <span className="status critical">Slow</span>
                        ) : api.averageTime > 200 ? (
                          <span className="status warning">Review</span>
                        ) : (
                          <span className="status good">Good</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="optimization-tips">
              <h3>API Optimization Tips</h3>
              <ul>
                <li>Use caching for frequently accessed data</li>
                <li>Implement pagination for large data sets</li>
                <li>Batch multiple requests into a single request</li>
                <li>Use compression for large responses</li>
                <li>Implement rate limiting to prevent overloading</li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'resources' && (
          <div className="resources-tab">
            <div className="chart-container wide">
              <h2>Resource Load Times</h2>
              <div className="chart-wrapper">
                <Bar data={resourceChartData} options={barChartOptions} />
              </div>
            </div>
            
            <div className="table-container">
              <h2>Resource Details</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Load Time</th>
                    <th>Size</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceTimings.map((resource, index) => (
                    <tr key={index} className={resource.loadTime > 500 ? 'warning-row' : ''}>
                      <td>{resource.name}</td>
                      <td>{resource.type}</td>
                      <td>{resource.loadTime.toFixed(2)} ms</td>
                      <td>{(resource.size / 1024).toFixed(2)} KB</td>
                      <td>
                        {resource.loadTime > 500 ? (
                          <span className="status warning">Slow</span>
                        ) : resource.loadTime > 200 ? (
                          <span className="status warning">Review</span>
                        ) : (
                          <span className="status good">Good</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="optimization-tips">
              <h3>Resource Optimization Tips</h3>
              <ul>
                <li>Optimize images with WebP format and proper sizing</li>
                <li>Implement lazy loading for off-screen images</li>
                <li>Use code splitting to reduce initial JavaScript bundle size</li>
                <li>Minify and compress CSS and JavaScript files</li>
                <li>Implement HTTP/2 for parallel resource loading</li>
                <li>Use font-display: swap for better font loading</li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'memory' && (
          <div className="memory-tab">
            <div className="memory-report">
              <h2>Memory Leak Analysis</h2>
              <div className="memory-report-content">
                <pre>{memoryReport || 'Memory analysis not available. Initialize memory tracking first.'}</pre>
              </div>
            </div>
            
            <div className="memory-controls">
              <button
                onClick={() => {
                  // Would normally call initializeMemoryDetection from the memory leak detector
                  alert('Memory tracking initialized. Check console for tracking messages.');
                }}
                className="memory-button"
              >
                Initialize Memory Tracking
              </button>
              
              <button
                onClick={() => {
                  // Would normally call cleanupMemoryTracking from the memory leak detector
                  alert('Memory tracking cleaned up.');
                }}
                className="memory-button"
              >
                Cleanup Memory Tracking
              </button>
            </div>
            
            <div className="optimization-tips">
              <h3>Memory Leak Prevention Tips</h3>
              <ul>
                <li>Always clean up event listeners in useEffect cleanup functions</li>
                <li>Dispose of WebGL contexts, audio contexts, and other resources</li>
                <li>Avoid creating closures that capture large objects</li>
                <li>Use WeakMap and WeakSet for temporary references</li>
                <li>Watch for components that mount but never unmount</li>
                <li>Use the memory leak detector to identify problematic components</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {permissionLevel === 'admin' && (
        <div className="admin-actions">
          <h2>Administrative Actions</h2>
          <div className="action-buttons">
            <button className="action-button" onClick={() => alert('Performance data exported')}>
              Export Performance Data
            </button>
            <button className="action-button" onClick={() => alert('Performance test started')}>
              Run Performance Test
            </button>
            <button className="action-button warning" onClick={() => alert('Heap snapshot created')}>
              Create Heap Snapshot
            </button>
            <button className="action-button warning" onClick={() => alert('Application cache cleared')}>
              Clear Application Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;