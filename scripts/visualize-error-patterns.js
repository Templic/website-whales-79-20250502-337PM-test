#!/usr/bin/env node

/**
 * TypeScript Error Pattern Visualization Script
 * 
 * This script generates visualizations from TypeScript error analysis data to help
 * identify patterns and relationships between errors.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Generate an HTML visualization from analysis data
 */
function generateVisualization(analysisJsonPath, outputHtmlPath) {
  try {
    // Load analysis data
    if (!fs.existsSync(analysisJsonPath)) {
      console.error(`Analysis file not found: ${analysisJsonPath}`);
      process.exit(1);
    }
    
    const analysisData = JSON.parse(fs.readFileSync(analysisJsonPath, 'utf-8'));
    
    // Generate HTML content
    const htmlContent = generateHtml(analysisData);
    
    // Write HTML file
    fs.writeFileSync(outputHtmlPath, htmlContent);
    
    console.log(`Visualization generated at: ${outputHtmlPath}`);
    
  } catch (error) {
    console.error('Error generating visualization:', error);
    process.exit(1);
  }
}

/**
 * Generate HTML content for visualization
 */
function generateHtml(analysisData) {
  const {
    totalErrors,
    errorsByCategory,
    errorsByFile,
    errorsBySeverity,
    dependencyGraph,
    rootCauses,
    summary
  } = analysisData;
  
  // Prepare data for charts
  const categoryData = Object.entries(errorsByCategory || {})
    .map(([category, errors]) => ({
      category,
      count: Array.isArray(errors) ? errors.length : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  const severityData = Object.entries(errorsBySeverity || {})
    .map(([severity, errors]) => ({
      severity,
      count: Array.isArray(errors) ? errors.length : 0
    }))
    .sort((a, b) => {
      const order = { critical: 3, high: 2, medium: 1, low: 0 };
      return order[b.severity] - order[a.severity];
    });
  
  const topFiles = Object.entries(errorsByFile || {})
    .map(([file, errors]) => ({
      file: path.basename(file),
      path: file,
      count: Array.isArray(errors) ? errors.length : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Create node and link data for dependency graph visualization
  const nodes = [];
  const links = [];
  
  const fileMap = new Map();
  
  // Add files with errors to nodes
  Object.keys(errorsByFile || {}).forEach((file, index) => {
    const errors = errorsByFile[file];
    const errorCount = Array.isArray(errors) ? errors.length : 0;
    
    if (errorCount > 0) {
      fileMap.set(file, index);
      nodes.push({
        id: index,
        name: path.basename(file),
        path: file,
        errors: errorCount,
        size: Math.log(errorCount + 1) * 5 + 5 // Logarithmic scaling
      });
    }
  });
  
  // Add dependencies to links
  Object.entries(dependencyGraph || {}).forEach(([source, targets]) => {
    if (fileMap.has(source)) {
      const sourceIndex = fileMap.get(source);
      
      targets.forEach(target => {
        if (fileMap.has(target)) {
          const targetIndex = fileMap.get(target);
          links.push({
            source: sourceIndex,
            target: targetIndex,
            value: 1
          });
        }
      });
    }
  });
  
  // Generate HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeScript Error Analysis Visualization</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    header {
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    h1 {
      color: #2a3f5f;
      margin-bottom: 10px;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: #f4f7f9;
      border-radius: 6px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #2a3f5f;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    .visualization-row {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .chart-container {
      flex: 1;
      min-width: 300px;
      background-color: white;
      border-radius: 6px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }
    .section-heading {
      margin-top: 40px;
      margin-bottom: 20px;
      color: #2a3f5f;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    #dependency-graph {
      width: 100%;
      height: 600px;
      border: 1px solid #ddd;
      border-radius: 6px;
    }
    .top-files-list {
      list-style-type: none;
      padding: 0;
    }
    .top-files-list li {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .top-files-list li:last-child {
      border-bottom: none;
    }
    .file-name {
      font-weight: 500;
    }
    .file-errors {
      font-weight: bold;
      color: #e15759;
    }
    .root-causes-list {
      list-style-type: none;
      padding: 0;
    }
    .root-cause-item {
      margin-bottom: 15px;
      padding: 15px;
      background-color: #f9f2f4;
      border-radius: 6px;
      border-left: 4px solid #e15759;
    }
    .root-cause-message {
      font-weight: 500;
      margin-bottom: 5px;
    }
    .root-cause-details {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    .root-cause-code {
      font-family: monospace;
      font-size: 12px;
      background-color: #f1f1f1;
      padding: 10px;
      border-radius: 4px;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .legend {
      display: flex;
      justify-content: center;
      margin-top: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin: 0 10px;
    }
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>TypeScript Error Analysis Visualization</h1>
      <p>Interactive visualization of TypeScript errors and their relationships.</p>
    </header>
    
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-value">${summary.totalErrors}</div>
        <div class="stat-label">Total Errors</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${summary.criticalErrors}</div>
        <div class="stat-label">Critical Errors</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${summary.rootCausesCount}</div>
        <div class="stat-label">Root Causes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${summary.fixableErrorsCount}</div>
        <div class="stat-label">Fixable Errors</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round(summary.estimatedFixTimeMinutes / 60)}h ${summary.estimatedFixTimeMinutes % 60}m</div>
        <div class="stat-label">Est. Fix Time</div>
      </div>
    </div>
    
    <h2 class="section-heading">Error Distribution</h2>
    
    <div class="visualization-row">
      <div class="chart-container">
        <h3>Errors by Category</h3>
        <canvas id="categoryChart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3>Errors by Severity</h3>
        <canvas id="severityChart"></canvas>
      </div>
    </div>
    
    <div class="visualization-row">
      <div class="chart-container">
        <h3>Top Files with Errors</h3>
        <ul class="top-files-list">
          ${topFiles.map(file => `
            <li>
              <span class="file-name" title="${file.path}">${file.file}</span>
              <span class="file-errors">${file.count} errors</span>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div class="chart-container">
        <h3>Error Severity Distribution</h3>
        <canvas id="severityPieChart"></canvas>
      </div>
    </div>
    
    <h2 class="section-heading">Dependency Graph</h2>
    <p>Files with errors and their dependencies. Larger nodes indicate more errors.</p>
    
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color" style="background-color: #e15759;"></div>
        <span>Critical</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #f28e2c;"></div>
        <span>High</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #edc949;"></div>
        <span>Medium</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #59a14f;"></div>
        <span>Low</span>
      </div>
    </div>
    
    <div id="dependency-graph"></div>
    
    <h2 class="section-heading">Root Causes</h2>
    <p>These errors are likely causing cascading issues throughout the codebase.</p>
    
    <ul class="root-causes-list">
      ${(rootCauses || []).slice(0, 5).map(cause => `
        <li class="root-cause-item">
          <div class="root-cause-message">${cause.code}: ${escapeHtml(cause.message)}</div>
          <div class="root-cause-details">
            <strong>File:</strong> ${path.basename(cause.filePath)} | 
            <strong>Line:</strong> ${cause.line} | 
            <strong>Severity:</strong> ${cause.severity} | 
            <strong>Fix Strategy:</strong> ${cause.fixStrategy || 'N/A'}
          </div>
          <div class="root-cause-code">${cause.contextCode || 'No context available'}</div>
        </li>
      `).join('')}
    </ul>
    
  </div>
  
  <script>
    // Prepare chart data
    const categoryData = ${JSON.stringify(categoryData)};
    const severityData = ${JSON.stringify(severityData)};
    const topFiles = ${JSON.stringify(topFiles)};
    
    // Category bar chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
      type: 'bar',
      data: {
        labels: categoryData.map(d => d.category),
        datasets: [{
          label: 'Number of Errors',
          data: categoryData.map(d => d.count),
          backgroundColor: '#4e79a7',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Errors'
            }
          }
        }
      }
    });
    
    // Severity bar chart
    const severityCtx = document.getElementById('severityChart').getContext('2d');
    new Chart(severityCtx, {
      type: 'bar',
      data: {
        labels: severityData.map(d => d.severity),
        datasets: [{
          label: 'Number of Errors',
          data: severityData.map(d => d.count),
          backgroundColor: severityData.map(d => {
            const colors = {
              critical: '#e15759',
              high: '#f28e2c',
              medium: '#edc949',
              low: '#59a14f'
            };
            return colors[d.severity] || '#4e79a7';
          }),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Errors'
            }
          }
        }
      }
    });
    
    // Severity pie chart
    const severityPieCtx = document.getElementById('severityPieChart').getContext('2d');
    new Chart(severityPieCtx, {
      type: 'pie',
      data: {
        labels: severityData.map(d => d.severity),
        datasets: [{
          data: severityData.map(d => d.count),
          backgroundColor: [
            '#e15759', // critical
            '#f28e2c', // high
            '#edc949', // medium
            '#59a14f'  // low
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
    
    // Dependency graph visualization using D3.js
    const nodes = ${JSON.stringify(nodes)};
    const links = ${JSON.stringify(links)};
    
    if (nodes.length > 0) {
      const width = document.getElementById('dependency-graph').clientWidth;
      const height = 600;
      
      const svg = d3.select('#dependency-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
      
      const g = svg.append('g');
      
      // Add zoom functionality
      svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        })
      );
      
      // Create a force simulation
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.size + 10));
      
      // Draw links
      const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', d => Math.sqrt(d.value));
      
      // Draw nodes
      const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', d => d.size)
        .attr('fill', d => {
          // Color based on highest severity error in the file
          const file = d.path;
          const errors = ${JSON.stringify(analysisData.errorsByFile || {})};
          const fileErrors = errors[file] || [];
          
          if (fileErrors.some(e => e.severity === 'critical')) return '#e15759';
          if (fileErrors.some(e => e.severity === 'high')) return '#f28e2c';
          if (fileErrors.some(e => e.severity === 'medium')) return '#edc949';
          return '#59a14f'; // low
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))
        .append('title')
        .text(d => \`\${d.name} (\${d.errors} errors)\`);
      
      // Add labels
      const label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .text(d => d.name)
        .attr('font-size', 10)
        .attr('dx', 12)
        .attr('dy', 4);
      
      // Update positions on simulation tick
      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        
        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);
        
        label
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });
      
      // Drag functions
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    } else {
      document.getElementById('dependency-graph').innerHTML = '<p style="text-align: center; padding: 20px;">No dependency data available</p>';
    }
  </script>
</body>
</html>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Parse command line arguments
const args = process.argv.slice(2);
let analysisJsonPath = path.join(projectRoot, 'typescript-error-analysis.json');
let outputHtmlPath = path.join(projectRoot, 'typescript-error-visualization.html');

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--input' || arg === '-i') {
    analysisJsonPath = args[++i];
  } else if (arg === '--output' || arg === '-o') {
    outputHtmlPath = args[++i];
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
TypeScript Error Pattern Visualization Script
===========================================

Usage:
  node visualize-error-patterns.js [options]

Options:
  --input, -i    Input analysis JSON file (default: typescript-error-analysis.json)
  --output, -o   Output HTML file (default: typescript-error-visualization.html)
  --help, -h     Show this help message

Examples:
  node visualize-error-patterns.js
  node visualize-error-patterns.js --input ./reports/analysis.json --output ./reports/visualization.html
    `);
    process.exit(0);
  }
}

// Execute main function
generateVisualization(analysisJsonPath, outputHtmlPath);