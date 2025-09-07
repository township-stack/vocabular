"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Worker } from 'tesseract.js';

// --- Tesseract Worker Singleton ---

let worker: Worker | null = null;
let workerPromise: Promise<Worker> | null = null;

const getWorker = (): Promise<Worker> => {
    if (workerPromise) {
        return workerPromise;
    }

    workerPromise = new Promise(async (resolve, reject) => {
        try {
            console.log("Tesseract Worker wird erstellt...");
            const { createWorker } = await import('tesseract.js');
            const createdWorker = await createWorker({
                 workerPath: '/tesseract/worker.min.js',
                 corePath: '/tesseract/tesseract-core.wasm.js',
                 langPath: '/tessdata',
            });

            const langs = 'pol+deu';
            console.log(`Sprachmodelle werden geladen (${langs})...`);
            await createdWorker.loadLanguage(langs);
            await createdWorker.initialize(langs);
            
            worker = createdWorker;
            console.log('Tesseract Worker wurde erfolgreich initialisiert.');
            resolve(worker);
        } catch (error) {
            console.error("Tesseract Worker-Initialisierung fehlgeschlagen:", error);
            workerPromise = null; // Reset promise so we can try again
            reject(error);
        }
    });

    return workerPromise;
};

// Pre-initialize on module load in the browser
if (typeof window !== 'undefined') {
    getWorker();
}


// --- React Hook ---

export function useTesseractOcr() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('Initialisiere...');
  const [progress, setProgress] = useState<number>(0);
  
  // Ref to track component mount status
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    const checkWorkerStatus = async () => {
        try {
            await getWorker();
            if (isMounted.current) {
                setIsReady(true);
                setIsInitializing(false);
                setStatus('Bereit');
            }
        } catch (error) {
            if (isMounted.current) {
                setIsInitializing(false);
                setStatus('Fehler bei Initialisierung');
            }
        }
    };
    
    checkWorkerStatus();
    
    return () => {
        isMounted.current = false;
    };
  }, []);

  const recognize = useCallback(async (imageSource: File | HTMLCanvasElement): Promise<string | null> => {
    if (!isReady || !worker) {
      console.error("Recognize aufgerufen, bevor der Worker bereit war.");
      setStatus('Worker nicht bereit');
      return null;
    }

    try {
      setStatus('Text wird erkannt...');
      setProgress(0);
      
      const { data } = await worker.recognize(imageSource, {}, { 
          logger: (m) => {
             if (m.status === 'recognizing text' && isMounted.current) {
                setProgress(Math.round(m.progress * 100));
              }
          }
      });
      
       if (isMounted.current) {
         setStatus('Bereit');
         setProgress(100);
       }
      return data.text;
    } catch (error) {
      console.error('Fehler bei der Tesseract-Texterkennung:', error);
       if (isMounted.current) {
        setStatus('Fehler bei Texterkennung');
        setProgress(0);
       }
      return null;
    }
  }, [isReady]);

  return { recognize, progress, status, isReady, isInitializing };
}
