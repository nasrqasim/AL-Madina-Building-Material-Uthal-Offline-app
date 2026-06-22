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

  const patterns = [/747,?745/, /747,?492/, /784,?195/, /122,?399/, /85,?949/, /122,?652/];
  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    const match = patterns.some(pat => pat.test(line));
    if (match) {
      console.log(`\n================ LINE ${lineCount} ================`);
      try {
        const obj = JSON.parse(line);
        console.log(`Source: ${obj.source}, Type: ${obj.type}`);
        if (obj.thinking) {
          console.log(`THINKING: ${obj.thinking}`);
        }
        if (obj.content) {
          console.log(`CONTENT: ${obj.content}`);
        }
      } catch (e) {
        console.log(line.substring(0, 1000));
      }
    }
  }
}

main().catch(console.error);
