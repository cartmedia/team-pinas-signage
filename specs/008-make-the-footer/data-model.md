# Data Model: Professional Configurable News Ticker Footer

**Feature**: Professional Configurable News Ticker Footer  
**Model Date**: 2025-09-13  
**Status**: Draft

## Core Entities

### FooterConfiguration
**Purpose**: Central configuration entity that controls all aspects of the news ticker footer  
**Lifecycle**: Single active configuration with versioning support

**Attributes**:
- `id` (Integer, Primary Key): Unique identifier
- `footer_text` (Text): Raw content with separator tokens (e.g., "NEWS <separator> UPDATES <separator> INFO")
- `text_color` (String): Hex color code for text (e.g., "#1a1a1a")
- `background_color` (String): Hex color code for background (e.g., "#c19d6c")  
- `font_size` (String): CSS font size value (e.g., "3vh", "24px")
- `scroll_speed` (Integer): Animation speed in pixels per second (1-100)
- `scroll_direction` (Enum): Animation behavior ("continuous", "discrete", "static")
- `separator_type` (Enum): Separator style ("custom", "crown", "star", "dot", "dash", "space")
- `custom_separator` (String): Custom separator text when separator_type="custom"
- `is_visible` (Boolean): Master visibility toggle
- `is_active` (Boolean): System flag for active configuration (only one active)
- `created_at` (Timestamp): Record creation time
- `updated_at` (Timestamp): Last modification time

**Validation Rules**:
- Only one configuration can have `is_active = true`
- `footer_text` maximum length: 2000 characters per segment
- `text_color` and `background_color` must be valid hex colors
- `scroll_speed` range: 1-100 (pixels per second)
- `font_size` must be valid CSS value
- `scroll_direction` enum: ["continuous", "discrete", "static"]
- `separator_type` enum: ["custom", "crown", "star", "dot", "dash", "space"]

**State Transitions**:
- Draft → Active (when `is_active` set to true, previous active becomes inactive)
- Active → Inactive (when replaced by new active configuration)
- Any → Deleted (soft delete by setting `is_active = false`)

### ContentSegment (Virtual Entity)
**Purpose**: Represents individual text segments extracted from footer_text  
**Lifecycle**: Dynamically parsed from footer_text on rendering

**Attributes**:
- `text` (String): Individual text segment content
- `order` (Integer): Position in sequence (0-based)
- `separator_after` (String): Resolved separator content for this segment

**Parsing Logic**:
- Split `footer_text` on `<separator>` tokens
- Create ContentSegment for each non-empty text segment
- Apply separator resolution based on `separator_type` and `custom_separator`

### VisualSettings (Embedded Entity)
**Purpose**: Encapsulates all visual styling properties  
**Lifecycle**: Embedded within FooterConfiguration

**Attributes**:
- `text_color` (String): Text color hex value
- `background_color` (String): Background color hex value  
- `font_size` (String): CSS font size specification
- `opacity` (Float): Overall opacity (0.0-1.0, default: 1.0)
- `text_shadow` (String): CSS text-shadow value (optional)
- `border_radius` (String): CSS border-radius value (optional)

### ScrollingBehavior (Embedded Entity)
**Purpose**: Encapsulates animation and movement properties  
**Lifecycle**: Embedded within FooterConfiguration

**Attributes**:
- `scroll_direction` (Enum): Animation type
- `scroll_speed` (Integer): Speed in pixels per second
- `animation_timing` (Enum): CSS timing function ("linear", "ease", "ease-in-out")
- `pause_on_hover` (Boolean): Whether to pause animation on mouse hover
- `reverse_on_complete` (Boolean): Whether to reverse direction after completion

### SeparatorConfiguration (Embedded Entity)  
**Purpose**: Encapsulates separator selection and rendering logic
**Lifecycle**: Embedded within FooterConfiguration

**Attributes**:
- `separator_type` (Enum): Type of separator to use
- `custom_separator` (String): Custom text when type="custom"  
- `separator_spacing` (String): CSS margin around separators (e.g., "0 0.5em")
- `separator_color` (String): Override color for separators (optional)

## Data Relationships

### Primary Relationships
```
FooterConfiguration (1) ←contains→ (1) VisualSettings
FooterConfiguration (1) ←contains→ (1) ScrollingBehavior  
FooterConfiguration (1) ←contains→ (1) SeparatorConfiguration
FooterConfiguration (1) ←generates→ (N) ContentSegment [virtual]
```

### System Relationships
```
FooterConfiguration ←used_by→ SignageDisplay [external]
FooterConfiguration ←managed_by→ AdminInterface [external] 
FooterConfiguration ←cached_by→ APIEndpoint [external]
```

## Database Schema Evolution

