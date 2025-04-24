/**
 * Service Worker Manager Component
 * 
 * This component handles service worker registration, updates, and user notifications
 * for Progressive Web App (PWA) functionality.
 */

import React, { useState, useEffect } from 'react';
import { useServiceWorker, ServiceWorkerStatus } from '@/lib/service-worker';

interface ServiceWorkerManagerProps {
  /** Path to the service worker file */
  swPath?: string;
  
  /** Whether to register the service worker on mount */
  registerOnMount?: boolean;
  
  /** Whether to show update notifications */
  showUpdateNotification?: boolean;
  
  /** Whether to show offline notifications */
  showOfflineNotification?: boolean;
  
  /** Custom render function for the update notification */
  renderUpdateNotification?: (update: () => Promise<void>, dismiss: () => void) => React.ReactNode;
  
  /** Custom render function for the offline notification */
  renderOfflineNotification?: (dismiss: () => void) => React.ReactNode;
  
  /** Callback when the service worker status changes */
  onStatusChange?: (status: ServiceWorkerStatus) => void;
  
  /** Callback when an update is available */
  onUpdateAvailable?: () => void;
  
  /** Callback when the update is applied */
  onUpdateApplied?: () => void;
  
  /** Callback when the app goes offline */
  onOffline?: () => void;
  
  /** Callback when the app goes back online */
  onOnline?: () => void;
}

/**
 * Component that manages the service worker registration and lifecycle
 */
const ServiceWorkerManager: React.FC<ServiceWorkerManagerProps> = ({
  swPath = '/service-worker.js',
  registerOnMount = true,
  showUpdateNotification = true,
  showOfflineNotification = true,
  renderUpdateNotification,
  renderOfflineNotification,
  onStatusChange,
  onUpdateAvailable,
  onUpdateApplied,
  onOffline,
  onOnline
}) => {
  // Use service worker hook
  const {
    status,
    updateAvailable,
    register,
    update,
    checkUpdate,
    unregister
  } = useServiceWorker();
  
  // State for notifications
  const [showingUpdateNotification, setShowingUpdateNotification] = useState(false);
  const [showingOfflineNotification, setShowingOfflineNotification] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Register service worker on mount
  useEffect(() => {
    if (registerOnMount) {
      register(swPath).catch(error => {
        console.error('Failed to register service worker:', error);
      });
    }
    
    // Check for updates periodically
    const checkInterval = setInterval(() => {
      checkUpdate().catch(error => {
        console.error('Failed to check for updates:', error);
      });
    }, 60 * 60 * 1000); // Check every hour
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [register, checkUpdate, registerOnMount, swPath]);
  
  // Handle status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);
  
  // Handle update available
  useEffect(() => {
    if (updateAvailable) {
      if (onUpdateAvailable) {
        onUpdateAvailable();
      }
      
      if (showUpdateNotification) {
        setShowingUpdateNotification(true);
      }
    } else {
      setShowingUpdateNotification(false);
    }
  }, [updateAvailable, onUpdateAvailable, showUpdateNotification]);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowingOfflineNotification(false);
      
      if (onOnline) {
        onOnline();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      
      if (showOfflineNotification) {
        setShowingOfflineNotification(true);
      }
      
      if (onOffline) {
        onOffline();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline, showOfflineNotification]);
  
  // Apply update
  const handleUpdate = async () => {
    try {
      await update();
      
      if (onUpdateApplied) {
        onUpdateApplied();
      }
      
      // Refresh the page to use the new service worker
      window.location.reload();
    } catch (error) {
      console.error('Failed to apply update:', error);
    }
  };
  
  // Dismiss update notification
  const dismissUpdateNotification = () => {
    setShowingUpdateNotification(false);
  };
  
  // Dismiss offline notification
  const dismissOfflineNotification = () => {
    setShowingOfflineNotification(false);
  };
  
  // Default update notification
  const defaultUpdateNotification = (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg 
              className="h-6 w-6 text-blue-500" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Update Available
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A new version of the app is available. Click to update.
            </p>
            <div className="mt-4 flex">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleUpdate}
              >
                Update
              </button>
              <button
                type="button"
                className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={dismissUpdateNotification}
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={dismissUpdateNotification}
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Default offline notification
  const defaultOfflineNotification = (
    <div className="fixed bottom-4 left-4 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg 
              className="h-6 w-6 text-yellow-500" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              You're Offline
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Some features may be limited until you reconnect.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={dismissOfflineNotification}
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      {/* Update notification */}
      {showingUpdateNotification && (
        renderUpdateNotification ? 
          renderUpdateNotification(handleUpdate, dismissUpdateNotification) : 
          defaultUpdateNotification
      )}
      
      {/* Offline notification */}
      {showingOfflineNotification && !isOnline && (
        renderOfflineNotification ? 
          renderOfflineNotification(dismissOfflineNotification) : 
          defaultOfflineNotification
      )}
    </>
  );
};

export default ServiceWorkerManager;