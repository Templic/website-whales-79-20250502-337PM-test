/**
 * Accessibility Controls Script
 * Handles all accessibility-related functionality
 */

// Default settings
const defaultSettings = {
  fontSize: 16,
  highContrast: false,
  reducedMotion: false,
  textSpacing: 1.5,
  themeOption: 'default'
};

// Current settings (initialize with defaults or stored values)
let accessibilitySettings = loadSettings();

// DOM Elements
let fontSizeControls, fontSizeDisplay, highContrastToggle, 
    reducedMotionToggle, textSpacingSlider, themeOptions,
    resetButton, accessibilityToggle, accessibilityPanel;

// Initialize once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeAccessibilityControls();
});

/**
 * Initialize all accessibility controls
 */
function initializeAccessibilityControls() {
  // Initialize panel toggle button if it exists
  accessibilityToggle = document.getElementById('accessibility-toggle');
  if (accessibilityToggle) {
    accessibilityPanel = document.getElementById('accessibility-panel');
    accessibilityToggle.addEventListener('click', toggleAccessibilityPanel);
    
    // Close panel when clicking outside
    document.addEventListener('click', (event) => {
      if (accessibilityPanel && 
          accessibilityPanel.classList.contains('visible') && 
          !accessibilityPanel.contains(event.target) && 
          event.target !== accessibilityToggle) {
        accessibilityPanel.classList.remove('visible');
      }
    });
  }
  
  // Setup font size controls
  setupFontSizeControls();
  
  // Setup high contrast toggle
  setupHighContrastToggle();
  
  // Setup reduced motion toggle
  setupReducedMotionToggle();
  
  // Setup text spacing controls
  setupTextSpacingControls();
  
  // Setup theme options
  setupThemeOptions();
  
  // Setup reset button
  setupResetButton();
  
  // Apply current settings
  applySettings();
}

/**
 * Toggle the accessibility panel visibility
 */
function toggleAccessibilityPanel() {
  if (accessibilityPanel) {
    accessibilityPanel.classList.toggle('visible');
  }
}

/**
 * Setup font size controls
 */
function setupFontSizeControls() {
  const decreaseBtn = document.getElementById('decrease-font');
  const increaseBtn = document.getElementById('increase-font');
  fontSizeDisplay = document.getElementById('font-size-display');
  
  if (decreaseBtn && increaseBtn && fontSizeDisplay) {
    // Update display
    fontSizeDisplay.textContent = `${accessibilitySettings.fontSize}px`;
    
    // Add event listeners
    decreaseBtn.addEventListener('click', () => {
      if (accessibilitySettings.fontSize > 12) {
        accessibilitySettings.fontSize -= 2;
        updateFontSize();
      }
    });
    
    increaseBtn.addEventListener('click', () => {
      if (accessibilitySettings.fontSize < 24) {
        accessibilitySettings.fontSize += 2;
        updateFontSize();
      }
    });
  }
}

/**
 * Update the font size
 */
function updateFontSize() {
  // Update display
  if (fontSizeDisplay) {
    fontSizeDisplay.textContent = `${accessibilitySettings.fontSize}px`;
  }
  
  // Apply font size to document
  document.documentElement.style.fontSize = `${accessibilitySettings.fontSize}px`;
  
  // Update body classes for larger font sizes
  document.body.classList.remove('font-size-large', 'font-size-larger', 'font-size-largest');
  
  if (accessibilitySettings.fontSize >= 18 && accessibilitySettings.fontSize < 20) {
    document.body.classList.add('font-size-large');
  } else if (accessibilitySettings.fontSize >= 20 && accessibilitySettings.fontSize < 22) {
    document.body.classList.add('font-size-larger');
  } else if (accessibilitySettings.fontSize >= 22) {
    document.body.classList.add('font-size-largest');
  }
  
  // Save settings
  saveSettings();
}

/**
 * Setup high contrast toggle
 */
function setupHighContrastToggle() {
  highContrastToggle = document.getElementById('high-contrast-toggle');
  
  if (highContrastToggle) {
    // Set current state
    highContrastToggle.checked = accessibilitySettings.highContrast;
    
    // Add event listener
    highContrastToggle.addEventListener('change', () => {
      accessibilitySettings.highContrast = highContrastToggle.checked;
      toggleHighContrast();
    });
  }
}

/**
 * Toggle high contrast mode
 */
function toggleHighContrast() {
  if (accessibilitySettings.highContrast) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
  
  // Save settings
  saveSettings();
}

/**
 * Setup reduced motion toggle
 */
function setupReducedMotionToggle() {
  reducedMotionToggle = document.getElementById('reduced-motion-toggle');
  
  if (reducedMotionToggle) {
    // Set current state
    reducedMotionToggle.checked = accessibilitySettings.reducedMotion;
    
    // Add event listener
    reducedMotionToggle.addEventListener('change', () => {
      accessibilitySettings.reducedMotion = reducedMotionToggle.checked;
      toggleReducedMotion();
    });
  }
}

/**
 * Toggle reduced motion
 */
function toggleReducedMotion() {
  if (accessibilitySettings.reducedMotion) {
    document.body.classList.add('reduced-motion');
  } else {
    document.body.classList.remove('reduced-motion');
  }
  
  // Save settings
  saveSettings();
}

/**
 * Setup text spacing controls
 */
function setupTextSpacingControls() {
  textSpacingSlider = document.getElementById('text-spacing-slider');
  
  if (textSpacingSlider) {
    // Set current value
    textSpacingSlider.value = accessibilitySettings.textSpacing;
    
    // Add event listener
    textSpacingSlider.addEventListener('input', () => {
      accessibilitySettings.textSpacing = parseFloat(textSpacingSlider.value);
      updateTextSpacing();
    });
  }
}

