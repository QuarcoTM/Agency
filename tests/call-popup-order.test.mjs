import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=new URL('../',import.meta.url).pathname;
function htmlFiles(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(entry.isDirectory() && !['.git','node_modules'].includes(entry.name)) return htmlFiles(path.join(dir,entry.name));
    return entry.isFile() && entry.name.endsWith('.html') ? [path.join(dir,entry.name)] : [];
  });
}

test('All floating phone popups display 0898 24 24 34 above 0893 64 66 68',()=>{
  let panels=0;
  for(const file of htmlFiles(root)){
    const html=fs.readFileSync(file,'utf8');
    const content=html.match(/<div class="call-panel-numbers">([\s\S]*?)<\/div>/);
    if(!content) continue;
    panels++;
    const numbers=[...content[1].matchAll(/href="tel:\+359(\d+)"/g)].map(m=>m[1]);
    assert.deepEqual(numbers,['898242434','893646668'],path.relative(root,file));
    assert.match(html,/class="call-fab"/);
  }
  assert.equal(panels,26,'Expected number of public phone popups; investigate changes to templates');
});
