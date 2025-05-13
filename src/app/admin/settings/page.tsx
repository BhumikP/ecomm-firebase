
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Percent, Truck, AlertTriangle } from 'lucide-react'; // Added icons

interface StoreSettings {
  storeName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  taxPercentage: number;
  shippingCharge: number;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'eShop Simplified',
    supportEmail: 'support@eshop.com',
    maintenanceMode: false,
    taxPercentage: 0, // Default tax percentage
    shippingCharge: 0, // Default shipping charge
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // In a real app, load initial settings from API
    const loadedSettings = localStorage.getItem('storeSettings');
    if (loadedSettings) {
      try {
        const parsedSettings = JSON.parse(loadedSettings) as StoreSettings;
        // Validate parsed settings structure if necessary
        if (parsedSettings && typeof parsedSettings.storeName === 'string') {
             setSettings(prev => ({
                ...prev, // keep defaults for any missing fields
                ...parsedSettings,
                taxPercentage: parsedSettings.taxPercentage ?? 0, // Ensure defaults for new fields
                shippingCharge: parsedSettings.shippingCharge ?? 0,
             }));
        } else {
            console.warn("Invalid settings found in localStorage, using defaults.");
        }

      } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
        // Stick to default settings if parsing fails
      }
    }
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSwitchChange = (checked: boolean, name: keyof StoreSettings) => {
    setSettings(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    console.log('Saving settings:', settings);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // In a real app, save to API: await fetch('/api/admin/settings', { method: 'POST', body: JSON.stringify(settings) });
      localStorage.setItem('storeSettings', JSON.stringify(settings)); // Mock save to localStorage
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

  if (!isClient) {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-1/2 bg-muted rounded"></div>
            <Card><CardHeader><div className="h-6 w-1/4 bg-muted rounded"></div></CardHeader><CardContent className="space-y-4"><div className="h-10 bg-muted rounded w-full"></div><div className="h-10 bg-muted rounded w-full"></div></CardContent></Card>
            <div className="flex justify-end"><div className="h-10 w-24 bg-muted rounded"></div></div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
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
              name="storeName"
              value={settings.storeName}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              name="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>Configure tax rates and shipping costs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="taxPercentage" className="flex items-center"><Percent className="mr-2 h-4 w-4 text-muted-foreground" />Tax Percentage (%)</Label>
            <Input
              id="taxPercentage"
              name="taxPercentage"
              type="number"
              value={settings.taxPercentage}
              onChange={handleInputChange}
              placeholder="e.g., 18"
              min="0"
              max="100"
              step="0.01"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Enter value like '18' for 18%. Used for cart calculations.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCharge" className="flex items-center"><Truck className="mr-2 h-4 w-4 text-muted-foreground" />Default Shipping Charge (₹)</Label>
            <Input
              id="shippingCharge"
              name="shippingCharge"
              type="number"
              value={settings.shippingCharge}
              onChange={handleInputChange}
              placeholder="e.g., 50"
              min="0"
              step="1"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Flat shipping rate. More complex rules may need custom logic.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
             <div className="space-y-0.5">
                 <Label htmlFor="maintenanceMode" className="text-base flex items-center">
                   <AlertTriangle className="mr-2 h-5 w-5 text-orange-500"/>Maintenance Mode
                 </Label>
                 <p className="text-sm text-muted-foreground">
                    Temporarily disable storefront access for updates. Admins may still access the site.
                 </p>
             </div>
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => handleSwitchChange(checked, 'maintenanceMode')}
              disabled={isLoading}
              aria-label="Toggle maintenance mode"
            />
          </div>
           {/* Example of future setting placeholder */}
           <Card className="mt-6">
             <CardHeader>
                <CardTitle className="text-lg">Advanced Integrations</CardTitle>
                <CardDescription>Configure external services and API keys.</CardDescription>
             </CardHeader>
             <CardContent>
                 <p className="text-muted-foreground">[Payment Gateway Keys, Email Service API, etc. - Placeholder]</p>
             </CardContent>
           </Card>

        </CardContent>
      </Card>

      <div className="flex justify-end mt-8">
        <Button onClick={handleSaveChanges} disabled={isLoading} size="lg">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