### Current Schema (footer_config table)
```sql
CREATE TABLE footer_config (
  id SERIAL PRIMARY KEY,
  footer_text TEXT,
  text_color VARCHAR(7),
  background_color VARCHAR(7), 
  scroll_speed INTEGER,
  scroll_direction VARCHAR(20),
  divider_image VARCHAR(255),
  font_size VARCHAR(20),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Required Schema Additions
```sql
-- Add new columns for enhanced functionality
ALTER TABLE footer_config 
ADD COLUMN is_visible BOOLEAN DEFAULT true,
ADD COLUMN separator_type VARCHAR(20) DEFAULT 'crown',
ADD COLUMN custom_separator VARCHAR(50) DEFAULT NULL,
ADD COLUMN separator_spacing VARCHAR(20) DEFAULT '0 0.5em',
ADD COLUMN separator_color VARCHAR(7) DEFAULT NULL,
ADD COLUMN animation_timing VARCHAR(20) DEFAULT 'linear',
ADD COLUMN pause_on_hover BOOLEAN DEFAULT false,
ADD COLUMN reverse_on_complete BOOLEAN DEFAULT false,
ADD COLUMN opacity DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN text_shadow VARCHAR(100) DEFAULT NULL,
ADD COLUMN border_radius VARCHAR(20) DEFAULT NULL;

-- Add constraints
ALTER TABLE footer_config 
ADD CONSTRAINT check_scroll_speed CHECK (scroll_speed >= 1 AND scroll_speed <= 100),
ADD CONSTRAINT check_opacity CHECK (opacity >= 0.0 AND opacity <= 1.0),
ADD CONSTRAINT check_separator_type CHECK (separator_type IN ('custom', 'crown', 'star', 'dot', 'dash', 'space')),
ADD CONSTRAINT check_scroll_direction CHECK (scroll_direction IN ('continuous', 'discrete', 'static')),
ADD CONSTRAINT check_animation_timing CHECK (animation_timing IN ('linear', 'ease', 'ease-in-out', 'ease-in', 'ease-out'));

-- Add unique constraint for single active configuration
CREATE UNIQUE INDEX idx_footer_config_single_active ON footer_config(is_active) WHERE is_active = true;
```

## Data Access Patterns

### Read Patterns
1. **Public Display**: Get active visible configuration with all settings
2. **Admin Preview**: Get configuration by ID with full details  
3. **Admin List**: Get all configurations with summary information

### Write Patterns  
1. **Create Configuration**: Insert new configuration (inactive by default)
2. **Update Configuration**: Modify existing configuration  
3. **Activate Configuration**: Set new configuration as active (deactivates others)
4. **Toggle Visibility**: Update is_visible flag without affecting active status

### Cache Invalidation
- Cache key: `footer_config_active`
- Invalidate on: Any write operation to footer_config table
- TTL: 5 minutes (300 seconds) for production, no-cache for development

## API Data Transfer Objects

### FooterConfigurationResponse (GET)
```json
{
  "id": 1,
  "footer_text": "WELCOME TO TEAM PINAS <separator> FRESH MEALS FOR EVERYONE",
  "text_color": "#1a1a1a", 
  "background_color": "#c19d6c",
  "font_size": "3vh",
  "scroll_speed": 8,
  "scroll_direction": "continuous",
  "separator_type": "crown",
  "custom_separator": null,
  "is_visible": true,
  "is_active": true,
  "created_at": "2025-09-13T10:30:00Z",
  "updated_at": "2025-09-13T11:15:00Z"
}
```

### FooterConfigurationRequest (PUT/POST)
```json
{
  "footer_text": "NEW CONTENT <separator> UPDATED MESSAGE",
  "text_color": "#ffffff",
  "background_color": "#333333", 
  "font_size": "2.8vh",
  "scroll_speed": 12,
  "scroll_direction": "continuous",
  "separator_type": "custom",
  "custom_separator": " | ",
  "is_visible": true
}
```

### FooterPreviewResponse (Admin)
```json
{
  "config": { /* full configuration object */ },
  "parsed_segments": [
    {"text": "NEW CONTENT", "separator_after": " | "},
    {"text": "UPDATED MESSAGE", "separator_after": ""}
  ],
  "rendered_html": "<div class='preview'>NEW CONTENT | UPDATED MESSAGE</div>",
  "estimated_duration": 15.2
}
```

## Validation and Business Rules

### Input Validation
- Footer text: 2000 character limit per segment, no HTML injection
- Colors: Valid hex format (#RRGGBB or #RGB)  
- Font size: Valid CSS units (px, vh, vw, em, rem)
- Speed: Integer between 1-100
- Enums: Must match defined enum values

### Business Rules
- **Single Active**: Only one configuration can be active at a time
- **Visibility Override**: Invisible configurations don't display regardless of active status
- **Separator Priority**: Custom > Crown SVG > Star Emoji > Space (existing logic)
- **Content Length**: Total rendered content should not exceed viewport width × 3 for smooth scrolling
- **Performance**: Configurations causing >50ms frame times should trigger fallback mode

### Data Integrity
- **Referential Integrity**: Maintained at application level (single table)
- **Transactional Updates**: Active flag changes must be atomic
- **Backup Strategy**: Configuration changes logged for rollback capability
- **Migration Safety**: Schema changes must maintain backward compatibility

---

**Model Status**: ✅ Complete  
**Database Impact**: Medium (additive schema changes)  
**Next Phase**: Contract Definition  
**Dependencies**: None - extends existing schema