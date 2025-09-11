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
    
    // Remove existing color classes
    footerContainer.classList.remove('footer-light', 'footer-dark');
    
    // Apply new color class and CSS custom property
    if (colorMode === 'light') {
      footerContainer.classList.add('footer-light');
      document.body.style.setProperty('--footer-text-color', '#ffffff');
      console.log('🎨 Applied light footer text color');
    } else {
      footerContainer.classList.add('footer-dark');
      document.body.style.setProperty('--footer-text-color', '#101010');
      console.log('🎨 Applied dark footer text color');
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
  
  // Load display settings for rotation timing
  const loadDisplaySettings = async () => {
    try {
      const response = await fetch('/.netlify/functions/settings');
      const data = await response.json();
      const settings = data.settings || {};
      
      ROTATE_INTERVAL_MS = parseInt(settings.rotation_interval) || 6000;
      console.log(`⚡ Rotation interval: ${ROTATE_INTERVAL_MS}ms`);
    } catch (error) {
      console.log('ℹ️ Using default rotation interval (6s)');
      ROTATE_INTERVAL_MS = 6000;
    }
  };
  
  // Load settings in background - don't block menu
  loadDisplaySettings();
  
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
    }
  }

  function applyFooterSettings(footerData) {
    if (footerData && footerData.footer_text && footerData.footer_text.trim()) {
      console.log('✅ Applying footer data from concurrent load...');
      
      // Map footer API response to display properties
      footerSpeed = parseInt(footerData.scroll_speed) || 30;
      footerText = footerData.footer_text.trim().replace('<separator>', '||');
      footerContinuous = footerData.scroll_direction !== 'static';
      
      // Apply footer text color if provided
      if (footerData.text_color) {
        document.body.style.setProperty('--footer-text-color', footerData.text_color);
        console.log(`🎨 Applied footer text color: ${footerData.text_color}`);
      }
      
      // Apply footer background color if provided
      if (footerData.background_color) {
        document.body.style.setProperty('--footer-bg-color', footerData.background_color);
        console.log(`🎨 Applied footer background color: ${footerData.background_color}`);
      }
      
      // Update footer content
      const scrollingTextSpan = document.querySelector('.ScrollingText span');
      if (scrollingTextSpan) {
        // Replace separator with image tags for proper display
        const formattedText = footerText.replace(/\|\|/g, 
          ' <img class="sep" src="assets/images/pinas_kroon.svg" alt="" role="presentation" aria-hidden="true" /> ');
        scrollingTextSpan.innerHTML = formattedText;
        console.log('📝 Footer content updated from API');
        
        // Restart animation with new content
        setAnimationDuration();
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
});

document.addEventListener("DOMContentLoaded", function () {
  const scrollingTextSpan = document.querySelector(".ScrollingText span");

  // Footer slideshow management
  let footerSpeed = 30; // Default pixels per second
  let footerText = ""; // No fallback content - only show footer if database has content
  let footerContinuous = true; // Default to continuous scrolling
  let footerInitialized = false;

  function updateFooterContent() {
    if (!scrollingTextSpan) return;
    
    // Split text by custom separator and add SVG dividers
    const textParts = footerText.split('||').filter(part => part.trim());
    
    // Always ensure footer is visible - never hide it
    const footerContainer = document.querySelector('.SignageFooter');
    if (footerContainer) {
      footerContainer.style.display = 'block';
    }
    
    // Only update content if we have valid database content
    if (textParts.length === 0 || !footerText.trim()) {
      console.log('⚠️ No valid database footer content, keeping HTML fallback');
      return;
    } else {
      console.log('✅ Updating footer with database content');
    }
    
    let htmlContent = '';
    
    // Get per-row color settings if available
    const footerRowColors = displaySettings?.settings?.footer_row_colors;
    const usePerRowColors = footerRowColors && Array.isArray(footerRowColors);
    
    // Create the scrolling content with SVG separators and optional per-row colors
    textParts.forEach((part, index) => {
      let partContent = part.trim();
      
      // Apply per-row color if specified
      if (usePerRowColors && footerRowColors[index]) {
        const colorClass = footerRowColors[index] === 'light' ? 'footer-text-light' : 'footer-text-dark';
        partContent = `<span class="${colorClass}">${partContent}</span>`;
        console.log(`🎨 Applied ${colorClass} to row ${index + 1}`);
      }
      
      htmlContent += partContent;
      // Add SVG separator after each part
      htmlContent += '<img class="sep" src="assets/images/pinas_kroon.svg" alt="" role="presentation" aria-hidden="true" />';
    });
    
    if (footerContinuous) {
      // Voor echte continue scrolling: dupliceer de content zonder extra spacing
      scrollingTextSpan.innerHTML = htmlContent + htmlContent;
      scrollingTextSpan.style.animationName = 'scrollTextContinuous';
    } else {
      // Discrete mode: enkele content met natuurlijke pauze
      scrollingTextSpan.innerHTML = htmlContent;
      scrollingTextSpan.style.animationName = 'scrollTextDiscrete';
    }
    
    // Set animation immediately after content is set
    requestAnimationFrame(() => {
      setAnimationDuration();
      footerInitialized = true;
    });
  }

  function setAnimationDuration() {
    if (!scrollingTextSpan || !scrollingTextSpan.innerHTML.trim()) return;
    
    // Force layout calculation to ensure accurate measurements
    const containerWidth = scrollingTextSpan.parentElement.offsetWidth;
    let spanWidth = scrollingTextSpan.offsetWidth;
    
    // Fallback if measurements fail
    if (!containerWidth || !spanWidth) {
      console.warn('⚠️ Footer measurement failed, using fallback timing');
      scrollingTextSpan.style.animationDuration = '20s';
      return;
    }
    
    let totalDistance;
    
    if (footerContinuous && spanWidth > 0) {
      // Continue: van 100% naar -100% = 200% van container breedte
      // Content is gedupliceerd, dus halve span breedte = echte content breedte
      spanWidth = spanWidth / 2;
      totalDistance = containerWidth + spanWidth; // 100% container + volledige content breedte
    } else {
      // Discrete: van 100% naar -100% = 200% van container breedte  
      totalDistance = spanWidth + (2 * containerWidth); // Volledige span + 200% container
    }
    
    // Calculate duration based on speed setting (pixels per second)
    // Minimum duration of 5s to prevent too fast scrolling
    const calculatedDuration = Math.max(5, totalDistance / footerSpeed);
    scrollingTextSpan.style.animationDuration = calculatedDuration + "s";
    
    console.log(`🎬 Footer animation: ${footerContinuous ? 'continuous' : 'discrete'}, spanWidth: ${spanWidth}px, containerWidth: ${containerWidth}px, totalDistance: ${totalDistance}px, duration: ${calculatedDuration}s`);
  }


  // Show footer immediately with fallback content, then load settings
  const footerContainer = document.querySelector('.SignageFooter');
  if (footerContainer) {
    // Start visible for instant display - no delay needed
    footerContainer.style.display = 'block'; 
    console.log('✨ Footer shown immediately with HTML content');
    
    // Start animation immediately with HTML content
    if (scrollingTextSpan && scrollingTextSpan.innerHTML.trim()) {
      console.log('🎬 Starting footer animation with HTML content immediately');
      setAnimationDuration();
    }
  }

  // Load footer using dedicated footer API endpoint
  const loadFooterSettings = async () => {
    try {
      console.log('📡 Loading footer from dedicated footer API...');
      
      // Use the global API service with retry logic
      const footerData = await window.apiService.loadFooter();
      
      if (footerData && footerData.footer_text && footerData.footer_text.trim()) {
        console.log('✅ Got footer content from dedicated API, updating...');
        
        // Map footer API response to display properties
        footerSpeed = parseInt(footerData.scroll_speed) || 30;
        footerText = footerData.footer_text.trim().replace('<separator>', '||'); // Convert separator format
        footerContinuous = footerData.scroll_direction !== 'static';
        
        // Apply footer text color if provided
        if (footerData.text_color) {
          document.body.style.setProperty('--footer-text-color', footerData.text_color);
          console.log(`🎨 Applied footer text color: ${footerData.text_color}`);
        }
        
        // Apply footer font size if provided
        if (footerData.font_size) {
          document.body.style.setProperty('--footer-font-size', footerData.font_size);
          console.log(`📏 Applied footer font size: ${footerData.font_size}`);
        }
        
        // Update divider image if provided and different from default
        if (footerData.divider_image && footerData.divider_image !== 'assets/images/pinas_kroon.svg') {
          // Note: Would need to update updateFooterContent() to use dynamic divider image
          console.log(`🖼️ Custom divider image available: ${footerData.divider_image}`);
        }
        
        // Update the footer with database content
        updateFooterContent();
        
        console.log(`🎬 Footer configured: speed=${footerSpeed}px/s, direction=${footerData.scroll_direction}, color=${footerData.text_color}`);
      } else {
        console.log('ℹ️ No footer content in dedicated API, keeping HTML content');
      }
    } catch (error) {
      console.log('ℹ️ Footer API failed, keeping HTML content:', error.message);
    }
  };

  // Start loading footer settings in background
  // Footer settings will be loaded via loadAllData() for better performance

  // Restart the animation when it ends to simulate an infinite scroll
  if (scrollingTextSpan) {
    scrollingTextSpan.addEventListener("animationiteration", () => {
      if (footerInitialized) {
        setAnimationDuration();
      }
    });
  }
});
