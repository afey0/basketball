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

  // Replace unused WASM references with the sqlite one
  replaced = replaced
    .replaceAll('query_engine_bg.mysql.wasm', 'query_engine_bg.sqlite.wasm')
    .replaceAll('query_engine_bg.postgresql.wasm', 'query_engine_bg.sqlite.wasm');

  if (replaced !== content) {
    console.log(`✅ Optimized paths & imports in: ${file}`);
    fs.writeFileSync(file, replaced);
  }
});

// 2. Delete unused WASM files
function deleteFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      deleteFiles(file);
    } else if (file.endsWith('mysql.wasm') || file.endsWith('postgresql.wasm')) {
      console.log(`🗑️ Deleted unused WASM engine: ${file}`);
      fs.unlinkSync(file);
    }
  });
}
deleteFiles('.open-next');

console.log('🎉 Cloudflare build optimization complete!');
