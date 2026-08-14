const fs = require('fs');
const path = require('path');

const srcDir = path.join('d:', 'FInalAttempt', 'frontend', 'src');

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(srcDir, filePath);

  lines.forEach((line, idx) => {
    // 1. Large padding on small screen without sm: or md: prefix
    if (/\bp-8\b|\bp-10\b|\bp-12\b|\bp-16\b/.test(line) && !/sm:p-|md:p-|lg:p-/.test(line)) {
      console.log(`[PADD]: ${relPath}:${idx+1} -> ${line.trim()}`);
    }
    // 2. Fixed large pixel width without max-w-full
    if (/\bw-\[\d{3,4}px\]/.test(line) && !line.includes('max-w-full')) {
      console.log(`[WIDTH]: ${relPath}:${idx+1} -> ${line.trim()}`);
    }
    // 3. Flex gap without flex-wrap in headers or filter bars
    if (/className="[^"]*flex items-center gap-[4-9][^"]*"/.test(line) && !line.includes('flex-wrap') && !line.includes('overflow')) {
      console.log(`[WRAP]: ${relPath}:${idx+1} -> ${line.trim()}`);
    }
  });
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
        scanDir(fullPath);
      }
    } else if (file.endsWith('.tsx')) {
      scanFile(fullPath);
    }
  }
}

scanDir(srcDir);
