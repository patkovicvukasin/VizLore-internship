// backend/src/utils/convertCsv.js
//--------------------------------------------------------------
//  Pružamo 2 funkcije:  toJsonLd(rows)  i  toNgsiV2(rows)
//  rows = [ { col1: '...', col2: '...' }, … ]   (jedan CSV red = jedan objekat)
//--------------------------------------------------------------

/* ---------- zaједничке помоћне ---------- */
function determineValueType(v) {
  if (v === null || v === undefined || v === '') return { type: 'Property', value: null };
  const t = String(v).trim();
  if (!t) return { type: 'Property', value: null };
  if (t.toLowerCase() === 'true')  return { type: 'Property', value: true  };
  if (t.toLowerCase() === 'false') return { type: 'Property', value: false };

  const n = Number(t);
  if (!isNaN(n)) return { type: 'Property', value: n };

  if (/^\d{4}-\d{2}-\d{2}T/.test(t) || /^\d{4}-\d{2}-\d{2}$/.test(t) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(t)) {
    return { type: 'Property', value: new Date(t).toISOString() };
  }
  return { type: 'Property', value: t };
}

function determineProperty(v) {
  if (v === null || v === undefined || v === '') return { type: 'Text', value: null };
  const t = String(v).trim();
  if (!t) return { type: 'Text', value: null };
  if (t.toLowerCase() === 'true')  return { type: 'Boolean',  value: true  };
  if (t.toLowerCase() === 'false') return { type: 'Boolean',  value: false };
  const n = Number(t);
  if (!isNaN(n)) return { type: 'Number', value: n };
  if (/^\d{4}-\d{2}-\d{2}T/.test(t) || /^\d{4}-\d{2}-\d{2}$/.test(t) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(t)) {
    return { type: 'DateTime', value: new Date(t).toISOString() };
  }
  return { type: 'Text', value: t };
}

function normalizeAttr(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

/* ---------- JSON-LD ---------- */
function toJsonLd(rows) {
  return rows.map((row, idx) => {
    const entity = {
      '@context': 'https://schema.lab.fiware.org/ld/context',
      id:  `urn:ngsi-ld:CsvEntry:${idx}`,
      type: 'CsvEntry'
    };
    Object.entries(row).forEach(([key, val]) => {
      const { type, value } = determineValueType(val);
      entity[normalizeAttr(key)] = { type, value };
    });
    return entity;
  });
}

/* ---------- NGSI-v2 ---------- */
function toNgsiV2(rows) {
  return rows.map((row, idx) => {
    const entity = {
      id:   `CsvEntry:${idx}`,
      type: 'CsvEntry'
    };
    Object.entries(row).forEach(([key, val]) => {
      const { type, value } = determineProperty(val);
      entity[normalizeAttr(key)] = { type, value };
    });
    return entity;
  });
}

export { toJsonLd, toNgsiV2 };