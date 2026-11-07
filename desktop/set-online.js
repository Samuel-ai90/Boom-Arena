// Build step: bake the hosted online server into the desktop app.
//   BOOM_ONLINE_URL=https://boom-arena-xxxx.onrender.com npm run dist:win
const fs = require('fs'), path = require('path');
const url = String(process.env.BOOM_ONLINE_URL || '').trim();
if (url && !/^https?:\/\/[^\s/]+\/?$/i.test(url)) { console.error('BOOM_ONLINE_URL must look like https://name.onrender.com'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, 'online.json'), JSON.stringify({ url: url.replace(/\/$/, '') }) + '\n');
console.log(url ? 'Play Online -> ' + url : 'Play Online -> local server only (set BOOM_ONLINE_URL to use a hosted one)');
