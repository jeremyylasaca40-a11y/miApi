const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.js');
let code = fs.readFileSync(file, 'utf8');
code = code.replace("origin: 'http://localhost:5173'", "origin: '*'");
fs.writeFileSync(file, code, 'utf8');
console.log('INDEX_JS_UPDATED');

