// Safe metadata only; never print API keys, request headers or complete errors.
import {readFile}from'node:fs/promises';
const text=await readFile('.env.local','utf8'),key=text.match(/^OPENAI_API_KEY=(.*)$/m)?.[1]?.trim();
const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',store:false,max_output_tokens:16,input:'Reply OK.'})});
const d=await r.json();console.log(JSON.stringify({status:r.status,providerStatus:d.status||null,errorCode:d.error?.code||null,errorType:d.error?.type||null,errorParameter:d.error?.param||null}));
