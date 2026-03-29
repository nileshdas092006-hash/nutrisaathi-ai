"use client";

import Link from "next/link";
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Sparkles, ChevronRight, Search, ShoppingCart, Activity } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { t } = useLanguage();

  const examples = [
    { name: "Maggi", icon: Search },
    { name: "Milk", icon: ShoppingCart },
    { name: "Chips", icon: Activity },
  ];

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background text-foreground">
      {/* Hero Welcome */}
      <section className="w-full max-w-5xl px-6 py-20 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-8 border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-700">
          <Sparkles className="w-3 h-3" />
          <span>{t("WELCOME_SUBTITLE")}</span>
        </div>
        
        <h1 className="text-4xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tighter max-w-4xl text-foreground">
          {t("WELCOME_TITLE")}
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed font-medium">
          {t("WELCOME_WHAT_DESC")}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20">
          <Button asChild size="lg" className="rounded-2xl px-10 h-16 text-lg font-black shadow-2xl shadow-primary/20 transition-transform active:scale-95">
            <Link href="/search">
              {t("WELCOME_START_BTN")} <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>

        {/* How to use */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-24">
          <div className="space-y-4 p-8 bg-white rounded-[2rem] border border-border shadow-sm hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="font-black text-xl">1</span>
            </div>
            <h3 className="text-xl font-bold">{t("WELCOME_HOW_LABEL")}</h3>
            <p className="text-muted-foreground text-sm font-semibold leading-relaxed">
              {t("WELCOME_STEP1")}
            </p>
          </div>
          <div className="space-y-4 p-8 bg-white rounded-[2rem] border border-border shadow-sm hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="font-black text-xl">2</span>
            </div>
            <h3 className="text-xl font-bold">Analysis</h3>
            <p className="text-muted-foreground text-sm font-semibold leading-relaxed">
              {t("WELCOME_STEP2")}
            </p>
          </div>
          <div className="space-y-4 p-8 bg-white rounded-[2rem] border border-border shadow-sm hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="font-black text-xl">3</span>
            </div>
            <h3 className="text-xl font-bold">Smart Swaps</h3>
            <p className="text-muted-foreground text-sm font-semibold leading-relaxed">
              {t("WELCOME_STEP3")}
            </p>
          </div>
        </div>

        {/* Examples */}
        <div className="w-full max-w-3xl">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center justify-center gap-3">
             <ChevronRight className="w-4 h-4" /> {t("WELCOME_EXAMPLES_LABEL")} <ChevronRight className="w-4 h-4" />
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {examples.map((ex) => (
              <Button 
                key={ex.name} 
                asChild
                variant="outline" 
                className="h-14 rounded-2xl border-border bg-white font-bold hover:bg-primary/5 hover:border-primary/20 transition-all text-foreground"
              >
                <Link href={`/search?q=${ex.name}`}>
                  <ex.icon className="w-4 h-4 mr-3 text-primary" />
                  {ex.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badge */}
      <section className="w-full py-20 px-6 border-t border-border bg-secondary/20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 text-center md:text-left">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center shrink-0 border border-primary/10">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">Science-Backed Nutrition</h3>
            <p className="text-muted-foreground font-medium max-w-lg leading-relaxed">
              NutriSaathi uses advanced AI models trained on nutritional standards to give you accurate advice for thousands of food items.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
