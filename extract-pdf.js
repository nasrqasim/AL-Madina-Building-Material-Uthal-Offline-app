const fs = require('fs');
const PDFParser = require('pdf2json');

let pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync('d:/oilshop/oilshop/pdf_extracted.txt', pdfParser.getRawTextContent());
    console.log('PDF extraction done.');
});

pdfParser.loadPDF('d:/oilshop/oilshop/Remote Desktop Redirected Printer Doc (8).pdf');
