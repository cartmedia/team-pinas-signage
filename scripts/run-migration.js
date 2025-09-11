#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting footer content migration...');
  
  // Check for database URL
  if (!process.env.NEON_DATABASE_URL) {
    console.error('❌ Error: NEON_DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '004-footer-migration.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: Migration file not found at ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Migration file loaded successfully');

  // Create database connection
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  let client;

  try {
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Database connection established');

    // Execute the migration
    console.log('⚡ Executing migration...');
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully!');
    console.log('📊 Migration results:');
    
    // The migration script includes validation queries that return results
    if (Array.isArray(result)) {
      result.forEach((res, index) => {
        if (res.rows && res.rows.length > 0) {
          console.log(`Result ${index + 1}:`, res.rows);
        }
      });
    } else if (result.rows && result.rows.length > 0) {
      console.log('Results:', result.rows);
    }

    // Verify the tables were created
    console.log('🔍 Verifying table creation...');
    
    const tableCheck = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('footer_config', 'migration_status')
      ORDER BY table_name;
    `);

    if (tableCheck.rows.length === 2) {
      console.log('✅ Tables created successfully:');
      tableCheck.rows.forEach(row => {
        console.log(`  - ${row.table_name} (${row.table_type})`);
      });
    } else {
      console.warn('⚠️  Warning: Expected 2 tables, found:', tableCheck.rows.length);
      console.log('Found tables:', tableCheck.rows);
    }

    // Check if footer config data was created
    const footerCheck = await client.query('SELECT COUNT(*) as count FROM footer_config');
    console.log(`✅ Footer config records: ${footerCheck.rows[0].count}`);

    // Check migration status
    const migrationCheck = await client.query('SELECT COUNT(*) as count FROM migration_status');
    if (migrationCheck.rows[0].count > 0) {
      console.log(`✅ Migration status records: ${migrationCheck.rows[0].count}`);
    } else {
      console.log('ℹ️  No migration status records (expected for fresh installation)');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run tests to verify the migration: npm run test:contract');
    console.log('2. Implement the footer endpoints');
    console.log('3. Update admin interface to use new endpoints');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Handle command line execution
if (require.main === module) {
  runMigration().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };