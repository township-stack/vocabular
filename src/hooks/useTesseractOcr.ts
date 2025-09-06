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

  const initializeWorker = useCallback(async () => {
    if (workerRef.current) {
      return;
    }
    
    setStatus('Worker wird initialisiert...');
    try {
      const worker = await createWorker({
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core.wasm.js',
        langPath: '/tessdata',
      });
      
      workerRef.current = worker;
      setStatus('Sprachmodelle werden geladen...');
      await worker.loadLanguage('pol+deu');
      await worker.initialize('pol+deu');
      
      setIsReady(true);
      setStatus('Bereit');
    } catch (error) {
        console.error("Error initializing Tesseract worker:", error);
        setStatus("Initialisierung fehlgeschlagen");
        setIsReady(false);
        workerRef.current = null; // Reset on failure
    }
  }, []);

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
    initializeWorker();
    return () => {
      terminate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recognize = useCallback(async (imageSource: File | HTMLCanvasElement): Promise<OcrResult | null> => {
    if (!workerRef.current || !isReady) {
        throw new Error("Tesseract Worker ist nicht bereit.");
    }
    
    const worker = workerRef.current;
    
    // Tesseract.js v5+ uses a subscription model on the worker for progress updates.
    const subscription = worker.subscribe(m => {
       if (m.status === 'recognizing text') {
           setStatus('Texterkennung läuft...');
           setProgress(Math.round(m.progress * 100));
       }
    });

    const { data } = await worker.recognize(imageSource);
    subscription.unsubscribe(); // Clean up the subscription
    
    return { text: data.text, confidence: data.confidence ?? 0 };
  }, [isReady]);

  return { recognize, progress, status, terminate, isReady };
}
