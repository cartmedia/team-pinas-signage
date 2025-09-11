// Clean API Service for Team Pinas Signage
// Replaces complex CMS Connector with simple, reliable API calls

class APIService {
  constructor() {
    this.baseUrl = '/.netlify/functions';
    this.maxRetries = 4;
    this.initialDelay = 1000; // 1 second
  }

  /**
   * Exponential backoff retry logic
   * Attempt 1: Immediate
   * Attempt 2: 1 second delay  
   * Attempt 3: 2 second delay
   * Attempt 4: 4 second delay
   */
  async withRetry(apiCall, endpoint) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📡 API Request: ${endpoint} (attempt ${attempt}/${this.maxRetries})`);
        
        const result = await apiCall();
        
        if (attempt > 1) {
          console.log(`✅ API recovered on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ API attempt ${attempt} failed:`, error.message);
        
        // Don't delay on final attempt
        if (attempt < this.maxRetries) {
          const delay = this.initialDelay * Math.pow(2, attempt - 2);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    // All attempts failed
    console.error(`❌ API failed after ${this.maxRetries} attempts:`, lastError.message);
    throw new Error(`Failed to load ${endpoint}: ${lastError.message}`);
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create AbortController with timeout
   */
  createTimeoutController(timeoutMs = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Clear timeout if request completes normally
    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
    
    return controller;
  }

  /**
   * Generic API call with timeout and error handling
   */
  async makeRequest(endpoint, options = {}) {
    const controller = this.createTimeoutController(3000);
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server not responding');
      }
      throw error;
    }
  }

  /**
   * Load products data with retry logic
   */
  async loadProducts() {
    return this.withRetry(
      () => this.makeRequest('/products'),
      'products'
    );
  }

  /**
   * Load settings data with retry logic
   */
  async loadSettings() {
    return this.withRetry(
      () => this.makeRequest('/settings'),
      'settings'
    );
  }

  /**
   * Load footer configuration with retry logic
   */
  async loadFooter() {
    return this.withRetry(
      () => this.makeRequest('/footer'),
      'footer'
    );
  }

  /**
   * Load products, settings, and footer concurrently
   */
  async loadAll() {
    try {
      console.log('📡 Loading products, settings, and footer concurrently...');
      
      const [products, settings, footer] = await Promise.all([
        this.loadProducts(),
        this.loadSettings(),
        this.loadFooter()
      ]);

      console.log('✅ All data loaded successfully');
      return { products, settings, footer };
    } catch (error) {
      console.error('❌ Failed to load application data:', error.message);
      throw error;
    }
  }

  /**
   * Check if we're online (basic connectivity test)
   */
  async isOnline() {
    try {
      // Simple connectivity check with very short timeout
      const controller = this.createTimeoutController(1000);
      await fetch(`${this.baseUrl}/settings`, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for connectivity to return
   */
  async waitForConnectivity(maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isOnline()) {
        console.log('🌐 Connectivity restored');
        return true;
      }
      
      console.log('⏳ Waiting for connectivity...');
      await this.sleep(2000);
    }
    
    return false;
  }
}

// Create global instance
const apiService = new APIService();

// Make available globally
if (typeof window !== 'undefined') {
  window.apiService = apiService;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiService;
}