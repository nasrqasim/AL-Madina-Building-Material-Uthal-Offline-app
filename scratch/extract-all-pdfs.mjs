import fs from 'fs';
import path from 'path';

globalThis.DOMMatrix = class DOMMatrix {};

async function main() {
  const { PDFParse } = await import('pdf-parse');
  const searchDir = 'd:/oilshop';
  const outDir = 'd:/oilshop/oilshop/scratch';

  const files = fs.readdirSync(searchDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  console.log(`Extracting ${pdfFiles.length} PDF files...`);

  for (const f of pdfFiles) {
    const filePath = path.join(searchDir, f);
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const parser = new PDFParse({ data: dataBuffer });
      const textResult = await parser.getText();
      const text = textResult.text;
      
      const outPath = path.join(outDir, `${f.replace(/\.pdf$/i, '')}.txt`);
      fs.writeFileSync(outPath, text);
      console.log(`Saved: ${outPath} (${text.length} chars)`);
      
      await parser.destroy();
    } catch (e) {
      console.error(`Error reading ${f}:`, e);
    }
  }
}

main().catch(console.error);
