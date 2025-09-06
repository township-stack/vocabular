// hooks/useTesseractOcr.ts
import { createWorker, Worker } from 'tesseract.js';
import { useRef, useState, useCallback, useEffect } from 'react';

type OcrResult = {
  text: string;
  confidence: number; // 0-100
};

export function useTesseractOcr() {
  const workerRef = useRef<Worker | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  const ensureWorker = useCallback(async () => {
    if (workerRef.current && isReady) {
      console.log("Worker already ready.");
      return workerRef.current;
    }

    if (status && !status.includes('fehlgeschlagen') && !status.includes('Bereit')) {
        console.log("Worker initialization already in progress.");
        return;
    }


    setIsReady(false);
    setStatus('Worker wird initialisiert...');
    
    try {
      const worker = await createWorker({
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core.wasm.js',
        langPath: '/tessdata',
      });

      setStatus('Sprachmodelle werden geladen...');
      await worker.loadLanguage('pol+deu');
      await worker.initialize('pol+deu');
      
      workerRef.current = worker;
      setIsReady(true);
      setStatus('Bereit');
      return workerRef.current;
    } catch (error) {
        console.error("Error initializing Tesseract worker:", error);
        setStatus("Initialisierung fehlgeschlagen");
        setIsReady(false);
        workerRef.current = null; // Reset on failure
        return null;
    }
  }, [isReady, status]);

  const terminate = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
      setStatus('');
      setProgress(0);
    }
  }, []);

  useEffect(() => {
    ensureWorker();
    return () => {
      terminate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recognize = useCallback(async (imageSource: File | HTMLCanvasElement): Promise<OcrResult | null> => {
    const worker = await ensureWorker();
    if (!worker) {
        throw new Error("Tesseract Worker ist nicht verfügbar.");
    }

    const recognizePromise = worker.recognize(imageSource);
    
    // Tesseract.js v5 uses a subscription model on the worker for progress updates.
    const subscription = worker.subscribe(m => {
       if (m.status === 'recognizing text') {
           setStatus('Texterkennung läuft...');
           setProgress(Math.round(m.progress * 100));
       }
    });

    const { data } = await recognizePromise;
    subscription.unsubscribe(); // Clean up the subscription
    
    return { text: data.text, confidence: data.confidence ?? 0 };
  }, [ensureWorker]);

  return { recognize, progress, status, terminate, isReady };
}
