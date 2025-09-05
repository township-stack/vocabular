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
    if (workerRef.current && isReady) return workerRef.current;

    setIsReady(false);
    setStatus('Worker wird initialisiert...');
    
    const worker = await createWorker({
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/tesseract-core.wasm.js',
      langPath: '/tessdata',
      logger: (m) => {
        if (m.status) {
            // Capitalize first letter
            const friendlyStatus = m.status.charAt(0).toUpperCase() + m.status.slice(1).replace(/_/g, ' ');
            setStatus(friendlyStatus);
        }
        if (m.progress != null) setProgress(Math.round(m.progress * 100));
      },
    });

    setStatus('Sprachmodelle werden geladen...');
    await worker.loadLanguage('pol+deu');
    await worker.initialize('pol+deu');
    
    workerRef.current = worker;
    setIsReady(true);
    setStatus('Bereit');
    return workerRef.current;
  }, [isReady]);

  // Pre-initialize the worker on mount.
  useEffect(() => {
    // We don't pre-init anymore to save resources on mobile
    return () => {
        // Cleanup on unmount
        terminate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recognize = useCallback(async (imageSource: File | HTMLCanvasElement): Promise<OcrResult> => {
    const worker = await ensureWorker();
    const { data } = await worker.recognize(imageSource);
    return { text: data.text, confidence: data.confidence ?? 0 };
  }, [ensureWorker]);

  const terminate = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
      setStatus('');
      setProgress(0);
    }
  }, []);

  return { recognize, progress, status, terminate, isReady };
}
