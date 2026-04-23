const fs = require('fs');
const content = fs.readFileSync('front_end/src/pages/Dashboard.jsx', 'utf8');
const stack = [];
const pairs = { '(': ')', '{': '}', '[': ']' };
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if ('({['.includes(char)) {
      stack.push({ char, line: i + 1 });
    } else if (')}]'.includes(char)) {
      if (stack.length === 0) {
        console.log(`Extra closing ${char} at line ${i + 1}`);
        process.exit(0);
      }
      const last = stack.pop();
      if (pairs[last.char] !== char) {
        console.log(`Mismatch: ${last.char} (line ${last.line}) with ${char} (line ${i + 1})`);
        process.exit(0);
      }
    }
  }
}

if (stack.length > 0) {
  stack.forEach(s => console.log(`Unclosed ${s.char} from line ${s.line}`));
} else {
  console.log("Balanced (ignoring strings/comments)");
}
