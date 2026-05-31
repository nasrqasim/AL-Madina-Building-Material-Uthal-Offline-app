import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory && !f.startsWith('.') && f !== 'node_modules') {
            walkDir(dirPath, callback);
        } else if (!isDirectory) {
            callback(dirPath);
        }
    });
}

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('Party') && (content.includes('balance') || content.includes('findByIdAndUpdate') || content.includes('save'))) {
            if (content.includes('debit') || content.includes('credit') || content.includes('updateParty')) {
                console.log(`Potential party balance update in ${filePath}`);
            }
        }
    }
});
