"use client";

import { useMemoFirebase, useCollection, useFirestore, useUser } from "@/firebase";
import { collection, orderBy, query, limit } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Search, ShoppingCart, BarChart3, TrendingUp, Users, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { generateWeeklyInsights, WeeklyInsightsOutput } from "@/ai/flows/weekly-insights-flow";
import { useProfile } from "@/hooks/use-profile";
import { addDocumentNonBlocking } from "@/firebase";
import { useLanguage } from "@/hooks/use-language";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const { firestore } = useFirestore();
  const { user } = useUser();
  const { profile } = useProfile();
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const { t } = useLanguage();

  const searchEventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "searchEvents"), orderBy("timestamp", "desc"));
  }, [firestore]);

  const cartEventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "cartAnalysisEvents"), orderBy("timestamp", "desc"));
  }, [firestore]);

  const userInsightsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "weeklyInsights"), orderBy("timestamp", "desc"), limit(1));
  }, [firestore, user]);

  const userHistoryQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "searchHistory"), orderBy("timestamp", "desc"), limit(20));
  }, [firestore, user]);

  const userCartHistoryQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "cartHistory"), orderBy("timestamp", "desc"), limit(5));
  }, [firestore, user]);

  const { data: searchEvents, isLoading: searchesLoading } = useCollection(searchEventsQuery);
  const { data: cartEvents, isLoading: cartsLoading } = useCollection(cartEventsQuery);
  const { data: latestInsight } = useCollection(userInsightsQuery);
  const { data: userHistory } = useCollection(userHistoryQuery);
  const { data: userCartHistory } = useCollection(userCartHistoryQuery);

  const stats = useMemoFirebase(() => {
    if (!searchEvents || !cartEvents) return null;
    const searchCounts: Record<string, number> = {};
    searchEvents.forEach((ev) => {
      const q = ev.query?.toLowerCase()?.trim() || "unknown";
      searchCounts[q] = (searchCounts[q] || 0) + 1;
    });
    const topSearches = Object.entries(searchCounts)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const uniqueSessions = new Set([...searchEvents.map(e => e.anonymizedSessionId), ...cartEvents.map(e => e.anonymizedSessionId)]);
    return { topSearches, totalSearches: searchEvents.length, totalCarts: cartEvents.length, activeSessions: uniqueSessions.size };
  }, [searchEvents, cartEvents]);

  const handleGenerateInsight = async () => {
    if (!user || !userHistory || !userCartHistory) return;
    setInsightLoading(true);
    setInsightError(null);
    try {
      const result = await generateWeeklyInsights({
        searchQueries: userHistory.map(h => h.query),
        cartItems: userCartHistory.flatMap(c => c.items),
        userProfile: {
          healthConditions: profile.healthConditions,
          dietGoals: profile.dietGoals,
        },
      });

      if (firestore) {
        const insightRef = collection(firestore, "users", user.uid, "weeklyInsights");
        addDocumentNonBlocking(insightRef, {
          ...result,
          userId: user.uid,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error(err);
      setInsightError("Could not generate report. Please log more food items and try again.");
    } finally {
      setInsightLoading(false);
    }
  };

  if (searchesLoading || cartsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Aggregating intelligence...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">{t("DASHBOARD_TITLE")}</h1>
          <p className="text-muted-foreground">{t("DASHBOARD_DESC")}</p>
        </div>
        {user && (
          <Button 
            onClick={handleGenerateInsight} 
            disabled={insightLoading || !userHistory?.length}
            className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20"
          >
            {insightLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {t("DASHBOARD_GEN_INSIGHT_BTN")}
          </Button>
        )}
      </div>

      {insightError && (
        <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Insight Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            {insightError}
            <Button size="sm" variant="outline" onClick={handleGenerateInsight} className="h-7 text-[10px] font-bold">
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {user && latestInsight && latestInsight.length > 0 && (
        <Card className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold tracking-tight">{t("DASHBOARD_WEEKLY_REPORT")}</h3>
                <Badge className="bg-primary/10 text-primary border-primary/20 font-black tracking-widest uppercase text-[10px]">AI Generated</Badge>
              </div>
              <p className="text-foreground/80 leading-relaxed mb-6 font-medium text-lg italic">"{latestInsight[0].summary}"</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/50 p-4 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Top Risk</p>
                  <p className="text-sm font-bold text-destructive/80">{latestInsight[0].topRisk}</p>
                </div>
                <div className="bg-white/50 p-4 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Weekly Advice</p>
                  <p className="text-sm font-bold text-primary">{latestInsight[0].advice}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Search, label: "Total Searches", value: stats?.totalSearches || 0 },
          { icon: ShoppingCart, label: "Carts Audited", value: stats?.totalCarts || 0 },
          { icon: Users, label: "Active Users", value: stats?.activeSessions || 0 },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border bg-white p-6 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4"><stat.icon className="w-6 h-6" /></div>
            <p className="text-3xl font-black">{stat.value}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> {t("DASHBOARD_GLOBAL_STATS")}</CardTitle></CardHeader>
        <CardContent className="h-[400px]">
          {stats?.topSearches.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topSearches} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}><Cell fill="hsl(var(--primary))" /></Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-muted-foreground italic">No search data yet...</div>}
        </CardContent>
      </Card>
    </div>
  );
}
