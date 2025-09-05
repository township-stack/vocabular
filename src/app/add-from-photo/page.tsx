"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, RefreshCw, Camera } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { useTesseractOcr } from "@/hooks/useTesseractOcr";
import { Progress } from "@/components/ui/progress";
import CameraModal from "@/components/camera-modal";

type Pair = { front: string; back: string; selected: boolean };

function parsePairs(raw: string): Pair[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const out: Pair[] = [];
  for (const line of lines) {
    // Common separators: – — - : ; → =>
    const m = line.match(/^(.*?)\s*(?:[-–—:;→]|=>)\s*(.+)$/);
    if (m && m[1]?.trim() && m[2]?.trim()) {
      out.push({ front: m[1].trim(), back: m[2].trim(), selected: true });
    }
  }
  return out;
}

// Helper: client-side downscaling for performance
async function downscaleImage(file: File, maxDim = 2200): Promise<HTMLCanvasElement> {
  const img = await fileToImage(file);
  const { width, height } = fitContain(img.width, img.height, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function fitContain(w: number, h: number, maxDim: number) {
  const scale = Math.min(maxDim / w, maxDim / h, 1);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url); // Clean up memory
      res(img);
    };
    img.onerror = rej;
    img.src = url;
  });
}

export default function AddFromPhotoPage() {
  const { toast } = useToast();
  const { recognize, progress, status, terminate, isReady } = useTesseractOcr();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory] = useState<string>(MOCK_CATEGORIES[0]?.id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImage(file);
  };
  
  const processImage = async (imageSource: File | HTMLCanvasElement) => {
    setIsLoading(true);
    setPairs([]);
    setRawText('');
    
    try {
      let imageToProcess: HTMLCanvasElement;
      if (imageSource instanceof File) {
        imageToProcess = await downscaleImage(imageSource, 2200);
      } else {
        imageToProcess = imageSource;
      }
      
      const { text, confidence } = await recognize(imageToProcess);
      console.log('OCR confidence', confidence);
      setRawText(text);
      const parsed = parsePairs(text);
      setPairs(parsed);
      if (parsed.length === 0 && text) {
        toast({
            variant: "default",
            title: "Keine Paare erkannt",
            description: "Es konnten keine Wortpaare automatisch erkannt werden. Bitte bearbeite den Rohtext manuell.",
        });
      }
    } catch (error) {
      console.error("Error during OCR process:", error);
      toast({
        variant: "destructive",
        title: "Fehler bei der Texterkennung",
        description: "Das Bild konnte nicht verarbeitet werden.",
      });
    } finally {
      setIsLoading(false);
    }
  }


  const handleReset = () => {
    setPairs([]);
    setRawText('');
    setIsLoading(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    terminate(); // Terminate worker to free up memory
  };
  
  const handleSave = async () => {
    const selectedPairs = pairs.filter(p => p.selected).map(p => ({
        front: p.front,
        back: p.back,
        categoryId: selectedCategory,
    }));

    if (selectedPairs.length === 0) {
        toast({
            variant: "destructive",
            title: "Keine Karten ausgewählt",
            description: "Bitte wähle mindestens eine Karte zum Speichern aus.",
        });
        return;
    }

    // Currently only logging (cleanly separated)
    console.log("[OCR] Save candidates:", selectedPairs);

    // Later: enable real saving
    // await savePairs(selectedPairs);

    toast({
        title: "Vorschläge gespeichert (Demo)",
        description: `${selectedPairs.length} Einträge wurden (noch lokal) protokolliert.`,
    });
    
    handleReset();
  };


  const renderContent = () => {
    if (isLoading || !isReady) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium capitalize">{status || "Initialisiere..."}</p>
          {isLoading && <Progress value={progress} className="w-full max-w-sm" />}
        </div>
      );
    }

    if (rawText) {
      return (
        <div className="space-y-6">
            {pairs.length > 0 && (
                 <div className="space-y-3">
                    <h3 className="font-semibold">Erkannte Wortpaare ({pairs.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {pairs.map((p, i) => (
                        <div key={i} className="p-3 border rounded-lg flex items-center gap-3 bg-muted/20">
                            <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={p.selected}
                            onChange={(e) => {
                                const next = [...pairs];
                                next[i] = { ...p, selected: e.target.checked };
                                setPairs(next);
                            }}
                            />
                            <input
                            className="flex-1 px-2 py-1 border rounded-md"
                            value={p.front}
                            onChange={(e) => {
                                const next = [...pairs];
                                next[i] = { ...p, front: e.target.value };
                                setPairs(next);
                            }}
                            placeholder="Vorderseite (Polnisch)"
                            />
                            <span>→</span>
                            <input
                            className="flex-1 px-2 py-1 border rounded-md"
                            value={p.back}
                            onChange={(e) => {
                                const next = [...pairs];
                                next[i] = { ...p, back: e.target.value };
                                setPairs(next);
                            }}
                            placeholder="Rückseite (Deutsch)"
                            />
                        </div>
                        ))}
                    </div>
                 </div>
            )}
            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer font-medium text-sm text-muted-foreground">Erkannten Rohtext anzeigen/bearbeiten</summary>
              <textarea 
                className="mt-2 w-full h-32 p-2 border rounded font-mono text-xs"
                value={rawText}
                onChange={(e) => {
                    setRawText(e.target.value);
                    setPairs(parsePairs(e.target.value))
                }}
              />
            </details>
        </div>
      );
    }

    return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold text-muted-foreground">Bereit zum Scannen</h3>
            <p className="text-sm text-muted-foreground">Wähle ein Foto von deinem Gerät aus oder nimm eins auf.</p>
            <div className="flex items-center gap-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <Button
                    variant="default"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Foto/Datei wählen
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setCameraOpen(true)}
                >
                    <Camera className="mr-2 h-4 w-4" />
                    Foto aufnehmen
                </Button>
            </div>
        </div>
    );
  };


  return (
    <div className="space-y-8">
      <Link href="/manage" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Verwaltung
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Karte aus Foto hinzufügen</CardTitle>
          <CardDescription>
            Wähle ein Bild aus, um es per OCR zu analysieren und daraus neue Karten zu erstellen.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[250px] flex items-center justify-center">
          {renderContent()}
        </CardContent>
        <CardFooter className="flex justify-end gap-4 border-t pt-6">
            {rawText && (
                <>
                    <Button variant="ghost" onClick={handleReset}><RefreshCw className="mr-2"/> Abbrechen / Neu</Button>
                    <Button onClick={handleSave} disabled={isLoading || pairs.filter(p=>p.selected).length === 0}><Save className="mr-2"/> Ausgewählte speichern</Button>
                </>
            )}
        </CardFooter>
      </Card>
      
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(canvas) => {
            setCameraOpen(false);
            processImage(canvas);
        }}
      />
    </div>
  );
}
