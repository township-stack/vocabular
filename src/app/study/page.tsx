"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Card as CardType } from "@/lib/types";

// --- Local Storage & SRS Logic ---

function loadCards(): CardType[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cards") ?? "[]");
  } catch {
    return [];
  }
}

function saveCards(cards: CardType[]) {
  localStorage.setItem("cards", JSON.stringify(cards));
}

function getDueCards(): CardType[] {
  const now = new Date();
  return loadCards().filter(c => !c.due || new Date(c.due) <= now)
         .sort((a,b) => new Date(a.due || 0).getTime() - new Date(b.due || 0).getTime());
}

function reviewCard(card: CardType, quality: number) {
  let { reps, ease, interval } = card;
  const minEase = 1.3;

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps = (reps || 0) + 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round((interval || 1) * ease);

    ease = ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (ease < minEase) ease = minEase;
  }

  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + interval);

  const updated: CardType = {
    ...card,
    reps,
    ease,
    interval,
    due: nextDue.toISOString(),
  };

  const cards = loadCards().map(c => (c.id === card.id ? updated : c));
  saveCards(cards);

  return updated;
}


// --- Component ---

export default function StudyPage() {
  const [queue, setQueue] = useState<CardType[]>([]);
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [showBack, setShowBack] = useState(false);
  
  useEffect(() => {
    const due = getDueCards();
    setQueue(due);
    setCurrentCard(due[0] || null);
  }, []);

  const grade = useCallback((quality: number) => {
    if (!currentCard) return;

    reviewCard(currentCard, quality);
    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    setCurrentCard(nextQueue[0] || null);
    setShowBack(false);
  }, [currentCard, queue]);


  const renderCard = () => {
    if (!currentCard) {
      return (
        <div className="text-center py-12 flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-500"/>
          <h3 className="text-lg font-semibold text-muted-foreground">Super! 🎉</h3>
          <p className="text-sm text-muted-foreground">Du hast alle fälligen Karten für heute gelernt.</p>
        </div>
      );
    }

    return (
        <>
            <CardHeader>
              <CardTitle className="text-2xl">
                Lernsitzung ({queue.length} Karten übrig)
              </CardTitle>
              <CardDescription>
                {showBack ? "Wie gut konntest du dich erinnern?" : "Was ist die Übersetzung?"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 <div className="text-4xl font-bold text-center break-words">
                    {showBack ? currentCard.back : currentCard.front}
                 </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6">
                {!showBack ? (
                    <Button onClick={() => setShowBack(true)} className="w-full" size="lg">
                    Antwort anzeigen
                    </Button>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full">
                    {[0, 1, 2, 3, 4, 5].map(q => (
                        <Button
                        key={q}
                        onClick={() => grade(q)}
                        variant={q < 3 ? "destructive" : "default"}
                        className="flex-1"
                        >
                        {q}
                        </Button>
                    ))}
                    </div>
                )}
                 <p className="text-xs text-muted-foreground text-center">
                    0 = Gar nicht gewusst, 5 = Perfekt gewusst
                </p>
            </CardFooter>
        </>
    );
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Dashboard
      </Link>

      <Card className="min-h-[450px] flex flex-col">
        {renderCard()}
      </Card>
    </div>
  );
}
