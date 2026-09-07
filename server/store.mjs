import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
export class Store {
 constructor(dir){mkdirSync(dir,{recursive:true});this.db=new DatabaseSync(join(dir,'astra.sqlite'));this.db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS entities (kind TEXT NOT NULL,id TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE INDEX IF NOT EXISTS kind_idx ON entities(kind);");}
 all(kind){return this.db.prepare('SELECT data FROM entities WHERE kind=? ORDER BY rowid').all(kind).map(x=>JSON.parse(x.data));}
 get(kind,id){const row=this.db.prepare('SELECT data FROM entities WHERE kind=? AND id=?').get(kind,id);return row?JSON.parse(row.data):null;}
 put(kind,v){v={...v,id:v.id||randomUUID()};this.db.prepare('INSERT INTO entities(kind,id,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data WHERE kind=excluded.kind').run(kind,v.id,JSON.stringify(v));return v;}
 remove(kind,id){this.db.prepare('DELETE FROM entities WHERE kind=? AND id=?').run(kind,id);}
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r}catch(e){this.db.exec('ROLLBACK');throw e}}
 close(){this.db.close();}
}
