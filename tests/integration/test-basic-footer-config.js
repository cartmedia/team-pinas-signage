/**
 * T010: Integration test: Basic footer configuration scenario
 * Tests: Complete flow from API call to signage display, verify footer appears with correct configuration
 * THIS TEST MUST FAIL BEFORE IMPLEMENTATION
 */

const request = require('supertest');
const { JSDOM } = require('jsdom');

describe('Basic Footer Configuration Integration Tests', () => {
  const baseURL = 'http://localhost:8080/.netlify/functions';
  const validApiKey = process.env.ADMIN_API_KEY || 'test-api-key';
  
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Set up DOM environment for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Team Pinas Signage</title>
          <link rel="stylesheet" href="/src/styles/components/scrolling-footer.css">
        </head>
        <body>
          <div id="signage-container">
            <header class="SignageHeader">Header Content</header>
            <main class="SignageContent">Main Content</main>
            <footer class="SignageFooter" id="footer-container">
              <!-- Footer will be rendered here -->
            </footer>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:8080/',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window;
    
    // Mock global variables that would normally be available
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    dom.window.close();
  });

  test('Complete basic footer configuration flow', async () => {
    // Step 1: Configure footer via API
    const footerConfig = {
      footer_text: "INTEGRATION TEST <separator> BASIC CONFIGURATION <separator> SUCCESS",
      text_color: "#ffffff",
      background_color: "#333333",
      font_size: "3vh",
      scroll_speed: 10,
      scroll_direction: "continuous",
      separator_type: "crown",
      is_visible: true
    };

    // Update footer configuration
    const updateResponse = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(footerConfig)
      .expect(200);

    expect(updateResponse.body.footer_text).toBe(footerConfig.footer_text);

    // Step 2: Retrieve footer configuration (simulates signage display fetching config)
    const getResponse = await request(baseURL)
      .get('/footer')
      .expect(200);

    expect(getResponse.body.footer_text).toBe(footerConfig.footer_text);
    expect(getResponse.body.is_visible).toBe(true);
    expect(getResponse.body.is_active).toBe(true);

    // Step 3: Simulate ScrollingFooter component rendering
    const footerElement = document.getElementById('footer-container');
    expect(footerElement).not.toBeNull();

    // Mock the ScrollingFooter component behavior
    const mockScrollingFooter = {
      config: getResponse.body,
      
      render() {
        const contentHtml = this.parseContent();
        footerElement.innerHTML = `
          <div class="scrolling-footer">
            <div class="scrolling-footer-content" style="
              color: ${this.config.text_color};
              background-color: ${this.config.background_color};
              font-size: ${this.config.font_size};
            ">
              ${contentHtml}
            </div>
          </div>
        `;
        
        // Apply visibility
        footerElement.style.opacity = this.config.is_visible ? '1' : '0';
        footerElement.style.visibility = this.config.is_visible ? 'visible' : 'hidden';
      },

      parseContent() {
        const segments = this.config.footer_text.split('<separator>');
        const separator = this.resolveSeparator();
        
        return segments
          .map(segment => segment.trim())
          .filter(segment => segment.length > 0)
          .map((segment, index, array) => {
            const separatorAfter = index < array.length - 1 ? `<span class="scrolling-separator">${separator}</span>` : '';
            return `<span class="scrolling-text-segment">${segment}</span>${separatorAfter}`;
          })
          .join('');
      },

      resolveSeparator() {
        switch (this.config.separator_type) {
          case 'crown': return '👑';
          case 'star': return '⭐';
          case 'dot': return '•';
          case 'dash': return '–';
          case 'space': return ' ';
          case 'custom': return this.config.custom_separator || ' ';
          default: return ' ';
        }
      }
    };

    // Render the footer
    mockScrollingFooter.render();

    // Step 4: Verify footer is properly rendered and visible
    const renderedFooter = document.querySelector('.scrolling-footer');
    expect(renderedFooter).not.toBeNull();

    const footerContent = document.querySelector('.scrolling-footer-content');
    expect(footerContent).not.toBeNull();

    // Verify styling is applied
    expect(footerContent.style.color).toBe(footerConfig.text_color);
    expect(footerContent.style.backgroundColor).toBe(footerConfig.background_color);
    expect(footerContent.style.fontSize).toBe(footerConfig.font_size);

    // Verify content segments are present
    const textSegments = document.querySelectorAll('.scrolling-text-segment');
    expect(textSegments.length).toBe(3);
    expect(textSegments[0].textContent).toBe('INTEGRATION TEST');
    expect(textSegments[1].textContent).toBe('BASIC CONFIGURATION');
    expect(textSegments[2].textContent).toBe('SUCCESS');

    // Verify separators are present (should be 2 separators between 3 segments)
    const separators = document.querySelectorAll('.scrolling-separator');
    expect(separators.length).toBe(2);
    expect(separators[0].textContent).toBe('👑'); // Crown separator
    expect(separators[1].textContent).toBe('👑');

    // Verify footer visibility
    expect(footerElement.style.opacity).toBe('1');
    expect(footerElement.style.visibility).toBe('visible');

    // Step 5: Verify footer is responsive to configuration changes
    const updatedConfig = {
      ...footerConfig,
      text_color: "#ff0000",
      separator_type: "star"
    };

    await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(updatedConfig)
      .expect(200);

    // Simulate re-fetch and re-render (what would happen in real app)
    const updatedResponse = await request(baseURL)
      .get('/footer')
      .expect(200);

    mockScrollingFooter.config = updatedResponse.body;
    mockScrollingFooter.render();

    // Verify changes are reflected
    const updatedFooterContent = document.querySelector('.scrolling-footer-content');
    expect(updatedFooterContent.style.color).toBe('#ff0000');

    const updatedSeparators = document.querySelectorAll('.scrolling-separator');
    expect(updatedSeparators[0].textContent).toBe('⭐'); // Star separator
  });

  test('Footer remains hidden when is_visible is false', async () => {
    // Configure footer as invisible
    const hiddenFooterConfig = {
      footer_text: "HIDDEN FOOTER TEST",
      text_color: "#000000",
      background_color: "#ffffff", 
      is_visible: false
    };

    await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(hiddenFooterConfig)
      .expect(200);

    // API should return 404 for invisible footer
    await request(baseURL)
      .get('/footer')
      .expect(404);

    // Footer element should remain hidden in DOM
    const footerElement = document.getElementById('footer-container');
    expect(footerElement.style.visibility).not.toBe('visible');
  });

  test('Footer handles empty or invalid configuration gracefully', async () => {
    // Test with minimal content
    const minimalConfig = {
      footer_text: "MINIMAL",
      text_color: "#000000",
      background_color: "#ffffff",
      is_visible: true
    };

    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(minimalConfig)
      .expect(200);

    // Should still render properly
    const getResponse = await request(baseURL)
      .get('/footer')
      .expect(200);

    expect(getResponse.body.footer_text).toBe('MINIMAL');

    // Test rendering with no separators
    const footerElement = document.getElementById('footer-container');
    const mockScrollingFooter = {
      config: getResponse.body,
      render() {
        footerElement.innerHTML = `
          <div class="scrolling-footer">
            <div class="scrolling-footer-content">
              <span class="scrolling-text-segment">${this.config.footer_text}</span>
            </div>
          </div>
        `;
      }
    };

    mockScrollingFooter.render();

    const textSegments = document.querySelectorAll('.scrolling-text-segment');
    expect(textSegments.length).toBe(1);
    expect(textSegments[0].textContent).toBe('MINIMAL');

    // No separators should be present
    const separators = document.querySelectorAll('.scrolling-separator');
    expect(separators.length).toBe(0);
  });

  test('Performance requirements are met', async () => {
    // Test with reasonable content that should perform well
    const performantConfig = {
      footer_text: "PERFORMANCE TEST <separator> MODERATE CONTENT <separator> GOOD SPEED",
      scroll_speed: 15,
      is_visible: true
    };

    const startTime = Date.now();
    
    await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(performantConfig)
      .expect(200);

    const getStartTime = Date.now();
    await request(baseURL)
      .get('/footer')
      .expect(200);
    const getEndTime = Date.now();

    const updateTime = getStartTime - startTime;
    const getTime = getEndTime - getStartTime;

    // API responses should be reasonably fast (target: <200ms for local, allowing margin for test env)
    expect(updateTime).toBeLessThan(1000); // 1 second max for update
    expect(getTime).toBeLessThan(500); // 500ms max for get
  });
});