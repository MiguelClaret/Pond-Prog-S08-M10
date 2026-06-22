const fs = require('fs');
const path = require('path');

const localesDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'debugger-frontend',
  'dist',
  'third-party',
  'front_end',
  'core',
  'i18n',
  'locales',
);

const sourceFile = path.join(localesDir, 'en-US.json');
const targetFile = path.join(localesDir, 'pt.json');

try {
  if (!fs.existsSync(localesDir) || !fs.existsSync(sourceFile) || fs.existsSync(targetFile)) {
    process.exit(0);
  }

  fs.copyFileSync(sourceFile, targetFile);
} catch (error) {
  console.warn('[ensure-debugger-locale] unable to create pt.json locale file');
  console.warn(error instanceof Error ? error.message : error);
}
