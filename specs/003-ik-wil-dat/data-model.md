# Data Model: Footer Content Management

## Entities

### FooterConfig

**Purpose**: Stores all footer display configuration and content

**Fields**:
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT): Unique identifier
- `footer_text` (TEXT, NOT NULL): Main scrolling text content with embedded separators
- `text_color` (VARCHAR(7), DEFAULT '#101010'): Text color in hex format (#rrggbb)
- `background_color` (VARCHAR(7), NULLABLE): Optional background color override
- `scroll_speed` (INTEGER, DEFAULT 30): Scrolling speed in pixels per second
- `scroll_direction` (ENUM('left', 'right', 'static'), DEFAULT 'left'): Scroll direction
- `divider_image` (VARCHAR(255), DEFAULT 'assets/images/pinas_kroon.svg'): Path to separator icon
- `font_size` (VARCHAR(10), DEFAULT '3vh'): Font size in viewport height units
- `is_active` (BOOLEAN, DEFAULT true): Whether this configuration is currently active
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Last modification timestamp

**Relationships**: 
- No foreign key relationships (standalone configuration)

**Validation Rules**:
- `text_color` must match hex color pattern `^#[0-9a-fA-F]{6}$`
- `background_color` must match hex color pattern or be NULL
- `scroll_speed` must be between 1 and 200 pixels per second
- `font_size` must end with 'vh', 'px', 'em', or 'rem'
- `footer_text` must not exceed 1000 characters
- Only one record can have `is_active = true` at a time

**State Transitions**:
1. **Draft** → **Active**: When `is_active` set to true, all other records set to false
2. **Active** → **Inactive**: When new configuration becomes active
3. **Created** → **Updated**: When any field is modified, `updated_at` timestamp updates

**Indexes**:
- Primary key on `id`
- Unique index on `is_active` WHERE `is_active = true` (ensure single active config)
- Index on `updated_at` for ordering by recency

## Database Schema (PostgreSQL)

```sql
CREATE TABLE footer_config (
    id SERIAL PRIMARY KEY,
    footer_text TEXT NOT NULL,
    text_color VARCHAR(7) DEFAULT '#101010' CHECK (text_color ~ '^#[0-9a-fA-F]{6}$'),
    background_color VARCHAR(7) CHECK (background_color IS NULL OR background_color ~ '^#[0-9a-fA-F]{6}$'),
    scroll_speed INTEGER DEFAULT 30 CHECK (scroll_speed >= 1 AND scroll_speed <= 200),
    scroll_direction VARCHAR(10) DEFAULT 'left' CHECK (scroll_direction IN ('left', 'right', 'static')),
    divider_image VARCHAR(255) DEFAULT 'assets/images/pinas_kroon.svg',
    font_size VARCHAR(10) DEFAULT '3vh' CHECK (font_size ~ '^[0-9]+(\.[0-9]+)?(vh|px|em|rem)$'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one active configuration
CREATE UNIQUE INDEX idx_footer_config_active ON footer_config (is_active) WHERE is_active = true;

-- Index for ordering by recency
CREATE INDEX idx_footer_config_updated ON footer_config (updated_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_footer_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_footer_config_updated_at
    BEFORE UPDATE ON footer_config
    FOR EACH ROW
    EXECUTE FUNCTION update_footer_config_updated_at();
```

## Migration from Current Settings

**Current State**: Footer configuration stored in `settings` table as:
- `footer_text` 
- `footer_speed`
- `footer_continuous`
- `footer_text_color` or per-row color arrays

**Migration Strategy**:
1. Create new `footer_config` table
2. Insert current footer settings as initial active configuration
3. Update frontend to use new endpoint with fallback
4. Remove footer columns from settings table after migration complete

**Migration SQL**:
```sql
-- Migrate existing footer settings
INSERT INTO footer_config (
    footer_text, 
    text_color, 
    scroll_speed, 
    is_active
)
SELECT 
    COALESCE(footer_text, 'Team Pinas - Verse maaltijden voor iedereen') as footer_text,
    COALESCE(footer_text_color, '#101010') as text_color,
    COALESCE(footer_speed::integer, 30) as scroll_speed,
    true as is_active
FROM settings 
WHERE id = 1
ON CONFLICT DO NOTHING;
```