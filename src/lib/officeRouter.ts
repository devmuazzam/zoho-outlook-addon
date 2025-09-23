'use client';

/**
 * Office-compatible router utilities to handle navigation in restricted environments
 * where standard browser APIs like history.replaceState might not be available
 */

export class OfficeRouter {
  private static instance: OfficeRouter;
  private currentPath: string = '/';
  private listeners: Set<(path: string) => void> = new Set();

  private constructor() {
    // Initialize with current path if available
    if (typeof window !== 'undefined') {
      this.currentPath = window.location.pathname || '/';
    }
  }

  static getInstance(): OfficeRouter {
    if (!OfficeRouter.instance) {
      OfficeRouter.instance = new OfficeRouter();
    }
    return OfficeRouter.instance;
  }

  /**
   * Get current path
   */
  getCurrentPath(): string {
    return this.currentPath;
  }

  /**
   * Navigate to a new path (Office-safe)
   */
  push(path: string): void {
    if (this.currentPath === path) return;
    
    this.currentPath = path;
    this.notifyListeners(path);
    
    // Try to update URL if possible, but don't fail if not available
    this.tryUpdateUrl(path);
  }

  /**
   * Replace current path (Office-safe)
   */
  replace(path: string): void {
    this.currentPath = path;
    this.notifyListeners(path);
    
    // Try to update URL if possible, but don't fail if not available
    this.tryUpdateUrl(path, true);
  }

  /**
   * Go back (Office-safe)
   */
  back(): void {
    // In Office context, we can't really go back, so just notify listeners
    this.notifyListeners(this.currentPath);
  }

  /**
   * Subscribe to route changes
   */
  subscribe(listener: (path: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Safely try to update the URL using available browser APIs
   */
  private tryUpdateUrl(path: string, replace: boolean = false): void {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(path, window.location.origin);
      
      // Try modern history API first
      if (window.history && typeof window.history.pushState === 'function') {
        if (replace && typeof window.history.replaceState === 'function') {
          window.history.replaceState(null, '', url.pathname + url.search);
        } else {
          window.history.pushState(null, '', url.pathname + url.search);
        }
      }
      // Fallback: just update hash if possible
      else if (window.location && typeof window.location.hash !== 'undefined') {
        window.location.hash = path;
      }
    } catch (error) {
      // Silently fail if URL update is not possible
      console.debug('URL update not available in this environment:', error);
    }
  }

  /**
   * Notify all listeners of route change
   */
  private notifyListeners(path: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(path);
      } catch (error) {
        console.error('Error in route listener:', error);
      }
    });
  }
}

/**
 * Hook-like interface for using OfficeRouter
 */
export function useOfficeRouter() {
  const router = OfficeRouter.getInstance();
  
  return {
    push: (path: string) => router.push(path),
    replace: (path: string) => router.replace(path),
    back: () => router.back(),
    pathname: router.getCurrentPath(),
    subscribe: (listener: (path: string) => void) => router.subscribe(listener)
  };
}

/**
 * Safe navigation function for Office environments
 */
export function safeNavigate(path: string, replace: boolean = false): void {
  const router = OfficeRouter.getInstance();
  
  if (replace) {
    router.replace(path);
  } else {
    router.push(path);
  }
}
