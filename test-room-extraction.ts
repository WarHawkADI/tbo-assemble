import fs from 'fs';
import path from 'path';
import { parseContractLocally } from './src/lib/local-parser';

(async () => {
  const demoDir = path.join(__dirname, 'demo-docs');
  const files = fs.readdirSync(demoDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  for (const file of files) {
    console.log('--------------------------------------------------');
    console.log(file);
    const buf = fs.readFileSync(path.join(demoDir, file));
    const res = await parseContractLocally(buf, 'application/pdf');
    if (!res.success || !res.data) {
      console.log('Parse failed:', res.error, res.validation);
      continue;
    }
    console.log('venue:', res.data.venue);
    console.log('eventName:', res.data.eventName, 'eventType:', res.data.eventType, 'clientName:', res.data.clientName);
    console.log('rooms:', JSON.stringify(res.data.rooms, null, 2));
    console.log('addOns:', JSON.stringify(res.data.addOns, null, 2));
    console.log('attritionRules:', JSON.stringify(res.data.attritionRules, null, 2));
  }
})();