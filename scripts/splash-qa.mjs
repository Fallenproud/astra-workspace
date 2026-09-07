import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('design/splash',{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4317/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(850);await page.screenshot({path:'design/splash/boot.png'});
 await page.locator('#astra-splash').waitFor({state:'detached'});
 assert.equal(await page.locator('#root').getAttribute('inert'),null);
 await page.screenshot({path:'design/splash/landing.png'});
 await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.locator('#astra-splash').count(),1);await page.locator('#astra-splash').waitFor({state:'detached'});
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4317/workspace');await page.locator('#astra-splash').waitFor({state:'detached'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const slow=await browser.newPage();await slow.route('**/assets/index-*.js',async route=>{await new Promise(r=>setTimeout(r,2300));await route.continue()});await slow.goto('http://127.0.0.1:4317/',{waitUntil:'commit'});await slow.locator('#astra-splash.is-waiting').waitFor();await slow.locator('#astra-splash').waitFor({state:'detached'});
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto('http://127.0.0.1:4317/');await reduced.locator('#astra-splash').waitFor({state:'detached'});assert.equal(await reduced.locator('#root').getAttribute('inert'),null);
 const failed=await browser.newPage();await failed.route('**/assets/index-*.js',route=>route.abort());await failed.goto('http://127.0.0.1:4317/');await failed.locator('#astra-splash.is-error').waitFor({timeout:18000});assert.equal(await failed.getByRole('link',{name:'Reload workspace'}).isVisible(),true);
 assert.deepEqual(errors,[]);console.log('PASS: repeat entry, mobile, delayed bundle, reduced motion, failed bundle recovery, no page errors.');
}finally{await browser.close()}
