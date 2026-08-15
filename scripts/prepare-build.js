const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('🌱 No .env file found. Creating a default .env for the build environment...');
  fs.writeFileSync(envPath, 'DATABASE_URL="file:./dev.db"\nAUTH_SECRET="bball-crm-secret-key-2026-change-me-in-prod!"\n');
} else {
  console.log('✅ .env file already exists.');
}
