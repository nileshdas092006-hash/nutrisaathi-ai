"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Zap } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { firestore } = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName: name });
      
      // Create initial profile in Firestore at /users/{uid}/profile
      if (firestore) {
        const profileRef = doc(firestore, "users", user.uid, "profile");
        setDocumentNonBlocking(profileRef, {
          id: user.uid,
          email: user.email,
          displayName: name,
          age: 25,
          weight: 65,
          healthConditions: [],
          dietType: "Omnivore",
          dietGoals: ["Healthier Eating"],
          createdAt: new Date().toISOString()
        }, { merge: true });
      }

      toast({ title: "Account Created!", description: "Welcome to NutriSaathi AI." });
      router.push("/profile");
    } catch (error: any) {
      toast({ 
        title: "Signup Failed", 
        description: error.message || "Could not create account", 
        variant: "destructive" 
      });
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
          <CardTitle className="text-2xl font-black tracking-tight">Create Account</CardTitle>
          <CardDescription>Start your personalized health journey today.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10 h-11 rounded-xl bg-secondary/30 border-none focus-visible:ring-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  className="pl-10 h-11 rounded-xl bg-secondary/30 border-none focus-visible:ring-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-sm mt-4" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 pb-10 pt-4">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">Sign in instead</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}