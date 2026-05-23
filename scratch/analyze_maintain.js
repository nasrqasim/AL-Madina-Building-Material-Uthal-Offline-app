const fs = require('fs');
const path = require('path');

const dir = 'd:/oilshop/oilshop/src/app/(erp)/maintain';
const subdirs = fs.readdirSync(dir);

subdirs.forEach(subdir => {
  const p = path.join(dir, subdir, 'page.tsx');
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    const hasSearchState = content.includes('searchTerm') || content.includes('searchQuery');
    const hasSearchIcon = content.includes('Search');
    const hasInput = content.includes('<input');
    const hasDataTable = content.includes('ERPDataTable');
    console.log(`Page: ${subdir}`);
    console.log(`  Has search state: ${hasSearchState}`);
    console.log(`  Has Search icon: ${hasSearchIcon}`);
    console.log(`  Has <input: ${hasInput}`);
    console.log(`  Has ERPDataTable: ${hasDataTable}`);
  }
});
