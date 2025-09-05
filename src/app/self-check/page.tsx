'use client';
import { useEffect, useState } from 'react';

const urls = [
    '/tessdata/pol.traineddata',
    '/tessdata/deu.traineddata',
    '/tesseract/worker.min.js',
    '/tesseract/tesseract-core.wasm.js'
];

export default function SelfCheck(){
  const [rows,setRows]=useState<{u:string,ok:boolean}[]>([]);
  
  useEffect(()=>{(async()=>{
    const r: any[] = [];
    for (const u of urls){
      try { 
        const res = await fetch(u,{cache:'no-cache'}); 
        r.push({u,ok:res.ok}); 
      }
      catch{ 
        r.push({u,ok:false}); 
      }
    }
    setRows(r);
  })()},[]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-bold mb-2 text-xl">Assets Check</h1>
      <p className="text-muted-foreground">Diese Seite prüft, ob alle für die Offline-OCR benötigten Dateien korrekt vom Server geladen werden können. Wenn hier alles mit ✅ markiert ist, sollte die App auch im Flugmodus funktionieren.</p>
      <ul className="space-y-2">
        {rows.length === 0 && <p>Prüfe Assets...</p>}
        {rows.map(x=> (
          <li key={x.u} className="flex items-center gap-3 font-mono text-sm p-2 border rounded-md">
            <span>{x.ok ? '✅' : '❌'}</span>
            <span>{x.u}</span>
            {!x.ok && <span className="text-xs text-red-500 font-sans">- Datei nicht gefunden. Bitte stelle sicher, dass sie im `public` Ordner liegt.</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
