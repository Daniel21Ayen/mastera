const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/expo/virtual/streams.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  const target = 'for(const r in Wo)Object.prototype.hasOwnProperty.call(Wo,r)&&Object.defineProperty(wo,r,{value:Wo[r],writable:!0,configurable:!0})';
  const replacement = 'for(const r in Wo)if(Object.prototype.hasOwnProperty.call(Wo,r)){try{const d=Object.getOwnPropertyDescriptor(wo,r);if(!d||d.configurable){Object.defineProperty(wo,r,{value:Wo[r],writable:!0,configurable:!0})}else if(d.writable){wo[r]=Wo[r]}}catch(e){try{wo[r]=Wo[r]}catch(_){}}}';

  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(targetFile, content);
    console.log('[patch-expo-streams] Successfully patched expo/virtual/streams.js');
  }
}
