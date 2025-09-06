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

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setStatus('Worker wird initialisiert...');
      const worker = await createWorker({
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core.wasm.js',
        langPath: '/tessdata',
      });

      if (cancelled) {
        await worker.terminate();
        return;
      }
      
      workerRef.current = worker;
      setStatus('Sprachmodelle werden geladen...');
      await worker.loadLanguage('pol+deu');
      await worker.initialize('pol+deu');
      
      if (cancelled) {
        await worker.terminate();
        return;
      }

      setIsReady(true);
      setStatus('Bereit');
    };

    initialize().catch(error => {
      console.error("Error initializing Tesseract worker:", error);
      setStatus("Initialisierung fehlgeschlagen");
      setIsReady(false);
      workerRef.current = null;
    });

    return () => {
      cancelled = true;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const recognize = useCallback(async (imageSource: File | HTMLCanvasElement): Promise<OcrResult | null> => {
    if (!workerRef.current || !isReady) {
        console.error("Recognize called but worker is not ready.");
        throw new Error("Tesseract Worker ist nicht bereit.");
    }
    
    const worker = workerRef.current;
    
    const subscription = worker.subscribe(m => {
       if (m.status === 'recognizing text') {
           setStatus('Texterkennung läuft...');
           setProgress(Math.round(m.progress * 100));
       }
    });

    const { data } = await worker.recognize(imageSource);
    subscription.unsubscribe();
    
    return { text: data.text, confidence: data.confidence ?? 0 };
  }, [isReady]);

  return { recognize, progress, status, isReady };
}
