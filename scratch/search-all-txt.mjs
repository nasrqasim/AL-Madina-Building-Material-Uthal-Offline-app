import fs from 'fs';
import path from 'path';

const scratchDir = 'd:/oilshop/oilshop/scratch';

async function main() {
  const files = fs.readdirSync(scratchDir).filter(f => f.endsWith('.txt'));
  
  for (const f of files) {
    const filePath = path.join(scratchDir, f);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let fileHeaderShown = false;
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('max') || lowerLine.includes('747,745') || lowerLine.includes('747,492') || lowerLine.includes('747')) {
        if (!fileHeaderShown) {
          console.log(`\n================ SEARCHING ${f} ================`);
          fileHeaderShown = true;
        }
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    });
  }
}

main().catch(console.error);
