import fs from 'fs';

const filePath = 'd:/oilshop/oilshop/pdf_extracted.json';

async function main() {
  if (!fs.existsSync(filePath)) {
    console.log("File not found");
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  console.log(`Type of data: ${typeof data}`);
  
  // Search keys/values for Max
  const matches = [];
  if (Array.isArray(data)) {
    console.log(`Data is array of length ${data.length}`);
    data.forEach((item, index) => {
      const str = JSON.stringify(item);
      if (str.toLowerCase().includes('max')) {
        matches.push({ index, item });
      }
    });
  } else {
    console.log("Data keys:", Object.keys(data).slice(0, 50));
    for (const key of Object.keys(data)) {
      if (key.toLowerCase().includes('max') || JSON.stringify(data[key]).toLowerCase().includes('max')) {
        matches.push({ key, val: data[key] });
      }
    }
  }

  console.log(`Found ${matches.length} matches:`);
  console.log(JSON.stringify(matches.slice(0, 10), null, 2));
}

main().catch(console.error);
