"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Check, Loader2, RefreshCw, X } from "lucide-react";
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
import { extractTextFromImage } from "@/ai/flows/ocr";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function AddFromPhotoPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<{ front: string; back: string } | null>(null);

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
    setExtractedData(null);
  };

  const handleProcessImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      const result = await extractTextFromImage({ photoDataUri: capturedImage });
      setExtractedData(result);
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        variant: "destructive",
        title: "Fehler bei der Texterkennung",
        description: "Das Bild konnte nicht verarbeitet werden. Bitte versuche es erneut.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCard = () => {
    // Logic to save the card will be implemented later
    toast({
        title: "Karte gespeichert (simuliert)",
        description: "Deine neue Karte wurde zur Bibliothek hinzugefügt.",
    });
    handleRetake();
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
            {extractedData
              ? "Überprüfe den erkannten Text und speichere deine Karte."
              : capturedImage
              ? "Das Bild wurde erfasst. Bist du bereit für die Texterkennung?"
              : "Richte deine Kamera auf ein Wort oder einen Satz, um eine neue Karte zu erstellen."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>Kamerazugriff erforderlich</AlertTitle>
              <AlertDescription>
                Bitte erlaube den Zugriff auf die Kamera, um diese Funktion zu nutzen.
              </AlertDescription>
            </Alert>
          )}

          <div className="relative aspect-video w-full max-w-2xl mx-auto bg-muted rounded-md overflow-hidden flex items-center justify-center">
            {capturedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capturedImage} alt="Captured" className="w-full h-auto" />
            ) : (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            )}
             {hasCameraPermission === null && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
             )}
          </div>
           <canvas ref={canvasRef} className="hidden" />

           {extractedData && (
             <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="front">Vorderseite</Label>
                    <Textarea id="front" value={extractedData.front} onChange={(e) => setExtractedData({...extractedData, front: e.target.value})} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="back">Rückseite</Label>
                    <Textarea id="back" value={extractedData.back} onChange={(e) => setExtractedData({...extractedData, back: e.target.value})} className="mt-1" />
                </div>
             </div>
           )}

        </CardContent>
        <CardFooter className="flex justify-center gap-4 border-t pt-6">
          {extractedData ? (
            <>
               <Button variant="outline" onClick={handleRetake}><RefreshCw className="mr-2 h-4 w-4" /> Erneut aufnehmen</Button>
               <Button onClick={handleSaveCard}><Check className="mr-2 h-4 w-4" /> Karte speichern</Button>
            </>
          ) : capturedImage ? (
             <>
                <Button variant="outline" onClick={handleRetake} disabled={isProcessing}><X className="mr-2 h-4 w-4" /> Wiederholen</Button>
                <Button onClick={handleProcessImage} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    {isProcessing ? "Wird verarbeitet..." : "Bestätigen"}
                </Button>
             </>
          ) : (
            <Button onClick={handleCapture} disabled={hasCameraPermission !== true}>
              <Camera className="mr-2 h-4 w-4" /> Foto aufnehmen
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
