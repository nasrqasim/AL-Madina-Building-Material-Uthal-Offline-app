import fs from 'fs';
import path from 'path';

const scratchDir = 'd:/oilshop/oilshop/scratch';

async function main() {
  const files = ['Customer Balances Report.txt', 'Remote Desktop Redirected Printer Doc (8) (1).txt'];
  
  for (const f of files) {
    const filePath = path.join(scratchDir, f);
    if (!fs.existsSync(filePath)) {
      console.log(`File ${f} not found`);
      continue;
    }
    console.log(`\n================ SEARCHING ${f} ================`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('max') || line.includes('747,745') || line.includes('747,492') || line.includes('8,680') || line.includes('8680')) {
        console.log(`Line ${index + 1}: ${line}`);
      }
    });
  }
}

main().catch(console.error);
