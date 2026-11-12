// Exercise the real context-menu component with disposable callbacks in a DOM fixture.
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Window } from 'happy-dom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
const project = process.cwd(), temp = await mkdtemp(resolve(project, '.column-menu-check-'));
const window = new Window({ url: 'http://column-menu.test' });
for (const name of ['window','document','navigator','HTMLElement','Element','Node','Event','MouseEvent','KeyboardEvent'])
  Object.defineProperty(globalThis,name,{configurable:true,value:name==='window'?window:window[name]});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
try {
 const result=await build({absWorkingDir:project,entryPoints:['src/app/pages/main_window/project_view/table_view/components/DataGridContextMenu.tsx'],bundle:true,write:false,format:'esm',platform:'node',packages:'external',jsx:'automatic',alias:{'@':resolve(project,'src')},plugins:[{name:'boundaries',setup(b){
  b.onResolve({filter:/^@\/app\/i18n$/},()=>({path:'i18n',namespace:'test'}));
  b.onResolve({filter:/^@\/app\/components\/plugins\/PluginExtensions$/},()=>({path:'plugins',namespace:'test'}));
  b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path==='i18n'?`export const useI18n=()=>({t:key=>key});`:`export const PluginContextItems=()=>null;`}));
 }}]});
 const path=resolve(temp,'menu.mjs'); await writeFile(path,result.outputFiles[0].text);
 const {DataGridContextMenu}=await import(pathToFileURL(path));
 const host=document.createElement('div');document.body.append(host);root=createRoot(host);
 const actions=[];let closed=0;
 const render=async props=>act(async()=>root.render(React.createElement(DataGridContextMenu,{type:'column',x:0,y:0,onClose:()=>closed++,onEditColumn:()=>actions.push('edit'),onDeleteColumn:()=>actions.push('delete'),...props})));
 await render({}); let items=host.querySelectorAll('[role="menuitem"]');
 assert.equal(items.length,2);assert.equal(items[0].textContent,'column.editorTitle');assert.equal(items[1].textContent,'grid.deleteColumn');assert.deepEqual(actions,[]);
 assert.equal(document.activeElement,items[0]); await act(async()=>items[0].dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}))); assert.equal(document.activeElement,items[1]);
 await act(async()=>items[0].click());assert.deepEqual(actions,['edit']);assert.equal(closed,1);
 await render({deleteAllowed:false});items=host.querySelectorAll('[role="menuitem"]');assert.equal(items[1].disabled,true);await act(async()=>items[1].click());assert.deepEqual(actions,['edit']);
 await render({});items=host.querySelectorAll('[role="menuitem"]');await act(async()=>items[1].click());assert.deepEqual(actions,['edit','delete']);assert.equal(closed,2);
 console.log('PASS column menu contains only edit and delete; explicit actions, disabled deletion and close');
} finally {if(root) await act(async()=>root.unmount());await rm(temp,{recursive:true,force:true});window.happyDOM.abort();}
