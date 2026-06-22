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
    if (lineCount >= 2155 && lineCount <= 2165) {
      console.log(`--- Line ${lineCount} ---`);
      try {
        const obj = JSON.parse(line);
        console.log(obj.thinking || obj.content || line);
      } catch (e) {
        console.log(line);
      }
    }
  }
}

main().catch(console.error);
