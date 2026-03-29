"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Phone, Chrome, ArrowRight, Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      router.push("/search");
    } catch (error: any) {
      toast({ 
        title: "Login Failed", 
        description: error.message || "Invalid credentials", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/search");
    } catch (error: any) {
      toast({ title: "Google Login Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md rounded-3xl border-border/50 shadow-xl overflow-hidden bg-white">
        <CardHeader className="text-center pt-10 pb-6">
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">Welcome Back</CardTitle>
          <CardDescription>Enter your details to access your health insights.</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 rounded-xl bg-secondary/30 border-none focus-visible:ring-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 rounded-xl bg-secondary/30 border-none focus-visible:ring-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-sm" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              onClick={handleGoogleLogin} 
              className="h-12 rounded-xl font-bold border-border/60 hover:bg-secondary/50"
              disabled={loading}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Google
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 pb-10">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">Sign up for free</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
