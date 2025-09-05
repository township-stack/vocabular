import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";

export default function ManagePage() {
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
          <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import CSV</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
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
