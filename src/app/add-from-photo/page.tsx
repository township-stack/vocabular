"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Camera, Check, Loader2, RefreshCw, ScanText, X, Languages, PlusCircle, Save } from "lucide-react";
import Link from "next/link";
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
import { createWorker, Worker } from 'tesseract.js';
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_CATEGORIES } from "@/lib/mock-data";


interface OcrProgress {
    status: string;
    progress: number;
}


export default function AddFromPhotoPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(MOCK_CATEGORIES[0]?.id || '');

  const workerRef = useRef<Worker | null>(null);

  const setupWorker = useCallback(async () => {
    const worker = await createWorker({
      logger: m => {
        if (m.status === 'recognizing text') {
            setOcrProgress({ status: m.status, progress: m.progress });
        } else {
            console.log(m);
        }
      },
    });
    await worker.loadLanguage('pol+deu');
    await worker.initialize('pol+deu');
    workerRef.current = worker;
  }, []);

  useEffect(() => {
    setupWorker();
    return () => {
      workerRef.current?.terminate();
    }
  }, [setupWorker]);
  

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API is not available in this browser.");
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Kamera nicht unterstützt",
          description: "Dein Browser unterstützt die Kamera-API nicht.",
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Kamerazugriff verweigert",
          description: "Bitte aktiviere den Kamerazugriff in deinen Browser-Einstellungen.",
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
      }
    }
  };
  
  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedText(null);
    setOcrProgress(null);
    setFront('');
    setBack('');
  };

  const handleProcessImage = async () => {
    if (!capturedImage || !workerRef.current) return;

    setIsProcessing(true);
    setOcrProgress({ status: 'starting', progress: 0 });
    try {
      const { data: { text } } = await workerRef.current.recognize(capturedImage);
      setExtractedText(text);
      // Simple heuristic: if there's a newline, take the first line as front.
      // This part can be improved with a Genkit flow later if needed.
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 0) {
        setFront(lines[0]);
        if (lines.length > 1) {
            setBack(lines[1]);
        }
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        variant: "destructive",
        title: "Fehler bei der Texterkennung",
        description: "Das Bild konnte nicht verarbeitet werden. Bitte versuche es erneut.",
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  const handleSaveCard = () => {
    // In a real app, this would call a Firestore function to save the card.
    console.log("Saving card:", {
        front,
        back,
        categoryId: selectedCategory,
    });
    toast({
        title: "Karte gespeichert (simuliert)",
        description: `Vorderseite: ${front}`,
    });
    // Reset for next card
    handleRetake();
  };

  const renderContent = () => {
    if (extractedText !== null) {
      return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="front">Vorderseite (Polnisch)</Label>
                    <Textarea id="front" value={front} onChange={(e) => setFront(e.target.value)} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="back">Rückseite (Deutsch)</Label>
                    <Textarea id="back" value={back} onChange={(e) => setBack(e.target.value)} className="mt-1" />
                </div>
             </div>
             <div>
                <Label htmlFor="category">Kategorie</Label>
                 <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category" className="mt-1">
                        <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                        {MOCK_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
             <div className="mt-4">
                <Label>Erkannter Rohtext</Label>
                <pre className="mt-1 text-xs p-3 bg-muted rounded-md max-h-40 overflow-auto whitespace-pre-wrap font-code">{extractedText}</pre>
             </div>
        </div>
      );
    }

    if (capturedImage) {
        if (isProcessing) {
            return (
                 <div className="flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground font-medium mb-2">Texterkennung läuft...</p>
                    <p className="text-sm text-muted-foreground capitalize mb-2">{ocrProgress?.status.replace(/_/g, ' ') || 'Initialisiere'}</p>
                    <Progress value={ocrProgress ? ocrProgress.progress * 100 : 0} className="w-full max-w-sm" />
                </div>
            )
        }
        return (
            <div className="relative aspect-video w-full max-w-2xl mx-auto bg-muted rounded-md overflow-hidden flex items-center justify-center">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedImage} alt="Captured" className="w-full h-auto" />
            </div>
        );
    }

    // Default camera view
     return (
        <div className="relative aspect-video w-full max-w-2xl mx-auto bg-muted rounded-md overflow-hidden flex items-center justify-center">
           {hasCameraPermission === false && (
            <Alert variant="destructive" className="absolute m-4">
              <AlertTitle>Kamerazugriff erforderlich</AlertTitle>
              <AlertDescription>
                Bitte erlaube den Zugriff auf die Kamera, um diese Funktion zu nutzen.
              </AlertDescription>
            </Alert>
          )}
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2">Kamera wird gestartet...</p>
            </div>
          )}
        </div>
     );
  };

  const renderFooter = () => {
    if (extractedText !== null) {
        return (
            <>
               <Button variant="outline" onClick={handleRetake}><RefreshCw className="mr-2" /> Erneut aufnehmen</Button>
               <Button onClick={handleSaveCard} disabled={!front || !back}><Save className="mr-2" /> Karte speichern</Button>
            </>
        )
    }
    
    if (capturedImage) {
        return (
            <>
                <Button variant="outline" onClick={handleRetake} disabled={isProcessing}><X className="mr-2" /> Wiederholen</Button>
                <Button onClick={handleProcessImage} disabled={isProcessing || !workerRef.current}>
                    {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <ScanText className="mr-2" />}
                    {isProcessing ? "Wird verarbeitet..." : "Text erkennen"}
                </Button>
             </>
        )
    }

    return (
        <Button onClick={handleCapture} disabled={hasCameraPermission !== true}>
            <Camera className="mr-2" /> Foto aufnehmen
        </Button>
    )
  }

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
            {extractedText !== null
              ? "Überprüfe den erkannten Text und speichere deine Karte."
              : capturedImage
              ? "Das Bild wurde erfasst. Bist du bereit für die Texterkennung?"
              : "Richte deine Kamera auf ein Wort oder einen Satz, um eine neue Karte zu erstellen."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
           <canvas ref={canvasRef} className="hidden" />
        </CardContent>
        <CardFooter className="flex justify-center gap-4 border-t pt-6">
          {renderFooter()}
        </CardFooter>
      </Card>
    </div>
  );
}
