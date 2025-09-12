# ScrollingFooter Component Contract

**Component**: ScrollingFooter Class  
**File**: `src/scripts/display/components/ScrollingFooter.js`  
**Integration**: MenuSignage.js footer enhancement

## Constructor Contract

```javascript
/**
 * @param {HTMLElement} container - Footer container element
 * @param {Object} config - Footer configuration from API
 * @param {string} config.footer_text - Text with <separator> tags
 * @param {string} config.text_color - CSS color value
 * @param {string} config.font_size - CSS font-size value  
 * @param {number} config.scroll_speed - Speed multiplier (10-100)
 * @param {string} config.scroll_direction - 'continuous'|'discrete'|'static'
 */
constructor(container, config)
```

**Preconditions:**
- `container` must exist in DOM
- `config.footer_text` must be non-empty string
- `config.scroll_direction === 'continuous'` for scrolling activation

**Postconditions:**
- Component initialized but not started
- Container receives `scrolling-footer` CSS class
- Internal state prepared for animation

## Public Methods

### `start(): Promise<boolean>`

Initiates continuous scrolling animation.

**Behavior:**
1. Measure content dimensions
2. Calculate required repetitions for screen fill
3. Generate and inject CSS keyframes
4. Apply animation to container
5. Start performance monitoring

**Returns:** `Promise<boolean>` - `true` if animation started successfully

**Error Handling:** Returns `false` on animation failure, falls back to static display

### `stop(): void`

Stops scrolling animation and cleans up resources.

**Behavior:**
1. Remove CSS animation from container
2. Clear generated keyframes
3. Stop performance monitoring
4. Reset to static display mode

### `updateConfig(config: Object): Promise<boolean>`

Updates component configuration and restarts animation.

**Parameters:** Same as constructor `config` parameter

**Behavior:**
1. Stop current animation if running
2. Update internal configuration
3. Restart with new settings
4. Maintain performance monitoring

### `getPerformanceMetrics(): Object`

Returns current animation performance data.

**Returns:**
```javascript
{
  fps: number,           // Current frames per second
  dropped_frames: number, // Total dropped frames since start
  gpu_accelerated: boolean, // Hardware acceleration status
  animation_duration: number // Current animation cycle time
}
```

## Events

### `animation-started`
Fired when scrolling animation begins successfully.

**Detail:** `{ duration: number, repetitions: number }`

### `animation-stopped` 
Fired when animation is stopped (manually or due to error).

**Detail:** `{ reason: string }` - 'manual'|'error'|'fallback'

### `performance-warning`
Fired when animation performance drops below threshold.

**Detail:** `{ fps: number, threshold: number }`

## CSS Contract

### Generated Keyframes
```css
@keyframes scroll-footer-{timestamp} {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-{totalWidth}px, 0, 0); }
}
```

### Required CSS Classes
```css
.scrolling-footer {
  overflow: hidden;
  white-space: nowrap;
  position: relative;
}

.scroll-content {
  display: inline-block;
  animation: scroll-footer-{id} {duration}s linear infinite;
}

.text-segment {
  display: inline;
}

.separator {
  display: inline-block;
  width: 2em;
  background: url('data:image/svg+xml;...') center/contain no-repeat;
  vertical-align: middle;
}
```

## Integration Points

### MenuSignage.js Integration
```javascript
// Replace existing static footer logic (lines ~740-750)
if (footerConfig.scroll_direction === 'continuous') {
  const scrollingFooter = new ScrollingFooter(
    document.getElementById('footer-text'), 
    footerConfig
  );
  scrollingFooter.start();
} else {
  // Fallback to existing static implementation
}
```

### Performance Requirements
- **Initialization**: <100ms from constructor to `start()` completion
- **Animation**: 60fps sustained, <16.67ms frame time
- **Memory**: <5MB total footprint including DOM nodes
- **CPU**: <2% usage during steady-state animation

### Browser Compatibility
- **Minimum**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Feature Detection**: CSS animations, transforms, GPU acceleration
- **Fallback**: Graceful degradation to static footer display

### Error Boundaries
- Animation initialization failure → static display
- Performance degradation → automatic animation disable
- DOM manipulation errors → component cleanup and fallback
- CSS feature unavailable → immediate static mode

---
*Component contract complete - ready for test generation*