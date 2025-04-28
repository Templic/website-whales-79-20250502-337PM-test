/**
 * ResponsiveDemo.tsx
 * 
 * Demo page to showcase orientation-responsive components for
 * different device types and orientations.
 */

import React from 'react';
import { useOrientationContext } from '../contexts/OrientationContext';
import { OrientationLayout, OrientationContainer } from '../components/ui/OrientationLayout';
import { GeometricShapeResponsive, GeometricSectionResponsive } from '../components/cosmic/GeometricShapeResponsive';
import { OrientationView } from '../contexts/OrientationContext';

export function ResponsiveDemo() {
  const { isLandscape, isPortrait, isMobile, isTablet, deviceType, orientation } = useOrientationContext();
  
  return (
    <div className="responsive-demo-page">
      <header className="demo-header">
        <h1>Responsive Design Demo</h1>
        <div className="orientation-info">
          <p>Current device: <strong>{deviceType}</strong></p>
          <p>Current orientation: <strong>{orientation}</strong></p>
        </div>
      </header>
      
      <main className="demo-content">
        {/* Orientation layout showcase */}
        <section className="demo-section">
          <h2>OrientationLayout Demo</h2>
          <p>This component provides different content for landscape and portrait modes</p>
          
          <OrientationLayout
            landscapeContent={
              <div className="landscape-specific-content">
                <h3>Landscape Content</h3>
                <p>This content only appears in landscape orientation.</p>
                <p>Notice how the layout is optimized for the wider, shorter screen space.</p>
                <div className="landscape-only flex landscape-side-by-side">
                  <div className="card">Feature 1</div>
                  <div className="card">Feature 2</div>
                  <div className="card">Feature 3</div>
                </div>
              </div>
            }
            portraitContent={
              <div className="portrait-specific-content">
                <h3>Portrait Content</h3>
                <p>This content only appears in portrait orientation.</p>
                <p>The layout is optimized for the narrower, taller screen space.</p>
                <div className="portrait-stack">
                  <div className="card">Feature 1</div>
                  <div className="card">Feature 2</div>
                  <div className="card">Feature 3</div>
                </div>
              </div>
            }
          >
            <div className="common-content">
              <h3>Common Content</h3>
              <p>This content appears in both orientations, but styling adapts appropriately.</p>
            </div>
          </OrientationLayout>
        </section>
        
        {/* Geometric shapes showcase */}
        <section className="demo-section">
          <h2>Geometric Shape Responsiveness</h2>
          <p>Sacred geometry containers adapt to different device orientations</p>
          
          <div className={`shape-demo-container ${orientation === 'landscape' ? 'landscape-grid' : 'portrait-grid'}`}>
            <GeometricShapeResponsive shape="hexagon" glowEffect>
              <h3>Hexagon</h3>
              <p>This hexagon adapts its size based on your device and orientation.</p>
            </GeometricShapeResponsive>
            
            <GeometricShapeResponsive shape="triangle" color="#4a90e2">
              <h3>Triangle</h3>
              <p>The triangle shape adjusts for optimal viewing.</p>
            </GeometricShapeResponsive>
            
            <GeometricShapeResponsive shape="pentagon" pulseEffect>
              <h3>Pentagon</h3>
              <p>Notice how effects are preserved across orientations.</p>
            </GeometricShapeResponsive>
            
            <GeometricShapeResponsive shape="diamond" color="#50c878">
              <h3>Diamond</h3>
              <p>Color properties adapt to the current theme.</p>
            </GeometricShapeResponsive>
          </div>
        </section>
        
        {/* Device-specific content */}
        <section className="demo-section">
          <h2>Device-Specific Components</h2>
          <p>Components that appear only on specific device types</p>
          
          <div className="device-specific-demo">
            <OrientationView mobile>
              <div className="device-note mobile-note">
                <h3>Mobile Optimization</h3>
                <p>This content only appears on mobile devices. Font sizes and touch targets are optimized for small screens.</p>
              </div>
            </OrientationView>
            
            <OrientationView tablet>
              <div className="device-note tablet-note">
                <h3>Tablet Optimization</h3>
                <p>This content only appears on tablet devices. The layout takes advantage of the medium-sized screen.</p>
              </div>
            </OrientationView>
            
            <OrientationView desktop>
              <div className="device-note desktop-note">
                <h3>Desktop Experience</h3>
                <p>This content only appears on desktop devices. The layout is optimized for large screens and mouse/keyboard interaction.</p>
              </div>
            </OrientationView>
            
            <OrientationView mobile landscape>
              <div className="orientation-note mobile-landscape-note">
                <h3>Mobile Landscape Note</h3>
                <p>This appears only on mobile devices in landscape orientation. It's designed for the limited vertical space.</p>
              </div>
            </OrientationView>
            
            <OrientationView tablet portrait>
              <div className="orientation-note tablet-portrait-note">
                <h3>Tablet Portrait Note</h3>
                <p>This appears only on tablet devices in portrait orientation, optimizing for that specific layout.</p>
              </div>
            </OrientationView>
          </div>
        </section>
        
        {/* Full geometric section demo */}
        <GeometricSectionResponsive backgroundShape="circle" className="demo-geometric-section">
          <h2>Full Geometric Section</h2>
          <p>This entire section uses geometric styling with responsive adaptations</p>
          
          <div className={`feature-grid ${isLandscape ? 'landscape-side-by-side' : 'portrait-stack'}`}>
            <div className="feature-card">
              <h3>Dynamic Layouts</h3>
              <p>Layout automatically adjusts based on device orientation</p>
            </div>
            
            <div className="feature-card">
              <h3>Sacred Geometry</h3>
              <p>Geometric containers scale appropriately for different screens</p>
            </div>
            
            <div className="feature-card">
              <h3>Touch Optimized</h3>
              <p>Mobile interfaces have larger touch targets for better usability</p>
            </div>
          </div>
        </GeometricSectionResponsive>
      </main>
      
      <footer className="demo-footer">
        <p>Try rotating your device to see how the layout adapts!</p>
        <div className="device-info">
          <p>Current state: {deviceType} in {orientation} mode</p>
        </div>
      </footer>
    </div>
  );
}

export default ResponsiveDemo;