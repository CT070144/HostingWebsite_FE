/**
 * Script to convert all CSS files to CSS Modules
 * Usage: node convert-to-css-modules.js
 */

const fs = require('fs');
const path = require('path');

// Function to convert kebab-case to camelCase
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

// Function to convert CSS class names to camelCase
function convertClassName(className) {
  // Handle special cases like "btn-primary" -> "btnPrimary"
  return toCamelCase(className);
}

// Function to read and convert CSS file
function convertCSSFile(cssFilePath) {
  const cssContent = fs.readFileSync(cssFilePath, 'utf8');
  const moduleCssPath = cssFilePath.replace('.css', '.module.css');
  
  // Convert class names from kebab-case to camelCase
  let moduleCssContent = cssContent;
  
  // Match CSS class selectors (e.g., .class-name, .class-name:hover)
  const classRegex = /\.([a-z][a-z0-9-]*[a-z0-9]|[a-z])(?=\s*[,\s{])/g;
  
  moduleCssContent = moduleCssContent.replace(classRegex, (match, className) => {
    // Skip if it's a pseudo-class or already camelCase
    if (className.includes(':') || className === className.toLowerCase() && !className.includes('-')) {
      return match;
    }
    return `.${convertClassName(className)}`;
  });
  
  // Handle nested selectors like .parent .child
  moduleCssContent = moduleCssContent.replace(/\.([a-z][a-z0-9-]*)\s+\.([a-z][a-z0-9-]*)/g, (match, parent, child) => {
    return `.${convertClassName(parent)} .${convertClassName(child)}`;
  });
  
  // Write the module CSS file
  fs.writeFileSync(moduleCssPath, moduleCssContent, 'utf8');
  console.log(`✓ Created ${moduleCssPath}`);
  
  return moduleCssPath;
}

// Function to find all CSS files
function findCSSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      findCSSFiles(filePath, fileList);
    } else if (file.endsWith('.css') && !file.endsWith('.module.css') && !file.includes('node_modules')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main function
function main() {
  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('Error: src directory not found');
    process.exit(1);
  }
  
  console.log('Finding CSS files...');
  const cssFiles = findCSSFiles(srcDir);
  
  console.log(`Found ${cssFiles.length} CSS files to convert\n`);
  
  cssFiles.forEach(cssFile => {
    try {
      convertCSSFile(cssFile);
    } catch (error) {
      console.error(`Error converting ${cssFile}:`, error.message);
    }
  });
  
  console.log(`\n✓ Conversion complete! ${cssFiles.length} files converted.`);
  console.log('\nNote: You still need to update the JS/JSX files to use classNames with bind.');
}

if (require.main === module) {
  main();
}

module.exports = { convertCSSFile, convertClassName };

