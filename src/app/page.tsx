"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, Check, AlertTriangle, Text, Share2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTesseractOcr } from "@/hooks/useTesseractOcr";
import { Progress } from "@/components/ui/progress";
import CameraModal from "@/components/camera-modal";
import { savePairsLocal } from "@/lib/local-storage";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"


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

async function downscaleImage(file: File, maxDim = 2500): Promise<HTMLCanvasElement> {
  const img = await fileToImage(file);
  const { width, height } = fitContain(img.width, img.height, maxDim);
  
  if (width === img.width && height === img.height) {
     const canvas = document.createElement('canvas');
     canvas.width = img.width;
     canvas.height = img.height;
     const ctx = canvas.getContext('2d')!;
     ctx.drawImage(img, 0, 0, img.width, img.height);
     return canvas;
  }

  console.log(`Downscaling image from ${img.width}x${img.height} to ${width}x${height}`);
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

export default function AddVocabularyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { recognize, progress, status, isReady, isInitializing } = useTesseractOcr();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{ count: number; categoryName: string } | null>(null);
  const [pastedText, setPastedText] = useState("");
  
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
        imageToProcess = await downscaleImage(imageSource);
      } else {
        imageToProcess = imageSource;
      }
      
      const recognizedText = await recognize(imageToProcess);
      if (recognizedText === null) throw new Error("Texterkennung fehlgeschlagen. Recognize gab null zurück.");

      const pairs = parsePairs(recognizedText);
      handleSavePairs(pairs);

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

  const handleSavePairs = (pairs: Pair[]) => {
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
            description: "Es konnten keine gültigen Wortpaare im Format 'Wort - Übersetzung' gefunden werden.",
        });
      }
  };

  const handlePasteProcess = () => {
      const pairs = parsePairs(pastedText);
      handleSavePairs(pairs);
      setPastedText(""); // Clear textarea after processing
  };

  const renderContent = () => {
    const isLoading = isProcessing || isInitializing;
    const loadingText = isProcessing ? status : (isInitializing ? 'Initialisiere Texterkennung...' : 'Bereit');

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium capitalize">{loadingText}</p>
          {(isProcessing || (isInitializing && progress > 0)) && <Progress value={progress} className="w-full max-w-sm" />}
        </div>
      );
    }
    
     if (lastResult) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 min-h-[400px]">
            {lastResult.count > 0 ? (
                <>
                    <Check className="h-12 w-12 text-green-500"/>
                    <h3 className="text-2xl font-bold">{lastResult.count} Karten hinzugefügt!</h3>
                    <p className="text-muted-foreground">
                        Sie wurden zur Kategorie "{lastResult.categoryName}" gespeichert.
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={() => setLastResult(null)} variant="outline">
                            Weitere hinzufügen
                        </Button>
                        <Button onClick={() => router.push('/study')} size="lg">
                            Jetzt lernen
                        </Button>
                    </div>
                </>
            ) : (
                 <>
                    <AlertTriangle className="h-12 w-12 text-amber-500"/>
                    <h3 className="text-2xl font-bold">Nichts gefunden</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Keine Vokabelpaare erkannt. Bitte prüfe das Format (z.B. `Wort - Übersetzung`) und versuche es erneut.
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
      <div className="p-4 sm:p-6">
        <div className="w-full max-w-sm mx-auto space-y-4 mb-6">
            <h3 className="text-xl font-bold text-center text-foreground">Vokabeln hinzufügen</h3>
            <p className="text-base text-muted-foreground text-center">
               Wähle eine Kategorie und füge Karten per Foto, Text oder "Teilen"-Funktion hinzu.
            </p>
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
        </div>

        <Tabs defaultValue="photo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo"><Camera className="mr-2 h-4 w-4" />Foto-Scan</TabsTrigger>
            <TabsTrigger value="text"><Text className="mr-2 h-4 w-4" />Text einfügen</TabsTrigger>
          </TabsList>
          <TabsContent value="photo" className="pt-6 text-center">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground max-w-md">
                    Fotografiere eine Vokabelliste oder wähle ein Bild aus deiner Galerie.
                 </p>
                <Button
                    size="lg"
                    className="w-full max-w-xs h-14 text-lg"
                    onClick={() => setCameraOpen(true)}
                    disabled={isLoading}
                >
                    <Camera className="mr-3 h-6 w-6" />
                    Foto aufnehmen
                </Button>
                 <Button
                    variant="secondary"
                    className="w-full max-w-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                >
                    Datei auswählen
                </Button>
            </div>
          </TabsContent>
          <TabsContent value="text" className="pt-6">
            <div className="flex flex-col items-center gap-4">
                 <p className="text-sm text-muted-foreground max-w-md text-center">
                    Füge hier deine Vokabelliste ein. Jede Zeile sollte ein Paar enthalten, z.B. `Wort - Übersetzung`.
                 </p>
                <Textarea
                    placeholder="Beispiel:
dziękuję - danke
proszę - bitte
przepraszam - Entschuldigung"
                    className="min-h-[150px] text-base"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                />
                <Button
                    size="lg"
                    className="w-full max-w-xs"
                    onClick={handlePasteProcess}
                    disabled={!pastedText.trim()}
                >
                    Karten erstellen
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <Alert>
                  <Share2 className="h-4 w-4" />
                  <AlertTitle>Neu: Per "Teilen" importieren!</AlertTitle>
                  <AlertDescription>
                    Du kannst jetzt Text aus Apps wie Google Lens oder Keep direkt an LinguaDeck senden. Installiere die App (im Browser-Menü unter "App installieren" oder "Zum Startbildschirm hinzufügen") und wähle sie im "Teilen"-Dialog aus.
                  </AlertDescription>
                </Alert>
            </CardHeader>
            <CardContent className="p-0">
            {renderContent()}
            </CardContent>
             <CardFooter className="flex-col items-center justify-center gap-2 border-t pt-4 text-center">
                 <p className="text-xs text-muted-foreground">
                    OCR-Status: {isReady ? "Bereit" : status}
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
