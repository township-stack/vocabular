
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, Check, AlertTriangle } from "lucide-react";
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
import { useTesseractOcr } from "@/hooks/useTesseractOcr";
import { Progress } from "@/components/ui/progress";
import CameraModal from "@/components/camera-modal";
import { savePairsLocal } from "@/lib/local-storage";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Helpers ---

type Pair = { front: string; back: string; };

function parsePairs(raw: string): Pair[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const out: Pair[] = [];
  for (const line of lines) {
    const m = line.match(/^(.*?)\s*(?:[-–—:;→]|=>)\s*(.+)$/);
    if (m && m[1]?.trim() && m[2]?.trim()) {
      out.push({ front: m[1].trim(), back: m[2].trim() });
    }
  }
  return out;
}

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
      URL.revokeObjectURL(url);
      res(img);
    };
    img.onerror = rej;
    img.src = url;
  });
}

// --- Component ---

export default function AddFromPhotoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { recognize, progress, status, isReady } = useTesseractOcr();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{ count: number; categoryName: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(MOCK_CATEGORIES[0]?.id || '1');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImage(file);
  };
  
  const processImage = useCallback(async (imageSource: File | HTMLCanvasElement) => {
    if (!isReady) {
      toast({
        variant: "default",
        title: "OCR ist noch nicht bereit",
        description: "Bitte warte einen Moment, bis die Texterkennung initialisiert ist.",
      });
      return;
    }
    
    setIsProcessing(true);
    setLastResult(null);
    
    try {
      let imageToProcess: HTMLCanvasElement;
      if (imageSource instanceof File) {
        imageToProcess = await downscaleImage(imageSource, 2200);
      } else {
        imageToProcess = imageSource;
      }
      
      const result = await recognize(imageToProcess);
      if (!result) throw new Error("Texterkennung fehlgeschlagen");

      const pairs = parsePairs(result.text);

      if (pairs.length > 0) {
        savePairsLocal(pairs, selectedCategory);
        const categoryName = MOCK_CATEGORIES.find(c => c.id === selectedCategory)?.name || "Allgemein";
        setLastResult({ count: pairs.length, categoryName });
        toast({
          title: "Karten gespeichert!",
          description: `${pairs.length} neue Karten wurden in "${categoryName}" hinzugefügt.`,
        });
      } else {
         setLastResult({ count: 0, categoryName: '' });
         toast({
            variant: "default",
            title: "Keine Paare erkannt",
            description: "Es konnten keine Wortpaare automatisch erkannt werden. Bitte versuche es mit einem anderen Foto.",
        });
      }

    } catch (error) {
      console.error("Error during OCR process:", error);
      toast({
        variant: "destructive",
        title: "Fehler bei der Texterkennung",
        description: "Das Bild konnte nicht verarbeitet werden. Bitte versuche es erneut.",
      });
    } finally {
      setIsProcessing(false);
       if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    }
  }, [recognize, toast, isReady, selectedCategory]);

  const renderContent = () => {
    const isLoading = isProcessing || !isReady;

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium capitalize">{status || "Initialisiere..."}</p>
          <Progress value={progress} className="w-full max-w-sm" />
        </div>
      );
    }
    
     if (lastResult) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
            {lastResult.count > 0 ? (
                <>
                    <Check className="h-12 w-12 text-green-500"/>
                    <h3 className="text-2xl font-bold">{lastResult.count} Karten hinzugefügt!</h3>
                    <p className="text-muted-foreground">
                        Sie wurden zur Kategorie "{lastResult.categoryName}" gespeichert.
                    </p>
                    <Button onClick={() => router.push('/study')} size="lg">
                        Jetzt lernen
                    </Button>
                </>
            ) : (
                 <>
                    <AlertTriangle className="h-12 w-12 text-amber-500"/>
                    <h3 className="text-2xl font-bold">Nichts gefunden</h3>
                    <p className="text-muted-foreground">
                        Keine Vokabelpaare erkannt. Versuche es mit besserer Beleuchtung oder einem klareren Bild.
                    </p>
                     <Button onClick={() => setLastResult(null)} size="lg" variant="outline">
                        Erneut versuchen
                    </Button>
                </>
            )}
        </div>
      );
    }


    return (
        <div className="text-center py-8 px-4 flex flex-col items-center gap-6">
             <h3 className="text-xl font-bold text-foreground">Vokabeln scannen & lernen</h3>
             <p className="text-base text-muted-foreground max-w-md">
                Fotografiere eine Vokabelliste. Die App erkennt die Wortpaare und fügt sie automatisch deinem Trainer hinzu.
             </p>
            <div className="w-full max-w-sm space-y-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full h-12 text-base">
                        <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                        {MOCK_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className="text-base">{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                 <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <Button
                    size="lg"
                    className="w-full h-14 text-lg"
                    onClick={() => setCameraOpen(true)}
                    disabled={isLoading}
                >
                    <Camera className="mr-3 h-6 w-6" />
                    Foto aufnehmen
                </Button>
                 <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                >
                    Datei auswählen
                </Button>
            </div>
        </div>
    );
  };


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-lg mx-auto">
            <CardContent className="p-0">
            {renderContent()}
            </CardContent>
             <CardFooter className="flex-col items-center justify-center gap-2 border-t pt-4 text-center">
                 <p className="text-xs text-muted-foreground">
                    Status: {!isReady ? `${status}...` : "Bereit zum Scannen."}
                 </p>
                 <p className="text-xs text-muted-foreground">
                    Tipp: Für beste Ergebnisse flach fotografieren und auf gute Beleuchtung achten.
                 </p>
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
