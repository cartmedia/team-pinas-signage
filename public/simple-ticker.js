// Ultra-simpele footer ticker
class SimpleTicker {
  constructor(container) {
    this.container = container;
    this.init();
  }

  async init() {
    try {
      // Haal footer data op
      const response = await fetch('/.netlify/functions/footer');
      const data = await response.json();
      
      // Maak ticker HTML
      this.createTicker(data);
      
      console.log('SimpleTicker: Loaded successfully');
    } catch (error) {
      console.log('SimpleTicker: Error loading, using fallback');
      this.createFallbackTicker();
    }
  }

  createTicker(data) {
    const text = data.footer_text || 'WELKOM BIJ TEAM PINAS 👑 VERSE MAALTIJDEN 👑 PERSONAL TRAINING 👑 GEZONDE KEUZES';
    const segments = text.split('<separator>');
    
    const svgSeparator = `<img class="svg-separator" src="/assets/images/pinas_kroon.svg" alt="separator" />`;
    
    // Create seamless content by duplicating
    const contentHTML = segments.map(segment => `
      <span class="simple-ticker-segment">${segment.trim()}</span>
      <span class="simple-ticker-separator">${svgSeparator}</span>
    `).join('');
    
    this.container.className = 'simple-ticker';
    this.container.innerHTML = `
      <div class="simple-ticker-content">
        ${contentHTML}${contentHTML}
      </div>
    `;
  }

  createFallbackTicker() {
    const svgSeparator = `<img class="svg-separator" src="/assets/images/pinas_kroon.svg" alt="separator" />`;
    
    const fallbackContent = `
      <span class="simple-ticker-segment">WELKOM BIJ TEAM PINAS</span>
      <span class="simple-ticker-separator">${svgSeparator}</span>
      <span class="simple-ticker-segment">VERSE MAALTIJDEN VOOR IEDEREEN</span>
      <span class="simple-ticker-separator">${svgSeparator}</span>
      <span class="simple-ticker-segment">PERSONAL TRAINING VANAF €37,50</span>
      <span class="simple-ticker-separator">${svgSeparator}</span>
      <span class="simple-ticker-segment">INVESTEER IN JEZELF</span>
      <span class="simple-ticker-separator">${svgSeparator}</span>
    `;
    
    this.container.className = 'simple-ticker';
    this.container.innerHTML = `
      <div class="simple-ticker-content">
        ${fallbackContent}${fallbackContent}
      </div>
    `;
  }
}

// Start ticker when page loads
document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('.SignageFooter');
  if (footer) {
    new SimpleTicker(footer);
  }
});