// hooks/useTesseractOcr.ts
import { createWorker, Worker } from 'tesseract.js';
import { useRef, useState, useCallback, useEffect } from 'react';

type OcrResult = {
  text: string;
  confidence: number; // 0-100
};

// Singleton pattern for the worker
let workerSingleton: Worker | null = null;
let workerInitializationPromise: Promise<Worker> | null = null;

const initializeWorker = async (setStatus: (status: string) => void): Promise<Worker> => {
    if (workerSingleton) {
        return workerSingleton;
    }

    if (workerInitializationPromise) {
        return workerInitializationPromise;
    }

    workerInitializationPromise = (async () => {
        try {
            setStatus('Worker wird initialisiert...');
            const worker = await createWorker({
                workerPath: '/tesseract/worker.min.js',
                corePath: '/tesseract/tesseract-core.wasm.js',
                langPath: '/tessdata',
            });

            setStatus('Sprachmodelle werden geladen (pol+deu)...');
            await worker.loadLanguage('pol+deu');
            await worker.initialize('pol+deu');

            workerSingleton = worker;
            setStatus('Bereit');
            return worker;
        } catch (error) {
            console.error("Tesseract Worker-Initialisierung fehlgeschlagen:", error);
            setStatus("Fehler bei Initialisierung");
            workerInitializationPromise = null; // Reset for next attempt
            throw error;
        }
    })();

    return workerInitializationPromise;
};


export function useTesseractOcr() {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('Nicht initialisiert');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const updateStatus = (newStatus: string) => {
        if(isMounted) setStatus(newStatus);
    };

    initializeWorker(updateStatus)
      .then(() => {
        if(isMounted) setIsReady(true);
      })
      .catch(() => {
         if(isMounted) setIsReady(false);
      });

    return () => {
        isMounted = false;
    };
  }, []); 

  const recognize = useCallback(async (imageSource: File | HTMLCanvasElement): Promise<OcrResult | null> => {
    if (!workerSingleton || !isReady) {
        console.error("Recognize aufgerufen, aber Worker ist nicht bereit.");
        setStatus("Fehler: Worker nicht bereit");
        return null;
    }
    
    const worker = workerSingleton;
    
    const subscription = worker.subscribe(m => {
       if (m.status === 'recognizing text') {
           setStatus('Texterkennung läuft...');
           setProgress(Math.round(m.progress * 100));
       }
    });

    try {
        const { data } = await worker.recognize(imageSource);
        return { text: data.text, confidence: data.confidence ?? 0 };
    } catch (error) {
        console.error("Fehler bei der Tesseract-Texterkennung:", error);
        setStatus("Fehler bei Texterkennung");
        return null;
    } finally {
        subscription.unsubscribe();
        setStatus("Bereit");
        setProgress(0);
    }
  }, [isReady]);

  return { recognize, progress, status, isReady };
}
