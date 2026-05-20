import * as XLSX from 'xlsx';

/**
 * Trigger a hidden file input to allow the user to select a file.
 */
export const triggerFileInput = (accept: string = '.xlsx, .xls, .csv'): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      resolve(file || null);
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    // Note: oncancel might not be fully supported in all browsers, 
    // but it's safe to include.
    input.oncancel = () => {
      resolve(null);
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    document.body.appendChild(input);
    input.click();
  });
};

/**
 * Import data from an Excel or CSV file.
 */
export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

/**
 * Export an array of objects to an Excel file.
 */
export const exportToExcel = (data: any[], filename: string) => {
  try {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const isCsv = filename.toLowerCase().endsWith('.csv');
    const extension = isCsv ? '.csv' : '.xlsx';
    let fullFilename = filename;
    if (!fullFilename.toLowerCase().endsWith(extension)) {
      fullFilename += extension;
    }
    
    // Flatten data if it contains nested objects/arrays
    const flattenedData = data.map(item => {
      const flattened: any = {};
      Object.keys(item).forEach(key => {
        if (item[key] === null || item[key] === undefined) {
          flattened[key] = "";
        } else if (typeof item[key] === 'object' && !Array.isArray(item[key])) {
          Object.keys(item[key]).forEach(subKey => {
            flattened[`${key}_${subKey}`] = item[key][subKey];
          });
        } else if (Array.isArray(item[key])) {
          flattened[key] = item[key].length > 0 ? JSON.stringify(item[key]) : "";
        } else {
          flattened[key] = item[key];
        }
      });
      return flattened;
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    
    // Use XLSX.writeFile for the most reliable download across browsers
    XLSX.writeFile(workbook, fullFilename);
    
  } catch (error) {
    console.error("Export failed:", error);
    try {
      // Emergency fallback using basic sheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, filename.includes('.') ? filename : `${filename}.xlsx`);
    } catch (e) {
      alert("Export failed. Please check the data format.");
    }
  }
};

/**
 * Download an empty template with the specified columns.
 */
export const downloadTemplate = (columns: string[], filename: string) => {
  const headerRow = columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {});
  const worksheet = XLSX.utils.json_to_sheet([headerRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

/**
 * Trigger the browser's print dialog.
 */
export const printPage = () => {
  window.print();
};

/**
 * Export the first visible table in the DOM to an Excel file using xlsx.
 */
export const exportDOMTableToExcel = (filename: string = 'Report') => {
  try {
    const table = document.querySelector('table');
    if (!table) {
      alert("No table data found to export.");
      return;
    }
    
    // Clean up interactive/temporary elements in cloned table
    const tableClone = table.cloneNode(true) as HTMLTableElement;
    
    // Remove buttons, inputs, selects, dropdowns, and any elements marked no-export
    const interactiveElements = tableClone.querySelectorAll('button, input, select, .no-export');
    interactiveElements.forEach(el => el.remove());
    
    const worksheet = XLSX.utils.table_to_sheet(tableClone);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    
    const extension = '.xlsx';
    let fullFilename = filename;
    if (!fullFilename.toLowerCase().endsWith(extension)) {
      fullFilename += extension;
    }
    
    XLSX.writeFile(workbook, fullFilename);
  } catch (error) {
    console.error("DOM Excel Export failed:", error);
    alert("Excel export failed. Please try again.");
  }
};

/**
 * Print a clean list document in a new window — like a professional printable report.
 * @param title - Report title e.g. "Customer Balances Report"
 * @param companyName - Company name for the header
 * @param companyAddress - Company address
 * @param companyPhone - Company phone
 * @param columns - Array of { header: string, key: string } 
 * @param rows - Array of data objects
 * @param totals - Optional footer totals row object
 */
export const printListDocument = ({
  title,
  companyName = "Najeeb Oil Shop",
  companyAddress = "Bela, Balochistan, Pakistan",
  companyPhone = "",
  columns,
  rows,
  totals,
}: {
  title: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  columns: { header: string; key: string }[];
  rows: any[];
  totals?: Record<string, string | number>;
}) => {
  const date = new Date().toLocaleDateString("en-PK", {
    day: "2-digit", month: "long", year: "numeric"
  });

  const headerRow = columns.map(c => `<th>${c.header}</th>`).join("");
  const dataRows = rows.map((row, i) =>
    `<tr class="${i % 2 === 0 ? "" : "alt"}">
      ${columns.map(c => `<td>${row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : "-"}</td>`).join("")}
    </tr>`
  ).join("");

  const totalRow = totals
    ? `<tr class="total-row">
        ${columns.map(c => `<td><strong>${totals[c.key] !== undefined ? totals[c.key] : ""}</strong></td>`).join("")}
      </tr>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: white; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7f1d1d; padding-bottom: 12px; margin-bottom: 16px; }
    .header-left h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #1a1a1a; }
    .header-left p { font-size: 9px; color: #555; margin-top: 2px; text-transform: uppercase; }
    .header-right { text-align: right; }
    .header-right h2 { font-size: 14px; font-weight: 900; color: #7f1d1d; text-transform: uppercase; letter-spacing: 2px; }
    .header-right p { font-size: 9px; color: #777; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #7f1d1d; color: white; padding: 7px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; border: 1px solid #6b1515; }
    td { padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 10px; vertical-align: middle; }
    tr.alt td { background: #fafafa; }
    tr.total-row td { background: #1a1a1a; color: white; font-weight: 900; font-size: 10px; border-color: #333; }
    .footer { margin-top: 32px; display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #ddd; }
    .sig-line { width: 160px; border-bottom: 1px solid #aaa; margin-bottom: 4px; }
    .sig-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
    .summary { margin-top: 8px; font-size: 9px; color: #666; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${companyName}</h1>
      <p>${companyAddress}</p>
      ${companyPhone ? `<p>Ph: ${companyPhone}</p>` : ""}
    </div>
    <div class="header-right">
      <h2>${title}</h2>
      <p>Generated: ${date}</p>
      <p>Total Records: ${rows.length}</p>
    </div>
  </div>

  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${dataRows}</tbody>
    ${totals ? `<tfoot>${totalRow}</tfoot>` : ""}
  </table>

  <div class="footer">
    <div>
      <div class="sig-line"></div>
      <div class="sig-label">Authorized Signature</div>
    </div>
    <div class="summary">Total Records: ${rows.length} | Printed: ${date}</div>
    <div>
      <div class="sig-line"></div>
      <div class="sig-label">Accountant</div>
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1100,height=800");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
};
