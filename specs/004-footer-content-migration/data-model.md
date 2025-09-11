# Data Model: Footer Content Migration

**Phase 1 Design Output**  
**Date**: 2025-09-11  
**Purpose**: Define data structures and relationships for footer migration

## Entity Definitions

### Footer Configuration
**Purpose**: Centralized footer content and display settings  
**Table**: `footer_config`

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| footer_text | TEXT | NOT NULL | Main footer content with separator markers |
| scroll_speed | INTEGER | DEFAULT 30, CHECK (scroll_speed BETWEEN 10 AND 100) | Animation speed in seconds |
| text_color | VARCHAR(7) | DEFAULT '#101010' | Hex color code for text |
| background_color | VARCHAR(7) | DEFAULT '#c19d6c' | Hex color code for background |
| font_size | VARCHAR(10) | DEFAULT '3vh' | CSS font size value |
| scroll_direction | VARCHAR(20) | DEFAULT 'continuous', CHECK (scroll_direction IN ('continuous', 'discrete', 'static')) | Animation type |
| divider_image | VARCHAR(255) | DEFAULT 'assets/images/pinas_kroon.svg' | Path to separator image |
| is_active | BOOLEAN | DEFAULT true | Enable/disable footer display |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification time |

### Settings Configuration (Modified)
**Purpose**: General system settings without footer data  
**Table**: `settings`

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| organization_name | VARCHAR(255) | DEFAULT 'Team Pinas' | Organization display name |
| display_columns | INTEGER | DEFAULT 2, CHECK (display_columns IN (1, 2)) | Menu column layout |
| rotation_interval | INTEGER | DEFAULT 6000 | Content rotation timing |
| ~~footer_text~~ | ~~TEXT~~ | **REMOVED** | Migrated to footer_config |
| ~~footer_speed~~ | ~~INTEGER~~ | **REMOVED** | Migrated to footer_config |
| ~~footer_continuous~~ | ~~BOOLEAN~~ | **REMOVED** | Migrated to footer_config |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification time |

### Migration Status
**Purpose**: Track migration progress and status  
**Table**: `migration_status`

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| migration_name | VARCHAR(100) | UNIQUE, NOT NULL | Migration identifier |
| status | VARCHAR(20) | DEFAULT 'pending', CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')) | Current status |
| started_at | TIMESTAMP | NULL | Migration start time |
| completed_at | TIMESTAMP | NULL | Migration completion time |
| error_message | TEXT | NULL | Error details if failed |
| data_summary | JSONB | NULL | Migration statistics and details |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

## Data Relationships

### Primary Relationships
- **Footer Configuration**: Standalone entity (no foreign keys)
- **Settings Configuration**: Standalone entity (footer fields removed)
- **Migration Status**: Tracks migration operations (references migration name)

### Data Flow During Migration
```
1. settings.footer_* → footer_config.*
   - footer_text → footer_text
   - footer_speed → scroll_speed  
   - footer_continuous → scroll_direction mapping

2. migration_status tracks:
   - Data validation results
   - Record counts (before/after)
   - Conflict resolution details
   - Timing information
```

## State Transitions

### Migration Status State Machine
```
pending → in_progress → completed
   ↓           ↓
   ↓       failed → rolled_back
   ↓           ↑
   └───────────┘
```

**State Descriptions**:
- **pending**: Migration scheduled but not started
- **in_progress**: Migration actively running
- **completed**: Migration finished successfully
- **failed**: Migration encountered error
- **rolled_back**: Migration reversed due to failure

### Footer Data State During Migration
```
Phase 1: settings (authoritative) + footer_config (empty)
Phase 2: settings (source) + footer_config (target) - dual write
Phase 3: settings (legacy) + footer_config (authoritative) 
Phase 4: footer_config (authoritative) - settings footer data removed
```

## Validation Rules

### Footer Configuration Validation
1. **footer_text**: Required, max 2000 characters
2. **scroll_speed**: Range 10-100 seconds
3. **text_color**: Valid hex color format (#RRGGBB)
4. **background_color**: Valid hex color format (#RRGGBB)
5. **font_size**: Valid CSS size unit (vh, px, em, rem)
6. **scroll_direction**: Must be one of allowed values
7. **divider_image**: Valid file path or URL

### Migration Validation
1. **Data Integrity**: All footer fields successfully migrated
2. **Reference Integrity**: No orphaned references after migration
3. **Functional Validation**: Footer endpoint returns expected data
4. **Performance Validation**: Response times within acceptable limits

### Conflict Resolution Rules
1. **Same Data**: No action needed, mark as resolved
2. **Different Data**: Footer endpoint data takes precedence
3. **Missing Footer Data**: Copy from settings to footer
4. **Missing Settings Data**: Use footer data as authoritative

## Database Schema Changes

### New Table Creation
```sql
-- Footer configuration table
CREATE TABLE footer_config (
    id SERIAL PRIMARY KEY,
    footer_text TEXT NOT NULL,
    scroll_speed INTEGER DEFAULT 30 CHECK (scroll_speed BETWEEN 10 AND 100),
    text_color VARCHAR(7) DEFAULT '#101010',
    background_color VARCHAR(7) DEFAULT '#c19d6c',
    font_size VARCHAR(10) DEFAULT '3vh',
    scroll_direction VARCHAR(20) DEFAULT 'continuous' 
        CHECK (scroll_direction IN ('continuous', 'discrete', 'static')),
    divider_image VARCHAR(255) DEFAULT 'assets/images/pinas_kroon.svg',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration tracking table
CREATE TABLE migration_status (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    data_summary JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Existing Table Modifications
```sql
-- Remove footer columns from settings table (after migration)
ALTER TABLE settings DROP COLUMN footer_text;
ALTER TABLE settings DROP COLUMN footer_speed;
ALTER TABLE settings DROP COLUMN footer_continuous;
```

## Data Migration Mapping

### Field Mapping
| Settings Field | Footer Config Field | Transformation |
|---------------|-------------------|----------------|
| footer_text | footer_text | Direct copy |
| footer_speed | scroll_speed | Direct copy |
| footer_continuous | scroll_direction | Boolean to enum: true→'continuous', false→'discrete' |
| (default) | text_color | Use default '#101010' |
| (default) | background_color | Use default '#c19d6c' |
| (default) | font_size | Use default '3vh' |
| (default) | divider_image | Use default asset path |
| (default) | is_active | Use default true |

### Data Validation Queries
```sql
-- Verify migration completeness
SELECT 
    (SELECT COUNT(*) FROM settings WHERE footer_text IS NOT NULL) as settings_count,
    (SELECT COUNT(*) FROM footer_config) as footer_count;

-- Check for data conflicts
SELECT s.footer_text as settings_text, f.footer_text as footer_text
FROM settings s, footer_config f 
WHERE s.footer_text != f.footer_text;
```

---

**Data Model Status**: ✅ Complete  
**Schema Validated**: ✅ Yes  
**Ready for Contract Definition**: ✅ Yes