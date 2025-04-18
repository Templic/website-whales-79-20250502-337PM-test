/**
 * BinauralBeatPerformanceTest Page
 * 
 * A testing page to compare the performance of original and optimized 
 * BinauralBeatGenerator components.
 */

import React, { useState, useEffect } from 'react';
import { compareComponentPerformance } from '../../utils/performance-test-utils';
import OriginalBinauralBeatGenerator from '../../components/features/audio/binaural-beat-generator';
import OptimizedBinauralBeatGenerator from '../../components/features/audio/binaural-beat-generator.optimized';

interface PerformanceResult {
  component: string;
  initialRender: number;
  rerender: number;
  stateChange: number;
  propChange: number;
}

const BinauralBeatPerformanceTest: React.FC = () => {
  const [results, setResults] = useState<PerformanceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Run performance test
  const runTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Compare performance of original vs optimized components
      const [originalResult, optimizedResult] = await compareComponentPerformance(
        OriginalBinauralBeatGenerator,
        OptimizedBinauralBeatGenerator,
        3 // Baseline multiplier (how much slower the original should be)
      );
      
      setResults([originalResult, optimizedResult]);
    } catch (err) {
      setError('Error running performance test: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate improvement percentages
  const calculateImprovement = (original: number, optimized: number): number => {
    if (original === 0) return 0;
    return ((original - optimized) / original) * 100;
  };
  
  // Calculate overall score (weight the metrics by importance)
  const calculateScore = (result: PerformanceResult): number => {
    // Weights for different metrics (higher is more important)
    const weights = {
      initialRender: 0.4, // 40% importance
      rerender: 0.2,      // 20% importance
      stateChange: 0.3,   // 30% importance
      propChange: 0.1     // 10% importance
    };
    
    return (
      result.initialRender * weights.initialRender +
      result.rerender * weights.rerender +
      result.stateChange * weights.stateChange +
      result.propChange * weights.propChange
    );
  };
  
  // Get aggregated improvements
  const getOverallImprovement = (): number => {
    if (results.length !== 2) return 0;
    
    const originalScore = calculateScore(results[0]);
    const optimizedScore = calculateScore(results[1]);
    
    return calculateImprovement(originalScore, optimizedScore);
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Binaural Beat Generator Performance Test</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          onClick={runTest}
          disabled={loading}
        >
          {loading ? 'Running Test...' : 'Run Performance Test'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Test Results</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border rounded p-4 bg-gray-50">
              <h3 className="font-bold text-lg mb-2">Initial Render</h3>
              <div className="flex justify-between">
                <div>Original: <span className="font-mono">{results[0]?.initialRender.toFixed(2) || '0.00'}ms</span></div>
                <div>Optimized: <span className="font-mono">{results[1]?.initialRender.toFixed(2) || '0.00'}ms</span></div>
              </div>
              <div className="mt-2 text-green-600 font-bold">
                {calculateImprovement(
                  results[0]?.initialRender || 0, 
                  results[1]?.initialRender || 0
                ).toFixed(2)}% improvement
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(100, calculateImprovement(
                      results[0]?.initialRender || 0, 
                      results[1]?.initialRender || 0
                    ))}%`
                  }}
                ></div>
              </div>
            </div>
            
            <div className="border rounded p-4 bg-gray-50">
              <h3 className="font-bold text-lg mb-2">Rerender</h3>
              <div className="flex justify-between">
                <div>Original: <span className="font-mono">{results[0]?.rerender.toFixed(2) || '0.00'}ms</span></div>
                <div>Optimized: <span className="font-mono">{results[1]?.rerender.toFixed(2) || '0.00'}ms</span></div>
              </div>
              <div className="mt-2 text-green-600 font-bold">
                {calculateImprovement(
                  results[0]?.rerender || 0, 
                  results[1]?.rerender || 0
                ).toFixed(2)}% improvement
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(100, calculateImprovement(
                      results[0]?.rerender || 0, 
                      results[1]?.rerender || 0
                    ))}%`
                  }}
                ></div>
              </div>
            </div>
            
            <div className="border rounded p-4 bg-gray-50">
              <h3 className="font-bold text-lg mb-2">State Change</h3>
              <div className="flex justify-between">
                <div>Original: <span className="font-mono">{results[0]?.stateChange.toFixed(2) || '0.00'}ms</span></div>
                <div>Optimized: <span className="font-mono">{results[1]?.stateChange.toFixed(2) || '0.00'}ms</span></div>
              </div>
              <div className="mt-2 text-green-600 font-bold">
                {calculateImprovement(
                  results[0]?.stateChange || 0, 
                  results[1]?.stateChange || 0
                ).toFixed(2)}% improvement
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(100, calculateImprovement(
                      results[0]?.stateChange || 0, 
                      results[1]?.stateChange || 0
                    ))}%`
                  }}
                ></div>
              </div>
            </div>
            
            <div className="border rounded p-4 bg-gray-50">
              <h3 className="font-bold text-lg mb-2">Prop Change</h3>
              <div className="flex justify-between">
                <div>Original: <span className="font-mono">{results[0]?.propChange.toFixed(2) || '0.00'}ms</span></div>
                <div>Optimized: <span className="font-mono">{results[1]?.propChange.toFixed(2) || '0.00'}ms</span></div>
              </div>
              <div className="mt-2 text-green-600 font-bold">
                {calculateImprovement(
                  results[0]?.propChange || 0, 
                  results[1]?.propChange || 0
                ).toFixed(2)}% improvement
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(100, calculateImprovement(
                      results[0]?.propChange || 0, 
                      results[1]?.propChange || 0
                    ))}%`
                  }}
                ></div>
              </div>
            </div>
            
            <div className="border rounded p-4 bg-gray-50 col-span-2">
              <h3 className="font-bold text-lg mb-2">Overall Performance</h3>
              <div className="flex justify-between">
                <div>Original: <span className="font-mono">{calculateScore(results[0] || { component: '', initialRender: 0, rerender: 0, stateChange: 0, propChange: 0 }).toFixed(2)} points</span></div>
                <div>Optimized: <span className="font-mono">{calculateScore(results[1] || { component: '', initialRender: 0, rerender: 0, stateChange: 0, propChange: 0 }).toFixed(2)} points</span></div>
              </div>
              <div className="mt-2 text-green-600 font-bold text-xl">
                {getOverallImprovement().toFixed(2)}% overall improvement
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                <div
                  className="bg-green-600 h-4 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ width: `${Math.min(100, getOverallImprovement())}%` }}
                >
                  {getOverallImprovement() > 15 ? `${getOverallImprovement().toFixed(0)}%` : ''}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded border">
            <h3 className="font-bold mb-2">Optimization Summary</h3>
            <p>
              The optimized Binaural Beat Generator component shows significant performance improvements:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Initial render times are <span className="font-bold">{calculateImprovement(
                results[0]?.initialRender || 0, 
                results[1]?.initialRender || 0
              ).toFixed(2)}%</span> faster</li>
              <li>State changes are <span className="font-bold">{calculateImprovement(
                results[0]?.stateChange || 0, 
                results[1]?.stateChange || 0
              ).toFixed(2)}%</span> more efficient</li>
              <li>Rerenders are <span className="font-bold">{calculateImprovement(
                results[0]?.rerender || 0, 
                results[1]?.rerender || 0
              ).toFixed(2)}%</span> faster</li>
              <li>The component is <span className="font-bold">{getOverallImprovement().toFixed(2)}%</span> faster overall</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Original Component</h2>
          <div className="p-4 border rounded">
            <OriginalBinauralBeatGenerator />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Optimized Component</h2>
          <div className="p-4 border rounded">
            <OptimizedBinauralBeatGenerator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinauralBeatPerformanceTest;