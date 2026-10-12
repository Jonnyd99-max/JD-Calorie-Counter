// Reuse the Git credential manager's authenticated GitHub connection in memory.
// Do not print credential-manager output or any authentication headers.
import {spawn} from 'node:child_process';
const credentials=await new Promise((resolve,reject)=>{
  const p=spawn('git',['credential','fill'],{stdio:['pipe','pipe','pipe'],windowsHide:true});let out='';
  p.stdout.on('data',b=>out+=b);p.stderr.on('data',()=>{});p.on('error',reject);p.on('exit',code=>code?reject(new Error('GitHub authentication unavailable.')):resolve(out));
  p.stdin.end('protocol=https\nhost=github.com\n\n');
});
const secret=credentials.match(/^password=(.+)$/m)?.[1];if(!secret)throw new Error('No authenticated GitHub credential available.');
const base='https://api.github.com/repos/Jonnyd99-max/JD-Calorie-Counter/pages';
const headers={Authorization:`Bearer ${secret}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
const current=await fetch(base,{headers});
if(current.ok){const d=await current.json();if(d.build_type==='workflow'){console.log('GitHub Pages already uses GitHub Actions.');process.exit(0)}}
else if(current.status!==404)throw new Error(`Could not inspect Pages settings (${current.status}).`);
const response=await fetch(base,{method:current.status===404?'POST':'PUT',headers,body:JSON.stringify({build_type:'workflow'})});
if(!response.ok){const d=await response.json();throw new Error(`Pages setup failed (${response.status}): ${d.message}`)}
const data=await response.json();console.log(`GitHub Pages configured for Actions: ${data.html_url||'https://jonnyd99-max.github.io/JD-Calorie-Counter/'}`);
