import fs from 'fs';

globalThis.DOMMatrix = class DOMMatrix {};

async function main() {
  const { PDFParse } = await import('pdf-parse');
  const filePath = 'd:/oilshop/Remote Desktop Redirected Printer Doc (9).pdf';
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const textResult = await parser.getText();
  const text = textResult.text;
  
  const lines = text.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  // Write the whole text to a scratch file so we can view it
  fs.writeFileSync('d:/oilshop/oilshop/scratch/extracted_doc_9.txt', text);
  console.log("Extracted text saved to scratch/extracted_doc_9.txt");

  // Print lines around "MAX Customers"
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('max customers') || line.toLowerCase().includes('12004001')) {
      console.log(`\n--- Line ${index + 1} ---`);
      for (let i = Math.max(0, index - 20); i <= Math.min(lines.length - 1, index + 40); i++) {
        console.log(`Line ${i + 1}: ${lines[i]}`);
      }
    }
  });

  await parser.destroy();
}

main().catch(console.error);
