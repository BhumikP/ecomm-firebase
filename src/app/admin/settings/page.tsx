
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch"; // Maintenance mode switch removed
import { useToast } from "@/hooks/use-toast";
import { Loader2, Percent, Truck } from 'lucide-react'; // AlertTriangle removed
import { Skeleton } from '@/components/ui/skeleton';


interface StoreSettings {
  storeName: string;
  supportEmail: string;
  // maintenanceMode: boolean; // Removed
  taxPercentage: number;
  shippingCharge: number;
}

const defaultSettingsState: StoreSettings = {
    storeName: 'eShop Simplified',
    supportEmail: 'support@eshop.com',
    // maintenanceMode: false, // Removed
    taxPercentage: 0,
    shippingCharge: 0,
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettingsState);
  const [isLoading, setIsLoading] = useState(false); // For save button
  const [isPageLoading, setIsPageLoading] = useState(true); // For initial page load


  useEffect(() => {
    const fetchSettings = async () => {
        setIsPageLoading(true);
        try {
            const response = await fetch('/api/admin/settings');
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || "Failed to load settings");
            }
            const data = await response.json();
            if (data.settings) {
                // Ensure all fields are present, falling back to defaults if API might return partials
                setSettings({
                    storeName: data.settings.storeName ?? defaultSettingsState.storeName,
                    supportEmail: data.settings.supportEmail ?? defaultSettingsState.supportEmail,
                    // maintenanceMode: data.settings.maintenanceMode ?? defaultSettingsState.maintenanceMode, // Removed
                    taxPercentage: data.settings.taxPercentage ?? defaultSettingsState.taxPercentage,
                    shippingCharge: data.settings.shippingCharge ?? defaultSettingsState.shippingCharge,
                });
            }
        } catch (error: any) {
            console.error("Failed to fetch settings:", error);
            toast({ variant: "destructive", title: "Load Error", description: error.message || "Could not load store settings."});
            // Keep default settings on error
        } finally {
            setIsPageLoading(false);
        }
    };
    fetchSettings();
  }, [toast]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  // handleSwitchChange removed as maintenance mode is removed

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
       const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to save settings.");
      }
      toast({
        title: "Settings Saved",
        description: "Your store settings have been updated successfully.",
      });
      if (result.settings) { // Update state with potentially validated/formatted data from backend
         setSettings(result.settings);
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "Could not update settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-9 w-1/3 rounded" /> {/* Title Skeleton */}
            {[...Array(2)].map((_, i) => ( // Reduced to 2 cards as maintenance card is removed
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/4 rounded" />
                        <Skeleton className="h-4 w-1/2 rounded mt-1" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2"><Skeleton className="h-5 w-1/5 rounded" /><Skeleton className="h-10 w-full rounded-md" /></div>
                        <div className="space-y-2"><Skeleton className="h-5 w-1/5 rounded" /><Skeleton className="h-10 w-full rounded-md" /></div>
                    </CardContent>
                </Card>
            ))}
            <div className="flex justify-end mt-8">
                <Skeleton className="h-12 w-40 rounded-md" /> {/* Button Skeleton */}
            </div>
        </div>
    );
  }


  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Store Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage basic store information.</CardDescription>
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

      {/* Maintenance Mode Card Removed */}
      
       <Card>
        <CardHeader>
          <CardTitle>Operational Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
        <Button onClick={handleSaveChanges} disabled={isLoading || isPageLoading} size="lg">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
