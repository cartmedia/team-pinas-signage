-- Migration: Enhanced Footer Configuration Schema
-- Feature: Professional Configurable News Ticker Footer
-- Date: 2025-09-13
-- Description: Add new columns to footer_config table for enhanced functionality

BEGIN;

-- Add new columns for enhanced footer functionality
ALTER TABLE footer_config 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS separator_type VARCHAR(20) DEFAULT 'crown',
ADD COLUMN IF NOT EXISTS custom_separator VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS separator_spacing VARCHAR(20) DEFAULT '0 0.5em',
ADD COLUMN IF NOT EXISTS separator_color VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS animation_timing VARCHAR(20) DEFAULT 'linear',
ADD COLUMN IF NOT EXISTS pause_on_hover BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reverse_on_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS opacity DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS text_shadow VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS border_radius VARCHAR(20) DEFAULT NULL;

-- Clean up existing data to match new constraints
UPDATE footer_config SET 
  scroll_direction = CASE 
    WHEN scroll_direction IN ('left', 'right') THEN 'continuous'
    WHEN scroll_direction NOT IN ('continuous', 'discrete', 'static') THEN 'continuous'
    ELSE scroll_direction
  END;

-- Add constraints for data integrity (ignore if already exist)
DO $$ BEGIN
  -- Check constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_footer_scroll_speed') THEN
    ALTER TABLE footer_config ADD CONSTRAINT check_footer_scroll_speed CHECK (scroll_speed >= 1 AND scroll_speed <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_footer_opacity') THEN
    ALTER TABLE footer_config ADD CONSTRAINT check_footer_opacity CHECK (opacity >= 0.0 AND opacity <= 1.0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_footer_separator_type') THEN
    ALTER TABLE footer_config ADD CONSTRAINT check_footer_separator_type CHECK (separator_type IN ('custom', 'crown', 'star', 'dot', 'dash', 'space'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_footer_scroll_direction') THEN
    ALTER TABLE footer_config ADD CONSTRAINT check_footer_scroll_direction CHECK (scroll_direction IN ('continuous', 'discrete', 'static'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_footer_animation_timing') THEN
    ALTER TABLE footer_config ADD CONSTRAINT check_footer_animation_timing CHECK (animation_timing IN ('linear', 'ease', 'ease-in-out', 'ease-in', 'ease-out'));
  END IF;
END $$;

-- Create unique constraint for single active configuration
-- Drop existing constraint if it exists (in case of re-running migration)
DROP INDEX IF EXISTS idx_footer_config_single_active;
CREATE UNIQUE INDEX idx_footer_config_single_active ON footer_config(is_active) WHERE is_active = true;

-- Update any existing active records to include default values for new columns
UPDATE footer_config 
SET 
  is_visible = COALESCE(is_visible, true),
  separator_type = COALESCE(separator_type, 'crown'),
  separator_spacing = COALESCE(separator_spacing, '0 0.5em'),
  animation_timing = COALESCE(animation_timing, 'linear'),
  pause_on_hover = COALESCE(pause_on_hover, false),
  reverse_on_complete = COALESCE(reverse_on_complete, false),
  opacity = COALESCE(opacity, 1.0),
  updated_at = CURRENT_TIMESTAMP
WHERE is_active = true;

-- Insert migration tracking record
INSERT INTO migration_status (migration_name, status, started_at, completed_at, data_summary) 
VALUES (
  '008-enhanced-footer-config',
  'completed',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Added enhanced footer configuration fields: visibility, separator options, animation settings, styling properties'
) ON CONFLICT (migration_name) DO UPDATE SET
  status = EXCLUDED.status,
  completed_at = EXCLUDED.completed_at,
  data_summary = EXCLUDED.data_summary;

COMMIT;

-- Rollback script (for emergency use)
/*
BEGIN;

-- Remove added constraints
ALTER TABLE footer_config 
DROP CONSTRAINT IF EXISTS check_scroll_speed,
DROP CONSTRAINT IF EXISTS check_opacity,
DROP CONSTRAINT IF EXISTS check_separator_type,
DROP CONSTRAINT IF EXISTS check_scroll_direction,
DROP CONSTRAINT IF EXISTS check_animation_timing;

-- Drop unique index
DROP INDEX IF EXISTS idx_footer_config_single_active;

-- Remove added columns
ALTER TABLE footer_config 
DROP COLUMN IF EXISTS is_visible,
DROP COLUMN IF EXISTS separator_type,
DROP COLUMN IF EXISTS custom_separator,
DROP COLUMN IF EXISTS separator_spacing,
DROP COLUMN IF EXISTS separator_color,
DROP COLUMN IF EXISTS animation_timing,
DROP COLUMN IF EXISTS pause_on_hover,
DROP COLUMN IF EXISTS reverse_on_complete,
DROP COLUMN IF EXISTS opacity,
DROP COLUMN IF EXISTS text_shadow,
DROP COLUMN IF EXISTS border_radius;

-- Update migration status
UPDATE migration_status 
SET status = 'rolled_back', completed_at = CURRENT_TIMESTAMP
WHERE migration_name = '008-enhanced-footer-config';

COMMIT;
*/