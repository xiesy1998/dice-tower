import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { simulate } from './simulate.mjs';

test('twelve seeded complete campaigns reach a terminal state with valid saves at every action',()=>{
 const results=Array.from({length:12},(_,i)=>simulate(i+1));
 assert.ok(results.every(r=>['won','lost'].includes(r.phase)));
 assert.ok(results.some(r=>r.phase==='won'));
 assert.ok(results.every(r=>r.steps<3000));
 assert.ok(results.filter(r=>r.phase==='won').every(r=>r.floor===12&&r.bank===174));
});
test('standalone build parses and has no external runtime assets or module imports',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('<html lang="zh-CN">'));
 assert.ok(html.includes('九乘九楼层棋盘'));
 assert.ok(html.includes('点击中央骰子开始掷骰'));
 assert.ok(html.includes('aria-labelledby="modal-title"'));
 assert.ok(html.includes('prefers-reduced-motion:reduce'));
 assert.equal(/<script[^>]+src=/.test(html),false);
 assert.equal(/<link[^>]+rel="stylesheet"/.test(html),false);
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
 assert.equal(/^import /m.test(script),false);
 assert.equal(/\bfetch\(/.test(script),false);
 assert.equal(/https?:\/\//.test(script.replaceAll('http://www.w3.org/2000/svg','')),false);
 assert.doesNotThrow(()=>new vm.Script(script));
});
