import fs from 'fs';
import path from 'path';

// Establish mock before importing pdfjs-dist / pdf-parse
globalThis.DOMMatrix = class DOMMatrix {};

async function main() {
  const { PDFParse } = await import('pdf-parse');
  const searchDir = 'd:/oilshop';

  const files = fs.readdirSync(searchDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  console.log(`Found ${pdfFiles.length} PDF files. Searching for matches...`);

  for (const f of pdfFiles) {
    const filePath = path.join(searchDir, f);
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const parser = new PDFParse({ data: dataBuffer });
      const textResult = await parser.getText();
      const text = textResult.text;
      
      const keywords = ['747,745', '747745', 'max customers', '747,492', '747492'];
      let found = false;
      for (const kw of keywords) {
        if (text.toLowerCase().includes(kw)) {
          console.log(`FOUND KEYWORD "${kw}" IN PDF: ${f}`);
          found = true;
        }
      }

      if (found) {
        // Print lines containing matching keywords
        const lines = text.split('\n');
        lines.forEach((line, index) => {
          const lower = line.toLowerCase();
          for (const kw of keywords) {
            if (lower.includes(kw)) {
              console.log(`  Line ${index + 1}: ${line}`);
            }
          }
        });
      }
      
      await parser.destroy();
    } catch (e) {
      console.error(`Error reading ${f}:`, e);
    }
  }
}

main().catch(console.error);
