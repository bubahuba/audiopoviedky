const fs = require('fs');
const path = require('path');

const componentsRoot = path.join(
  __dirname,
  '../node_modules/react-native/Libraries/Components',
);

function createPlatformShim(dirPath, baseName) {
  const shimPath = path.join(dirPath, `${baseName}.js`);
  const iosPath = path.join(dirPath, `${baseName}.ios.js`);
  const androidPath = path.join(dirPath, `${baseName}.android.js`);

  if (fs.existsSync(shimPath) || !fs.existsSync(iosPath)) {
    return false;
  }

  const depth = path
    .relative(
      path.join(__dirname, '../node_modules/react-native/Libraries'),
      dirPath,
    )
    .split(path.sep).length;
  const platformPath = '../'.repeat(depth) + 'Utilities/Platform';

  const shim = `'use strict';

const Platform = require('${platformPath}');

if (Platform.OS === 'android') {
  module.exports = require('./${baseName}.android.js');
} else {
  module.exports = require('./${baseName}.ios.js');
}
`;

  fs.writeFileSync(shimPath, shim);
  return true;
}

function walk(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  for (const entry of fs.readdirSync(dirPath, {withFileTypes: true})) {
    if (!entry.isDirectory()) {
      continue;
    }

    const subDir = path.join(dirPath, entry.name);
    createPlatformShim(subDir, entry.name);
    walk(subDir);
  }
}

walk(componentsRoot);
