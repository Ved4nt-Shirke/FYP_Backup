/**
 * fix_hardcoded_urls.cjs
 * Replaces all hardcoded 'https://vpciaan.in/api' and 'http://localhost:5000/api'
 * URLs in JSX/JS source files with the import from the centralized config/api.js.
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const HARDCODED_PATTERNS = [
  'https://vpciaan.in',
  'http://localhost:5000',
];

function walkDir(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walkDir(full, results);
    } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = walkDir(SRC_DIR);
let totalFixed = 0;

for (const file of files) {
  // Skip the config file itself
  if (file.includes(path.join('config', 'api.js'))) continue;

  let content = fs.readFileSync(file, 'utf8');
  const hasHardcoded = HARDCODED_PATTERNS.some(p => content.includes(p));
  if (!hasHardcoded) continue;

  let newContent = content;

  // Replace each hardcoded pattern with import.meta.env
  for (const pattern of HARDCODED_PATTERNS) {
    newContent = newContent.split(pattern).join(
      '${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\\/api$/, "")}'
    );
  }

  // Correctly convert double/single quoted strings enclosing the template variable into backticks
  newContent = newContent.replace(
    /(["'])\$\{\(import\.meta\.env\.VITE_API_BASE_URL.*?\}\/([^"'\`]*?)\1/g,
    (match, quote, pathPart) => {
      return `\`\${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\\/api$/, "")}/${pathPart}\``;
    }
  );

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Fixed: ${path.relative(SRC_DIR, file)}`);
    totalFixed++;
  }
}

console.log(`\n✅ Done. Fixed ${totalFixed} files.`);
