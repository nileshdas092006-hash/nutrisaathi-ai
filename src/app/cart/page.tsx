"use client";

import { useState, useEffect } from "react";
import { cartHealthAssessment, CartHealthAssessmentOutput } from "@/ai/flows/cart-health-assessment";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { HealthScore } from "@/components/health-score";
import { ShoppingCart, Plus, X, Loader2, RefreshCw, Layers, ArrowRight, Sparkles, AlertCircle, CheckCircle2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useSessionAnalytics } from "@/hooks/use-session-analytics";
import { setDocumentNonBlocking } from "@/firebase";
import { useLanguage, LANGUAGES } from "@/hooks/use-language";
import { VoiceOutput } from "@/components/voice-output";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CartPage() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CartHealthAssessmentOutput | null>(null);
  const [mounted, setMounted] = useState(false);
  const { profile, isLoaded, user } = useProfile();
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { sessionId } = useSessionAnalytics();
  const { t, language } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const savedItems = localStorage.getItem("nutrisaathi_active_cart");
    if (savedItems) {
      try { setItems(JSON.parse(savedItems)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("nutrisaathi_active_cart", JSON.stringify(items));
    }
  }, [items]);

  const addItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = input.trim();
    if (!val) return;
    if (items.some(i => i.toLowerCase() === val.toLowerCase())) {
      toast({ title: "Item already in list", variant: "default" });
      return;
    }
    setItems([...items, val]);
    setInput("");
  };

  const removeItem = (item: string) => {
    setItems(items.filter((i) => i !== item));
  };

  const analyzeCart = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);

    const currentLangLabel = LANGUAGES.find(l => l.code === language)?.label || "English";

    try {
      const data = await cartHealthAssessment({
        foodItems: items,
        userProfile: profile,
        language: currentLangLabel,
      });
      setResult(data);

      if (firestore) {
        const eventRef = doc(collection(firestore, "cartAnalysisEvents"));
        setDocumentNonBlocking(eventRef, {
          id: eventRef.id,
          timestamp: new Date().toISOString(),
          numberOfItems: items.length,
          healthScore: data.cartHealthScore,
          anonymizedSessionId: sessionId
        }, { merge: true });

        if (user) {
          const userCartRef = collection(firestore, "users", user.uid, "cartHistory");
          addDocumentNonBlocking(userCartRef, {
            userId: user.uid,
            items,
            healthScore: data.cartHealthScore,
            riskSummary: data.riskSummary,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Basket analysis timed out. Please try again with fewer items.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 safe-bottom">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-none text-[10px] font-black uppercase">Grocery Intelligence</Badge>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">{t("CART_TITLE")}</h1>
          <p className="text-muted-foreground max-w-md font-medium">{t("CART_DESC")}</p>
        </div>
        <div className="flex gap-3">
          {items.length > 0 && (
            <Button 
              onClick={() => { setItems([]); setResult(null); localStorage.removeItem("nutrisaathi_active_cart"); }} 
              variant="outline"
              className="rounded-xl h-12 px-6 font-bold"
              disabled={loading}
            >
              Clear
            </Button>
          )}
          <Button 
            onClick={analyzeCart} 
            disabled={loading || items.length === 0}
            className="rounded-xl h-12 px-8 font-black shadow-xl shadow-primary/20 transition-transform active:scale-95 flex-1 md:flex-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            {loading ? t("CART_ANALYZING") : t("CART_AUDIT_BTN")}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8 rounded-3xl border-destructive/20 bg-destructive/5 animate-in slide-in-from-top-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Delay</AlertTitle>
          <AlertDescription className="flex items-center justify-between mt-2">
            {error}
            <Button size="sm" variant="outline" onClick={analyzeCart} className="h-8 bg-white font-bold">
              <RefreshCw className="w-3 h-3 mr-2" /> Retry Audit
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-3xl border shadow-xl bg-white p-8 sticky top-24">
            <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 text-primary" /> {t("CART_ITEMS_LABEL")} <Badge className="bg-primary/5 text-primary ml-auto">{items.length}</Badge>
            </h3>
            
            <form onSubmit={addItem} className="flex gap-2 mb-8">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("CART_ADD_PLACEHOLDER")}
                className="rounded-xl h-12 notion-input shadow-inner"
                disabled={loading}
              />
              <Button type="submit" size="icon" className="h-12 w-12 shrink-0 rounded-xl shadow-md transition-transform active:scale-90" disabled={loading}>
                <Plus className="w-5 h-5" />
              </Button>
            </form>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {items.length === 0 && (
                <div className="text-center py-16 text-muted-foreground text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-2xl flex flex-col items-center gap-4 animate-in fade-in duration-700">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center"><Layers className="w-5 h-5 opacity-30" /></div>
                  {t("CART_EMPTY")}
                </div>
              )}
              {items.map((item) => (
                <div key={item} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl group animate-in slide-in-from-left-4">
                  <span className="text-sm font-bold truncate max-w-[150px]">{item}</span>
                  <button onClick={() => removeItem(item)} className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-all" disabled={loading}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {result ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
              <Card className="rounded-[2.5rem] border shadow-2xl bg-white p-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 z-20"><VoiceOutput text={result.riskSummary} /></div>
                 <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                  <HealthScore score={result.cartHealthScore} size="lg" className="scale-125" />
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center justify-center md:justify-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-primary" /> {t("CART_VERDICT")}
                    </h3>
                    <p className="text-foreground/90 text-2xl font-black italic leading-relaxed">"{result.riskSummary}"</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3 ml-2">
                   <Sparkles className="w-4 h-4 text-primary" /> {t("CART_SWAPS_LABEL")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.replacements.length > 0 ? result.replacements.map((swap, i) => (
                    <Card key={i} className="rounded-3xl border shadow-lg bg-white p-8 hover:border-primary/30 transition-all hover:shadow-2xl group">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                         <span className="line-through text-muted-foreground/60 text-xs font-bold uppercase tracking-tighter">{swap.originalItem}</span>
                         <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                         <span className="text-lg font-black text-primary">{swap.replacement}</span>
                      </div>
                      <p className="text-sm text-muted-foreground font-semibold leading-relaxed">{swap.reason}</p>
                    </Card>
                  )) : (
                     <div className="col-span-2 py-12 text-center border-2 border-dashed rounded-3xl">
                        <p className="text-sm font-bold text-muted-foreground">Your basket is already peak nutritional excellence!</p>
                     </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            !loading && !error && (
              <div className="h-full min-h-[550px] flex flex-col items-center justify-center py-20 text-center border-4 border-dashed rounded-[3.5rem] bg-secondary/10 group hover:bg-secondary/20 transition-colors">
                <div className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-3xl font-black mb-4">{t("CART_TITLE")}</h3>
                <p className="text-muted-foreground max-w-sm px-10 font-medium leading-relaxed mb-10">
                  {t("CART_DESC")} Add your weekly groceries to see how they impact your health.
                </p>
                <div className="flex gap-4">
                   <Badge variant="outline" className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50 bg-white">Sugar Check</Badge>
                   <Badge variant="outline" className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50 bg-white">Sodium Audit</Badge>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
