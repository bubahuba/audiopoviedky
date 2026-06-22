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

const rneButtonPath = path.join(
  __dirname,
  '../node_modules/react-native-elements/dist/buttons/Button.js',
);
const rneIconPath = path.join(
  __dirname,
  '../node_modules/react-native-elements/dist/icons/Icon.js',
);

function patchReactNativeElementsRefSpread(filePath, exclusionAnchor) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  if (source.includes('"ref"')) {
    return false;
  }

  const updated = source.replace(exclusionAnchor, (match) =>
    match.replace(/\]\);$/, ', "ref"]);'),
  );

  if (updated === source) {
    return false;
  }

  fs.writeFileSync(filePath, updated);
  return true;
}

patchReactNativeElementsRefSpread(
  rneButtonPath,
  /"iconPosition"\]\);/,
);
patchReactNativeElementsRefSpread(
  rneIconPath,
  /"theme"\]\);/,
);

function patchAlphabetSectionList() {
  const alphabetPath = path.join(
    __dirname,
    '../node_modules/react-native-alphabet-sectionlist/src/AlphabetSectionList.js',
  );
  const rightPath = path.join(
    __dirname,
    '../node_modules/react-native-alphabet-sectionlist/src/RightSectionList.js',
  );

  if (!fs.existsSync(alphabetPath) || !fs.existsSync(rightPath)) {
    return;
  }

  let alphabetSource = fs.readFileSync(alphabetPath, 'utf8');
  let alphabetChanged = false;

  if (!alphabetSource.includes('this.viewRef')) {
    alphabetSource = alphabetSource.replace(
      '    this.state = {',
      '    this.viewRef = React.createRef();\n    this.listRef = React.createRef();\n\n    this.state = {',
    );
    alphabetSource = alphabetSource.replace(
      'ReactNative.findNodeHandle(this.refs.view)',
      'ReactNative.findNodeHandle(this.viewRef.current)',
    );
    alphabetSource = alphabetSource.replace(
      'this.refs.listview.scrollToLocation',
      'this.listRef.current?.scrollToLocation',
    );
    alphabetSource = alphabetSource.replace(
      '<View ref="view" style={[styles.container, this.props.style]}>',
      '<View ref={this.viewRef} style={[styles.container, this.props.style]}>',
    );
    alphabetSource = alphabetSource.replace(
      'ref="listview"',
      'ref={this.listRef}',
    );
    alphabetChanged = true;
  }

  if (
    alphabetSource.includes('UIManager.measure') ||
    alphabetSource.includes('ReactNative.findNodeHandle')
  ) {
    alphabetSource = alphabetSource.replace(
      /componentDidMount\(\) \{[\s\S]*?^\  \}/m,
      `componentDidMount() {
    setTimeout(() => {
      const node = this.viewRef.current;
      if (!node?.measure) {
        return;
      }

      node.measure((_x, _y, _w, h) => {
        this.containerHeight = h;
        if (
          this.props.contentInset &&
          this.props.data &&
          Object.keys(this.props.data).length > 0
        ) {
          this.scrollToSection(Object.keys(this.props.data)[0]);
        }
      });
    }, 0);
  }`,
    );
    alphabetSource = alphabetSource.replace(
      /import ReactNative, \{[\s\S]*?\} from 'react-native';/,
      `import {
  SectionList,
  StyleSheet,
  View,
  Text,
} from 'react-native';`,
    );
    alphabetSource = alphabetSource.replace(
      "const { UIManager } = NativeModules;\n\n",
      '',
    );
    alphabetChanged = true;
  }

  if (alphabetChanged) {
    fs.writeFileSync(alphabetPath, alphabetSource);
  }

  let rightSource = fs.readFileSync(rightPath, 'utf8');
  if (!rightSource.includes('this.viewRef')) {
    rightSource = rightSource.replace(
      '    this.onSectionSelect = this.onSectionSelect.bind(this);',
      '    this.viewRef = React.createRef();\n    this.sectionItemRefs = {};\n\n    this.onSectionSelect = this.onSectionSelect.bind(this);',
    );
    rightSource = rightSource.replace(
      'const sectionItem = this.refs.sectionItem0;',
      'const sectionItem = this.sectionItemRefs.sectionItem0;',
    );
    rightSource = rightSource.replace(
      "<View key={index} ref={'sectionItem' + index} pointerEvents=\"none\">",
      `<View
            key={index}
            ref={(ref) => {
              this.sectionItemRefs['sectionItem' + index] = ref;
            }}
            pointerEvents="none">`,
    );
    rightSource = rightSource.replace(
      '<View ref="view" style={[styles.container, this.props.style]}',
      '<View ref={this.viewRef} style={[styles.container, this.props.style]}',
    );
    fs.writeFileSync(rightPath, rightSource);
  }
}

patchAlphabetSectionList();
