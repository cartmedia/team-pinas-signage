// Debug Mode Implementation - check if debug is enabled
let debugMode = localStorage.getItem('debugMode') === 'true';
let originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

// Apply debug mode on page load
if (!debugMode) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  // Keep console.error for critical issues
}

// Import new footer component architecture
// Note: Components will be loaded via script tags and made available globally
// ScrollingFooter and FooterConfigWatcher are loaded via separate script tags
// CSS utilities will be imported when needed

// Hide loading screen when menu data is ready
function hideLoadingScreenWhenReady() {
  console.log('🚀 Menu data loaded successfully - hiding loading screen');
  
  // Clean timeout: Hide loading screen quickly but show loading animation briefly
  setTimeout(() => {
    hideLoadingScreen();
  }, 500); // Half second to show loading animation
}

// Actually hide the loading screen with animation
function hideLoadingScreen() {
  console.log('🎯 hideLoadingScreen called');
  const loadingScreen = document.getElementById('loadingScreen');
  console.log('Loading screen element found:', loadingScreen ? 'YES' : 'NO');
  if (loadingScreen) {
    console.log('Adding fade-out class...');
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      if (loadingScreen && loadingScreen.parentNode) {
        console.log('Removing loading screen element...');
        loadingScreen.remove();
      }
      console.log('🚀 Loading screen hidden - menu ready!');
    }, 500);
  } else {
    console.warn('⚠️ Loading screen element not found - cannot hide');
  }
}

document.addEventListener("DOMContentLoaded", function () {

  // Getting the span element
  var dayTitleSpan = document.getElementById("DayTitle");

  // Getting the current day's name
  var days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  var currentDate = new Date();
  var currentDayName = days[currentDate.getDay()];

  // Setting the text (CounterCast branding)
  dayTitleSpan.textContent = "CounterCast — " + currentDayName + " Menu";

  // Live clock (Dutch locale)
  const clockEl = document.getElementById("Clock");
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = now.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    // Render two lines similar to the Next.js dashboard clock
    clockEl.innerHTML = `
      <div class="ClockTime" aria-label="Huidige tijd">${timeStr}</div>
      <div class="ClockDate" aria-label="Huidige datum">${dateStr}</div>
    `;
  }
  updateClock();
  setInterval(updateClock, 1000);
});

// Display Settings Management
class DisplaySettings {
  constructor() {
    this.settings = {};
    // Settings will be loaded via loadAllData() for better performance
  }

  // Apply settings from loadAllData() 
  applySettings(settingsData) {
    try {
      console.log('⚙️ Applying settings from concurrent load...');
      this.settings = settingsData.settings || {};
      console.log('✅ Settings applied successfully');
    } catch (error) {
      console.warn('⚠️ Settings application failed, using defaults:', error.message);
      // Use defaults on error  
      this.settings = {
        display_columns: 2,
        rotation_interval: 6000
      };
    }
    
    // Apply column layout
    this.applyColumnLayout();
  }

  applyColumnLayout() {
    const columns = parseInt(this.settings.display_columns) || 2;
    const container = document.querySelector('.MenuContainer');
    if (container) {
      // Set both CSS custom property and data attribute
      container.style.setProperty('--columns', columns);
      container.setAttribute('data-columns', columns);
      
      console.log(`Applied ${columns} column layout`);
    }
    
    // Apply dynamic header/footer heights
    this.applyLayoutHeights();
  }

  applyLayoutHeights() {
    const headerHeight = parseInt(this.settings.header_height) || 15;
    const footerHeight = parseFloat(this.settings.footer_height) || 7.8; // Match CSS default
    const logoSize = parseInt(this.settings.logo_size) || 36; // Match CSS default
    const footerTextColor = this.settings.footer_text_color || 'dark'; // Default to dark text
    
    // Set CSS custom properties on body element
    document.body.style.setProperty('--header-height', `${headerHeight}vh`);
    document.body.style.setProperty('--footer-height', `${footerHeight}vh`);
    document.body.style.setProperty('--logo-size', `${logoSize}vh`);
    document.body.style.setProperty('--body-height', `calc(100vh - ${headerHeight}vh - ${footerHeight}vh)`);
    
    // Apply footer text color
    this.applyFooterTextColor(footerTextColor);
    
    console.log(`Applied header: ${headerHeight}vh, footer: ${footerHeight}vh, logo: ${logoSize}vh, footer text: ${footerTextColor}`);
  }

