const fs = require('fs');
const path = require('path');

const enPath = path.join('d:', 'FInalAttempt', 'frontend', 'src', 'i18n', 'en.json');
const hiPath = path.join('d:', 'FInalAttempt', 'frontend', 'src', 'i18n', 'hi.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hiData = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

function flattenObject(obj, prefix = '') {
  let res = {};
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(res, flattenObject(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      res[prefix ? `${prefix}.${key}` : key] = obj[key];
    }
  }
  return res;
}

const flatEn = flattenObject(enData);
const flatHi = flattenObject(hiData);

console.log('--- MISSING IN HI.JSON ---');
for (let key in flatEn) {
  if (flatHi[key] === undefined) {
    console.log(`KEY: ${key} | EN: "${flatEn[key]}"`);
  }
}

console.log('\n--- KEYS WHERE HI IS IDENTICAL TO EN (Potentially Untranslated English in HI) ---');
for (let key in flatEn) {
  if (flatHi[key] !== undefined && flatHi[key] === flatEn[key] && typeof flatEn[key] === 'string' && flatEn[key].length > 3 && !flatEn[key].includes('PDF') && !flatEn[key].includes('PYQ') && !flatEn[key].includes('BPSC') && !flatEn[key].includes('NCERT')) {
    console.log(`KEY: ${key} | EN/HI: "${flatEn[key]}"`);
  }
}
