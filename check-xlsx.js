const xlsx = require('xlsx');
const workbook = xlsx.readFile('d:/oilshop/oilshop/Items.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
console.log("Rows:", data.length);
console.log("First 10 rows:", data.slice(0, 10));
