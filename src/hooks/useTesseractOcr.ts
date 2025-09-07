"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';

// --- Tesseract Worker Singleton ---
let worker: Tesseract.Worker | null = null;
let workerPromise: Promise<Tesseract.Worker> | null = null;

const getWorker = (): Promise<Tesseract.Worker> => {
    if (workerPromise) {
        return workerPromise;
    }

    workerPromise = new Promise(async (resolve, reject) => {
        try {
            console.log("Tesseract Worker wird erstellt (v2 API)...");
            // API for v2.1.5
            const createdWorker = Tesseract.createWorker({
                 workerPath: '/tesseract/worker.min.js',
                 langPath: '/tessdata',
                 corePath: '/tesseract/tesseract-core.wasm.js',
                 logger: (m) => {
                    // We will use the logger in the recognize call instead
                 }
            });

            console.log(`Sprachmodelle werden geladen (pol+deu)...`);
            await createdWorker.load();
            await createdWorker.loadLanguage('pol+deu');
            await createdWorker.initialize('pol+deu');
            
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
    const localWorker = await getWorker();

    if (!isReady || !localWorker) {
      console.error("Recognize aufgerufen, bevor der Worker bereit war.");
      setStatus('Worker nicht bereit');
      return null;
    }

    try {
      setStatus('Text wird erkannt...');
      setProgress(0);
      
      const { data } = await localWorker.recognize(imageSource, {}, { 
          // logger is not a valid parameter in the recognize options for v2
      });

      // Since the logger option is not in recognize, we cannot track live progress easily.
      // We'll just set it to 100 at the end.
      if (isMounted.current) {
          setProgress(100);
          setStatus('Bereit');
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
