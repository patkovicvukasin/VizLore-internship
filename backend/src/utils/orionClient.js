const ORION_URL = process.env.ORION_URL || 'http://orion:1026';
const FIWARE_SERVICE = process.env.FIWARE_SERVICE || 'zest';
const FIWARE_SERVICEPATH = process.env.FIWARE_SERVICEPATH || '/';

const BATCH_SIZE = 100;

async function sendBatch(entitiesBatch) {
  const res = await fetch(`${ORION_URL}/v2/op/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Fiware-Service': FIWARE_SERVICE,
      'Fiware-ServicePath': FIWARE_SERVICEPATH,
    },
    body: JSON.stringify({
      actionType: 'APPEND',
      entities: entitiesBatch,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Orion ${res.status} – ${txt}`);
  }
}

export async function upsertEntities(entities) {
  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);
    console.log(`▶ Sending batch ${i/BATCH_SIZE + 1} (${batch.length} entities)`);
    try {
      await sendBatch(batch);
    } catch (err) {
      console.error('❌ Failed batch payload:', JSON.stringify(batch, null, 2));
      throw err;
    }
  }
}