  applyFooterTextColor(colorMode) {
    const footerContainer = document.querySelector('.SignageFooter');
    if (!footerContainer) return;
    
    // Use new CSS architecture with component-based classes
    // Apply color via CSS custom properties system
    if (colorMode === 'light') {
      document.body.style.setProperty('--footer-text-color', '#ffffff');
      console.log('🎨 Applied light footer text color via CSS custom properties');
    } else {
      document.body.style.setProperty('--footer-text-color', '#101010');
      console.log('🎨 Applied dark footer text color via CSS custom properties');
    }
  }

  getColumnCount() {
    return parseInt(this.settings.display_columns) || 2;
  }
}

// Initialize display settings
const displaySettings = new DisplaySettings();

// Products rendering and rotation
document.addEventListener("DOMContentLoaded", function () {
  // SAFETY TIMEOUT: Always hide loading screen after 2 seconds maximum
  setTimeout(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen && !loadingScreen.classList.contains('fade-out')) {
      console.log('⏰ Safety timeout: Force hiding loading screen after 2 seconds');
      hideLoadingScreen();
    }
  }, 2000);
  const SLOTS = [".CategorySlot[data-slot='1']", ".CategorySlot[data-slot='2']", ".CategorySlot[data-slot='3']", ".CategorySlot[data-slot='0']"];
  const PRIMARY_SLOT = SLOTS[0]; // Now points to slot 1
  let ROTATE_INTERVAL_MS = 6000; // Default, will be updated from settings
  
  // Performance: Cache DOM elements
  const categorySlots = {
    slot0: document.querySelector(".CategorySlot[data-slot='0']"),
    slot1: document.querySelector(".CategorySlot[data-slot='1']"),
    slot2: document.querySelector(".CategorySlot[data-slot='2']"),
    slot3: document.querySelector(".CategorySlot[data-slot='3']")
  };
  
  // Rotation interval will be loaded via loadAllData() for better performance
  
  console.log('🚀 Menu rendering starts immediately');

  // Strip technical prefixes from names (e.g., "A Cola" -> "Cola")
  function cleanName(name) {
    if (!name) return "";
    const str = String(name).trim();
    const parts = str.split(/\s+/);
    if (parts.length > 1) {
      const first = parts[0];
      const removable = new Set(["A", "B", "AA", "Br", "W"]);
      if (removable.has(first)) {
        return parts.slice(1).join(" ");
      }
    }
    return str;
  }

  function euro(value) {
    try {
      const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
      if (Number.isFinite(n)) {
        return "€" + n.toFixed(2).replace(".", ",");
      }
    } catch (_) {}
    return String(value);
  }

  // Performance: Use cached DOM elements and DocumentFragment
  function renderCategory(slotSelector, category, itemsOverride) {
    const slotElement = slotSelector.startsWith('.') ? 
      categorySlots[slotSelector.replace(/\W/g, '')] || document.querySelector(slotSelector) :
      document.querySelector(slotSelector);
      
    if (!category) {
      if (slotElement) slotElement.innerHTML = "";
      return;
    }
    // Performance: Use DocumentFragment for better DOM performance
    const fragment = document.createDocumentFragment();
    
    // Create title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'CategoryTitle';
    titleDiv.textContent = category.title;
    fragment.appendChild(titleDiv);
    
    const hr = document.createElement('hr');
    fragment.appendChild(hr);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'MenuItemsContainer';
    
    const list = Array.isArray(itemsOverride) ? itemsOverride : (category.items || []);
    list.forEach((it) => {
      // Performance: Create DOM elements directly instead of innerHTML
      const menuItem = document.createElement('div');
      menuItem.className = 'MenuItem';
      
      // Apply special styling classes
      if (it.on_sale) menuItem.classList.add('on-sale');
      if (it.is_new) menuItem.classList.add('is-new');
      
      // Create item type element
      const itemType = document.createElement('div');
      itemType.className = 'MenuItemType';
      itemType.textContent = cleanName(it.name);
      
      // Add badges
      if (it.on_sale) {
        const saleBadge = document.createElement('span');
        saleBadge.className = 'sale-badge';
        saleBadge.textContent = 'Aanbieding';
        itemType.appendChild(saleBadge);
      }
      if (it.is_new) {
        const newBadge = document.createElement('span');
        newBadge.className = 'new-badge';
        newBadge.textContent = 'Nieuw';
        itemType.appendChild(newBadge);
      }
      
      // Create price element
      const priceElement = document.createElement('div');
      priceElement.className = 'MenuFoodItem';
      priceElement.textContent = euro(it.price);
      
      menuItem.appendChild(itemType);
      menuItem.appendChild(priceElement);
      container.appendChild(menuItem);
    });
    
    fragment.appendChild(container);
    if (slotElement) {
      slotElement.innerHTML = ''; // Clear first
      slotElement.appendChild(fragment); // Single DOM update
    }
  }

  // Global functions to apply settings and footer from loadAllData()
  function applySettings(settingsData) {
    if (displaySettings && settingsData) {
      displaySettings.applySettings(settingsData);
      
      // Update rotation interval from settings
      const settings = settingsData.settings || {};
      ROTATE_INTERVAL_MS = parseInt(settings.rotation_interval) || 6000;
      console.log(`⚡ Rotation interval updated: ${ROTATE_INTERVAL_MS}ms`);
    }
  }

  // Global footer component instances
  let scrollingFooterInstance = null;
  let footerConfigWatcher = null;
  
  function applyFooterSettings(footerData) {
    const signageFooter = document.querySelector('.SignageFooter');
    
    // Check if footer should be hidden
    if (footerData && footerData.scroll_direction === 'hidden') {
      console.log('🚫 Footer set to hidden - using CSS state architecture');
      if (signageFooter) {
        signageFooter.classList.remove('footer-visible', 'footer-transitioning');
        signageFooter.classList.add('footer-hidden');
      }
      return; // Exit early - don't process footer content when hidden
    }
    
    if (footerData && footerData.footer_text && footerData.footer_text.trim()) {
      console.log('✅ Applying footer data using new component architecture...');
      
      // Initialize ScrollingFooter component if not already created
      const footerContainer = document.getElementById('footer-text') || signageFooter;
      
      if (footerContainer && !scrollingFooterInstance) {
        try {
          // Create ScrollingFooter instance with new architecture
          scrollingFooterInstance = new window.ScrollingFooter(footerContainer, footerData);
          
          // Set up footer config watcher for real-time updates (if available)
          if (window.FooterConfigWatcher) {
            footerConfigWatcher = new window.FooterConfigWatcher(
              footerContainer,
              scrollingFooterInstance,
              { pollInterval: 30000 } // Check for updates every 30 seconds
            );
          }
          
          // Start the footer component
          scrollingFooterInstance.start().then(success => {
            if (success) {
              console.log('✅ ScrollingFooter component started successfully');
              if (footerConfigWatcher) {
                footerConfigWatcher.start(footerData);
              }
            } else {
              console.log('ℹ️ ScrollingFooter using static fallback mode');
            }
          }).catch(error => {
            console.error('❌ ScrollingFooter failed to start:', error);
          });
          
          // Set up event listeners for component events
          footerContainer.addEventListener('footer-config-updated', (event) => {
            console.log('🔄 Footer configuration updated:', event.detail.config);
          });
          
          footerContainer.addEventListener('footer-config-error', (event) => {
            console.warn('⚠️ Footer configuration update failed:', event.detail.error);
          });
          
          footerContainer.addEventListener('performance-warning', (event) => {
            console.warn('⚠️ Footer performance warning:', event.detail);
          });
          
        } catch (error) {
          console.error('❌ Failed to initialize ScrollingFooter component:', error);
          // Fallback to basic footer display
          if (signageFooter) {
            signageFooter.classList.add('footer-visible');
            signageFooter.textContent = footerData.footer_text.replace(/<separator>/g, ' 🏰 ');
          }
        }
      } else if (scrollingFooterInstance) {
        // Update existing component with new configuration
        scrollingFooterInstance.updateConfig(footerData).then(success => {
          if (success) {
            console.log('✅ ScrollingFooter configuration updated');
          }
        }).catch(error => {
          console.error('❌ Failed to update ScrollingFooter configuration:', error);
        });
      }
      
      // Apply CSS custom properties using the new architecture
      if (signageFooter) {
        // Use CSS utilities if available, otherwise apply directly
        if (window.CSSUtils) {
          window.CSSUtils.updateFooterStyles(signageFooter, footerData);
        } else {
          // Fallback to direct CSS property application
          document.documentElement.style.setProperty('--footer-text-color', footerData.text_color || '#101010');
          document.documentElement.style.setProperty('--footer-bg-color', footerData.background_color || '#c19d6c');
          document.documentElement.style.setProperty('--footer-font-size', footerData.font_size || '3vh');
          
          // Apply visibility state classes
          signageFooter.classList.remove('footer-hidden', 'footer-transitioning');
          signageFooter.classList.add('footer-visible');
        }
        
        console.log('🎨 Applied footer styles via CSS custom properties');
      }
    }
  }

  // OPTIMIZED: Load all data concurrently using loadAll()
  const loadAllData = async () => {
    try {
      console.log('📡 Loading products, settings, and footer concurrently...');
      
      // Use the global API service to load everything in parallel
      const { products, settings, footer } = await window.apiService.loadAll();
      
      console.log(`✅ Loaded ${products.categories?.length || 0} categories, settings, and footer data concurrently`);
      
      // Process settings
      if (settings) {
        applySettings(settings);
      }
      
      // Process footer
      if (footer) {
        applyFooterSettings(footer);
      }
      
      return products;
      
    } catch (error) {
      console.error('❌ All API attempts failed:', error.message);
      
      // Update loading screen to show error message
      const loadingTextEl = document.getElementById('loadingText');
      if (loadingTextEl) {
        loadingTextEl.textContent = 'Verbinding mislukt - probeer de pagina te vernieuwen';
        loadingTextEl.style.color = '#ff6b6b';
      }
      
      throw new Error(`Failed to load menu: ${error.message}`);
    }
  };

  loadAllData()
    .then((data) => {
      console.log("🎯 EMERGENCY DEBUG: Initial data loaded:", data);
      const categories = Array.isArray(data.categories) ? data.categories : [];
      console.log(`🎯 EMERGENCY DEBUG: Found ${categories.length} categories:`, categories.map(c => c.title));
      if (categories.length === 0) {
        console.error('🚨 EMERGENCY: No categories found, keeping HTML fallback!');
        return;
      }
      let categoryIndex = 0;
      let pagePartIndex = 0; // which slice within current category

      const visibleCountCache = new Map(); // categoryIndex -> count

      function getSlotEl() {
        return document.querySelector(PRIMARY_SLOT);
      }

      function fits(slotEl) {
        // allow a tiny epsilon
        return slotEl.scrollHeight <= slotEl.clientHeight + 1;
      }

      function computeVisibleCountFor(catIdx) {
        // EMERGENCY FIX: Use fixed count to avoid blocking calculations
        const MAX_ITEMS = 8;
        const cat = categories[catIdx];
        if (!cat || !Array.isArray(cat.items) || cat.items.length === 0) {
          return 0;
        }
        // Simple fixed calculation - no complex DOM measurements that block
        return Math.min(cat.items.length, MAX_ITEMS);
      }

      function renderDynamicSlots() {
        console.log(`🎯 EMERGENCY DEBUG: renderDynamicSlots() called with ${categories.length} categories`);
        
        // Get display mode from settings
        const columnCount = displaySettings.getColumnCount();
        
        // EMERGENCY FIX: Don't clear HTML fallback content immediately
        // Only clear if we successfully have database data to show
        if (categories.length === 0) {
          console.warn('⚠️ No database categories loaded, keeping HTML fallback');
          return;
        }
        
        console.log(`🎯 EMERGENCY DEBUG: Rendering database content for ${categories.length} categories`);
        
        // Clear slots only when we have database data
        SLOTS.forEach(slot => {
          const el = document.querySelector(slot);
          if (el) {
            el.innerHTML = "";
            el.style.display = "none"; // Hide all initially
          }
        });
        
        // Determine how many slots to actually use based on content
        const currentCategory = categories[categoryIndex];
        if (!currentCategory || !currentCategory.items || currentCategory.items.length === 0) {
          return;
        }
        
        const visibleCount = computeVisibleCountFor(categoryIndex);
        const items = currentCategory.items || [];
        const totalItems = items.length;
        
        // Decide how many slots we need and fill them intelligently
        let slotsToUse = columnCount === 1 ? 1 : 2;
        
        if (slotsToUse === 1) {
          // Single slot mode - show current page of current category, MAX 8 ITEMS
          const MAX_ITEMS_PER_SLOT = 8;
          const slotEl = document.querySelector(SLOTS[0]);
          if (slotEl) {
            slotEl.style.display = "block";
            const start = pagePartIndex * MAX_ITEMS_PER_SLOT;
            const end = Math.min(totalItems, start + MAX_ITEMS_PER_SLOT);
            const slotItems = items.slice(start, end);
            renderCategory(SLOTS[0], currentCategory, slotItems);
          }
        } else {
          // Two slot mode - Use visibleCount for consistency with rotation logic
          const MAX_ITEMS_PER_SLOT = Math.min(visibleCount, 8); // Respect computed visible count but cap at 8
          
          if (totalItems > MAX_ITEMS_PER_SLOT) {
            // Split current category across 2 slots based on pagination
            const start = pagePartIndex * MAX_ITEMS_PER_SLOT;
            const end = Math.min(totalItems, start + MAX_ITEMS_PER_SLOT * 2);
            
            // Slot 1: Current page items
            const slot1El = document.querySelector(SLOTS[0]);
            if (slot1El) {
              slot1El.style.display = "block";
              const slot1Items = items.slice(start, Math.min(end, start + MAX_ITEMS_PER_SLOT));
              renderCategory(SLOTS[0], currentCategory, slot1Items);
            }
            
            // Slot 2: Next page items (if available)
            const slot2El = document.querySelector(SLOTS[1]);
            if (slot2El && start + MAX_ITEMS_PER_SLOT < end) {
              slot2El.style.display = "block";
              const slot2Items = items.slice(start + MAX_ITEMS_PER_SLOT, end);
              renderCategory(SLOTS[1], currentCategory, slot2Items);
            } else if (slot2El) {
              // If no more items in current category, show next category
              const nextCategoryIndex = (categoryIndex + 1) % categories.length;
              const nextCategory = categories[nextCategoryIndex];
              if (nextCategory) {
                slot2El.style.display = "block";
                const nextItems = (nextCategory.items || []).slice(0, MAX_ITEMS_PER_SLOT);
                renderCategory(SLOTS[1], nextCategory, nextItems);
              }
            }
          } else {
            // Show current category in slot 1, next category in slot 2
            const slot1El = document.querySelector(SLOTS[0]);
            if (slot1El) {
              slot1El.style.display = "block";
              const slot1Items = items.slice(0, MAX_ITEMS_PER_SLOT);
              renderCategory(SLOTS[0], currentCategory, slot1Items);
            }
            
            // Show next category in slot 2
            const nextCategoryIndex = (categoryIndex + 1) % categories.length;
            const nextCategory = categories[nextCategoryIndex];
            const slot2El = document.querySelector(SLOTS[1]);
            if (slot2El && nextCategory) {
              slot2El.style.display = "block";
              const nextItems = (nextCategory.items || []).slice(0, MAX_ITEMS_PER_SLOT);
              renderCategory(SLOTS[1], nextCategory, nextItems);
            }
          }
        }
        
        // No need for container management with direct slots
      }

      // Invalidate cache shortly after load to account for late-loading fonts
      setTimeout(() => visibleCountCache.clear(), 2000);
      window.addEventListener("resize", () => {
        visibleCountCache.clear();
        renderDynamicSlots();
      });

      // initial render
      renderDynamicSlots();

      // Hide loading screen after menu data is properly rendered
      hideLoadingScreenWhenReady();

      // Re-measure once web fonts have finished loading (prevents underestimation)
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          visibleCountCache.clear();
          pagePartIndex = 0;
          renderDynamicSlots();
        }).catch(() => {
          /* no-op */
        });
      }
      setInterval(() => {
        // Simple rotation: just advance the starting point
        // This will naturally cycle through all categories and pages
        pagePartIndex += 1;
        
        // Check if we need to move to next category
        if (categories[categoryIndex] && categories[categoryIndex].items) {
          const visibleCount = computeVisibleCountFor(categoryIndex);
          const items = categories[categoryIndex].items || [];
          const totalParts = Math.max(1, Math.ceil(items.length / Math.max(1, visibleCount)));
          
          console.log(`Category: ${categories[categoryIndex].title} (${categoryIndex}), pagePartIndex: ${pagePartIndex}, totalParts: ${totalParts}, visibleCount: ${visibleCount}`);
          
          if (pagePartIndex >= totalParts) {
            const oldCategoryIndex = categoryIndex;
            pagePartIndex = 0;
            categoryIndex = (categoryIndex + 1) % categories.length;
            console.log(`Advancing from category ${oldCategoryIndex} (${categories[oldCategoryIndex].title}) to ${categoryIndex} (${categories[categoryIndex].title})`);
          }
        } else {
          // Skip empty categories
          console.log(`Skipping empty category ${categoryIndex}: ${categories[categoryIndex]?.title || 'undefined'}`);
          pagePartIndex = 0;
          categoryIndex = (categoryIndex + 1) % categories.length;
        }
        
        renderDynamicSlots();
      }, ROTATE_INTERVAL_MS);

      // CLEAN API INTEGRATION: Using new API service with proper retry logic
      // Simple periodic refresh using direct API calls instead
      const refreshData = async () => {
        try {
          console.log("🔄 Refreshing data from direct API...");
          const newData = await loadAllData();
          
          if (newData && newData.categories && newData.categories.length > 0) {
            const newCategories = Array.isArray(newData.categories) ? newData.categories : [];
            categories.length = 0;
            categories.push(...newCategories);
            console.log("✅ Data refreshed:", categories.map(c => c.title));
            renderDynamicSlots();
          }
        } catch (error) {
          console.warn("⚠️ Failed to refresh data:", error);
        }
      };

      // Automatic refresh every 5 minutes with reliable API service
      setInterval(refreshData, 300000);
    })
    .catch((err) => {
      console.error("Error loading products data", err);
      
      // Ensure loading screen shows error message for any unhandled errors
      const loadingTextEl = document.getElementById('loadingText');
      if (loadingTextEl && !loadingTextEl.style.color) {
        loadingTextEl.textContent = 'Fout bij laden menu - probeer de pagina te vernieuwen';
        loadingTextEl.style.color = '#ff6b6b';
      }
    });
  
  // Make component instances globally available for cleanup
  window.scrollingFooterInstance = scrollingFooterInstance;
  window.footerConfigWatcher = footerConfigWatcher;
});

document.addEventListener("DOMContentLoaded", function () {
  // Footer initialization using new component architecture
  console.log('✨ Initializing footer with new component architecture');
  
  // Initialize footer container with proper CSS state classes
  const footerContainer = document.querySelector('.SignageFooter');
  if (footerContainer) {
    // Start with transitioning state to show loading
    footerContainer.classList.add('footer-transitioning');
    console.log('✨ Footer container initialized with CSS state architecture');
  }
  
  // Footer initialization is now handled by applyFooterSettings() function
  // which is called from loadAllData() for better performance and integration
  
  // Cleanup function for component instances
  window.cleanupFooterComponents = function() {
    if (window.scrollingFooterInstance) {
      window.scrollingFooterInstance.stop();
      window.scrollingFooterInstance = null;
    }
    if (window.footerConfigWatcher) {
      window.footerConfigWatcher.destroy();
      window.footerConfigWatcher = null;
    }
    console.log('🧹 Footer components cleaned up');
  };
  
  // Handle page unload to cleanup components
  window.addEventListener('beforeunload', () => {
    window.cleanupFooterComponents();
  });
});
