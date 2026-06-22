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

  const keywords = ['131', '133', '384', '386', '506'];
  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    const match = keywords.find(kw => line.includes(kw));
    if (match) {
      console.log(`\n================ LINE ${lineCount} (matched keyword "${match}") ================`);
      try {
        const obj = JSON.parse(line);
        console.log(`Source: ${obj.source}, Type: ${obj.type}`);
        if (obj.thinking) {
          console.log(`THINKING:\n${obj.thinking}`);
        }
        if (obj.content) {
          console.log(`CONTENT:\n${obj.content}`);
        }
      } catch (e) {
        console.log(line.substring(0, 1000));
      }
    }
  }
}

main().catch(console.error);
