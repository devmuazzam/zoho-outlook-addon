'use client';

export class OfficeRouter {
  private static instance: OfficeRouter;
  private currentPath: string = '/';
  private listeners: Set<(path: string) => void> = new Set();

  private constructor() {
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

  getCurrentPath(): string {
    return this.currentPath;
  }

  push(path: string): void {
    if (this.currentPath === path) return;

    this.currentPath = path;
    this.notifyListeners(path);

    this.tryUpdateUrl(path);
  }

  replace(path: string): void {
    this.currentPath = path;
    this.notifyListeners(path);

    this.tryUpdateUrl(path, true);
  }

  back(): void {
    this.notifyListeners(this.currentPath);
  }

  subscribe(listener: (path: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private tryUpdateUrl(path: string, replace: boolean = false): void {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(path, window.location.origin);

      if (window.history && typeof window.history.pushState === 'function') {
        if (replace && typeof window.history.replaceState === 'function') {
          window.history.replaceState(null, '', url.pathname + url.search);
        } else {
          window.history.pushState(null, '', url.pathname + url.search);
        }
      }
      else if (window.location && typeof window.location.hash !== 'undefined') {
        window.location.hash = path;
      }
    } catch (error) {
      console.debug('URL update not available in this environment:', error);
    }
  }

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

export function safeNavigate(path: string, replace: boolean = false): void {
  const router = OfficeRouter.getInstance();

  if (replace) {
    router.replace(path);
  } else {
    router.push(path);
  }
}
