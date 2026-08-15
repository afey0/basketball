const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      results.push(file);
    }
  });
  return results;
}

console.log('🚀 Starting Cloudflare build optimization...');

// 1. Replace imports in JS/MJS files
const files = walk('.open-next');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let replaced = content;
  
  // Replace absolute paths with relative ones (for Windows local builds)
  replaced = replaced
    .replaceAll('D:/Antigravity/bb/.open-next/server-functions/default/', './')
    .replaceAll('D:\\Antigravity\\bb\\.open-next\\server-functions\\default\\', './');

  // Redirect all WASM references to the single deduplicated query_engine_bg.wasm
  replaced = replaced
    .replaceAll('query_engine_bg.mysql.wasm', '../../.prisma/client/query_engine_bg.wasm')
    .replaceAll('query_engine_bg.postgresql.wasm', '../../.prisma/client/query_engine_bg.wasm')
    .replaceAll('query_engine_bg.sqlite.wasm', '../../.prisma/client/query_engine_bg.wasm');

  if (replaced !== content) {
    console.log(`✅ Optimized paths & imports in: ${file}`);
    fs.writeFileSync(file, replaced);
  }
});

// 2. Delete unused and redundant WASM files
function deleteFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      deleteFiles(file);
    } else if (
      file.endsWith('mysql.wasm') || 
      file.endsWith('postgresql.wasm') || 
      file.endsWith('sqlite.wasm')
    ) {
      console.log(`🗑️ Deleted redundant WASM engine: ${file}`);
      fs.unlinkSync(file);
    }
  });
}
deleteFiles('.open-next');

console.log('🎉 Cloudflare build optimization complete!');
