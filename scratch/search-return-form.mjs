import fs from 'fs';

const content = fs.readFileSync('./src/components/sales/SaleReturnForm.tsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search Results for SaleReturnForm.tsx ---');
lines.forEach((line, idx) => {
    if (line.includes('selectedItem') || line.includes('selectedLine') || line.includes('selectedItemDetails') || line.includes('rowActiveIndex') || line.includes('filteredItems.map')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
