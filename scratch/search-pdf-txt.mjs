import fs from 'fs';
import readline from 'readline';

const filePath = 'd:/oilshop/oilshop/pdf_extracted.txt';

async function main() {
  if (!fs.existsSync(filePath)) {
    console.log("File not found");
    return;
  }
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  const matches = [];
  for await (const line of rl) {
    lineCount++;
    if (line.toLowerCase().includes('max') || line.toLowerCase().includes('alhadeed') || line.includes('747,745') || line.includes('747492')) {
      matches.push({ lineCount, line });
    }
  }

  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => console.log(`Line ${m.lineCount}: ${m.line}`));
}

main().catch(console.error);
