import fs from 'fs';
import readline from 'readline';

const transcriptPath = 'C:\\Users\\PMLS\\.gemini\\antigravity\\brain\\f957ce9c-ff43-4913-b7d5-51d755061185\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  if (!fs.existsSync(transcriptPath)) {
    console.log("Transcript not found");
    return;
  }
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('1187') || line.includes('7454') || line.includes('SV') || line.includes('8680') || line.includes('8,680')) {
      console.log(`--- Line ${lineCount} ---`);
      try {
        const obj = JSON.parse(line);
        console.log(`Source: ${obj.source}, Type: ${obj.type}`);
        if (obj.content) console.log(obj.content.substring(0, 1000));
        else console.log(JSON.stringify(obj).substring(0, 1000));
      } catch (e) {
        console.log(line.substring(0, 1000));
      }
    }
  }
}

main().catch(console.error);
