import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(new URL('./presets.json', import.meta.url)));
if (!data.version || !Array.isArray(data.presets)) throw new Error('Invalid preset catalog');
for (const p of data.presets) {
  if (!p.id || !p.name || !p.type || !Array.isArray(p.controls)) throw new Error(`Invalid preset: ${p.id}`);
}
console.log(`SRNC preset catalog OK — ${data.presets.length} presets`);
