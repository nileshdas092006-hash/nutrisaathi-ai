"use client";

import { useState, useEffect } from "react";
import { personalizedFoodAnalysis, PersonalizedFoodAnalysisOutput } from "@/ai/flows/personalized-food-analysis";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { HealthScore } from "@/components/health-score";
import { Search, ChevronRight, Loader2, Sparkles, Leaf, Activity, History, RefreshCw, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy, limit } from "firebase/firestore";
import { useSessionAnalytics } from "@/hooks/use-session-analytics";
import { VoiceSearch } from "@/components/voice-search";
import { VoiceOutput } from "@/components/voice-output";
import { useLanguage } from "@/hooks/use-language";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function SearchPage() {
  const [queryText, setQueryText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PersonalizedFoodAnalysisOutput | null>(null);
  const [mounted, setMounted] = useState(false);
  const { profile, isLoaded, user } = useProfile();
  const { firestore } = useFirestore();
  const { sessionId } = useSessionAnalytics();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "searchHistory"),
      orderBy("timestamp", "desc"),
      limit(5)
    );
  }, [firestore, user]);
  
  const { data: searchHistory } = useCollection(historyQuery);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const searchTerm = (customQuery || queryText).trim();
    if (!searchTerm || !isLoaded) return;

    if (customQuery) setQueryText(customQuery);
    setLoading(true);
    setError(null);

    // Timeout notification for slow connections
    const timer = setTimeout(() => {
      if (loading) {
        toast({
          title: "Taking a bit longer...",
          description: "Our AI is analyzing deep nutritional patterns.",
        });
      }
    }, 8000);

    try {
      if (firestore) {
        const searchRef = doc(collection(firestore, "searchEvents"));
        setDocumentNonBlocking(searchRef, {
          id: searchRef.id,
          query: searchTerm,
          timestamp: new Date().toISOString(),
          anonymizedSessionId: sessionId,
          userId: user?.uid || "guest"
        }, { merge: true });

        if (user) {
          const userHistoryRef = collection(firestore, "users", user.uid, "searchHistory");
          addDocumentNonBlocking(userHistoryRef, {
            userId: user.uid,
            query: searchTerm,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const data = await personalizedFoodAnalysis({
        foodQuery: searchTerm,
        userProfile: {
          age: profile.age,
          weight: profile.weight,
          healthConditions: profile.healthConditions,
          dietType: profile.dietType,
          region: profile.region || "General India",
        },
      });
      setResult(data);
    } catch (err: any) {
      console.error("Search failed:", err);
      // Specifically handle "Failed to fetch" which is common in development or network drops
      if (err.message?.includes("fetch") || err.name === "TypeError") {
        setError("Network Connection Issue: We couldn't connect to the analysis engine. Please check your internet and try again.");
      } else {
        setError("Analysis Timeout: The engine is currently busy or taking too long. Please try a simpler search or retry now.");
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const handleVoiceResult = (text: string) => {
    setQueryText(text);
    handleSearch(undefined, text);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 safe-bottom">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase">V2 Intelligence</Badge>
        </div>
        <h1 className="text-3xl font-extrabold mb-3 tracking-tight">{t("SEARCH_TITLE")}</h1>
        <p className="text-muted-foreground">{t("SEARCH_DESC")}</p>
        
        <form onSubmit={(e) => handleSearch(e)} className="mt-8">
          <div className="relative flex items-center group">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={t("SEARCH_PLACEHOLDER")}
              className="pl-12 pr-32 h-14 rounded-2xl border-border bg-secondary/30 focus-visible:bg-white text-lg transition-all shadow-sm"
              disabled={loading}
            />
            <div className="absolute right-2 flex items-center gap-1">
              <VoiceSearch onResult={handleVoiceResult} />
              <Button 
                type="submit" 
                disabled={loading || !queryText.trim()}
                className="h-10 px-5 rounded-xl font-bold shadow-md transition-transform active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("SEARCH_ANALYZE_BTN")}
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-6 rounded-2xl border-destructive/20 bg-destructive/5 animate-in fade-in zoom-in-95">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Stability Notice</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <span className="text-sm">{error}</span>
              <Button size="sm" variant="outline" onClick={() => handleSearch()} className="h-8 rounded-lg font-bold bg-white shrink-0">
                <RefreshCw className="w-3 h-3 mr-1.5" /> Retry Audit
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {user && searchHistory && searchHistory.length > 0 && !result && !loading && !error && (
          <div className="mt-8 animate-in fade-in duration-700">
            <h4 className="text-[10px] uppercase font-black text-muted-foreground mb-4 tracking-widest flex items-center gap-2">
              <History className="w-3 h-3" /> {t("SEARCH_HISTORY_LABEL")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((h: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => handleSearch(undefined, h.query)}
                  className="text-xs font-bold px-4 py-2 bg-secondary/50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                >
                  {h.query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && !result && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
          <div className="relative mb-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary opacity-30" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Running health simulation...</p>
        </div>
      )}

      {result ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border border-border/50 shadow-xl bg-white p-8 flex flex-col items-center justify-center transition-all hover:shadow-2xl hover:border-primary/20">
              <HealthScore score={result.healthScore} size="lg" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-6">{t("RESULT_HEALTH_SCORE")}</h3>
            </Card>

            <Card className="rounded-3xl border border-border/50 shadow-xl bg-white p-8 col-span-1 md:col-span-2 relative group overflow-hidden">
               <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <Badge variant="outline" className={cn("px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider", result.decision === "Buy" ? "bg-primary/10 text-primary border-primary/20" : result.decision === "Moderate" ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-destructive/10 text-destructive border-destructive/20")}>
                  {result.decision}
                </Badge>
                <VoiceOutput text={result.explanation} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> {t("RESULT_VERDICT")}
              </h3>
              <p className="text-foreground/80 leading-relaxed font-semibold text-xl italic relative z-10">"{result.explanation}"</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            <Card className="rounded-3xl border border-border/50 shadow-xl bg-white p-8 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Leaf className="w-5 h-5 text-primary" /></div>
                <h3 className="text-xl font-extrabold">{t("RESULT_ALTERNATIVES")}</h3>
              </div>
              <div className="space-y-3">
                {result.healthierAlternatives.length > 0 ? result.healthierAlternatives.map((alt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSearch(undefined, alt)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-secondary/20 hover:bg-primary/5 hover:border-primary/20 transition-all text-left group"
                  >
                     <p className="font-bold text-sm group-hover:text-primary transition-colors">{alt}</p>
                     <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                )) : <p className="text-sm text-muted-foreground italic">No alternatives needed for this healthy choice!</p>}
              </div>
            </Card>

            <Card className="rounded-3xl border border-border/50 shadow-xl bg-white p-8 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Activity className="w-5 h-5 text-primary" /></div>
                <h3 className="text-xl font-extrabold">{t("RESULT_LOGIC")}</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground/60 mb-2 tracking-widest">{t("RESULT_QUANTITY")}</p>
                  <p className="font-bold text-primary bg-primary/5 inline-block px-3 py-1 rounded-lg">{result.safeQuantity}</p>
                </div>
                <Separator className="opacity-50" />
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground/60 mb-2 tracking-widest">{t("RESULT_RISK")}</p>
                  <p className="font-bold text-destructive/80 leading-relaxed">{result.avoidanceWarnings}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        !loading && !error && (
          <div className="mt-20 border-2 border-dashed border-border/60 rounded-[3rem] py-24 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary rounded-full mb-8 shadow-inner">
              <Search className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black mb-3">Ready for analysis?</h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
              Type or speak the name of any dish, brand, or packaged snack for an instant health audit.
            </p>
          </div>
        )
      )}
    </div>
  );
}
