import fs from 'fs';
import path from 'path';

const scratchDir = 'd:/oilshop/oilshop/scratch';

async function main() {
  const files = fs.readdirSync(scratchDir).filter(f => f.endsWith('.txt'));
  
  const keywords = ['7454', '1187', '8680', '8,680', '1152', '1153', '1168', '419166', '773438', '826424'];
  
  for (const f of files) {
    const filePath = path.join(scratchDir, f);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let fileHeaderShown = false;
    lines.forEach((line, index) => {
      const matched = keywords.find(kw => line.includes(kw));
      if (matched) {
        if (!fileHeaderShown) {
          console.log(`\n================ MATCHES IN ${f} ================`);
          fileHeaderShown = true;
        }
        console.log(`Line ${index + 1} (matched "${matched}"): ${line.trim()}`);
      }
    });
  }
}

main().catch(console.error);
