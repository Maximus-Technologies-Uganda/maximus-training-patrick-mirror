const fs = require('fs');
function loadJSON(p) {
  try {
    if (!fs.existsSync(p)) return [];
    const t = fs.readFileSync(p, 'utf8').trim();
    return t ? JSON.parse(t) : [];
  } catch (e) { return []; }
}
function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}
module.exports = { loadJSON, saveJSON };