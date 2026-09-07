import {randomBytes,scryptSync,createCipheriv,createDecipheriv,timingSafeEqual} from 'node:crypto';
export function seal(text,key){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);return [iv.toString('base64'),Buffer.concat([c.update(text,'utf8'),c.final()]).toString('base64'),c.getAuthTag().toString('base64')].join('.')}
export function unseal(value,key){const [iv,data,tag]=value.split('.').map(x=>Buffer.from(x,'base64'));const c=createDecipheriv('aes-256-gcm',key,iv);c.setAuthTag(tag);return Buffer.concat([c.update(data),c.final()]).toString('utf8')}
export class Vault{
 constructor(store){this.store=store;this.sessions=new Map();this.attempts=0;this.nextAttempt=0}
 get configured(){return !!this.store.get('system','vault')}
 login(password){if(Date.now()<this.nextAttempt)throw Error('Please wait before trying again.');if(typeof password!=='string'||password.length<12||password.length>256)throw Error('Use a passphrase of 12–256 characters.');
 let meta=this.store.get('system','vault');const salt=meta?.salt||randomBytes(32).toString('base64');const key=scryptSync(password,salt,32);
 if(meta){try{if(unseal(meta.check,key)!=='astra-vault-v1')throw Error()}catch{this.attempts++;this.nextAttempt=Date.now()+Math.min(60000,1000*2**this.attempts);throw Error('Incorrect passphrase.')}}else this.store.put('system',{id:'vault',salt,check:seal('astra-vault-v1',key)});
 this.attempts=0;const token=randomBytes(32).toString('hex');this.sessions.set(token,{key,expires:Date.now()+12*3600000});return token;}
 session(req){const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('astra_session='))?.slice(14);const s=this.sessions.get(token);if(s&&s.expires>Date.now())return s; if(s){s.key.fill(0);this.sessions.delete(token)}return null}
 lock(){for(const s of this.sessions.values())s.key.fill(0);this.sessions.clear();}
}
export function validateEndpoint(raw,{local=false}={}){const u=new URL(raw);if(u.username||u.password||u.search||u.hash)throw Error('Use an endpoint without credentials, query or fragment.');if(u.protocol!=='https:'&&!(local&&u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw Error('Use HTTPS (HTTP is allowed only for a local provider).');return u.toString().replace(/\/$/,'')}
export function text(value,max=10000){if(typeof value!=='string'||!value.trim()||value.length>max)throw Error('Required text is missing or too long.');return value.trim()}
export function bounded(value,min,max,fallback){const n=Number(value??fallback);if(!Number.isFinite(n)||n<min||n>max)throw Error('Number outside allowed range.');return Math.floor(n)}
