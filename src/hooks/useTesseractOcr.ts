
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Worker } from 'tesseract.js';
import { createWorker } from 'tesseract.js';

// --- Global Tesseract Worker Manager ---

type ProgressCallback = (progress: number) => void;
type StatusCallback = (status: string) => void;

class TesseractManager {
  private worker: Worker | null = null;
  private isReady = false;
  private isInitializing = false;
  private progressCallback: ProgressCallback | null = null;
  private statusCallback: StatusCallback | null = null;

  constructor() {
    this.initialize();
  }
  
  private setStatus(status: string) {
    if (this.statusCallback) this.statusCallback(status);
  }

  private setProgress(progress: number) {
    if (this.progressCallback) this.progressCallback(progress);
  }
  
  private async initialize() {
    if (this.isReady || this.isInitializing) {
      return;
    }
    this.isInitializing = true;
    this.setStatus('Worker wird erstellt...');
    
    try {
      const worker = await createWorker({
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core.wasm.js',
        langPath: '/tessdata',
      });
      
      const langs = 'pol+deu';
      this.setStatus('Sprachmodelle werden geladen (pol+deu)...');
      await worker.loadLanguage(langs);
      await worker.initialize(langs);
      
      this.worker = worker;
      this.isReady = true;
      this.isInitializing = false;
      this.setStatus('Bereit');
      console.log('Tesseract Worker wurde erfolgreich initialisiert.');

    } catch (error) {
      console.error("Tesseract Worker-Initialisierung fehlgeschlagen:", error);
      this.setStatus("Fehler bei Initialisierung");
      this.isInitializing = false;
    }
  }

  public subscribe(statusCb: StatusCallback, progressCb: ProgressCallback) {
    this.statusCallback = statusCb;
    this.progressCallback = progressCb;
    // Provide initial status
    if (this.isReady) {
        statusCb('Bereit');
    } else if (this.isInitializing) {
        statusCb('Worker wird initialisiert...');
    } else {
        statusCb('Nicht initialisiert');
    }
  }
  
  public unsubscribe() {
    this.statusCallback = null;
    this.progressCallback = null;
  }

  public async recognize(image: File | HTMLCanvasElement): Promise<string | null> {
    if (!this.isReady || !this.worker) {
      this.setStatus('Fehler: Worker nicht bereit');
      console.error('Recognize aufgerufen, aber Worker ist nicht bereit.');
      // Try to re-initialize if it failed before
      if (!this.isInitializing) {
          this.initialize();
      }
      return null;
    }
    
    const subscription = this.worker.subscribe(m => {
       if (m.status === 'recognizing text') {
          this.setStatus(`Text wird erkannt...`);
          this.setProgress(Math.round(m.progress * 100));
        }
    });

    try {
      const { data } = await this.worker.recognize(image);
      return data.text;
    } catch (error) {
      console.error('Fehler bei der Tesseract-Texterkennung:', error);
      this.setStatus('Fehler bei Texterkennung');
      return null;
    } finally {
       subscription.unsubscribe();
       this.setStatus('Bereit');
       this.setProgress(0);
    }
  }
  
  public getIsReady(): boolean {
      return this.isReady;
  }
}

// Create a single, global instance of the manager
const tesseractManager = new TesseractManager();


// --- React Hook ---

export function useTesseractOcr() {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('Nicht initialisiert');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const handleStatusUpdate = (newStatus: string) => {
      setStatus(newStatus);
      if (newStatus === 'Bereit') {
        setIsReady(true);
      } else {
        setIsReady(false);
      }
    };
    
    const handleProgressUpdate = (newProgress: number) => {
      setProgress(newProgress);
    };

    tesseractManager.subscribe(handleStatusUpdate, handleProgressUpdate);

    // Initial check
    setIsReady(tesseractManager.getIsReady());

    return () => {
      tesseractManager.unsubscribe();
    };
  }, []);
  
  const recognize = useCallback(
    async (imageSource: File | HTMLCanvasElement): Promise<string | null> => {
        return tesseractManager.recognize(imageSource);
    },
    []
  );

  return { recognize, progress, status, isReady, isInitializing: !isReady && status !== 'Nicht initialisiert' && status !== 'Fehler bei Initialisierung' };
}
