const fs = require('fs');

const jsonPath = 'c:/instaquote/src/Data/templates_smart_data.json';

try {
    console.log('Reading file from:', jsonPath);
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    const categories = new Set();
    const filenames = [];

    data.forEach(item => {
        const parts = item.imagePath.split('/');
        if (parts.length >= 3) {
            categories.add(parts[parts.length - 2]);
        }

        const lowerPath = item.imagePath.toLowerCase();
        if (lowerPath.includes('year') || lowerPath.includes('ano') || lowerPath.includes('passagem')) {
            filenames.push(item.imagePath);
        }
    });

    const output = [
        '--- CATEGORIES FOUND ---',
        ...Array.from(categories).sort(),
        '\n--- RELEVANT FILES ---',
        ...filenames.slice(0, 50)
    ].join('\n');

    fs.writeFileSync('c:/instaquote/debug_output.txt', output);
    console.log('Output written to c:/instaquote/debug_output.txt');

} catch (err) {
    console.error('Error:', err.message);
}
