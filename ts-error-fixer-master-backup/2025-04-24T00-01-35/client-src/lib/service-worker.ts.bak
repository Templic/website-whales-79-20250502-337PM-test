/**
 * Service Worker Utilities
 * 
 * Provides utilities for registering, updating, and communicating with the service worker.
 */

// Check if service workers are supported
export const isServiceWorkerSupported = 'serviceWorker' in navigator;

// Cache expiration times (in milliseconds)
export const CACHE_EXPIRATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,    // 1 day
  API: 60 * 60 * 1000,             // 1 hour
  IMAGES: 3 * 24 * 60 * 60 * 1000  // 3 days
};

// Service worker registration options
interface ServiceWorkerRegistrationOptions {
  scope?: string;
  updateViaCache?: ServiceWorkerUpdateViaCache;
}

// Service worker status
export type ServiceWorkerStatus = 
  | 'unsupported'
  | 'pending'
  | 'registered'
  | 'installing'
  | 'installed'
  | 'activating'
  | 'activated'
  | 'redundant'
  | 'updated'
  | 'error';

// Event callback types
export type ServiceWorkerCallback = (registration: ServiceWorkerRegistration) => void;
export type ServiceWorkerErrorCallback = (error: Error) => void;
export type ServiceWorkerMessageCallback = (event: MessageEvent) => void;

// Registration status and callbacks
let swRegistration: ServiceWorkerRegistration | null = null;
let swStatus: ServiceWorkerStatus = isServiceWorkerSupported ? 'pending' : 'unsupported';
const updateCallbacks: ServiceWorkerCallback[] = [];
const errorCallbacks: ServiceWorkerErrorCallback[] = [];
const messageCallbacks: ServiceWorkerMessageCallback[] = [];

/**
 * Registers the service worker
 * @param {string} swPath Path to the service worker file
 * @param {ServiceWorkerRegistrationOptions} options Registration options
 * @returns {Promise<ServiceWorkerRegistration | null>} The service worker registration or null if not supported
 */
export async function registerServiceWorker(
  swPath: string = '/service-worker.js',
  options: ServiceWorkerRegistrationOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  // Check if service workers are supported
  if (!isServiceWorkerSupported) {
    console.warn('Service workers are not supported in this browser');
    swStatus = 'unsupported';
    return null;
  }
  
  try {
    swStatus = 'pending';
    
    // Register the service worker
    const registration = await navigator.serviceWorker.register(swPath, options);
    swRegistration = registration;
    swStatus = 'registered';
    
    console.log('Service Worker registered with scope:', registration.scope);
    
    // Set up update listeners
    setupUpdateListeners(registration);
    
    // Set up message listeners
    setupMessageListeners();
    
    return registration;
  } catch (error: unknown) {
    swStatus = 'error';
    console.error('Service Worker registration failed:', error);
    
    // Notify error callbacks
    const err = error instanceof Error ? error : new Error(String(error));
    notifyErrorCallbacks(err);
    
    return null;
  }
}

/**
 * Sets up service worker update listeners
 * @param {ServiceWorkerRegistration} registration The service worker registration
 */
function setupUpdateListeners(registration: ServiceWorkerRegistration): void {
  // Check if a new service worker is installing
  if (registration.installing) {
    trackInstallation(registration.installing);
  }
  
  // Listen for updates
  registration.addEventListener('updatefound', () => {
    if (registration.installing) {
      trackInstallation(registration.installing);
    }
  });
  
  // Listen for controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed');
    
    // TODO: Potentially reload the page when the controller changes
    // window.location.reload();
  });
}

/**
 * Tracks the installation of a service worker
 * @param {ServiceWorker} worker The service worker to track
 */
function trackInstallation(worker: ServiceWorker): void {
  worker.addEventListener('statechange', () => {
    console.log('Service Worker state changed to:', worker.state);
    
    switch (worker.state) {
      case 'installing':
        swStatus = 'installing';
        break;
        
      case 'installed':
        swStatus = 'installed';
        
        // Check if there's an update
        if (navigator.serviceWorker.controller) {
          console.log('New Service Worker installed, but waiting for activation');
          swStatus = 'updated';
          
          // Notify update callbacks
          if (swRegistration) {
            notifyUpdateCallbacks(swRegistration);
          }
        } else {
          console.log('Service Worker installed for the first time');
        }
        break;
        
      case 'activating':
        swStatus = 'activating';
        break;
        
      case 'activated':
        swStatus = 'activated';
        console.log('Service Worker activated');
        break;
        
      case 'redundant':
        swStatus = 'redundant';
        console.log('Service Worker is now redundant');
        break;
    }
  });
}

