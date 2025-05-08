const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const files = ['prvi.csv', 'drugi.csv', 'treci.csv'];
const csvFolder = path.join(__dirname, 'csv');
const outputFolder = path.join(__dirname, 'converted-ld');

if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

files.forEach((filename, fileIndex) => {
  const inputPath = path.join(csvFolder, filename);
  const csvContent = fs.readFileSync(inputPath, 'utf8');
  const rows = csvContent.split('\n').map(r => r.trim()).filter(Boolean);

  let entries = [];

  if (filename.startsWith('prvi')) {
    const userHeaders = rows[2].split(',');
    const techLabels = rows[3].split(',');
    const combinedHeaders = userHeaders.map((header, i) => {
      const label = techLabels[i] || '';
      if (!header && !label) return `column_${i}`;
      if (!header) return label.trim();
      if (!label) return header.trim();
      return `${header.trim()} [${label.trim()}]`;
    });

    const dataRows = rows.slice(4);
    entries = dataRows.map((row, rowIndex) => {
      const values = row.split(',');
      const obj = {
        '@context': 'https://schema.lab.fiware.org/ld/context',
        'id': `urn:ngsi-ld:ZestEntry:${fileIndex}-${rowIndex}`,
        'type': 'ZestEntry'
      };

      combinedHeaders.forEach((key, i) => {
        obj[key] = {
          'type': 'Property',
          'value': values[i] || null
        };
      });

      return obj;
    });
  } else {
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

    entries = parsed.data.map((row, rowIndex) => {
      const obj = {
        '@context': 'https://schema.lab.fiware.org/ld/context',
        'id': `urn:ngsi-ld:ZestEntry:${fileIndex}-${rowIndex}`,
        'type': 'ZestEntry'
      };

      Object.keys(row).forEach((key) => {
        obj[key] = {
          'type': 'Property',
          'value': row[key] || null
        };
      });

      return obj;
    });
  }

  const outputPath = path.join(outputFolder, filename.replace('.csv', '.jsonld'));
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));
  console.log(`JSON-LD konverzija završena za: ${filename}`);
});
