"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, PlusCircle } from "lucide-react";
import Link from "next/link";
import { loadCards, saveCards } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";
import type { Card as CardType } from "@/lib/types";

function exportCsv() {
  const cards = loadCards();
  const rows = cards.map(c =>
    [`"${(c.front||'').replace(/"/g,'""')}"`,
     `"${(c.back||'').replace(/"/g,'""')}"`,
     `"${(c.categoryId||'').replace(/"/g,'""')}"`].join(',')
  );
  const blob = new Blob([`front,back,category\n${rows.join('\n')}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'vokabeln.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const cards = loadCards();
  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'vokabeln_backup.json' });
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(String(fr.result)) as CardType[];
        if (!Array.isArray(data)) throw new Error('Invalid file');
        // Basic validation
        if (!data[0] || !('front' in data[0]) || !('back' in data[0])) {
            throw new Error('Invalid card format in JSON file.');
        }
        saveCards(data);
        resolve(data.length);
      } catch (e) {
        reject(e);
      }
    };
    fr.onerror = reject;
    fr.readAsText(file);
  });
}

export default function ManagePage() {
    const { toast } = useToast();

    const handleImportClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const count = await importJson(file);
                toast({
                    title: "Import erfolgreich",
                    description: `${count} Karten wurden aus der JSON-Datei importiert.`
                });
            } catch (error) {
                console.error("Import failed", error);
                toast({
                    variant: "destructive",
                    title: "Import fehlgeschlagen",
                    description: "Die Datei konnte nicht gelesen werden oder ist fehlerhaft."
                });
            }
        };
        input.click();
    };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Vocabulary</h1>
          <p className="text-muted-foreground">
            Add, edit, and organize your cards and categories.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/add-from-photo" passHref>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add from Photo</Button>
          </Link>
          <Button variant="outline" onClick={handleImportClick}><Upload className="mr-2 h-4 w-4" /> Import JSON</Button>
          <Button variant="outline" onClick={exportJson}><Download className="mr-2 h-4 w-4" /> Export JSON</Button>
          <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Cards</CardTitle>
          <CardDescription>Full library of your vocabulary cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold text-muted-foreground">Card Management Coming Soon</h3>
            <p className="text-sm text-muted-foreground">This area will display a table of all your cards for easy editing and filtering.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    