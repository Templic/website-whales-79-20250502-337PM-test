/**
 * Accessibility Features JavaScript
 * 
 * This script handles all the accessibility features including:
 * - Font size adjustment
 * - High contrast mode
 * - Reduced motion
 * - Color themes
 * - Text spacing adjustment
 */

// Define default settings
const defaultSettings = {
  fontSize: 16,
  highContrast: false,
  reducedMotion: false,
  theme: 'default',
  textSpacing: 1.5
};

// Initialize settings from localStorage or use defaults
let accessibilitySettings = loadSettings() || { ...defaultSettings };

// DOM Elements and state variables for the floating panel
let accessibilityPanel;
let accessibilityToggle;
let fontSizeDisplay;
let highContrastToggle;
let reducedMotionToggle;
let themeOptions;
let textSpacingSlider;
let resetButton;

/**
 * Initialize accessibility panel on the dedicated page
 */
function initAccessibilityPage() {
  // The page already has the elements, so just need to wire up events
  fontSizeDisplay = document.getElementById('font-size-display');
  highContrastToggle = document.getElementById('high-contrast-toggle');
  reducedMotionToggle = document.getElementById('reduced-motion-toggle');
  textSpacingSlider = document.getElementById('text-spacing-slider');
  resetButton = document.getElementById('reset-accessibility');
  themeOptions = document.querySelectorAll('.theme-option');

  if (fontSizeDisplay) {
    document.getElementById('decrease-font').addEventListener('click', decreaseFontSize);
    document.getElementById('increase-font').addEventListener('click', increaseFontSize);
    fontSizeDisplay.textContent = `${accessibilitySettings.fontSize}px`;
  }

  if (highContrastToggle) {
    highContrastToggle.checked = accessibilitySettings.highContrast;
    highContrastToggle.addEventListener('change', toggleHighContrast);
  }

  if (reducedMotionToggle) {
    reducedMotionToggle.checked = accessibilitySettings.reducedMotion;
    reducedMotionToggle.addEventListener('change', toggleReducedMotion);
  }

  if (textSpacingSlider) {
    textSpacingSlider.value = accessibilitySettings.textSpacing;
    textSpacingSlider.addEventListener('input', adjustTextSpacing);
  }

  if (resetButton) {
    resetButton.addEventListener('click', resetSettings);
  }

  if (themeOptions) {
    themeOptions.forEach(option => {
      if (option.dataset.theme === accessibilitySettings.theme) {
        option.classList.add('active');
      }
      option.addEventListener('click', () => setTheme(option.dataset.theme));
    });
  }

  // Apply existing settings
  applySettings();
}

/**
 * Initialize the floating accessibility panel
 */
function initAccessibilityPanel() {
  // Create the panel if it doesn't exist
  if (!document.querySelector('.accessibility-panel')) {
    createAccessibilityPanel();
  }

  // Apply existing settings
  applySettings();
}

/**
 * Create the accessibility panel in the DOM
 */
