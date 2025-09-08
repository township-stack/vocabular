"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';

// --- Tesseract Worker Singleton ---
let worker: Tesseract.Worker | null = null;
let workerPromise: Promise<Tesseract.Worker> | null = null;
let currentLanguages = 'pol+deu';

// Broadcast-Mechanismus für Logger-Nachrichten (Fortschritt/Status)
type LoggerSubscriber = (msg: { status?: string; progress?: number }) => void;
const loggerSubscribers: LoggerSubscriber[] = [];
const subscribeLogger = (cb: LoggerSubscriber) => {
    loggerSubscribers.push(cb);
    return () => {
        const idx = loggerSubscribers.indexOf(cb);
        if (idx >= 0) loggerSubscribers.splice(idx, 1);
    };
};

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
                    // m: { status: string, progress?: number }
                    try {
                        const msg = (m as unknown) as { status?: string; progress?: number };
                        for (const cb of loggerSubscribers) cb(msg);
                    } catch {}
                 }
            });

            console.log(`Sprachmodelle werden geladen (${currentLanguages})...`);
            await createdWorker.load();
            await createdWorker.loadLanguage(currentLanguages);
            await createdWorker.initialize(currentLanguages);
            
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
  const [languages, setLanguages] = useState<string>(currentLanguages);
  
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
    // Fortschritt abonnieren
    const unsubscribe = subscribeLogger((m) => {
        if (!isMounted.current) return;
        if (typeof m.progress === 'number') {
            // 0..1 -> 0..100
            setProgress(Math.round((m.progress || 0) * 100));
        }
        if (m.status) {
            // Nutzerfreundliche Statusmeldungen
            const s = m.status;
            if (s.includes('initialized')) setStatus('Bereit');
            else if (s.includes('loading language')) setStatus('Lade Sprachmodelle...');
            else if (s.includes('initializing api')) setStatus('Initialisiere Texterkennung...');
            else if (s.includes('recognizing text')) setStatus('Text wird erkannt...');
            else setStatus(s);
        }
    });
    
    return () => {
        isMounted.current = false;
        unsubscribe();
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
      
      const { data } = await localWorker.recognize(imageSource);

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

  const changeLanguages = useCallback(async (langs: string) => {
    currentLanguages = langs;
    setLanguages(langs);
    setIsInitializing(true);
    setStatus('Lade Sprachmodelle...');
    setProgress(0);
    try {
      const w = await getWorker();
      await w.loadLanguage(langs);
      await w.initialize(langs);
      if (isMounted.current) {
        setIsReady(true);
        setIsInitializing(false);
        setStatus('Bereit');
      }
    } catch (e) {
      console.error('Sprachwechsel fehlgeschlagen:', e);
      if (isMounted.current) {
        setIsInitializing(false);
        setStatus('Fehler beim Laden der Sprache');
      }
    }
  }, []);

  return { recognize, progress, status, isReady, isInitializing, languages, changeLanguages };
}
