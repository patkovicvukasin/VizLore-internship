const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const files = ['zest_r4_clean(raw_data).csv', 'on-line_ralf.csv', 'off-line_ralf.csv'];
const csvFolder = path.join(__dirname, 'csv');
const outputFolder = path.join(__dirname, 'converted-ld');

if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

const determineValueType = (value) => {
  if (value === null || value === undefined || value === '') return { type: 'Property', value: null };

  const trimmed = String(value).trim();
  if (!trimmed) return { type: 'Property', value: null };

  if (trimmed.toLowerCase() === 'true') return { type: 'Property', value: true };
  if (trimmed.toLowerCase() === 'false') return { type: 'Property', value: false };

  const num = Number(trimmed);
  if (!isNaN(num)) return { type: 'Property', value: num };

  if (/^\d{1,2}\/\d{1,2}\/\d{4}( \d{1,2}:\d{2}:\d{2})?$/.test(trimmed)) {
    const iso = new Date(trimmed).toISOString();
    return { type: 'Property', value: iso };
  }

  return { type: 'Property', value: trimmed };
};

files.forEach((filename) => {
  try {
    const inputPath = path.join(csvFolder, filename);
    const csvContent = fs.readFileSync(inputPath, 'utf8');
    const rows = csvContent.split('\n').map(r => r.trim()).filter(Boolean);

    let entries = [];
    const filePrefix = filename.replace('.csv', '').replace(/\s+/g, '_');

    if (filename.startsWith('zest_r4_clean(raw_data)')) {
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
          'id': `urn:ngsi-ld:ZestEntry:${filePrefix}-${rowIndex}`,
          'type': 'ZestEntry'
        };

        combinedHeaders.forEach((key, i) => {
          if (key) {
            const { type, value } = determineValueType(values[i]);
            obj[key] = { type, value };
          }
        });

        return obj;
      });
    } else {
      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
      });

      entries = parsed.data.map((row, rowIndex) => {
        const obj = {
          '@context': 'https://schema.lab.fiware.org/ld/context',
          'id': `urn:ngsi-ld:ZestEntry:${filePrefix}-${rowIndex}`,
          'type': 'ZestEntry'
        };

        Object.keys(row).forEach((key) => {
          const { type, value } = determineValueType(row[key]);
          obj[key] = { type, value };
        });

        return obj;
      });
    }

    const outputPath = path.join(outputFolder, filename.replace('.csv', '.jsonld'));
    fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));
    console.log(`✅ JSON-LD konverzija uspešna za: ${filename}`);

  } catch (error) {
    console.error(`❌ Greška pri konverziji ${filename}:`, error.message);
  }
});
