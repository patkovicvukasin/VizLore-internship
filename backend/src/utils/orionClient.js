// src/utils/orionClient.js
// Ova verzija koristi globalni fetch (Node.js 18+). Ako ti ne radi, instaliraj i otkomentariši:
// const fetch = require('node-fetch');

// UBACI samo osnovni URL bez "/v2" – ruta se dodaje niže
const ORION_URL = process.env.ORION_URL || 'http://orion:1026';

/**
 * Šalje NGSIv2 entitete u FIWARE Orion Context Broker
 * @param {Array} entities - niz entiteta po NGSIv2 specifikaciji
 * @throws {Error} ako Orion vrati status !== 2xx
 */
async function upsertEntities(entities) {
  const url = `${ORION_URL}/v2/op/update`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Fiware-Service': 'zest',        // tenant ime po potrebi
      'Fiware-ServicePath': '/'
    },
    body: JSON.stringify({
      actionType: 'append',            // možeš promeniti u 'APPEND' za usklađenost sa NGSIv2 spec
      entities
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Orion ${res.status} – ${txt}`);
  }
  // Opcionalno: return await res.json();
}

export { upsertEntities };
