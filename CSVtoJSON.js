const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const files = ['zest_r4_clean(raw_data).csv', 'on-line_ralf.csv', 'off-line_ralf.csv'];
const csvFolder = path.join(__dirname, 'csv');
const outputFolder = path.join(__dirname, 'converted-json');

if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

// Poboljšana detekcija tipova
const detectType = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // Boolean
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;

  // Broj
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;

  return trimmed;
};

// Bezbedno parsiranje reda
const parseRow = (row) => {
  try {
    return Papa.parse(row, { delimiter: ',', skipEmptyLines: false }).data[0];
  } catch {
    return row.split(',');
  }
};

files.forEach((filename) => {
  try {
    const inputPath = path.join(csvFolder, filename);
    const csvContent = fs.readFileSync(inputPath, 'utf8');
    const rows = csvContent.split('\n').map(r => r.trim()).filter(Boolean);

    let jsonData;

    if (filename.startsWith('zest_r4_clean(raw_data)')) {
      const userHeaders = parseRow(rows[2]);
      const techLabels = parseRow(rows[3]);

      const combinedHeaders = userHeaders.map((header, i) => {
        const label = techLabels[i] || '';
        if (!header && !label) return `column_${i}`;
        if (!header) return label.trim();
        if (!label) return header.trim();
        return `${header.trim()} [${label.trim()}]`;
      });

      const dataRows = rows.slice(4);
      jsonData = dataRows.map((row, rowIndex) => {
        const values = parseRow(row);
        const entry = {};

        if (values.length !== combinedHeaders.length) {
          console.warn(`⚠️  Red ${rowIndex + 5} ima ${values.length} kolona, očekivano ${combinedHeaders.length}`);
        }

        combinedHeaders.forEach((key, i) => {
          if (key) {
            entry[key] = i < values.length ? detectType(values[i]) : null;
          }
        });

        return entry;
      });
    } else {
      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transform: value => detectType(value)
      });
      jsonData = parsed.data;
    }

    const outputPath = path.join(outputFolder, filename.replace('.csv', '.json'));
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Konvertovan fajl: ${filename}`);
  } catch (error) {
    console.error(`Greška pri konverziji ${filename}:`, error.message);
  }
});
