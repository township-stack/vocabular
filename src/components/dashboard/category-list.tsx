import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_CATEGORIES } from "@/lib/mock-data";

export default function CategoryList() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Your vocabulary decks.</CardDescription>
          </div>
          <Button size="sm" variant="ghost">
            <PlusCircle className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[260px]">
          <div className="space-y-2">
            {MOCK_CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-sm">{category.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {category.cardCount} cards
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
