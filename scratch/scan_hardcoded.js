const fs = require('fs');
const path = require('path');

const srcDir = path.join('d:', 'FInalAttempt', 'frontend', 'src');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
        scanDir(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for hardcoded strings in JSX button / headers without t()
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('t(')) return;
        if (line.includes('className=')) {
          // Look for text node literals
          if (/>[A-Za-z0-9\s,\.&]{5,}</.test(line) && !line.includes('http') && !line.includes('xmlns') && !line.includes('console.log')) {
            // Check if it's UI text
            const match = line.match(/>([^<{}>]+)</);
            if (match && match[1].trim().length > 4 && !/^[0-9\s\.\:\-\/]+$/.test(match[1].trim())) {
              // console.log(`${file}:${idx+1}: "${match[1].trim()}"`);
            }
          }
        }
      });
    }
  }
}

scanDir(srcDir);
