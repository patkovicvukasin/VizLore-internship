const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const files = ['zest_r4_clean(raw_data).csv', 'on-line_ralf.csv', 'off-line_ralf.csv'];
const csvFolder = path.join(__dirname, 'csv');
const outputFolder = path.join(__dirname, 'converted-ngsi');

if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

// Detekcija tipa vrednosti
const determineProperty = (value) => {
  if (value === null || value === undefined || value === '') {
    return { type: 'Text', value: null };
  }

  const trimmed = String(value).trim();
  if (!trimmed) return { type: 'Text', value: null };

  if (trimmed.toLowerCase() === 'true') return { type: 'Boolean', value: true };
  if (trimmed.toLowerCase() === 'false') return { type: 'Boolean', value: false };

  const num = Number(trimmed);
  if (!isNaN(num)) return { type: 'Number', value: num };

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return { type: 'DateTime', value: trimmed };
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
    return { type: 'DateTime', value: new Date(trimmed).toISOString() };
  }

  return { type: 'Text', value: trimmed };
};

// Normalizacija naziva atributa
const normalizeAttributeName = (name) => {
  return name
    .normalize('NFD') // Razlaganje Unicode karaktera
    .replace(/[\u0300-\u036f]/g, '') // Uklanjanje dijakritika
    .replace(/[^a-zA-Z0-9_]/g, '_') // Zamena nedozvoljenih karaktera sa '_'
    .replace(/_+/g, '_') // Zamena više uzastopnih '_' sa jednim '_'
    .replace(/^_+|_+$/g, ''); // Uklanjanje '_' sa početka i kraja
};

files.forEach((filename) => {
  try {
    const inputPath = path.join(csvFolder, filename);
    const csvContent = fs.readFileSync(inputPath, 'utf8');
    const rows = csvContent.split('\n').map(r => r.trim()).filter(Boolean);

    const fileKey = filename.replace('.csv', '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    let entries = [];

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
        const values = row.split(',').map(v => v.trim());
        const entity = {
          id: `urn:ngsi-ld:ZestEntry:${fileKey}-${rowIndex}`,
          type: 'ZestEntry'
        };

        combinedHeaders.forEach((key, i) => {
          if (key) {
            const normalizedKey = normalizeAttributeName(key);
            const value = i < values.length ? values[i] : null;
            const { type, value: parsedValue } = determineProperty(value);
            entity[normalizedKey] = { type, value: parsedValue };
          }
        });

        return entity;
      });
    } else {
      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => {
          const { value: parsedValue } = determineProperty(value);
          return parsedValue;
        }
      });

      entries = parsed.data.map((row, rowIndex) => {
        const entity = {
          id: `urn:ngsi-ld:ZestEntry:${fileKey}-${rowIndex}`,
          type: 'ZestEntry'
        };

        Object.keys(row).forEach((key) => {
          const normalizedKey = normalizeAttributeName(key);
          const value = row[key];
          const { type } = determineProperty(value);
          entity[normalizedKey] = { type, value };
        });

        return entity;
      });
    }

    const outputPath = path.join(outputFolder, filename.replace('.csv', '.ngsi.json'));
    fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));
    console.log(`✅ NGSIv2 konverzija uspešna za: ${filename}`);

  } catch (err) {
    console.error(`Greška pri obradi fajla ${filename}:`, err.message);
  }
});
