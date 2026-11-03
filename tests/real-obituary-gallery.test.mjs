import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const admin = read('admin/admin.js');
const adminHtml = read('admin/index.html');
const gallery = read('real-obituary-gallery.js');
const page = read('nekrolozi/index.html');
const styles = read('real-obituary-gallery.css');

function originalFunction(source,name){
  const start=source.indexOf('function '+name+'(');
  assert.ok(start>=0,'Missing function '+name);
  const firstBrace=source.indexOf('{',start);
  assert.ok(firstBrace>=0);
  let depth=0;
  for(let i=firstBrace;i<source.length;i++){
    if(source[i]==='{')depth++;
    else if(source[i]==='}'){
      depth--;
      if(depth===0)return source.slice(start,i+1).replace(/\s+/g,'');
    }
  }
  throw new Error('Unclosed '+name);
}

test('The public gallery contains exactly the eleven admin layout IDs and real captions',()=>{
  const choices=adminHtml.match(/<select id="obituary-design"[\s\S]*?<\/select>/)?.[0];
  assert.ok(choices);
  const options=Array.from(choices.matchAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g));
  assert.equal(options.length,11);
  for(const option of options) {
    assert.ok(gallery.includes('"id": "'+option[1]+'"'), 'Missing layout '+option[1]);
    assert.ok(gallery.includes('"label": "'+option[2]+'"'),'Missing original title: '+option[2]);
  }
});

test('Public rendering is derived from the admin drawing functions, not mock HTML designs',()=>{
  const functions=[
    'obituaryPeriod','formatObituaryShortDate','obituaryWrappedLines',
    'drawObituaryCornerCross','drawObituaryAngel','drawObituaryCandleBackground',
    'obituaryPrintGeometry','drawObituaryImageBackground','drawDoubleObituaryFrame',
    'drawObituaryFrame','obituaryPortraitPath','drawObituaryPortrait',
    'obituaryNameParts','drawObituaryFittedText','formatObituaryCeremonyText',
    'buildObituaryCeremonyText','drawObituaryFooter','drawDoubleObituaryPortrait',
    'paintDoubleObituary','paintObituary'
  ];
  for(const name of functions){
    assert.equal(originalFunction(gallery,name),originalFunction(admin,name),'Draw function drift: '+name);
  }
});

test('Preview placeholders are exactly the requested name and photo text',()=>{
  assert.match(gallery,/name:"Име Презиме Фамилия"/);
  assert.match(gallery,/fillText\("СНИМКА"/);
  assert.match(gallery,/\["photo","photo-oval","photo-arch","double"\]/);
  assert.match(gallery,/design==="background"\?sampleBackground:null/);
  assert.doesNotMatch(gallery,/Иван Иванов|Мария Георгиева|Георги Димитров/);
});

test('Gallery integrates only on obituary service page, on a dark background, and supports one-flag rollback',()=>{
  assert.match(page,/id="real-obituary-gallery"/);
  assert.match(page,/real-obituary-gallery\.css\?v=2\.02/);
  assert.match(page,/real-obituary-gallery\.js\?v=2\.02/);
  assert.match(page,/id="real-obituary-dialog"/);
  assert.match(page,/id="real-obituary-large"/);
  assert.match(styles,/\.real-obituary-gallery\{[^}]*background:#080706/);
  assert.match(styles,/#real-obituary-gallery\[hidden\]\{display:none!important\}/);
  assert.match(gallery,/const ENABLE_REAL_OBITUARY_GALLERY = true;/);
  assert.match(gallery,/if\(!ENABLE_REAL_OBITUARY_GALLERY\) return;/);
  assert.match(gallery,/img\.src="\/admin\/obituary-art\/"/);
  assert.doesNotMatch(gallery,/supabase|authToken|sessionKey|localStorage/);
});
