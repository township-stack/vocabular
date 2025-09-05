"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import type { Card as CardType } from "@/lib/types";
import { MOCK_CATEGORIES } from "@/lib/mock-data";


// --- Date Helpers ---
const toYMD = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const plusDaysYMD = (days: number): string => {
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + days);
  return toYMD(d);
};


// --- Local Storage & SRS Logic ---
function loadCards(): CardType[] {
  if (typeof window === "undefined") return [];
  try {
    const cards = JSON.parse(localStorage.getItem("cards") ?? "[]") as CardType[];
    // Ensure dueDay is set for old cards for backwards compatibility
     return cards.map((c: CardType) => ({
        ...c,
        dueDay: c.dueDay || c.due?.split('T')[0] || toYMD(),
    }));
  } catch {
    return [];
  }
}

function saveCards(cards: CardType[]) {
  localStorage.setItem("cards", JSON.stringify(cards));
}


function getDueCards(categoryId?: string): CardType[] {
  const today = toYMD();
  return loadCards()
        .filter(c =>
            (!categoryId || c.categoryId === categoryId) &&
            (c.dueDay! <= today)
        )
        .sort((a,b) => new Date(a.due || 0).getTime() - new Date(b.due || 0).getTime());
}

function reviewCard(card: CardType, quality: number): CardType {
  let { reps, ease, interval } = card;
  const minEase = 1.3;

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps = (reps || 0) + 1;
    if (reps === 1) {
        interval = 1;
    } else if (reps === 2) {
        interval = 6;
    } else {
        interval = Math.round((interval || 1) * ease);
    }

    ease = ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (ease < minEase) ease = minEase;
  }
  
  const updated: CardType = {
    ...card,
    reps,
    ease,
    interval,
    due: new Date(Date.now() + interval * 864e5).toISOString(),
    dueDay: plusDaysYMD(interval),
  };

  const allCards = loadCards();
  const updatedCards = allCards.map(c => (c.id === card.id ? updated : c));
  saveCards(updatedCards);

  return updated;
}


// --- Component ---
export default function StudyPage() {
  const [queue, setQueue] = useState<CardType[]>([]);
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [category, setCategory] = useState<string | undefined>(undefined);

  const refreshQueue = useCallback((cat?: string) => {
    const due = getDueCards(cat);
    setQueue(due);
    setCurrentCard(due[0] || null);
  }, []);
  
  useEffect(() => {
    refreshQueue(category);
  }, [category, refreshQueue]);

  const grade = useCallback((quality: number) => {
    if (!currentCard) return;

    reviewCard(currentCard, quality);

    // Instead of re-filtering the whole deck, just remove the reviewed card
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
            <CardHeader className="flex-row justify-between items-center">
              <div>
                <CardTitle className="text-2xl">
                    Lernsitzung ({queue.length} übrig)
                </CardTitle>
                <CardDescription>
                    {showBack ? "Wie gut konntest du dich erinnern?" : "Was ist die Übersetzung?"}
                </CardDescription>
              </div>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {MOCK_CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 <div className="text-4xl font-bold text-center break-words px-4">
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

    