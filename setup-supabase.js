#!/usr/bin/env node

/**
 * Setup script to help configure Supabase for the R.O.P.S. application
 * Run this after creating your Supabase project
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 R.O.P.S. Supabase Setup');
  console.log('==========================\n');
  
  console.log('This script will help you configure Supabase for your R.O.P.S. application.');
  console.log('Make sure you have already created a Supabase project.\n');
  
  // Get Supabase credentials
  const supabaseUrl = await question('Enter your Supabase Project URL: ');
  const supabaseAnonKey = await question('Enter your Supabase Anon Key: ');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Both Supabase URL and Anon Key are required!');
    process.exit(1);
  }
  
  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Invalid Supabase URL format. Should be like: https://your-project.supabase.co');
    process.exit(1);
  }
  
  // Create .env file
  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Optional: For development
VITE_API_BASE_URL=http://localhost:8080
`;
  
  try {
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file with Supabase configuration');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    process.exit(1);
  }
  
  // Check if supabase-migrations.sql exists
  const migrationsFile = path.join(__dirname, 'supabase-migrations.sql');
  if (fs.existsSync(migrationsFile)) {
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase dashboard → SQL Editor');
    console.log('2. Copy the contents of supabase-migrations.sql');
    console.log('3. Paste and run the SQL to create tables');
    console.log('4. Run "pnpm dev" to test locally');
    console.log('5. Follow DEPLOYMENT_GUIDE.md for Netlify deployment');
  } else {
    console.log('⚠️  Warning: supabase-migrations.sql not found');
  }
  
  console.log('\n🎉 Setup complete! Your .env file has been created.');
  console.log('Remember: Never commit the .env file to Git!');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