/**
 * Update text spacing
 */
function updateTextSpacing() {
  document.documentElement.style.setProperty('--line-height', accessibilitySettings.textSpacing);
  
  // Apply to common text elements
  const textElements = document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
  textElements.forEach(element => {
    element.style.lineHeight = accessibilitySettings.textSpacing;
  });
  
  // Save settings
  saveSettings();
}

/**
 * Setup theme options
 */
function setupThemeOptions() {
  const themeOptions = document.querySelectorAll('.theme-option');
  
  if (themeOptions.length > 0) {
    // Remove active class from all
    themeOptions.forEach(option => {
      option.classList.remove('active');
      
      // Add event listener
      option.addEventListener('click', () => {
        const theme = option.getAttribute('data-theme');
        accessibilitySettings.themeOption = theme;
        updateTheme(themeOptions);
      });
      
      // Set active class on current theme
      if (option.getAttribute('data-theme') === accessibilitySettings.themeOption) {
        option.classList.add('active');
      }
    });
  }
}

/**
 * Update the theme
 */
function updateTheme(themeOptions) {
  // Remove any existing theme classes
  document.body.classList.remove('theme-default', 'theme-high-contrast', 'theme-soft', 'theme-warm');
  
  // Add the selected theme class
  document.body.classList.add(`theme-${accessibilitySettings.themeOption}`);
  
  // Update active class on theme options
  if (themeOptions) {
    themeOptions.forEach(option => {
      if (option.getAttribute('data-theme') === accessibilitySettings.themeOption) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  // Save settings
  saveSettings();
}

/**
 * Setup reset button
 */
function setupResetButton() {
  resetButton = document.getElementById('reset-accessibility');
  
  if (resetButton) {
    resetButton.addEventListener('click', resetSettings);
  }
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
  accessibilitySettings = { ...defaultSettings };
  applySettings();
  saveSettings();
  
  // Update UI controls to reflect defaults
  if (fontSizeDisplay) fontSizeDisplay.textContent = `${accessibilitySettings.fontSize}px`;
  if (highContrastToggle) highContrastToggle.checked = accessibilitySettings.highContrast;
  if (reducedMotionToggle) reducedMotionToggle.checked = accessibilitySettings.reducedMotion;
  if (textSpacingSlider) textSpacingSlider.value = accessibilitySettings.textSpacing;
  
  const themeOptions = document.querySelectorAll('.theme-option');
  if (themeOptions.length > 0) {
    themeOptions.forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-theme') === accessibilitySettings.themeOption) {
        option.classList.add('active');
      }
    });
  }
}

/**
 * Apply all current settings
 */
function applySettings() {
  // Apply font size
  document.documentElement.style.fontSize = `${accessibilitySettings.fontSize}px`;
  
  // Apply high contrast if enabled
  if (accessibilitySettings.highContrast) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
  
  // Apply reduced motion if enabled
  if (accessibilitySettings.reducedMotion) {
    document.body.classList.add('reduced-motion');
  } else {
    document.body.classList.remove('reduced-motion');
  }
  
  // Apply text spacing
  document.documentElement.style.setProperty('--line-height', accessibilitySettings.textSpacing);
  
  // Apply theme
  updateTheme(document.querySelectorAll('.theme-option'));
}

/**
 * Save settings to local storage
 */
function saveSettings() {
  localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
}

/**
 * Load settings from local storage
 */
function loadSettings() {
  const storedSettings = localStorage.getItem('accessibilitySettings');
  return storedSettings ? JSON.parse(storedSettings) : { ...defaultSettings };
}

/**
 * Create accessibility toggle and panel if they don't exist
 */
function createAccessibilityControls() {
  if (!document.getElementById('accessibility-toggle')) {
    // Create toggle button
    const toggle = document.createElement('button');
    toggle.id = 'accessibility-toggle';
    toggle.className = 'accessibility-toggle';
    toggle.setAttribute('aria-label', 'Open accessibility settings');
    toggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
        <path d="M12 18.5v-2"></path>
        <path d="M12 7.5v-2"></path>
        <path d="M16.5 12h2"></path>
        <path d="M5.5 12h2"></path>
      </svg>
    `;
    document.body.appendChild(toggle);
    
    // Create panel
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.className = 'accessibility-panel';
    panel.innerHTML = `
      <h2 style="color: var(--fill-color); margin-top: 0;">Accessibility Settings</h2>
      
      <div class="accessibility-section">
        <h3>Text Size</h3>
        <div class="font-size-controls">
          <button id="decrease-font" class="font-size-btn">A-</button>
          <span id="font-size-display" class="font-size-display">16px</span>
          <button id="increase-font" class="font-size-btn">A+</button>
        </div>
      </div>
      
      <div class="accessibility-section">
        <h3>Display Options</h3>
        <div class="control-group">
          <label for="high-contrast-toggle">High Contrast Mode</label>
          <label class="toggle-switch">
            <input type="checkbox" id="high-contrast-toggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="control-group">
          <label for="reduced-motion-toggle">Reduced Motion</label>
          <label class="toggle-switch">
            <input type="checkbox" id="reduced-motion-toggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="accessibility-section">
        <h3>Text Spacing</h3>
        <div class="spacing-slider">
          <input type="range" id="text-spacing-slider" min="1" max="2" step="0.1" value="1.5">
        </div>
      </div>
      
      <button id="reset-accessibility" class="reset-btn">Reset to Defaults</button>
    `;
    document.body.appendChild(panel);
    
    // Initialize the controls
    initializeAccessibilityControls();
  }
}

// Add function to initialize the floating accessibility panel
window.initAccessibilityPanel = createAccessibilityControls;