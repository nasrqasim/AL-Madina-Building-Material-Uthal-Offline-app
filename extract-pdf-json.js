const fs = require('fs');
const PDFParser = require('pdf2json');

let pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    // Save the full JSON to see structure
    fs.writeFileSync('d:/oilshop/oilshop/pdf_extracted.json', JSON.stringify(pdfData, null, 2));
    console.log('PDF extraction to JSON done.');
});

pdfParser.loadPDF('d:/oilshop/Remote Desktop Redirected Printer Doc (8) (1).pdf');
