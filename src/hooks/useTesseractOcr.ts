
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Worker } from 'tesseract.js';

// --- Tesseract Worker Singleton ---

let worker: Worker | null = null;
let workerPromise: Promise<Worker> | null = null;
let globalStatus: string = 'Nicht initialisiert';
let globalProgress: number = 0;

const statusListeners = new Set<(status: string) => void>();
const progressListeners = new Set<(progress: number) => void>();

function updateStatus(status: string) {
  globalStatus = status;
  statusListeners.forEach(listener => listener(status));
}

function updateProgress(progress: number) {
  globalProgress = progress;
  progressListeners.forEach(listener => listener(progress));
}

async function getWorker(): Promise<Worker> {
  if (workerPromise) {
    return workerPromise;
  }

  workerPromise = (async () => {
    try {
      updateStatus('Worker wird erstellt...');
      const { createWorker } = await import('tesseract.js');
      
      const createdWorker = await createWorker({
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core.wasm.js',
        langPath: '/tessdata',
        logger: (m) => {
          if (m.status === 'recognizing text') {
            updateProgress(Math.round(m.progress * 100));
          }
        },
      });

      const langs = 'pol+deu';
      updateStatus(`Sprachmodelle werden geladen (${langs})...`);
      await createdWorker.loadLanguage(langs);
      await createdWorker.initialize(langs);
      
      worker = createdWorker;
      updateStatus('Bereit');
      console.log('Tesseract Worker wurde erfolgreich initialisiert.');
      return worker;

    } catch (error) {
      console.error("Tesseract Worker-Initialisierung fehlgeschlagen:", error);
      updateStatus("Fehler bei Initialisierung");
      workerPromise = null; // Reset promise so we can try again
      throw error;
    }
  })();

  return workerPromise;
}

// Pre-initialize on module load
getWorker();


// --- React Hook ---

export function useTesseractOcr() {
  const [progress, setProgress] = useState<number>(globalProgress);
  const [status, setStatus] = useState<string>(globalStatus);
  const isReady = status === 'Bereit';

  useEffect(() => {
    const onStatusChange = (newStatus: string) => setStatus(newStatus);
    const onProgressChange = (newProgress: number) => setProgress(newProgress);

    statusListeners.add(onStatusChange);
    progressListeners.add(onProgressChange);

    // Sync with current global state on mount
    onStatusChange(globalStatus);
    onProgressChange(globalProgress);

    return () => {
      statusListeners.delete(onStatusChange);
      progressListeners.delete(onProgressChange);
    };
  }, []);
  
  const recognize = useCallback(
    async (imageSource: File | HTMLCanvasElement): Promise<string | null> => {
      updateProgress(0);
      updateStatus('Warte auf Worker...');
      
      try {
        const w = await getWorker();
        updateStatus('Text wird erkannt...');
        
        const { data } = await w.recognize(imageSource);
        
        updateStatus('Bereit');
        updateProgress(0);
        return data.text;
      } catch (error) {
        console.error('Fehler bei der Tesseract-Texterkennung:', error);
        updateStatus('Fehler bei Texterkennung');
        updateProgress(0);
        return null;
      }
    },
    []
  );

  const isInitializing = !isReady && status !== 'Nicht initialisiert' && status !== 'Fehler bei Initialisierung' && status !== 'Fehler bei Texterkennung';

  return { recognize, progress, status, isReady, isInitializing };
}
