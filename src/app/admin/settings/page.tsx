'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState('eShop Simplified'); // Default or fetched value
  const [supportEmail, setSupportEmail] = useState('support@eshop.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Load initial settings from API in useEffect

  const handleSaveChanges = async () => {
    setIsLoading(true);
    console.log('Saving settings:', { storeName, supportEmail, maintenanceMode });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Replace with actual API call to save settings
      toast({
        title: "Settings Saved",
        description: "Your store settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not update settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Store Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage basic store information and operational status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
             <div className="space-y-0.5">
                 <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode</Label>
                 <p className="text-sm text-muted-foreground">
                    Temporarily disable storefront access for updates.
                 </p>
             </div>
            <Switch
              id="maintenanceMode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
              disabled={isLoading}
              aria-label="Toggle maintenance mode"
            />
          </div>

           {/* Add more settings fields here (e.g., currency, timezone, payment gateways) */}
           <Card>
             <CardHeader>
                <CardTitle className="text-lg">Advanced</CardTitle>
                <CardDescription>Configure integrations and advanced options.</CardDescription>
             </CardHeader>
             <CardContent>
                 <p className="text-muted-foreground">[API Keys, Webhooks, etc. Placeholder]</p>
             </CardContent>
           </Card>

        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
