function determineValueType(v) {
  if (v == null || v === '') return { type: 'Property', value: null };
  const t = String(v).trim();
  if (!t) return { type: 'Property', value: null };
  if (t.toLowerCase() === 'true')  return { type: 'Property', value: true  };
  if (t.toLowerCase() === 'false') return { type: 'Property', value: false };
  const n = Number(t);
  if (!isNaN(n)) return { type: 'Property', value: n };
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(t) ||
      /^\d{1,2}\/\d{1,2}\/\d{4}( \d{1,2}:\d{2}:\d{2})?$/.test(t)) {
    return { type: 'Property', value: new Date(t).toISOString() };
  }
  return { type: 'Property', value: t };
}

function determineProperty(v, rowIdx = -1, attrName = '') {
  if (v == null || v === '') return { type: 'Text', value: null };

  const original = String(v);
  let t = original.trim().normalize('NFD');

  t = t.replace(/[\u0300-\u036f]/g, '');

  const nonAscii = [...new Set((t.match(/[^\x00-\x7F]/g) || []))];
  if (nonAscii.length) {
    const codes = nonAscii
      .map(ch => `U+${ch.codePointAt(0).toString(16).toUpperCase()}`)
      .join(', ');
    console.warn(`WARN row ${rowIdx}, attr "${attrName}": non-ASCII [${codes}]`);
    t = t.replace(/[^\x00-\x7F]/g, '');
  }

  if (!t) return { type: 'Text', value: null };

  if (t.toLowerCase() === 'true')  return { type: 'Boolean', value: true  };
  if (t.toLowerCase() === 'false') return { type: 'Boolean', value: false };
  if (!isNaN(Number(t)))      return { type: 'Number',  value: Number(t) };
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(t) ||
      /^\d{1,2}\/\d{1,2}\/\d{4}( \d{1,2}:\d{2}:\d{2})?$/.test(t)) {
    return { type: 'DateTime', value: new Date(t).toISOString() };
  }

  const ctrls = [...new Set((t.match(/[\n\r\t]/g) || []))];
  if (ctrls.length) {
    console.warn(`WARN row ${rowIdx}, attr "${attrName}": ctrl chars [${ctrls.join(', ')}]`);
    t = t.replace(/[\n\r\t]+/g, ' ');
  }

  //important
  t = t.replace(/[<>"'=;()]/g, '');


  t = t.replace(/\s+/g, ' ').trim();

  if (/[^\x20-\x7E]/.test(t)) {
    console.error(`ERROR row ${rowIdx}, attr "${attrName}": leftover invalid chars in "${t}"`);
    t = t.replace(/[^\x20-\x7E]/g, '');
  }

  return { type: 'Text', value: t };
}

function normalizeAttr(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

// ---------- JSON-LD ----------
function toJsonLd(rows) {
  return rows.map((row, idx) => {
    const entity = {
      '@context': 'https://schema.lab.fiware.org/ld/context',
      id:  `urn:ngsi-ld:CsvEntry:${idx}`,
      type: 'CsvEntry'
    };
    Object.entries(row).forEach(([key, val]) => {
      const attr = normalizeAttr(key);
      if (!attr) {
        console.warn(`WARN row ${idx}: preskačem prazan atribut iz kolone "${key}"`);
        return;
      }
      const { type, value } = determineValueType(val);
      entity[attr] = { type, value };
    });
    return entity;
  });
}

// ---------- NGSI-v2 ----------
function toNgsiV2(rows) {
  return rows.map((row, idx) => {
    const entity = {
      id:   `CsvEntry:${idx}`,
      type: 'CsvEntry'
    };
    Object.entries(row).forEach(([key, val]) => {
      const attr = normalizeAttr(key);
      if (!attr) {
        console.warn(`WARN row ${idx}: preskačem prazan atribut iz kolone "${key}"`);
        return;
      }
      const { type, value } = determineProperty(val, idx, attr);
      entity[attr] = { type, value };
    });
    return entity;
  });
}

export { determineValueType, determineProperty, normalizeAttr, toJsonLd, toNgsiV2 };
