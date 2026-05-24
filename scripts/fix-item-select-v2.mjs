/**
 * fix-item-select-v2.mjs
 * Fixes item selection in all purchase/sales/store forms:
 *   1. Replaces triple onSelect updateItem calls → single call
 *   2. Fixes updateItem "itemId" block to set description, itemCode, gallons, liters, price
 *   3. Fixes cartons/gallons/liters cross-calc to use item-specific conversion rates
 */

import { readFileSync, writeFileSync } from 'fs';

const BASE = 'D:/oilshop/oilshop/src/components';

const FORMS = [
  // path | priceField | priceSource
  [`purchases/PurchaseOrderForm.tsx`,         'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`purchases/GoodsReceiptForm.tsx`,           'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`purchases/PurchaseInvoiceForm.tsx`,        'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`purchases/PurchaseReturnForm.tsx`,         'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`purchases/NonTaxPurchaseInvoiceForm.tsx`,  'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`purchases/NonTaxPurchaseReturnForm.tsx`,   'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`purchases/ImportPurchaseInvoiceForm.tsx`,  'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`sales/QuotationForm.tsx`,                  'unitPrice', `selected.retailRate || selected.rate || 0`],
  [`sales/SaleOrderForm.tsx`,                  'unitPrice', `selected.retailRate || selected.rate || 0`],
  [`sales/DeliveryChallanForm.tsx`,            'unitPrice', `selected.retailRate || selected.rate || 0`],
  [`sales/NonTaxSaleInvoiceForm.tsx`,          'unitPrice', `selected.retailRate || selected.rate || 0`],
  [`sales/NonTaxSaleReturnForm.tsx`,           'unitPrice', `selected.retailRate || selected.rate || 0`],
  [`store/AddStockForm.tsx`,                   'cost',      `selected.purchaseRate || selected.rate || 0`],
  [`store/ReduceStockForm.tsx`,                'cost',      `selected.purchaseRate || selected.rate || 0`],
  [`store/StockTransferForm.tsx`,              'cost',      `selected.purchaseRate || selected.rate || 0`],
  [`store/BranchTransferForm.tsx`,             'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`store/PurchaseRequisitionForm.tsx`,        'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`store/BillOfMaterialsForm.tsx`,            'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`store/ProductionOrderForm.tsx`,            'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`store/InwardGatePassForm.tsx`,             'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`store/OutwardGatePassForm.tsx`,            'unitPrice', `selected.purchaseRate || selected.rate || 0`],
  [`store/StockAdjustmentForm.tsx`,            'cost',      `selected.purchaseRate || selected.rate || 0`],
];

let changed = 0;
let errors = [];

for (const [relPath, priceField, priceSource] of FORMS) {
  const filePath = `${BASE}/${relPath}`;
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (e) {
    errors.push(`SKIP (not found): ${relPath}`);
    continue;
  }

  const original = content;

  // ─── FIX 1: Replace triple onSelect calls with single call ───────────────
  // Pattern: onSelect={(selected) => {\n  updateItem(X, "itemId", ...);\n  updateItem(X, "itemCode", ...);\n  updateItem(X, "description", ...);\n}}
  content = content.replace(
    /onSelect=\{\(selected\)\s*=>\s*\{[\s\n]*updateItem\(([^,]+),\s*"itemId",\s*selected\._id\);[\s\n]*updateItem\([^;]+;[\s\n]*updateItem\([^;]+;[\s\n]*\}\}/g,
    (match, lineId) => {
      const id = lineId.trim();
      return `onSelect={(selected) => updateItem(${id}, "itemId", selected._id)}`;
    }
  );

  // ─── FIX 2: Enhance updateItem "itemId" block to set all fields ──────────
  // Find: if (field === "itemId") { ... const selected = availableItems.find(...); if (selected) { updated.itemCode = ...; updated.description = ...; updated.unitPrice/cost = ...; } }
  // Replace with a version that also sets cartons/gallons/liters
  
  // Pattern for existing itemId block (purchase forms with unitPrice)
  content = content.replace(
    /if \(field === "itemId"\) \{[\s\n]*const selected = availableItems\.find\(ai => ai\._id === value\);[\s\n]*if \(selected\) \{[\s\n]*updated\.itemCode = selected\.code;[\s\n]*updated\.description = selected\.name;[\s\n]*updated\.(unitPrice|cost) = [^;]+;[\s\n]*\}[\s\n]*\}/g,
    (match, fieldName) => {
      return `if (field === "itemId") {
          const selected = availableItems.find(ai => ai._id === value);
          if (selected) {
            updated.itemCode = selected.code;
            updated.description = selected.name;
            updated.${fieldName} = ${priceSource};
            const isFilter = selected.name?.toLowerCase().includes("filter") || selected.name?.toLowerCase().includes("fliter");
            const gallonsInCtn = isFilter ? 1 : (selected.gallonsInCtn || 4);
            const litersInCtn = isFilter ? 1 : (selected.litersInCtn || 16);
            updated.cartons = 1;
            updated.gallons = gallonsInCtn;
            updated.liters = litersInCtn;
          }
        }`;
    }
  );

  // ─── FIX 3: Fix hardcoded gallons/liters cross-calc to use item data ─────
  // Replace: if (field === "cartons") { updated.gallons = value * 4; updated.liters = value * 16; }
  content = content.replace(
    /if \(field === "cartons"\) \{[\s\n]*updated\.gallons = value \* 4;[\s\n]*updated\.liters = value \* 16;[\s\n]*\} else if \(field === "gallons"\) \{[\s\n]*updated\.cartons = value \/ 4;[\s\n]*updated\.liters = value \* 4;[\s\n]*\} else if \(field === "liters"\) \{[\s\n]*updated\.cartons = value \/ 16;[\s\n]*updated\.gallons = value \/ 4;[\s\n]*\}/g,
    `if (field === "cartons" || field === "gallons" || field === "liters") {
          const selItem = availableItems.find(ai => ai._id === i.itemId);
          const isFltr = selItem?.name?.toLowerCase().includes("filter") || selItem?.name?.toLowerCase().includes("fliter");
          const galsInCtn = isFltr ? 1 : (selItem?.gallonsInCtn || 4);
          const ltrsInCtn = isFltr ? 1 : (selItem?.litersInCtn || 16);
          if (field === "cartons") {
            updated.gallons = value * galsInCtn;
            updated.liters = value * ltrsInCtn;
          } else if (field === "gallons") {
            updated.cartons = galsInCtn > 0 ? value / galsInCtn : 0;
            updated.liters = galsInCtn > 0 ? (value / galsInCtn) * ltrsInCtn : 0;
          } else if (field === "liters") {
            updated.cartons = ltrsInCtn > 0 ? value / ltrsInCtn : 0;
            updated.gallons = ltrsInCtn > 0 ? (value / ltrsInCtn) * galsInCtn : 0;
          }
        }`
  );

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${relPath}`);
    changed++;
  } else {
    console.log(`⚠️  No changes: ${relPath}`);
  }
}

console.log(`\nDone. Changed ${changed} files.`);
if (errors.length) {
  console.log('Errors/Skips:');
  errors.forEach(e => console.log(' -', e));
}