/**
 * Sets up message listeners for the service worker
 */
function setupMessageListeners(): void {
  navigator.serviceWorker.addEventListener('message', event => {
    console.log('Received message from Service Worker:', event.data);
    
    // Notify message callbacks
    notifyMessageCallbacks(event);
  });
}

/**
 * Notifies update callbacks
 * @param {ServiceWorkerRegistration} registration The service worker registration
 */
function notifyUpdateCallbacks(registration: ServiceWorkerRegistration): void {
  updateCallbacks.forEach(callback => {
    try {
      callback(registration);
    } catch (error: unknown) {
      console.error('Error in update callback:', error);
    }
  });
}

/**
 * Notifies error callbacks
 * @param {Error} error The error
 */
function notifyErrorCallbacks(error: Error): void {
  errorCallbacks.forEach(callback => {
    try {
      callback(error);
    } catch (callbackError: unknown) {
      console.error('Error in error callback:', callbackError);
    }
  });
}

/**
 * Notifies message callbacks
 * @param {MessageEvent} event The message event
 */
function notifyMessageCallbacks(event: MessageEvent): void {
  messageCallbacks.forEach(callback => {
    try {
      callback(event);
    } catch (error: unknown) {
      console.error('Error in message callback:', error);
    }
  });
}

/**
 * Returns the current service worker registration if available
 * @returns {ServiceWorkerRegistration | null} The service worker registration or null
 */
export function getRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

/**
 * Returns the current service worker status
 * @returns {ServiceWorkerStatus} The service worker status
 */
export function getStatus(): ServiceWorkerStatus {
  return swStatus;
}

/**
 * Checks for service worker updates
 * @returns {Promise<boolean>} Whether there was an update
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!swRegistration) {
    return false;
  }
  
  try {
    // Check for updates
    const hasUpdate = await swRegistration.update();
    return !!hasUpdate;
  } catch (error: unknown) {
    console.error('Failed to check for Service Worker updates:', error);
    
    // Notify error callbacks
    const err = error instanceof Error ? error : new Error(String(error));
    notifyErrorCallbacks(err);
    
    return false;
  }
}

/**
 * Unregisters the service worker
 * @returns {Promise<boolean>} Whether the unregistration was successful
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!swRegistration) {
    return false;
  }
  
  try {
    const success = await swRegistration.unregister();
    
    if (success) {
      console.log('Service Worker unregistered');
      swRegistration = null;
      swStatus = isServiceWorkerSupported ? 'pending' : 'unsupported';
    } else {
      console.warn('Service Worker unregistration failed');
    }
    
    return success;
  } catch (error: unknown) {
    console.error('Failed to unregister Service Worker:', error);
    
    // Notify error callbacks
    const err = error instanceof Error ? error : new Error(String(error));
    notifyErrorCallbacks(err);
    
    return false;
  }
}

/**
 * Sends a message to the service worker
 * @param {any} message The message to send
 * @returns {Promise<void>} Promise that resolves when the message is sent
 */
