# Data Model: Footer Continuous Scrolling System

**Date**: 2025-01-14  
**Feature**: Footer Continuous Scrolling System  

## Entity Overview

### ScrollingFooter (Component Class)
Primary entity responsible for managing continuous scrolling animation.

**Fields:**
- `container: HTMLElement` - DOM element containing footer content
- `content: string` - Raw footer text from database
- `segments: string[]` - Text segments split by separators
- `animationDuration: number` - CSS animation duration in seconds
- `isAnimating: boolean` - Current animation state
- `performanceObserver: PerformanceObserver` - Frame rate monitoring

**State Transitions:**
```
INITIALIZING → MEASURING → READY → ANIMATING
     ↓             ↓          ↓         ↓
   ERROR ←------←------←------←----- ERROR
```

**Validation Rules:**
- Content must not be empty string
- Animation duration must be positive number (1-60 seconds)
- Container must exist in DOM before initialization
- At least one text segment required after separator parsing

### FooterDisplayConfig (Configuration)
Extends existing footer_config database table - no schema changes required.

**Utilized Fields:**
- `footer_text: string` - Text content with `<separator>` tags
- `text_color: string` - CSS color for text (hex format)
- `font_size: string` - CSS font-size value (e.g., '3vh')
- `scroll_speed: integer` - Base speed multiplier (10-100)
- `scroll_direction: enum` - Direction override ('continuous'|'discrete'|'static')

**Business Rules:**
- When `scroll_direction = 'continuous'`: Enable scrolling animation
- When `scroll_direction = 'static'`: Fallback to current static display
- `scroll_speed` maps to CSS animation duration: `duration = 30 / scroll_speed` seconds

### AnimationState (Runtime State)
Ephemeral state object tracking current animation status.

**Properties:**
- `totalWidth: number` - Calculated pixel width of all content + separators
- `screenWidth: number` - Display viewport width in pixels
- `repetitions: number` - Number of content duplications needed
- `separatorSvg: string` - Inline SVG for kroon separator icons
- `keyframeName: string` - Generated CSS keyframe identifier
- `animationId: string|null` - CSS animation identifier for control

**Lifecycle:**
1. Created during `measure()` phase
2. Updated during `calculateRepetitions()` 
3. Applied during `startAnimation()`
4. Destroyed during `stopAnimation()` or component cleanup

## Relationships

```
FooterDisplayConfig (1) ←--→ (1) ScrollingFooter
                             ↓
                        AnimationState (1)
                             ↓
                    CSS Animation Rules (1..n)
```

**Data Flow:**
1. FooterDisplayConfig loaded from API (`/footer` endpoint)
2. ScrollingFooter instantiated with config data
3. AnimationState calculated based on screen dimensions
4. CSS keyframes generated and applied to DOM

## Integration Points

### Existing Database Schema
Reuses `footer_config` table without modifications:
- `footer_text` parsing for separator tags
- `scroll_speed` interpretation for animation timing  
- `text_color` and `font_size` for visual styling

### DOM Structure
```html
<div id="footer-text" class="scrolling-footer">
  <div class="scroll-content">
    <span class="text-segment">Segment 1</span>
    <span class="separator">🏰</span>
    <span class="text-segment">Segment 2</span>
    <!-- Repeated n times to fill screen -->
  </div>
</div>
```

### CSS Animation Schema
```css
@keyframes scroll-footer-{id} {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-{totalWidth}px, 0, 0); }
}
```

## Performance Considerations

**Memory Footprint:**
- Base component: ~2KB JavaScript object
- DOM nodes: 50-200 span elements (depending on repetitions)
- CSS rules: 1 keyframe rule, 3-5 CSS custom properties

**CPU Impact:**
- Initialization: ~50ms (one-time measurement)
- Animation: GPU-accelerated, <1% CPU usage
- Fallback detection: ~10ms feature testing

**Constraints:**
- Maximum text length: 2000 characters (database limit)
- Maximum repetitions: 20x (prevents excessive DOM nodes)
- Animation duration range: 0.5-60 seconds

---
*Data model complete - ready for contract design*