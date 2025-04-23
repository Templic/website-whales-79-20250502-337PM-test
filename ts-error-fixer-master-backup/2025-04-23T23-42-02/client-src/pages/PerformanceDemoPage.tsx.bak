import React, { useState, useEffect } from 'react';
import VirtualizedList from '@/components/common/VirtualizedList';
import OptimizedImage from '@/components/common/OptimizedImage';
import LazyLoad from '@/components/common/LazyLoad';
import GeometricSection from '@/components/cosmic/GeometricSection.optimized';
import { useDeviceCapabilities, useResponsiveRendering } from '@/hooks/use-responsive';
import { getPerformanceMetrics, PerformanceMonitor } from '@/lib/performance';
import { analyzeBundleSize, getBundleOptimizationRecommendations } from '@/lib/bundle-optimization';

/**
 * Performance Demonstration Page
 * 
 * Shows how various performance optimization techniques work together
 * to create a smooth user experience across different devices and network conditions.
 */
const PerformanceDemoPage: React.FC = () => {
  // Get device capabilities for adaptive rendering
  const capabilities = useDeviceCapabilities();
  const renderSettings = useResponsiveRendering();
  
  // State for demo data
  const [largeListData, setLargeListData] = useState<string[]>([]);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [metricsData, setMetricsData] = useState(getPerformanceMetrics());
  const [bundleAnalysis, setBundleAnalysis] = useState(analyzeBundleSize());
  const [recommendations, setRecommendations] = useState(getBundleOptimizationRecommendations());
  
  // Generate demo data on mount
  useEffect(() => {
    // Generate sample data for virtualized list
    const demoData = Array.from({ length: 10000 }, (_, i) => 
      `Item ${i + 1} - Sample text for virtualized demo`
    );
    setLargeListData(demoData);
    
    // Update metrics periodically
    const intervalId = setInterval(() => {
      setMetricsData(getPerformanceMetrics());
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Render a list item in the virtualized list
  const renderListItem = (item: string, index: number) => {
    return (
      <div className="p-4 border-b hover:bg-gray-50">
        <span className="font-medium text-blue-600 mr-2">{index + 1}.</span>
        {item}
      </div>
    );
  };
  
  return (
    <div className="performance-demo-page min-h-screen bg-gray-50">
      {/* Page header */}
      <header className="bg-indigo-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4">Performance Optimization Demo</h1>
          <p className="text-xl opacity-80">
            Demonstrating advanced techniques for improving web application performance
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-indigo-700 rounded-full text-sm">
              Device: {capabilities.estimatedDeviceClass}
            </span>
            <span className="px-3 py-1 bg-indigo-700 rounded-full text-sm">
              Performance: {capabilities.overallLevel}
            </span>
            <span className="px-3 py-1 bg-indigo-700 rounded-full text-sm">
              Connection: {capabilities.connection}
            </span>
            <span className="px-3 py-1 bg-indigo-700 rounded-full text-sm">
              Effects: {renderSettings.useComplexEffects ? 'Enabled' : 'Reduced'}
            </span>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto py-8 px-4">
        {/* Section 1: Device Adaptation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4">1. Device Capability Adaptation</h2>
          <p className="mb-6">
            This demo automatically adapts to your device capabilities, network conditions, and preferences.
          </p>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Your Device Profile:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-100 p-4 rounded">
                <h4 className="font-medium">Device Class</h4>
                <p>{capabilities.estimatedDeviceClass}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <h4 className="font-medium">CPU Performance</h4>
                <p>{capabilities.cpu}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <h4 className="font-medium">Memory</h4>
                <p>{capabilities.memory}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <h4 className="font-medium">Connection</h4>
                <p>{capabilities.connection}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <h4 className="font-medium">Screen Resolution</h4>
                <p>{capabilities.resolution}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <h4 className="font-medium">Preferences</h4>
                <p>
                  {capabilities.isReducedMotion ? 'Reduced motion, ' : 'Standard motion, '}
                  {capabilities.isPrefersDataSaver ? 'Data saver' : 'Standard data'}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section 2: Lazy Loading */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4">2. Visibility-Based Rendering</h2>
          <p className="mb-6">
            Components are only rendered when they become visible in the viewport, 
            saving memory and processing power.
          </p>
          
          <div className="space-y-8">
            {/* First lazy-loaded section */}
            <LazyLoad 
              height={300}
              className="bg-white shadow-md rounded-lg overflow-hidden"
              placeholder={
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-gray-500">Loading content as you scroll...</p>
                </div>
              }
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Lazy Loaded Content 1</h3>
                <p>
                  This content was not rendered until it became visible in your viewport.
                  This reduces initial page load time and memory usage.
                </p>
                <div className="mt-4 bg-green-100 p-4 rounded">
                  <p className="text-green-700">✓ This component has been loaded!</p>
                </div>
              </div>
            </LazyLoad>
            
            {/* Second lazy-loaded section with delay */}
            <LazyLoad 
              height={300}
              delayMs={500}
              className="bg-white shadow-md rounded-lg overflow-hidden"
              placeholder={
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-gray-500">Loading content with 500ms delay...</p>
                </div>
              }
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Lazy Loaded Content 2</h3>
                <p>
                  This content has a 500ms delay after becoming visible before rendering.
                  This technique is useful for staggering resource-intensive operations.
                </p>
                <div className="mt-4 bg-green-100 p-4 rounded">
                  <p className="text-green-700">✓ This component has been loaded with delay!</p>
                </div>
              </div>
            </LazyLoad>
          </div>
        </section>
        
        {/* Section 3: Virtualized List */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4">3. Virtualized List</h2>
          <p className="mb-6">
            Rendering 10,000 items efficiently by only creating DOM nodes for visible items.
          </p>
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-100 border-b">
              <h3 className="font-semibold">Virtual List Demo (10,000 items)</h3>
            </div>
            <div className="h-80">
              <VirtualizedList
                items={largeListData}
                height={320}
                itemHeight={56}
                renderItem={renderListItem}
                overscan={5}
              />
            </div>
          </div>
        </section>
        
        {/* Section 4: Optimized Images */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4">4. Image Optimization</h2>
          <p className="mb-6">
            Images are loaded with progressive enhancement, placeholder, and lazy loading.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Standard image */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Standard Image</h3>
              </div>
              <OptimizedImage
                src="https://source.unsplash.com/random/800x600/?nature"
                alt="Nature"
                width="100%"
                height={200}
                loading="lazy"
                placeholderColor="#e2e8f0"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  Basic lazy-loaded image with placeholder color.
                </p>
              </div>
            </div>
            
            {/* Priority image */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Priority Image</h3>
              </div>
              <OptimizedImage
                src="https://source.unsplash.com/random/800x600/?mountain"
                alt="Mountain"
                width="100%"
                height={200}
                priority
                fadeIn
                placeholderColor="#e2e8f0"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  Priority image loads immediately with fade-in effect.
                </p>
              </div>
            </div>
            
            {/* Fallback image */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Fallback Image</h3>
              </div>
              <OptimizedImage
                src="https://this-url-does-not-exist.jpg"
                alt="Missing image"
                width="100%"
                height={200}
                fallbackSrc="https://via.placeholder.com/800x600?text=Image+Not+Found"
                loading="lazy"
                placeholderColor="#fecaca"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  Demonstrates graceful fallback handling when image fails to load.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section 5: Adaptive Sacred Geometry */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4">5. Optimized SVG Rendering</h2>
          <p className="mb-6">
            Sacred geometry shapes rendered with detail level based on device capabilities.
          </p>
          
          <div className="space-y-8">
            <GeometricSection
              title="Flower of Life"
              subtitle="The Blueprint of Creation"
              description="The Flower of Life is one of the most ancient sacred geometry symbols, representing the fundamental patterns of creation."
              primaryShape="flower-of-life"
              complexity={capabilities.overallLevel === 'low' ? 'low' : 'high'}
              minimalRendering={capabilities.connection === 'low'}
              animate={!capabilities.isReducedMotion}
            />
            
            <GeometricSection
              title="Metatron's Cube"
              subtitle="The Structure of Energy"
              description="Metatron's Cube contains all of the geometric shapes that exist in the universe, representing the flow of energy."
              primaryShape="metatron"
              backgroundColor="#1a202c"
              glowColor="#60a5fa"
              complexity={capabilities.overallLevel === 'low' ? 'low' : 'medium'}
              minimalRendering={capabilities.connection === 'low'}
              animate={!capabilities.isReducedMotion}
            />
            
            <GeometricSection
              title="Sri Yantra"
              subtitle="The Divine Feminine"
              description="The Sri Yantra represents the cosmos and the human body in a state of divine union through geometric precision."
              primaryShape="sri-yantra"
              backgroundColor="#281c3b"
              glowColor="#ec4899"
              complexity={capabilities.overallLevel === 'low' ? 'low' : 'high'}
              minimalRendering={capabilities.connection === 'low'}
              animate={!capabilities.isReducedMotion}
            />
          </div>
        </section>
        
        {/* Performance Monitor Toggle */}
        <div className="fixed bottom-4 right-4 z-50">
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-lg"
            onClick={() => setShowPerformanceStats(!showPerformanceStats)}
          >
            {showPerformanceStats ? 'Hide' : 'Show'} Performance Stats
          </button>
        </div>
        
        {/* Performance Monitor */}
        {showPerformanceStats && <PerformanceMonitor />}
      </div>
    </div>
  );
};

export default PerformanceDemoPage;