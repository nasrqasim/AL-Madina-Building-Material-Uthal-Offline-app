const fs = require('fs');
const path = require('path');

const baseDir = 'd:/oilshop/oilshop/src/app/(erp)';

function getPageFiles(dir, files_ = []) {
  const list = fs.readdirSync(dir);
  for (const i in list) {
    const name = dir + '/' + list[i];
    if (fs.statSync(name).isDirectory()) {
      getPageFiles(name, files_);
    } else if (name.endsWith('page.tsx')) {
      files_.push(name);
    }
  }
  return files_;
}

const pageFiles = getPageFiles(baseDir);

pageFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(baseDir, file).replace(/\\/g, '/');
  
  const hasSearchState = content.includes('searchTerm') || content.includes('searchQuery');
  const hasSearchIcon = content.includes('Search');
  const hasInput = content.includes('<input') || content.includes('onSearch');
  const hasDataTable = content.includes('ERPDataTable');
  
  if (hasInput || hasSearchIcon || hasDataTable) {
    console.log(`Page: ${relPath}`);
    console.log(`  Search state: ${hasSearchState}`);
    console.log(`  Search icon: ${hasSearchIcon}`);
    console.log(`  Input: ${hasInput}`);
    console.log(`  DataTable: ${hasDataTable}`);
  }
});
