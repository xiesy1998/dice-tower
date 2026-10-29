import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { CARDS,RELICS } from '../cards.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
for(const f of ['gdd.md','prd.md','interaction.md']) {
 const source=await readFile(path.join(root,'specs/dicebound-tower',f),'utf8');
 assert.ok(source.includes('文档状态.status: approved'),`${f} requires approval`);
 assert.ok(source.length>700,`${f} must contain a real spec`);
}
for(const f of ['index.html','template.html','style.css','app.mjs','engine.mjs','cards.mjs','art.mjs','dist/index.html','.workflow/LICENSE',...['spec.md','research.md','plan.md','tasks.md','quickstart.md','validation.md','asset-manifest.yaml','contracts/style-contract.yaml','contracts/screen-contract.yaml','contracts/component-contract.yaml'].map(f=>'specs/dicebound-tower/'+f)])await access(path.join(root,f));
const componentSource=await readFile(path.join(root,'specs/dicebound-tower/contracts/component-contract.yaml'),'utf8');
const componentIds=new Set([...componentSource.matchAll(/- id: ([\w-]+)/g)].map(m=>m[1]));
const screenSource=await readFile(path.join(root,'specs/dicebound-tower/contracts/screen-contract.yaml'),'utf8');
for(const match of screenSource.matchAll(/components: \[([^\]]+)\]/g))for(const id of match[1].split(',').map(v=>v.trim()))assert.ok(componentIds.has(id),`Unregistered screen component: ${id}`);
for(const contract of ['contracts/component-contract.yaml','asset-manifest.yaml']){
 const source=await readFile(path.join(root,'specs/dicebound-tower',contract),'utf8');
 for(const match of source.matchAll(/^    (?:path|source): (.+)$/gm))await access(path.join(root,match[1].trim()));
}
assert.equal(Object.keys(CARDS).length,36);assert.equal(Object.keys(RELICS).length,8);
assert.equal(await readFile(path.join(root,'index.html'),'utf8'),await readFile(path.join(root,'dist/index.html'),'utf8'));
console.log('Web-adapted workflow validation passed: approved specs, style and screen contracts, actual source assets and standalone build.');
