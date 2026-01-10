const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'src/Data/templates_smart_data.json');
try {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    const categories = new Set();
    const filenames = [];

    data.forEach(item => {
        const parts = item.imagePath.split('/');
        // minhas_imagens / Category / filename
        if (parts.length >= 3) {
            categories.add(parts[parts.length - 2]);
        }
        if (item.imagePath.toLowerCase().includes('year') || item.imagePath.toLowerCase().includes('ano')) {
            filenames.push(item.imagePath);
        }
    });

    console.log('Categories found:', Array.from(categories).sort());
    console.log('Files with "year" or "ano":', filenames);

} catch (err) {
    console.error('Error:', err);
}
