import {createServer}from'node:http';
import{readFile}from'node:fs/promises';
import{resolve,extname,sep}from'node:path';
const root=resolve('public'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),file=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return}const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end('Not found')}}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'));
