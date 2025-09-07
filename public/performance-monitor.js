// Performance monitoring for Team Pinas Signage
// Tracks key metrics and reports issues

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.startTime = performance.now();
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    this.trackPageLoad();
    this.trackNetworkRequests();
    this.trackMemoryUsage();
    this.trackFPS();
    
    this.initialized = true;
    console.log('🚀 Performance monitoring initialized');
  }

  trackPageLoad() {
    if (!performance.navigation) return;

    window.addEventListener('load', () => {
      const nav = performance.navigation;
      const timing = performance.timing;
      
      this.metrics.pageLoad = {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        domainLookup: timing.domainLookupEnd - timing.domainLookupStart,
        serverResponse: timing.responseEnd - timing.requestStart,
        domProcessing: timing.domComplete - timing.domLoading
      };

      // Log performance warnings
      if (this.metrics.pageLoad.loadComplete > 3000) {
        console.warn('⚠️ PERFORMANCE: Page load took', this.metrics.pageLoad.loadComplete + 'ms');
      }

      this.reportMetrics();
    });
  }

  trackNetworkRequests() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          this.trackNavigationTiming(entry);
        } else if (entry.entryType === 'resource') {
          this.trackResourceTiming(entry);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'resource'] });
    } catch (e) {
      console.warn('Performance Observer not supported');
    }
  }

  trackNavigationTiming(entry) {
    this.metrics.navigation = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      connection: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      domProcessing: entry.domComplete - entry.domLoading,
      loadEvent: entry.loadEventEnd - entry.loadEventStart
    };
  }

  trackResourceTiming(entry) {
    if (!this.metrics.resources) this.metrics.resources = [];
    
    const resource = {
      name: entry.name.split('/').pop(),
      type: this.getResourceType(entry.name),
      size: entry.transferSize || 0,
      duration: entry.duration,
      cached: entry.transferSize === 0 && entry.duration > 0
    };

    // Flag slow resources
    if (resource.duration > 1000) {
      resource.slow = true;
      console.warn('⚠️ PERFORMANCE: Slow resource:', resource.name, resource.duration + 'ms');
    }

    // Flag large resources
    if (resource.size > 500000) { // 500KB
      resource.large = true;
      console.warn('⚠️ PERFORMANCE: Large resource:', resource.name, Math.round(resource.size/1024) + 'KB');
    }

    this.metrics.resources.push(resource);
  }

  trackMemoryUsage() {
    if (!performance.memory) return;

    setInterval(() => {
      const memory = performance.memory;
      this.metrics.memory = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };

      // Warn about high memory usage
      if (this.metrics.memory.used > 100) {
        console.warn('⚠️ PERFORMANCE: High memory usage:', this.metrics.memory.used + 'MB');
      }
    }, 10000); // Check every 10 seconds
  }

  trackFPS() {
    let frames = 0;
    let lastTime = performance.now();

    const countFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime > lastTime + 1000) {
        const fps = Math.round(frames * 1000 / (currentTime - lastTime));
        this.metrics.fps = fps;
        
        // Warn about low FPS
        if (fps < 30) {
          console.warn('⚠️ PERFORMANCE: Low FPS detected:', fps);
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFPS);
    };

    requestAnimationFrame(countFPS);
  }

  getResourceType(url) {
    if (url.includes('.css')) return 'css';
    if (url.includes('.js')) return 'js';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image';
    if (url.includes('.netlify/functions/')) return 'api';
    if (url.includes('fonts') || url.includes('typekit')) return 'font';
    return 'other';
  }

  reportMetrics() {
    console.group('📊 PERFORMANCE METRICS');
    
    if (this.metrics.pageLoad) {
      console.log('Page Load:', this.metrics.pageLoad);
    }
    
    if (this.metrics.navigation) {
      console.log('Navigation:', this.metrics.navigation);
    }
    
    if (this.metrics.resources) {
      console.log('Resources:', this.metrics.resources.length, 'total');
      console.log('Slow resources:', this.metrics.resources.filter(r => r.slow).length);
      console.log('Large resources:', this.metrics.resources.filter(r => r.large).length);
      console.log('Cached resources:', this.metrics.resources.filter(r => r.cached).length);
    }
    
    if (this.metrics.memory) {
      console.log('Memory usage:', this.metrics.memory.used + 'MB / ' + this.metrics.memory.limit + 'MB');
    }
    
    if (this.metrics.fps) {
      console.log('FPS:', this.metrics.fps);
    }
    
    console.groupEnd();
  }

  // Method to get performance summary for debugging
  getPerformanceSummary() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: Math.round(performance.now() - this.startTime)
    };
  }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => performanceMonitor.init());
} else {
  performanceMonitor.init();
}

// Make available globally for debugging
window.performanceMonitor = performanceMonitor;