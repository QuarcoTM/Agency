import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('About page has two equal visual tap-to-call buttons with correct numbers',()=>{
  const html=read('za-nas/index.html');
  const css=read('assets/about/about.css');
  const buttons=[...html.matchAll(/<a class="button about-v2-phone-button(?: about-v2-phone-secondary)?" href="tel:\+(\d+)"/g)];
  assert.equal(buttons.length,2,'Both agency phone numbers must be visually prominent buttons');
  assert.deepEqual(buttons.map(x=>x[1]),['359893646668','359898242434']);
  assert.match(css,/\.about-v2-contact-actions \.about-v2-phone-button\{/);
  assert.match(css,/\.about-v2-contact-actions \.about-v2-phone-secondary\{/);
  assert.ok(html.includes('/assets/about/about.css?v=2'));
});
test('No archive-photo/old-phone disclaimer anywhere in public HTML',()=>{
  const excluded=new Set(['.git','node_modules']);
  const stack=[new URL(root).pathname];
  const offending=[];
  while(stack.length){
    const dir=stack.pop();
    for(const f of fs.readdirSync(dir,{withFileTypes:true})){
      if(f.isDirectory()&&!excluded.has(f.name))stack.push(path.join(dir,f.name));
      else if(f.isFile()&&f.name.endsWith('.html')){
        const content=fs.readFileSync(path.join(dir,f.name),'utf8');
        if(/За актуална връзка|надписи върху архивни снимки|предишни номера/i.test(content))offending.push(path.relative(new URL(root).pathname,path.join(dir,f.name)));
      }
    }
  }
  assert.deepEqual(offending,[],'Remove disclaimers from public pages');
});
