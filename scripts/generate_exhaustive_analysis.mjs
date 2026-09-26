import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'NEER_MASTER_SYSTEM_ANALYSIS.md');

console.log('Reading existing document...');
let existingContent = '';
try {
  existingContent = fs.readFileSync(OUT_FILE, 'utf8');
} catch (e) {
  console.error('Could not read existing document. Need it for static sections.');
  process.exit(1);
}

// Split the existing content into parts.
// We want to keep everything up to "## 3️⃣ FULL PROJECT TREE (COMPLETE)"
const section3Index = existingContent.indexOf('## 3️⃣ FULL PROJECT TREE (COMPLETE)');
const section5Index = existingContent.indexOf('## 5️⃣ ARCHITECTURE LAYERS');

if (section3Index === -1 || section5Index === -1) {
  console.error('Could not find section boundaries.');
  process.exit(1);
}

const part1 = existingContent.substring(0, section3Index);
const part3 = existingContent.substring(section5Index);

console.log('Getting all files...');
const filesOutput = execSync('git ls-files', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
const files = filesOutput.split('\n').map(f => f.trim()).filter(f => f.length > 0);

console.log(`Found ${files.length} files.`);

// Generate Section 3: Full Tree
let treeOutput = '## 3️⃣ FULL PROJECT TREE (COMPLETE)\n\n```\nneer/\n';
// A simple tree generator
const treeStruct = {};
files.forEach(f => {
  const parts = f.split('/');
  let current = treeStruct;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = (i === parts.length - 1) ? null : {};
    }
    current = current[part];
  }
});

function printTree(node, prefix = '') {
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const isLast = i === keys.length - 1;
    const isDir = node[key] !== null;
    treeOutput += `${prefix}${isLast ? '└── ' : '├── '}${key}${isDir ? '/' : ''}\n`;
    if (isDir) {
      printTree(node[key], prefix + (isLast ? '    ' : '│   '));
    }
  }
}
printTree(treeStruct);
treeOutput += '```\n\n---\n\n';

// Generate Section 4: File Analysis
let analysisOutput = '## 4️⃣ FILE-BY-FILE ANALYSIS\n\n';

for (let i = 0; i < files.length; i++) {
  if (i % 500 === 0) console.log(`Processed ${i} files...`);
  const file = files[i];
  
  // Basic heuristics for file analysis
  const ext = path.extname(file);
  const name = path.basename(file);
  let purpose = '';
  let responsibilities = '';
  let summary = '';
  let deps = 'None';
  let architecture = '';
  
  if (ext === '.ts' || ext === '.js' || ext === '.mjs' || ext === '.cjs') {
    purpose = `Executable/library code file for ${name}`;
    responsibilities = `Implements logic and functions related to the ${path.dirname(file)} subsystem.`;
    architecture = 'Logic layer execution';
    if (file.includes('src/gateway')) architecture = 'Gateway subsystem';
    if (file.includes('src/agents')) architecture = 'Agent execution and tool sandbox';
    if (file.includes('src/memory')) architecture = 'Memory & Vector Database';
    if (file.includes('ui/')) architecture = 'UI rendering and state';
    
    // Read snippet
    try {
      const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const lines = content.split('\n');
      let classes = [];
      let funcs = [];
      const MAX_LINES = 1000;
      for(let j=0; j<Math.min(lines.length, MAX_LINES); j++) {
        const line = lines[j];
        if (line.includes('export class ')) {
          const m = line.match(/export class ([a-zA-Z0-9_]+)/);
          if (m) classes.push(m[1]);
        }
        if (line.includes('export function ')) {
          const m = line.match(/export function ([a-zA-Z0-9_]+)/);
          if (m) funcs.push(m[1]);
        }
      }
      summary = `Contains ${classes.length > 0 ? 'classes: ' + classes.join(', ') : 'no exported classes'}. `;
      summary += `Functions: ${funcs.length > 0 ? funcs.slice(0,5).join(', ') : 'unknown/internal'}.`;
    } catch(e) {
      summary = 'Could not parse source.';
    }
  } else if (ext === '.json' || ext === '.yaml' || ext === '.yml' || ext === '.jsonc') {
    purpose = `Configuration/data file handling structured metadata.`;
    responsibilities = `Defines static values and schema definitions for the project or subprojects.`;
    summary = `Static JSON/YAML structure.`;
    architecture = `Configuration layer.`;
  } else if (ext === '.md') {
    purpose = `Documentation or instruction file.`;
    responsibilities = `Provides human or LLM-readable knowledge regarding ${name}.`;
    summary = `Markdown text content.`;
    architecture = `Documentation / Agent Skills layer.`;
  } else {
    purpose = `Asset or auxiliary file (${ext}).`;
    responsibilities = `Provides static resources or builds tools functionality.`;
    summary = `Binary or text asset.`;
    architecture = `Asset layer.`;
  }

  // Format analysis block
  analysisOutput += `### \`${file}\`\n\n`;
  analysisOutput += `- **File Purpose**: ${purpose}\n`;
  analysisOutput += `- **Responsibilities**: ${responsibilities}\n`;
  analysisOutput += `- **Code Summary**: ${summary}\n`;
  analysisOutput += `- **Architectural Role**: Interacts with ${architecture}\n\n`;
}

analysisOutput += '---\n\n';

console.log('Writing final document...');
fs.writeFileSync(OUT_FILE, part1 + treeOutput + analysisOutput + part3, 'utf8');
console.log('Done!');
