// hooks/useTesseractOcr.ts
"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { createWorker, Worker } from 'tesseract.js';

// Singleton-Pattern, um sicherzustellen, dass der Worker nur einmal initialisiert wird.
let workerSingleton: Worker | null = null;
let workerInitializationPromise: Promise<Worker> | null = null;

const initializeWorker = async (
  onProgress: (p: number) => void,
  onStatus: (s: string) => void
): Promise<Worker> => {
  if (workerSingleton) {
    onStatus("Bereit");
    return workerSingleton;
  }
  if (workerInitializationPromise) {
    return workerInitializationPromise;
  }

  workerInitializationPromise = (async () => {
    try {
      const workerPath = '/tesseract/worker.min.js';
      const corePath = '/tesseract/tesseract-core.wasm.js';
      const langPath = '/tessdata';
      const langs = 'pol+deu';
      
      console.log('Tesseract Worker wird initialisiert mit:', {
          typeof_workerPath: typeof workerPath,
          typeof_corePath: typeof corePath,
          typeof_langPath: typeof langPath,
          langs,
          typeof_langs: typeof langs,
        });


      onStatus('Worker wird erstellt...');
      const worker = await createWorker({
        workerPath,
        corePath,
        langPath,
      });

      onStatus('Sprachmodelle werden geladen (pol+deu)...');
      await worker.loadLanguage(langs);
      await worker.initialize(langs);

      workerSingleton = worker;
      onStatus('Bereit');
      return worker;
    } catch (error) {
      console.error("Tesseract Worker-Initialisierung fehlgeschlagen:", error);
      onStatus("Fehler bei Initialisierung");
      workerInitializationPromise = null; // Reset für den nächsten Versuch
      throw error;
    }
  })();

  return workerInitializationPromise;
};

export function useTesseractOcr() {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('Nicht initialisiert');
  const [isReady, setIsReady] = useState(false);

  // Stellt sicher, dass die Worker-Initialisierung nur einmal angestoßen wird.
  useEffect(() => {
    let isMounted = true;

    const onStatusUpdate = (newStatus: string) => {
      if (isMounted) setStatus(newStatus);
    };
    const onProgressUpdate = (newProgress: number) => {
        if (isMounted) setProgress(newProgress);
    }

    initializeWorker(onProgressUpdate, onStatusUpdate)
      .then(() => {
        if (isMounted) setIsReady(true);
      })
      .catch(() => {
        if (isMounted) setIsReady(false);
      });

    return () => {
      isMounted = false;
      // Der Worker wird absichtlich nicht terminiert, damit er für die gesamte Sitzung verfügbar bleibt.
    };
  }, []);

  const recognize = useCallback(
    async (imageSource: File | HTMLCanvasElement): Promise<string | null> => {
      if (!workerSingleton || !isReady) {
        console.error('Recognize aufgerufen, aber Worker ist nicht bereit.');
        setStatus('Fehler: Worker nicht bereit');
        return null;
      }

      const worker = workerSingleton;
      const subscription = worker.subscribe((m) => {
        if (m.status === 'recognizing text') {
          setStatus(`Text wird erkannt...`);
          setProgress(Math.round(m.progress * 100));
        }
      });

      try {
        const { data } = await worker.recognize(imageSource);
        return data.text;
      } catch (error) {
        console.error('Fehler bei der Tesseract-Texterkennung:', error);
        setStatus('Fehler bei Texterkennung');
        return null;
      } finally {
        subscription.unsubscribe();
        setStatus('Bereit');
        setProgress(0);
      }
    },
    [isReady]
  );

  return { recognize, progress, status, isReady };
}
