/**
 * Contract Test: CSS Class States
 * 
 * Tests CSS class state management contract for footer component
 * Based on: /specs/006-footer-fix-n/contracts/css-component-interface.md
 */

/**
 * @jest-environment jsdom
 */

describe('CSS Class States Contract Test', () => {
  let container;

  beforeEach(() => {
    // Create DOM container for testing
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.className = 'SignageFooter';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Required CSS Classes', () => {
    test('should support .SignageFooter base class', () => {
      // Contract: Component must use .SignageFooter as base container class
      expect(container.classList.contains('SignageFooter')).toBe(true);
      
      const computedStyle = getComputedStyle(container);
      
      // Contract: Base class must provide grid area positioning
      expect(computedStyle.gridArea).toBe('footer');
      expect(computedStyle.position).toBe('relative');
    });

    test('should support .footer-hidden state class', () => {
      // Contract: Component must control visibility via .footer-hidden class
      container.classList.add('footer-hidden');
      
      const computedStyle = getComputedStyle(container);
      
      // Contract: .footer-hidden must set display: none
      expect(computedStyle.display).toBe('none');
    });

    test('should support .footer-visible state class', () => {
      // Contract: Component must show footer via .footer-visible class
      container.classList.add('footer-visible');
      
      const computedStyle = getComputedStyle(container);
      
      // Contract: .footer-visible must set display: flex with centering
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.alignItems).toBe('center');
      expect(computedStyle.justifyContent).toBe('center');
    });

    test('should support .footer-transitioning state class', () => {
      // Contract: Component must support transition state for config changes
      container.classList.add('footer-transitioning');
      
      const computedStyle = getComputedStyle(container);
      
      // Contract: .footer-transitioning must reduce opacity and disable pointer events
      expect(computedStyle.opacity).toBe('0.5');
      expect(computedStyle.pointerEvents).toBe('none');
    });
  });

  describe('Content Structure Classes', () => {
    test('should support .scrolling-footer-content class', () => {
      // Contract: Content wrapper must use .scrolling-footer-content class
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'scrolling-footer-content';
      container.appendChild(contentWrapper);
      
      const computedStyle = getComputedStyle(contentWrapper);
      
      // Contract: Content wrapper must be flex container with overflow hidden
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.alignItems).toBe('center');
      expect(computedStyle.height).toBe('100%');
      expect(computedStyle.width).toBe('100%');
      expect(computedStyle.overflow).toBe('hidden');
    });

    test('should support .scrolling-text-segment class', () => {
      // Contract: Text segments must use .scrolling-text-segment class
      const textSegment = document.createElement('span');
      textSegment.className = 'scrolling-text-segment';
      textSegment.textContent = 'Test text';
      container.appendChild(textSegment);
      
      const computedStyle = getComputedStyle(textSegment);
      
      // Contract: Text segments must be inline-block with animation properties
      expect(computedStyle.display).toBe('inline-block');
      expect(computedStyle.whiteSpace).toBe('nowrap');
      expect(computedStyle.willChange).toBe('transform');
    });

    test('should support .scrolling-separator class', () => {
      // Contract: Separators must use .scrolling-separator class
      const separator = document.createElement('img');
      separator.className = 'scrolling-separator';
      separator.src = 'crown.svg';
      container.appendChild(separator);
      
      const computedStyle = getComputedStyle(separator);
      
      // Contract: Separators must be inline-block with proper sizing and alignment
      expect(computedStyle.display).toBe('inline-block');
      expect(computedStyle.verticalAlign).toBe('middle');
      expect(computedStyle.opacity).toBe('0.9');
    });
  });

  describe('State Transitions', () => {
    test('should transition from hidden to visible state', () => {
      // Contract: Component must properly transition between visibility states
      container.classList.add('footer-hidden');
      
      let computedStyle = getComputedStyle(container);
      expect(computedStyle.display).toBe('none');
      
      // Transition to visible
      container.classList.remove('footer-hidden');
      container.classList.add('footer-visible');
      
      computedStyle = getComputedStyle(container);
      expect(computedStyle.display).toBe('flex');
    });

    test('should handle transitioning state', () => {
      // Contract: Component must support transitioning state during config changes
      container.classList.add('footer-visible');
      container.classList.add('footer-transitioning');
      
      const computedStyle = getComputedStyle(container);
      
      // Contract: Transitioning should maintain visibility but reduce opacity
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.opacity).toBe('0.5');
      expect(computedStyle.pointerEvents).toBe('none');
    });
  });

  describe('Class Management Contract', () => {
    test('should not use display: none !important anywhere', () => {
      // Contract: Component must NEVER use display: none !important
      // This was the root cause of the original issue
      
      // Test all possible class combinations
      const classStates = [
        ['footer-hidden'],
        ['footer-visible'], 
        ['footer-transitioning'],
        ['footer-visible', 'footer-transitioning']
      ];
      
      classStates.forEach(classes => {
        container.className = 'SignageFooter ' + classes.join(' ');
        const computedStyle = getComputedStyle(container);
        
        // Contract: No !important display rules should block visibility control
        // If hidden class is present, display should be 'none'
        // If visible class is present (without hidden), display should be 'flex'
        if (classes.includes('footer-hidden')) {
          expect(computedStyle.display).toBe('none');
        } else if (classes.includes('footer-visible')) {
          expect(computedStyle.display).toBe('flex');
        }
      });
    });

    test('should allow component-controlled class changes', () => {
      // Contract: Component must be able to change classes programmatically
      expect(container.classList.contains('footer-hidden')).toBe(false);
      
      // Simulate component adding hidden class
      container.classList.add('footer-hidden');
      expect(container.classList.contains('footer-hidden')).toBe(true);
      
      // Simulate component showing footer
      container.classList.remove('footer-hidden');
      container.classList.add('footer-visible');
      
      expect(container.classList.contains('footer-hidden')).toBe(false);
      expect(container.classList.contains('footer-visible')).toBe(true);
    });
  });

  describe('CSS Specificity Contract', () => {
    test('should use low specificity selectors', () => {
      // Contract: Component CSS must use low specificity to avoid conflicts
      // This test verifies that our CSS rules don't use high specificity
      
      // Test will initially fail until proper CSS specificity is implemented
      expect(true).toBe(false); // This test MUST FAIL initially
    });

    test('should not use !important declarations', () => {
      // Contract: Component CSS must NEVER use !important declarations
      // This test will initially fail until !important rules are removed
      
      expect(true).toBe(false); // This test MUST FAIL initially  
    });
  });

  describe('DOM Structure Contract', () => {
    test('should enforce maximum 3-level DOM nesting', () => {
      // Contract: DOM structure must not exceed 3 levels for performance
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'scrolling-footer-content';
      
      const textSegment = document.createElement('span');
      textSegment.className = 'scrolling-text-segment';
      textSegment.textContent = 'Test';
      
      contentWrapper.appendChild(textSegment);
      container.appendChild(contentWrapper);
      
      // Contract: Structure should be: .SignageFooter > .scrolling-footer-content > .scrolling-text-segment
      expect(container.children.length).toBe(1);
      expect(contentWrapper.children.length).toBe(1);
      expect(textSegment.children.length).toBe(0);
    });

    test('should require specific class hierarchy', () => {
      // Contract: Required DOM structure for proper styling
      const structure = `
        <div class="SignageFooter footer-visible">
          <div class="scrolling-footer-content">
            <span class="scrolling-text-segment">Content</span>
            <img class="scrolling-separator" src="crown.svg" alt="">
          </div>
        </div>
      `;
      
      container.innerHTML = '<div class="scrolling-footer-content"><span class="scrolling-text-segment">Content</span><img class="scrolling-separator" src="crown.svg" alt=""></div>';
      container.classList.add('footer-visible');
      
      // Verify structure exists
      const contentWrapper = container.querySelector('.scrolling-footer-content');
      const textSegment = container.querySelector('.scrolling-text-segment');
      const separator = container.querySelector('.scrolling-separator');
      
      expect(contentWrapper).not.toBeNull();
      expect(textSegment).not.toBeNull();
      expect(separator).not.toBeNull();
      
      // Verify parent-child relationships
      expect(textSegment.parentElement).toBe(contentWrapper);
      expect(separator.parentElement).toBe(contentWrapper);
      expect(contentWrapper.parentElement).toBe(container);
    });
  });
});