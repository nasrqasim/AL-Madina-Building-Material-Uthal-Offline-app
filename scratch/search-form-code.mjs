import fs from 'fs';

const content = fs.readFileSync('./src/components/sales/SaleInvoiceForm.tsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search Results for SaleInvoiceForm.tsx ---');
lines.forEach((line, idx) => {
    if (line.includes('ItemDetailsPanel') || line.includes('ItemSearchInput') || line.includes('selectedItem') || line.includes('setSelectedItem') || line.includes('activeRow') || line.includes('hover') || line.includes('mouseEnter')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
