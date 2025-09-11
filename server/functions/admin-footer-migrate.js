// Netlify Function for Team Pinas Signage - Footer Config Migration
// Creates footer_config table and migrates existing footer settings

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Initialize Neon connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// API key for admin access
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check authentication
  const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid API key' })
    };
  }

  try {
    const client = await pool.connect();
    
    try {
      console.log('🚀 Running footer_config table migration...');
      
      // Check if footer_config table already exists
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'footer_config'
        );
      `;
      
      const tableExists = await client.query(tableExistsQuery);
      
      if (tableExists.rows[0].exists) {
        console.log('⚠️ Footer config table already exists, checking for data...');
        
        // Check if there's any active configuration
        const activeQuery = 'SELECT COUNT(*) as count FROM footer_config WHERE is_active = true';
        const activeCount = await client.query(activeQuery);
        
        if (activeCount.rows[0].count === '0') {
          console.log('No active configuration found, inserting default...');
          
          // Insert default footer configuration
          const defaultConfigQuery = `
            INSERT INTO footer_config (
              footer_text,
              text_color,
              scroll_speed,
              is_active
            ) VALUES (
              'Team Pinas - Verse maaltijden voor iedereen <separator> Investeer in jezelf - personal training vanaf €37,50 per les',
              '#101010',
              30,
              true
            )
          `;
          
          await client.query(defaultConfigQuery);
          console.log('✅ Default footer configuration inserted');
        }
        
        // Get current table structure
        const schemaQuery = `
          SELECT table_name, column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'footer_config'
          ORDER BY ordinal_position;
        `;
        
        const schemaResult = await client.query(schemaQuery);
        
        // Get active configuration
        const activeConfigQuery = 'SELECT * FROM footer_config WHERE is_active = true';
        const activeConfigResult = await client.query(activeConfigQuery);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Footer config table ready with active configuration',
            tableExists: true,
            schema: schemaResult.rows,
            activeConfig: activeConfigResult.rows[0] || null,
            recordCount: activeConfigResult.rows.length
          })
        };
      }
      
      // Create table with basic structure first
      console.log('Creating footer_config table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS footer_config (
            id SERIAL PRIMARY KEY,
            footer_text TEXT NOT NULL,
            text_color VARCHAR(7) DEFAULT '#101010',
            background_color VARCHAR(7),
            scroll_speed INTEGER DEFAULT 30,
            scroll_direction VARCHAR(10) DEFAULT 'left',
            divider_image VARCHAR(255) DEFAULT 'assets/images/pinas_kroon.svg',
            font_size VARCHAR(10) DEFAULT '3vh',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Creating unique index for active config...');
      try {
        await client.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_footer_config_active 
          ON footer_config (is_active) WHERE is_active = true
        `);
      } catch (indexError) {
        console.log('Index already exists, continuing...');
      }
      
      console.log('Creating update index...');
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_footer_config_updated 
          ON footer_config (updated_at DESC)
        `);
      } catch (indexError) {
        console.log('Index already exists, continuing...');
      }
      
      console.log('Creating update trigger...');
      try {
        await client.query(`
          CREATE OR REPLACE FUNCTION update_footer_config_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
          END;
          $$ language 'plpgsql'
        `);
        
        await client.query(`
          DROP TRIGGER IF EXISTS trigger_footer_config_updated_at ON footer_config
        `);
        
        await client.query(`
          CREATE TRIGGER trigger_footer_config_updated_at
              BEFORE UPDATE ON footer_config
              FOR EACH ROW
              EXECUTE FUNCTION update_footer_config_updated_at()
        `);
      } catch (triggerError) {
        console.log('Trigger creation skipped, continuing...');
      }
      
      console.log('✅ Footer config table created successfully');
      
      // Migrate existing footer settings from settings table if they exist
      let migrationResult = { existingDataMigrated: false, defaultDataInserted: false };
      
      try {
        // Check if settings table exists and has footer data
        const settingsExistsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'settings'
          );
        `;
        
        const settingsExists = await client.query(settingsExistsQuery);
        
        if (settingsExists.rows[0].exists) {
          // Get existing footer settings
          const existingSettingsQuery = `
            SELECT 
              COALESCE(footer_text, 'Team Pinas - Verse maaltijden voor iedereen') as footer_text,
              COALESCE(footer_speed::integer, 30) as footer_speed,
              COALESCE(footer_text_color, '#101010') as footer_text_color
            FROM settings 
            WHERE id = 1
            LIMIT 1;
          `;
          
          const existingSettings = await client.query(existingSettingsQuery);
          
          if (existingSettings.rows.length > 0) {
            const settings = existingSettings.rows[0];
            
            // Insert migrated data
            const migrateDataQuery = `
              INSERT INTO footer_config (
                footer_text, 
                text_color, 
                scroll_speed, 
                is_active
              ) VALUES ($1, $2, $3, true)
            `;
            
            await client.query(migrateDataQuery, [
              settings.footer_text,
              settings.footer_text_color,
              settings.footer_speed
            ]);
            
            migrationResult.existingDataMigrated = true;
            console.log('📦 Migrated existing footer settings');
          }
        }
      } catch (migrationError) {
        console.log('⚠️ Could not migrate existing settings (this is normal for new installations)');
      }
      
      // Insert default footer configuration if no active config exists
      const checkActiveQuery = 'SELECT COUNT(*) as count FROM footer_config WHERE is_active = true';
      const activeCount = await client.query(checkActiveQuery);
      
      if (activeCount.rows[0].count === '0') {
        const defaultConfigQuery = `
          INSERT INTO footer_config (
            footer_text,
            text_color,
            scroll_speed,
            is_active
          ) VALUES (
            'Team Pinas - Verse maaltijden voor iedereen <separator> Investeer in jezelf - personal training vanaf €37,50 per les',
            '#101010',
            30,
            true
          )
        `;
        
        await client.query(defaultConfigQuery);
        migrationResult.defaultDataInserted = true;
        console.log('📝 Inserted default footer configuration');
      }
      
      // Verify migration
      const verifyQuery = `
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'footer_config'
        ORDER BY ordinal_position;
      `;
      
      const verifyResult = await client.query(verifyQuery);
      
      // Check final record count
      const finalCountQuery = 'SELECT COUNT(*) as count FROM footer_config';
      const finalCount = await client.query(finalCountQuery);
      
      // Get active configuration
      const activeConfigQuery = 'SELECT * FROM footer_config WHERE is_active = true';
      const activeConfig = await client.query(activeConfigQuery);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Footer config migration completed successfully',
          migration: migrationResult,
          schema: verifyResult.rows,
          recordCount: parseInt(finalCount.rows[0].count),
          activeConfig: activeConfig.rows[0] || null
        })
      };

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Footer migration failed', 
        details: error.message 
      })
    };
  }
};