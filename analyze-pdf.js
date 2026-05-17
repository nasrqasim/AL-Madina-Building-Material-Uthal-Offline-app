const fs = require('fs');

const data = JSON.parse(fs.readFileSync('d:/oilshop/oilshop/pdf_extracted.json', 'utf8'));

const results = [];

data.Pages.forEach((page, pageIdx) => {
    const lines = {};
    page.Texts.forEach(text => {
        const y = text.y;
        if (!lines[y]) lines[y] = [];
        lines[y].push({
            x: text.x,
            t: decodeURIComponent(text.R[0].T).trim()
        });
    });

    Object.keys(lines).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(y => {
        const sortedTexts = lines[y].sort((a, b) => a.x - b.x);
        results.push({
            page: pageIdx + 1,
            y: parseFloat(y),
            texts: sortedTexts
        });
    });
});

fs.writeFileSync('d:/oilshop/oilshop/pdf_analysis.json', JSON.stringify(results, null, 2));
console.log('Analysis done.');
