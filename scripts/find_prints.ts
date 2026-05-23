import fs from "fs";
import path from "path";

const ignoreDirs = ["node_modules", ".next", ".git", "artifacts", "scratch", ".gemini"];

function searchFiles(dir: string, results: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        searchFiles(fullPath, results);
      }
    } else {
      if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (content.includes("print") || content.includes("Printer") || content.includes("printPage") || content.includes("printListDocument")) {
          results.push(fullPath);
        }
      }
    }
  }
  return results;
}

const erpDir = path.join(__dirname, "../src");
const results = searchFiles(erpDir);
console.log("=== FILES WITH PRINTING LOGIC ===");
results.forEach(f => console.log(path.relative(path.join(__dirname, ".."), f)));
