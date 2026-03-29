"use client";

import { useProfile, UserProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Activity, Info, LogOut, ShieldCheck, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import Link from "next/link";
import { useLanguage } from "@/hooks/use-language";

const HEALTH_CONDITIONS = ["Diabetes", "Hypertension", "Lactose Intolerance", "Nut Allergy", "Gluten Sensitivity"];
const REGIONS = ["North India", "South India", "East India", "West India", "Central India", "North East India", "General India"];

export default function ProfilePage() {
  const { profile, updateProfile, isLoaded, user } = useProfile();
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { t } = useLanguage();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profile);
    toast({
      title: "Settings Saved",
      description: "Your regional health profile has been updated successfully.",
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const toggleCondition = (condition: string) => {
    const updated = profile.healthConditions.includes(condition)
      ? profile.healthConditions.filter(c => c !== condition)
      : [...profile.healthConditions, condition];
    updateProfile({ ...profile, healthConditions: updated });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">{t("PROFILE_TITLE")}</h1>
          <p className="text-muted-foreground">{t("PROFILE_DESC")}</p>
        </div>
        {user && (
          <Button variant="outline" onClick={handleLogout} className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5">
            <LogOut className="w-4 h-4 mr-2" /> {t("NAV_LOGOUT")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <aside className="md:col-span-4 space-y-6">
          <Card className="rounded-2xl border border-border/50 shadow-sm bg-white overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t("PROFILE_QUICK_VIEW")}</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">{t("PROFILE_METABOLISM")}</Label>
                  <p className="text-2xl font-bold mt-1">{profile.age} <span className="text-xs font-medium text-muted-foreground uppercase">yrs</span></p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">{t("PROFILE_WEIGHT")}</Label>
                  <p className="text-2xl font-bold mt-1">{profile.weight} <span className="text-xs font-medium text-muted-foreground uppercase">kg</span></p>
                </div>
                <Separator />
                <div>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">{t("PROFILE_REGION")}</Label>
                  <p className="font-bold mt-1 text-primary flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.region}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </aside>

        <main className="md:col-span-8">
          <Card className="rounded-2xl border border-border/50 shadow-sm bg-white">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age}
                      onChange={(e) => updateProfile({ ...profile, age: Number(e.target.value) })}
                      className="rounded-lg h-11 notion-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={profile.weight}
                      onChange={(e) => updateProfile({ ...profile, weight: Number(e.target.value) })}
                      className="rounded-lg h-11 notion-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Region</Label>
                    <Select
                      value={profile.region}
                      onValueChange={(val) => updateProfile({ ...profile, region: val })}
                    >
                      <SelectTrigger className="rounded-lg h-11 border-border/60 bg-secondary/30">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full rounded-xl h-12 text-sm font-bold shadow-sm">
                    {user ? "Save Settings" : "Update Profile"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
