/**
 * Simple Test: Separator Resolution Basic Functionality
 * Purpose: Quick test to verify separator resolution works
 */

// Mock DOM environment
global.window = global.window || {};
global.window.matchMedia = global.window.matchMedia || jest.fn(() => ({
  matches: false,
  addListener: jest.fn(),
  removeListener: jest.fn(),
}));

// Mock performance
global.performance = global.performance || {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
};

// Load ScrollingFooter component
const ScrollingFooter = require('../../src/scripts/display/components/ScrollingFooter.js');

// Mock missing performance monitoring methods
ScrollingFooter.prototype._initializePerformanceSystems = function() {
    this.performanceMonitor = null;
    this.fallbackManager = null;
    this.cssTracker = null;
};

describe('Simple Separator Test', () => {
    let container;
    let footer;
    
    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '1920px';
        container.style.height = '100px';
        Object.defineProperty(container, 'offsetWidth', {
            writable: true,
            configurable: true,
            value: 1920
        });
        document.body.appendChild(container);
    });
    
    afterEach(() => {
        if (footer) {
            footer.stop();
            footer = null;
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });
    
    test('should resolve custom separator correctly', () => {
        const config = {
            footer_text: 'Test <separator> Content',
            separator_text: ' | ',
            scroll_direction: 'static'
        };
        
        footer = new ScrollingFooter(container, config);
        
        // Check separator state
        expect(footer._separatorState).toBeDefined();
        expect(footer._separatorState.selectedType).toBe('custom');
        expect(footer._separatorState.content).toBe(' | ');
    });
    
    test('should resolve SVG separator when no custom', () => {
        const config = {
            footer_text: 'Test <separator> Content',
            separator_text: null,
            scroll_direction: 'static'
        };
        
        footer = new ScrollingFooter(container, config);
        
        // Check separator state
        expect(footer._separatorState).toBeDefined();
        expect(footer._separatorState.selectedType).toBe('svg');
        expect(footer._separatorState.content).toContain('img');
        expect(footer._separatorState.content).toContain('pinas_kroon.svg');
    });
    
    test('should resolve emoji separator when SVG fails', () => {
        const config = {
            footer_text: 'Test <separator> Content',
            separator_text: null,
            scroll_direction: 'static',
            _simulateSVGFailure: true
        };
        
        footer = new ScrollingFooter(container, config);
        
        // Check separator state
        expect(footer._separatorState).toBeDefined();
        expect(footer._separatorState.selectedType).toBe('emoji');
        expect(footer._separatorState.content).toBe(' 👑 ');
    });
    
    test('should update separator when config changes', () => {
        const config1 = {
            footer_text: 'Test <separator> Content',
            separator_text: null,
            scroll_direction: 'static'
        };
        
        footer = new ScrollingFooter(container, config1);
        expect(footer._separatorState.selectedType).toBe('svg');
        
        // Update to custom separator
        const config2 = {
            footer_text: 'Test <separator> Content',
            separator_text: ' ⭐ ',
            scroll_direction: 'static'
        };
        
        footer.updateConfig(config2);
        expect(footer._separatorState.selectedType).toBe('custom');
        expect(footer._separatorState.content).toBe(' ⭐ ');
    });
});

console.log('Running simple separator tests...');