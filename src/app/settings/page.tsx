import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Settings Panel</CardTitle>
           <CardDescription>Configuration options will be available here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold text-muted-foreground">Settings Coming Soon</h3>
            <p className="text-sm text-muted-foreground">This is where you'll be able to configure app settings, your profile, and more.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
