"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { savePairsLocal } from '@/lib/local-storage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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

function ShareReceiverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const sharedText = searchParams.get('text');
    const sharedTitle = searchParams.get('title');
    const sharedUrl = searchParams.get('url');

    console.log("Shared data received:", { sharedText, sharedTitle, sharedUrl });

    const textToProcess = sharedText || sharedTitle || '';

    if (!textToProcess) {
      toast({
        variant: "destructive",
        title: "Kein Text empfangen",
        description: "Beim Teilen wurden keine Textdaten übermittelt.",
      });
      router.push('/');
      return;
    }

    try {
      const pairs = parsePairs(textToProcess);
      
      if (pairs.length > 0) {
        savePairsLocal(pairs); // Saves to default category
        toast({
          title: `${pairs.length} Karten importiert!`,
          description: `Die geteilten Vokabeln wurden erfolgreich gespeichert.`,
        });
      } else {
        toast({
          title: "Keine Vokabelpaare gefunden",
          description: "Der geteilte Text konnte nicht als Vokabeln interpretiert werden. Versuche das Format 'Wort - Übersetzung'.",
        });
      }
    } catch (error) {
      console.error("Failed to process shared text:", error);
      toast({
        variant: "destructive",
        title: "Verarbeitung fehlgeschlagen",
        description: "Der geteilte Text konnte nicht verarbeitet werden.",
      });
    } finally {
      // Redirect back to the main page after processing
      router.push('/');
    }

  }, [searchParams, router, toast]);

  return (
     <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Verarbeite geteilte Vokabeln...</CardTitle>
                <CardDescription>
                    Einen Moment, die Daten von Google Lens, Keep etc. werden importiert. Du wirst gleich weitergeleitet.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </CardContent>
        </Card>
     </div>
  );
}


export default function ShareReceiverPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ShareReceiverContent />
        </Suspense>
    )
}