function createAccessibilityPanel() {
  // Create the toggle button
  accessibilityToggle = document.createElement('button');
  accessibilityToggle.className = 'accessibility-toggle';
  accessibilityToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
  accessibilityToggle.setAttribute('aria-label', 'Open accessibility panel');
  accessibilityToggle.setAttribute('title', 'Accessibility Options');
  
  // Create the panel
  accessibilityPanel = document.createElement('div');
  accessibilityPanel.className = 'accessibility-panel';
  accessibilityPanel.innerHTML = `
    <h2 style="margin-top: 0; font-size: 18px; color: var(--fill-color);">Accessibility Options</h2>
    <div class="accessibility-controls">
      <div class="accessibility-section">
        <h3>Text Size</h3>
        <div class="font-size-controls">
          <button id="panel-decrease-font" class="font-size-btn" aria-label="Decrease font size">A-</button>
          <span id="panel-font-size-display" class="font-size-display">${accessibilitySettings.fontSize}px</span>
          <button id="panel-increase-font" class="font-size-btn" aria-label="Increase font size">A+</button>
        </div>
      </div>
      
      <div class="accessibility-section">
        <h3>Display Options</h3>
        <div class="control-group">
          <label for="panel-high-contrast-toggle">High Contrast</label>
          <label class="toggle-switch">
            <input type="checkbox" id="panel-high-contrast-toggle" ${accessibilitySettings.highContrast ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        
        <div class="control-group">
          <label for="panel-reduced-motion-toggle">Reduced Motion</label>
          <label class="toggle-switch">
            <input type="checkbox" id="panel-reduced-motion-toggle" ${accessibilitySettings.reducedMotion ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="accessibility-section">
        <h3>Color Theme</h3>
        <div class="theme-options">
          <div class="theme-option theme-default ${accessibilitySettings.theme === 'default' ? 'active' : ''}" 
               data-theme="default" aria-label="Default theme"></div>
          <div class="theme-option theme-high-contrast ${accessibilitySettings.theme === 'high-contrast' ? 'active' : ''}" 
               data-theme="high-contrast" aria-label="High contrast theme"></div>
          <div class="theme-option theme-soft ${accessibilitySettings.theme === 'soft' ? 'active' : ''}" 
               data-theme="soft" aria-label="Soft colors theme"></div>
          <div class="theme-option theme-warm ${accessibilitySettings.theme === 'warm' ? 'active' : ''}" 
               data-theme="warm" aria-label="Warm colors theme"></div>
        </div>
      </div>
      
      <div class="accessibility-section">
        <h3>Text Spacing</h3>
        <div class="spacing-slider">
          <input type="range" id="panel-text-spacing-slider" min="1" max="2" step="0.1" 
                 value="${accessibilitySettings.textSpacing}" aria-label="Adjust text spacing">
        </div>
      </div>
      
      <button id="panel-reset-accessibility" class="reset-btn">Reset to Defaults</button>
    </div>
  `;
  
  // Append to body
  document.body.appendChild(accessibilityToggle);
  document.body.appendChild(accessibilityPanel);
  
  // Add event listeners
  accessibilityToggle.addEventListener('click', togglePanel);
  
  // Font size controls
  document.getElementById('panel-decrease-font').addEventListener('click', decreaseFontSize);
  document.getElementById('panel-increase-font').addEventListener('click', increaseFontSize);
  
  // High contrast toggle
  document.getElementById('panel-high-contrast-toggle').addEventListener('change', toggleHighContrast);
  
  // Reduced motion toggle
  document.getElementById('panel-reduced-motion-toggle').addEventListener('change', toggleReducedMotion);
  
  // Theme options
  const panelThemeOptions = document.querySelectorAll('.accessibility-panel .theme-option');
  panelThemeOptions.forEach(option => {
    option.addEventListener('click', () => setTheme(option.dataset.theme));
  });
  
  // Text spacing slider
  document.getElementById('panel-text-spacing-slider').addEventListener('input', adjustTextSpacing);
  
  // Reset button
  document.getElementById('panel-reset-accessibility').addEventListener('click', resetSettings);
}

/**
 * Toggle the visibility of the accessibility panel
 */
function togglePanel() {
  accessibilityPanel.classList.toggle('open');
  
  // Update button attributes based on panel state
  if (accessibilityPanel.classList.contains('open')) {
    accessibilityToggle.setAttribute('aria-label', 'Close accessibility panel');
    accessibilityToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  } else {
    accessibilityToggle.setAttribute('aria-label', 'Open accessibility panel');
    accessibilityToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
  }
}

/**
 * Increase font size
 */
function increaseFontSize() {
  if (accessibilitySettings.fontSize < 24) {
    accessibilitySettings.fontSize += 1;
    updateFontSizeDisplay();
    applyFontSize();
    saveSettings();
  }
}

/**
 * Decrease font size
 */
function decreaseFontSize() {
  if (accessibilitySettings.fontSize > 12) {
    accessibilitySettings.fontSize -= 1;
    updateFontSizeDisplay();
    applyFontSize();
    saveSettings();
  }
}

/**
 * Update font size displays in panel and on page
 */
function updateFontSizeDisplay() {
  // Update in floating panel
  const panelDisplay = document.getElementById('panel-font-size-display');
  if (panelDisplay) {
    panelDisplay.textContent = `${accessibilitySettings.fontSize}px`;
  }
  
  // Update on accessibility page
  if (fontSizeDisplay) {
    fontSizeDisplay.textContent = `${accessibilitySettings.fontSize}px`;
  }
}

/**
 * Apply font size to the document
 */
function applyFontSize() {
  document.documentElement.style.setProperty('font-size', `${accessibilitySettings.fontSize}px`);
}

/**
 * Toggle high contrast mode
 */
function toggleHighContrast(event) {
  // If the event came from the UI, update the settings
  if (event && event.target) {
    accessibilitySettings.highContrast = event.target.checked;
    
    // Sync the other toggle if it exists
    const pageToggle = document.getElementById('high-contrast-toggle');
    const panelToggle = document.getElementById('panel-high-contrast-toggle');
    
    if (event.target === pageToggle && panelToggle) {
      panelToggle.checked = pageToggle.checked;
    } else if (event.target === panelToggle && pageToggle) {
      pageToggle.checked = panelToggle.checked;
    }
  }
  
  applyHighContrast();
  saveSettings();
}

