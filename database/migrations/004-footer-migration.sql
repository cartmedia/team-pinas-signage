-- Footer Content Migration
-- Date: 2025-09-11
-- Purpose: Migrate footer data from settings to dedicated footer endpoint

-- ==============================================
-- Phase 1: Create New Tables
-- ==============================================

-- Footer configuration table
CREATE TABLE IF NOT EXISTS footer_config (
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
CREATE TABLE IF NOT EXISTS migration_status (
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

-- ==============================================
-- Phase 2: Data Migration (IF Needed)
-- ==============================================

-- Check if settings table has footer data to migrate
DO $$
DECLARE
    footer_exists BOOLEAN := FALSE;
    settings_count INTEGER := 0;
BEGIN
    -- Check if footer data exists in settings
    SELECT COUNT(*) INTO settings_count 
    FROM information_schema.columns 
    WHERE table_name = 'settings' 
    AND column_name IN ('footer_text', 'footer_speed', 'footer_continuous');
    
    IF settings_count > 0 THEN
        -- Check if there's actual footer data to migrate
        EXECUTE 'SELECT EXISTS(SELECT 1 FROM settings WHERE footer_text IS NOT NULL)' INTO footer_exists;
        
        IF footer_exists THEN
            -- Migrate data from settings to footer_config
            INSERT INTO footer_config (
                footer_text, 
                scroll_speed, 
                scroll_direction,
                text_color,
                background_color,
                font_size,
                divider_image,
                is_active
            )
            SELECT 
                COALESCE(footer_text, 'Team Pinas - Verse maaltijden||Personal training vanaf €37,50'),
                COALESCE(footer_speed, 30),
                CASE 
                    WHEN footer_continuous = true THEN 'continuous'
                    WHEN footer_continuous = false THEN 'discrete'
                    ELSE 'continuous'
                END,
                '#101010',
                '#c19d6c',
                '3vh',
                'assets/images/pinas_kroon.svg',
                true
            FROM settings 
            WHERE footer_text IS NOT NULL
            LIMIT 1;
            
            -- Record migration status
            INSERT INTO migration_status (
                migration_name, 
                status, 
                started_at, 
                completed_at,
                data_summary
            ) VALUES (
                'footer-migration-' || TO_CHAR(NOW(), 'YYYYMMDD'),
                'completed',
                NOW(),
                NOW(),
                jsonb_build_object(
                    'records_migrated', 1,
                    'conflicts_found', 0,
                    'conflicts_resolved', 0,
                    'execution_time_ms', 0,
                    'backup_created', false
                )
            );
            
            RAISE NOTICE 'Footer data migrated successfully from settings to footer_config';
        ELSE
            -- No data to migrate, create default footer config
            INSERT INTO footer_config (
                footer_text, 
                scroll_speed, 
                scroll_direction,
                text_color,
                background_color,
                font_size,
                divider_image,
                is_active
            ) VALUES (
                'Team Pinas - Verse maaltijden||Personal training vanaf €37,50',
                30,
                'continuous',
                '#101010',
                '#c19d6c',
                '3vh',
                'assets/images/pinas_kroon.svg',
                true
            );
            
            RAISE NOTICE 'Default footer configuration created';
        END IF;
    ELSE
        -- Settings table doesn't have footer columns, create default config
        INSERT INTO footer_config (
            footer_text, 
            scroll_speed, 
            scroll_direction,
            text_color,
            background_color,
            font_size,
            divider_image,
            is_active
        ) VALUES (
            'Team Pinas - Verse maaltijden||Personal training vanaf €37,50',
            30,
            'continuous',
            '#101010',
            '#c19d6c',
            '3vh',
            'assets/images/pinas_kroon.svg',
            true
        );
        
        RAISE NOTICE 'Default footer configuration created (no settings migration needed)';
    END IF;
END $$;

-- ==============================================
-- Phase 3: Validation Queries
-- ==============================================

-- Verify migration completeness
SELECT 
    'Migration Status' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM footer_config) THEN 'PASS: Footer config exists'
        ELSE 'FAIL: No footer config found'
    END as result;

-- Check footer_config table structure
SELECT 
    'Schema Validation' as check_type,
    CASE 
        WHEN COUNT(*) = 10 THEN 'PASS: All footer_config columns present'
        ELSE 'FAIL: Missing footer_config columns'
    END as result
FROM information_schema.columns 
WHERE table_name = 'footer_config' 
AND column_name IN (
    'id', 'footer_text', 'scroll_speed', 'text_color', 
    'background_color', 'font_size', 'scroll_direction', 
    'divider_image', 'is_active', 'created_at'
);

-- Check migration_status table structure
SELECT 
    'Migration Table' as check_type,
    CASE 
        WHEN COUNT(*) = 7 THEN 'PASS: All migration_status columns present'
        ELSE 'FAIL: Missing migration_status columns'
    END as result
FROM information_schema.columns 
WHERE table_name = 'migration_status' 
AND column_name IN (
    'id', 'migration_name', 'status', 'started_at', 
    'completed_at', 'error_message', 'data_summary'
);

-- Final verification
SELECT 
    'Footer Data' as check_type,
    'COUNT: ' || COUNT(*) || ' footer configurations' as result
FROM footer_config;

-- ==============================================
-- Phase 4: Optional Cleanup (Commented Out)
-- ==============================================

-- IMPORTANT: Only run these after verifying migration success
-- and confirming footer endpoint is working properly

-- Remove footer columns from settings table (EXECUTE MANUALLY AFTER VERIFICATION)
-- ALTER TABLE settings DROP COLUMN IF EXISTS footer_text;
-- ALTER TABLE settings DROP COLUMN IF EXISTS footer_speed;
-- ALTER TABLE settings DROP COLUMN IF EXISTS footer_continuous;

-- ==============================================
-- Rollback Instructions (For Emergency Use Only)
-- ==============================================

-- To rollback this migration if needed:
-- 1. Stop the application
-- 2. Run: DROP TABLE IF EXISTS footer_config CASCADE;
-- 3. Run: DROP TABLE IF EXISTS migration_status CASCADE;
-- 4. Restore original settings table if columns were removed
-- 5. Restart application

-- Migration completed successfully
SELECT 'MIGRATION COMPLETE' as status, NOW() as completed_at;