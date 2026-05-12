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