export async function sendMessage(message$2: Promise<void> {
  if (!navigator.serviceWorker.controller) {
    throw new Error('No active Service Worker');
  }
  
  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Adds an update callback
 * @param {ServiceWorkerCallback} callback The callback to add
 */
export function onUpdate(callback: ServiceWorkerCallback): void {
  updateCallbacks.push(callback);
}

/**
 * Adds an error callback
 * @param {ServiceWorkerErrorCallback} callback The callback to add
 */
export function onError(callback: ServiceWorkerErrorCallback): void {
  errorCallbacks.push(callback);
}

/**
 * Adds a message callback
 * @param {ServiceWorkerMessageCallback} callback The callback to add
 */
export function onMessage(callback: ServiceWorkerMessageCallback): void {
  messageCallbacks.push(callback);
}

/**
 * Removes an update callback
 * @param {ServiceWorkerCallback} callback The callback to remove
 */
export function offUpdate(callback: ServiceWorkerCallback): void {
  const index = updateCallbacks.indexOf(callback);
  if (index !== -1) {
    updateCallbacks.splice(index, 1);
  }
}

/**
 * Removes an error callback
 * @param {ServiceWorkerErrorCallback} callback The callback to remove
 */
export function offError(callback: ServiceWorkerErrorCallback): void {
  const index = errorCallbacks.indexOf(callback);
  if (index !== -1) {
    errorCallbacks.splice(index, 1);
  }
}

/**
 * Removes a message callback
 * @param {ServiceWorkerMessageCallback} callback The callback to remove
 */
export function offMessage(callback: ServiceWorkerMessageCallback): void {
  const index = messageCallbacks.indexOf(callback);
  if (index !== -1) {
    messageCallbacks.splice(index, 1);
  }
}

/**
 * Applies a service worker update immediately
 * @returns {Promise<void>} Promise that resolves when the update is applied
 */
export async function applyUpdate(): Promise<void> {
  if (!swRegistration || !swRegistration.waiting) {
    throw new Error('No waiting Service Worker to activate');
  }
  
  // Send skip waiting message to the waiting service worker
  swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Clears all caches managed by the service worker
 * @returns {Promise<void>} Promise that resolves when the caches are cleared
 */
export async function clearAllCaches(): Promise<void> {
  if (!navigator.serviceWorker.controller) {
    throw new Error('No active Service Worker');
  }
  
  // Send clear caches message
  await sendMessage({ type: 'CLEAR_CACHES' });
}

/**
 * Clears a specific cache
 * @param {string} cacheName The name of the cache to clear
 * @returns {Promise<void>} Promise that resolves when the cache is cleared
 */
export async function clearCache(cacheName: string): Promise<void> {
  if (!navigator.serviceWorker.controller) {
    throw new Error('No active Service Worker');
  }
  
  // Send clear cache message
  await sendMessage({ type: 'CLEAR_CACHE', cacheName });
}

/**
 * Gets caches information from the Service Worker
 * @returns {Promise<any>} Promise that resolves with cache information
 */
export async function getCachesInfo(): Promise<any> {
  if (!navigator.serviceWorker.controller) {
    throw new Error('No active Service Worker');
  }
  
  return new Promise((resolve, reject) => {
    // Set up one-time message handler
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CACHES_INFO') {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
        resolve(event.data.info);
      }
    };
    
    // Add message listener
    navigator.serviceWorker.addEventListener('message', messageHandler);
    
    // Send message to get caches info
    sendMessage({ type: 'GET_CACHES_INFO' })
      .catch(error => {
        // Remove message listener on error
        navigator.serviceWorker.removeEventListener('message', messageHandler);
        reject(error);
      });
    
    // Set timeout
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', messageHandler);
      reject(new Error('Timed out waiting for caches info'));
    }, 5000);
  });
}

/**
 * React hook for managing the service worker
 * @returns ServiceWorker management utilities
 */
export function useServiceWorker() {
  const [status, setStatus] = React.useState<ServiceWorkerStatus>(swStatus);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  
  React.useEffect(() => {
    // Handle service worker updates
    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      setUpdateAvailable(!!registration.waiting);
    };
    
    // Handle service worker errors
    const handleError = (error: Error) => {
      console.error('Service Worker error:', error);
    };
    
    // Set up event listeners
    onUpdate(handleUpdate);
    onError(handleError);
    
    // Set initial status
    setStatus(swStatus);
    
    // Clean up event listeners
    return () => {
      offUpdate(handleUpdate);
      offError(handleError);
    };
  }, []);
  
  // Register the service worker
  const register = React.useCallback(async (
    swPath: string = '/service-worker.js',
    options: ServiceWorkerRegistrationOptions = {}
  ) => {
    const registration = await registerServiceWorker(swPath, options);
    setStatus(swStatus);
    return registration;
  }, []);
  
  // Update the service worker
  const update = React.useCallback(async () => {
    if (updateAvailable) {
      await applyUpdate();
      setUpdateAvailable(false);
    }
  }, [updateAvailable]);
  
  // Check for updates
  const checkUpdate = React.useCallback(async () => {
    const hasUpdate = await checkForUpdates();
    setUpdateAvailable(hasUpdate);
    return hasUpdate;
  }, []);
  
  // Unregister the service worker
  const unregister = React.useCallback(async () => {
    const success = await unregisterServiceWorker();
    setStatus(swStatus);
    setUpdateAvailable(false);
    return success;
  }, []);
  
  return {
    status,
    updateAvailable,
    register,
    update,
    checkUpdate,
    unregister,
    clearAllCaches,
    clearCache
  };
}

// Import React on demand for the hook
import * as React from 'react';