import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {chromium} from 'playwright';
import {existsSync} from 'node:fs';
import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
function publicIP(ip){if(ip.includes(':'))return !(/^(::|fc|fd|fe8|fe9|fea|feb|ff)/i.test(ip)||ip.includes('.'));const p=ip.split('.').map(Number);return !(p[0]===0||p[0]===10||p[0]===127||p[0]>=224||(p[0]===169&&p[1]===254)||(p[0]===192&&p[1]===168)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===100&&p[1]>=64&&p[1]<=127)||(p[0]===198&&[18,19].includes(p[1])))}
export async function publicURL(raw){const u=new URL(raw);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Only public HTTP(S) pages are allowed.');const addresses=await lookup(u.hostname,{all:true});if(!addresses.length||addresses.some(x=>!publicIP(x.address)))throw Error('Local and private network pages are blocked.');return u.toString()}
export class BrowserTools {
 async page(){if(!this.browser){let executablePath=process.env.ASTRA_CHROMIUM_PATH;if(!executablePath&&!existsSync(chromium.executablePath())&&process.platform==='win32'){const cache=join(homedir(),'AppData','Local','ms-playwright');const versions=(await readdir(cache).catch(()=>[])).filter(n=>/^chromium-\d+$/.test(n)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1]));for(const version of versions){const candidate=join(cache,version,'chrome-win64','chrome.exe');if(existsSync(candidate)){executablePath=candidate;break}}}this.browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});this.context=await this.browser.newContext({acceptDownloads:false,serviceWorkers:'block'});await this.context.route('**/*',async route=>{try{await publicURL(route.request().url());await route.continue()}catch{await route.abort()}});this.tab=await this.context.newPage();this.tab.setDefaultTimeout(15000)}return this.tab}
 async action(a){const page=await this.page();if(a.action==='open')await page.goto(await publicURL(a.url),{waitUntil:'domcontentloaded',timeout:30000});else if(a.action==='click')await page.locator(a.selector).first().click();else if(a.action==='fill')await page.locator(a.selector).first().fill(a.text||'');else if(a.action!=='read')throw Error('Unknown browser action');
 return {url:page.url(),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,16000),controls:await page.locator('a,button,input,textarea,select').evaluateAll(nodes=>nodes.slice(0,60).map(n=>({tag:n.tagName,text:(n.textContent||'').trim().slice(0,100),id:n.id,name:n.getAttribute('name'),href:n.getAttribute('href'),type:n.getAttribute('type')})))}}
 async close(){await this.browser?.close()}
}
export const functionTools=[
 {type:'function',name:'create_artifact',description:'Create a persistent downloadable text or code artifact. Requires user approval.',parameters:{type:'object',properties:{name:{type:'string'},content:{type:'string'}},required:['name','content'],additionalProperties:false},strict:true},
 {type:'function',name:'browser_action',description:'Use an isolated browser on public websites. All actions require user approval. Read returns page text and controls; use observed IDs, names or text to form selectors.',parameters:{type:'object',properties:{action:{type:'string',enum:['open','read','click','fill']},url:{type:'string'},selector:{type:'string'},text:{type:'string'}},required:['action','url','selector','text'],additionalProperties:false},strict:true}
];
