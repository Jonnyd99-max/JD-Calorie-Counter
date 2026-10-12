import {validateBackup, makeBackup, clone} from './core.js';
export const DB_NAME = 'jd-food-tracker';
export const DB_VERSION = 1;
export async function openDatabase(factory = indexedDB) {
  return new Promise((resolve,reject)=>{
    const r = factory.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('meals')) r.result.createObjectStore('meals',{keyPath:'id'}); };
    r.onsuccess = () => { r.result.onversionchange=()=>r.result.close(); resolve(r.result); };
    r.onerror = () => reject(new Error('Could not open local storage. Check browser storage permissions.'));
    r.onblocked = () => reject(new Error('Close other JD Food Tracker tabs, then try again.'));
  });
}
export class MealStore {
  constructor(db) { this.db=db; }
  transaction(mode, work) {
    return new Promise((resolve,reject)=>{
      const tx=this.db.transaction('meals',mode), store=tx.objectStore('meals');
      let result;
      try { result=work(store); } catch(e) { tx.abort(); reject(e); return; }
      tx.oncomplete=()=>resolve(result?.result);
      tx.onerror=()=>reject(new Error('Could not save data. Your device may be out of storage. Export a backup before clearing anything.'));
      tx.onabort=()=>reject(new Error('Local storage operation was interrupted.'));
    });
  }
  all() { return this.transaction('readonly',s=>s.getAll()); }
  put(meal) { return this.transaction('readwrite',s=>s.put(clone(meal))); }
  delete(id) { return this.transaction('readwrite',s=>s.delete(id)); }
  async export() { return makeBackup(await this.all()); }
  async import(data) {
    const meals=validateBackup(data);
    // One transaction: a bad write cannot leave a partially restored diary.
    await this.transaction('readwrite',s=>{ for(const meal of meals) s.put(meal); });
    return meals.length;
  }
}
