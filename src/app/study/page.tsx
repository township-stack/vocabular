import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function StudyPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
        </Link>
      
      <Card className="min-h-[400px] flex flex-col items-center justify-center text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Study Session</CardTitle>
          <CardDescription>Let's review your due cards.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-muted-foreground">Flashcard Interface Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Your flashcards will appear here one by one for you to review.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
