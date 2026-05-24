# patch-item-search.ps1
# Replaces the broken absolute-positioned item-search dropdown in all form files
# with the new <ItemSearchInput> component that uses position:fixed via portal.

$forms = @(
  "src\components\purchases\NonTaxPurchaseInvoiceForm.tsx",
  "src\components\purchases\NonTaxPurchaseReturnForm.tsx",
  "src\components\purchases\PurchaseOrderForm.tsx",
  "src\components\purchases\PurchaseInvoiceForm.tsx",
  "src\components\purchases\PurchaseReturnForm.tsx",
  "src\components\purchases\GoodsReceiptForm.tsx",
  "src\components\purchases\ImportPurchaseInvoiceForm.tsx",
  "src\components\sales\NonTaxSaleInvoiceForm.tsx",
  "src\components\sales\NonTaxSaleReturnForm.tsx",
  "src\components\sales\QuotationForm.tsx",
  "src\components\sales\SaleOrderForm.tsx",
  "src\components\sales\DeliveryChallanForm.tsx",
  "src\components\sales\SaleInvoiceForm.tsx",
  "src\components\sales\SaleReturnForm.tsx",
  "src\components\store\AddStockForm.tsx",
  "src\components\store\ReduceStockForm.tsx",
  "src\components\store\StockTransferForm.tsx",
  "src\components\store\BranchTransferForm.tsx",
  "src\components\store\StockAdjustmentForm.tsx"
)

$patched = 0

foreach ($file in $forms) {
  if (-not (Test-Path $file)) {
    Write-Host "SKIP (not found): $file"
    continue
  }

  $content = Get-Content $file -Raw -Encoding UTF8

  # ── 1. Add import for ItemSearchInput (after first "use client" or first import) ──
  if ($content -notmatch 'ItemSearchInput') {
    $importLine = 'import ItemSearchInput from "@/components/erp/ui/ItemSearchInput";'
    # Insert after the last existing import line
    $content = $content -replace '(import [^\n]+\n)(?!import )', "`$1$importLine`n"
    Write-Host "  Added import to $file"
  }

  # ── 2. Replace <td className="px-4 py-4 relative"> ... </td> block ──
  # The block contains: input[type=text] + conditional dropdown div
  # Pattern: td.relative > input + {showItemSearch && <div>...</div>}
  # We replace with: td > ItemSearchInput
  #
  # Strategy: regex replace the entire item-code <td> block.
  # The block starts at:   <td className="px-4 py-4 relative">
  # and ends at the first: </td>  that closes it.
  # We replace it with a simple <ItemSearchInput> call.

  # Build the replacement <td> using ItemSearchInput
  $replacement = @'
                    <td className="px-4 py-4">
                      <ItemSearchInput
                        value={item.itemCode || ""}
                        availableItems={availableItems}
                        onSelect={(selected) => {
                          updateItem(item.id, "itemId", selected._id);
                          updateItem(item.id, "itemCode", selected.code);
                          updateItem(item.id, "description", selected.name);
                        }}
                        onChange={(val) => updateItem(item.id, "itemCode", val)}
                        placeholder="Search item..."
                      />
                    </td>
'@

  # Match the relative td block: from <td ... relative> to matching </td>
  # Use a greedy match within the tbody row
  $pattern = '(?s)<td className="px-4 py-4 relative">.*?</td>'

  $newContent = [regex]::Replace($content, $pattern, $replacement.Trim(), 'Singleline')

  if ($newContent -ne $content) {
    Set-Content $file $newContent -Encoding UTF8 -NoNewline
    Write-Host "PATCHED: $file"
    $patched++
  } else {
    Write-Host "NO CHANGE (pattern not found): $file"
  }
}

Write-Host ""
Write-Host "Done. $patched files patched."
