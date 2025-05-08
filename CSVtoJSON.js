const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const files = ['prvi.csv', 'drugi.csv', 'treci.csv'];
const csvFolder = path.join(__dirname, 'csv');
const outputFolder = path.join(__dirname, 'converted');

if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

files.forEach((filename) => {
  const inputPath = path.join(csvFolder, filename);
  const csvContent = fs.readFileSync(inputPath, 'utf8');
  const rows = csvContent.split('\n').map(r => r.trim()).filter(Boolean);

  if (filename.startsWith('prvi')) {
    const userHeaders = rows[2].split(','); // "Temperature", "pH",...
    const techLabels = rows[3].split(',');  // "R01.R.Trend.Temp.Value",...

    const combinedHeaders = userHeaders.map((header, i) => {
      const label = techLabels[i] || "";
      if (header === "") return label || `column_${i}`;
      return label ? `${header.trim()} [${label.trim()}]` : header.trim();
    });

    const dataRows = rows.slice(4);
    const jsonData = dataRows.map((row) => {
      const values = row.split(',');
      const entry = {};
      combinedHeaders.forEach((key, i) => {
        entry[key] = values[i] || null;
      });
      return entry;
    });

    fs.writeFileSync(
      path.join(outputFolder, filename.replace('.csv', '.json')),
      JSON.stringify(jsonData, null, 2)
    );
    console.log(`✅ (kombinovano) Konvertovan fajl: ${filename}`);
  } else {
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    fs.writeFileSync(
      path.join(outputFolder, filename.replace('.csv', '.json')),
      JSON.stringify(parsed.data, null, 2)
    );
    console.log(`Konvertovan fajl: ${filename}`);
  }
});
