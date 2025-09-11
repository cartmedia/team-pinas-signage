-- Migration: Create footer_config table for dedicated footer content management
-- Feature: 003-ik-wil-dat
-- Date: 2025-09-11

-- Create footer_config table
CREATE TABLE IF NOT EXISTS footer_config (
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_footer_config_active ON footer_config (is_active) WHERE is_active = true;

-- Index for ordering by recency
CREATE INDEX IF NOT EXISTS idx_footer_config_updated ON footer_config (updated_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_footer_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS trigger_footer_config_updated_at
    BEFORE UPDATE ON footer_config
    FOR EACH ROW
    EXECUTE FUNCTION update_footer_config_updated_at();

-- Migrate existing footer settings from settings table if they exist
DO $$
DECLARE
    existing_footer_text TEXT;
    existing_footer_speed INTEGER;
    existing_footer_color VARCHAR(7);
BEGIN
    -- Check if settings table exists and has footer data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        -- Get existing footer settings
        SELECT 
            COALESCE(footer_text, 'Team Pinas - Verse maaltijden voor iedereen'),
            COALESCE(footer_speed::integer, 30),
            COALESCE(footer_text_color, '#101010')
        INTO existing_footer_text, existing_footer_speed, existing_footer_color
        FROM settings 
        WHERE id = 1
        LIMIT 1;
        
        -- Insert only if we have valid data and no footer config exists yet
        IF existing_footer_text IS NOT NULL AND NOT EXISTS (SELECT 1 FROM footer_config WHERE is_active = true) THEN
            INSERT INTO footer_config (
                footer_text, 
                text_color, 
                scroll_speed, 
                is_active
            ) VALUES (
                existing_footer_text,
                existing_footer_color,
                existing_footer_speed,
                true
            );
            
            RAISE NOTICE 'Migrated existing footer settings to footer_config table';
        END IF;
    END IF;
END $$;

-- Insert default footer configuration if no active config exists
INSERT INTO footer_config (
    footer_text,
    text_color,
    scroll_speed,
    is_active
)
SELECT 
    'Team Pinas - Verse maaltijden voor iedereen <separator> Investeer in jezelf - personal training vanaf €37,50 per les',
    '#101010',
    30,
    true
WHERE NOT EXISTS (SELECT 1 FROM footer_config WHERE is_active = true);

-- Verify migration
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM footer_config WHERE is_active = true) = 1 THEN
        RAISE NOTICE 'Footer config migration successful - 1 active configuration exists';
    ELSE
        RAISE EXCEPTION 'Footer config migration failed - expected exactly 1 active configuration';
    END IF;
END $$;