/**
 * Apply high contrast mode to the document
 */
function applyHighContrast() {
  if (accessibilitySettings.highContrast) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
}

/**
 * Toggle reduced motion setting
 */
function toggleReducedMotion(event) {
  // If the event came from the UI, update the settings
  if (event && event.target) {
    accessibilitySettings.reducedMotion = event.target.checked;
    
    // Sync the other toggle if it exists
    const pageToggle = document.getElementById('reduced-motion-toggle');
    const panelToggle = document.getElementById('panel-reduced-motion-toggle');
    
    if (event.target === pageToggle && panelToggle) {
      panelToggle.checked = pageToggle.checked;
    } else if (event.target === panelToggle && pageToggle) {
      pageToggle.checked = panelToggle.checked;
    }
  }
  
  applyReducedMotion();
  saveSettings();
}

/**
 * Apply reduced motion to the document
 */
function applyReducedMotion() {
  if (accessibilitySettings.reducedMotion) {
    document.body.classList.add('reduced-motion');
  } else {
    document.body.classList.remove('reduced-motion');
  }
}

/**
 * Set the color theme
 */
function setTheme(theme) {
  // Update settings
  accessibilitySettings.theme = theme;
  
  // Update UI - remove active class from all and add to selected
  const allThemeOptions = document.querySelectorAll('.theme-option');
  allThemeOptions.forEach(option => {
    if (option.dataset.theme === theme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  applyTheme();
  saveSettings();
}

/**
 * Apply the theme to the document
 */
function applyTheme() {
  // Remove all theme classes
  document.body.classList.remove('high-contrast', 'soft-theme', 'warm-theme');
  
  // Add the selected theme class
  switch (accessibilitySettings.theme) {
    case 'high-contrast':
      document.body.classList.add('high-contrast');
      break;
    case 'soft':
      document.body.classList.add('soft-theme');
      break;
    case 'warm':
      document.body.classList.add('warm-theme');
      break;
    // Default theme requires no class
  }
}

/**
 * Adjust text spacing
 */
function adjustTextSpacing(event) {
  // If the event came from the UI, update the settings
  if (event && event.target) {
    accessibilitySettings.textSpacing = parseFloat(event.target.value);
    
    // Sync the other slider if it exists
    const pageSlider = document.getElementById('text-spacing-slider');
    const panelSlider = document.getElementById('panel-text-spacing-slider');
    
    if (event.target === pageSlider && panelSlider) {
      panelSlider.value = pageSlider.value;
    } else if (event.target === panelSlider && pageSlider) {
      pageSlider.value = panelSlider.value;
    }
  }
  
  applyTextSpacing();
  saveSettings();
}

/**
 * Apply text spacing to the document
 */
function applyTextSpacing() {
  document.body.style.lineHeight = accessibilitySettings.textSpacing;
}

/**
 * Reset all settings to defaults
 */
function resetSettings() {
  accessibilitySettings = { ...defaultSettings };
  
  // Update UI elements
  updateFontSizeDisplay();
  
  // Update toggles
  const highContrastToggles = document.querySelectorAll('#high-contrast-toggle, #panel-high-contrast-toggle');
  highContrastToggles.forEach(toggle => {
    toggle.checked = defaultSettings.highContrast;
  });
  
  const reducedMotionToggles = document.querySelectorAll('#reduced-motion-toggle, #panel-reduced-motion-toggle');
  reducedMotionToggles.forEach(toggle => {
    toggle.checked = defaultSettings.reducedMotion;
  });
  
  // Update theme options
  const allThemeOptions = document.querySelectorAll('.theme-option');
  allThemeOptions.forEach(option => {
    if (option.dataset.theme === defaultSettings.theme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // Update sliders
  const textSpacingSliders = document.querySelectorAll('#text-spacing-slider, #panel-text-spacing-slider');
  textSpacingSliders.forEach(slider => {
    slider.value = defaultSettings.textSpacing;
  });
  
  // Apply all default settings
  applySettings();
  
  // Save to localStorage
  saveSettings();
}

/**
 * Apply all current settings to the document
 */
function applySettings() {
  applyFontSize();
  applyHighContrast();
  applyReducedMotion();
  applyTheme();
  applyTextSpacing();
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
  const savedSettings = localStorage.getItem('accessibilitySettings');
  return savedSettings ? JSON.parse(savedSettings) : null;
}

// Check if we're on the accessibility page
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('accessibility')) {
    initAccessibilityPage();
  }
});

// Export the init function for the floating panel
window.initAccessibilityPanel = initAccessibilityPanel;