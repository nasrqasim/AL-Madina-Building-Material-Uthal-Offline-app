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
    if (line.toLowerCase().includes('media__') || line.toLowerCase().includes('screenshot') || line.toLowerCase().includes('png') || line.toLowerCase().includes('jpg')) {
      console.log(`--- Line ${lineCount} ---`);
      try {
        const obj = JSON.parse(line);
        console.log(`Source: ${obj.source}, Type: ${obj.type}`);
        if (obj.thinking) console.log("Thinking: " + obj.thinking.substring(0, 500));
        if (obj.content) console.log("Content: " + obj.content.substring(0, 1000));
      } catch (e) {
        console.log(line.substring(0, 500));
      }
    }
  }
}

main().catch(console.error);
