// Temporary script to run footer_config migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use environment variables (should be loaded by shell)

// Initialize Neon connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running footer_config table migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '003-footer-config-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the table was created
    const verifyQuery = `
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'footer_config'
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(verifyQuery);
    console.log('📋 Footer config table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}${row.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Check if any records exist
    const countQuery = 'SELECT COUNT(*) as count FROM footer_config';
    const countResult = await client.query(countQuery);
    console.log(`📊 Records in footer_config: ${countResult.rows[0].count}`);
    
    // Show active configuration
    const activeQuery = 'SELECT * FROM footer_config WHERE is_active = true';
    const activeResult = await client.query(activeQuery);
    if (activeResult.rows.length > 0) {
      console.log('🎯 Active footer configuration:');
      console.log(`  Text: ${activeResult.rows[0].footer_text.substring(0, 50)}...`);
      console.log(`  Color: ${activeResult.rows[0].text_color}`);
      console.log(`  Speed: ${activeResult.rows[0].scroll_speed}px/s`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });