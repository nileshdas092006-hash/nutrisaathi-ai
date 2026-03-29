
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, ShoppingCart, User, Zap, BarChart3, Languages, LogOut, ChevronDown, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, LANGUAGES } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth, useUser, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { query, collection, where } from "firebase/firestore";
import { FeedbackDialog } from "@/components/feedback-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", label: "NAV_HOME", icon: Home },
  { href: "/search", label: "NAV_ANALYZE", icon: Search },
  { href: "/cart", label: "NAV_CART", icon: ShoppingCart },
  { href: "/dashboard", label: "NAV_INSIGHTS", icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirestore();
  const auth = useAuth();

  const unreadNotifsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      where("read", "==", false)
    );
  }, [firestore, user]);

  const { data: unreadNotifications } = useCollection(unreadNotifsQuery);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <>
      <nav className="hidden md:flex items-center justify-between px-10 py-5 bg-white border-b border-border/50 sticky top-0 z-50">
        <Link href="/" prefetch={false} className="flex items-center gap-2 group">
          <div className="bg-primary p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tighter">
            Nutri<span className="text-primary">Saathi</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                pathname === item.href 
                  ? "bg-secondary text-primary" 
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {t(item.label)}
            </Link>
          ))}
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <FeedbackDialog />

          <Separator orientation="vertical" className="h-6 mx-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl font-bold flex items-center gap-2 text-primary hover:bg-primary/5">
                <Languages className="w-4 h-4" />
                {currentLang.native}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[300px] overflow-y-auto rounded-2xl p-2">
              <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-3 py-2">Select Language</DropdownMenuLabel>
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code} 
                  onClick={() => setLanguage(lang.code)}
                  className={cn("rounded-xl cursor-pointer py-2 px-3", language === lang.code && "bg-primary/10 text-primary font-bold")}
                >
                  <span className="flex-1">{lang.label}</span>
                  <span className="text-xs opacity-50 ml-4 font-normal">{lang.native}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && !user.isAnonymous && (
            <Link href="/notifications" prefetch={false} className="relative mr-2 ml-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadNotifications && unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadNotifications.length}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {isUserLoading ? (
            <div className="w-10 h-10 rounded-full bg-secondary animate-pulse ml-2" />
          ) : user && !user.isAnonymous ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-10 rounded-full pl-1 pr-3 border border-border/40 hover:bg-secondary/50 ml-2">
                  <Avatar className="h-8 w-8 border border-primary/10">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-bold max-w-[100px] truncate">
                    {user.displayName?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl p-2 mt-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user.displayName || "Nutri User"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="rounded-xl py-2 cursor-pointer">
                  <Link href="/profile" prefetch={false} className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t("NAV_PROFILE")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2 cursor-pointer">
                  <Link href="/notifications" prefetch={false} className="flex items-center">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>{t("NAV_INBOX")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("NAV_LOGOUT")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 ml-4">
              <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold">
                <Link href="/login" prefetch={false}>Login</Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl font-bold px-5">
                <Link href="/signup" prefetch={false}>Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border/40 flex justify-around items-center py-4 z-50 px-2 pb-safe backdrop-blur-lg bg-white/90">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} prefetch={false} className={cn("flex flex-col items-center gap-1 transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
              <div className={cn("p-2 rounded-xl transition-all duration-300", isActive ? "bg-primary/10" : "")}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{t(item.label)}</span>
            </Link>
          );
        })}
        <Link href={user && !user.isAnonymous ? "/notifications" : "/login"} prefetch={false} className={cn("flex flex-col items-center gap-1 transition-colors", pathname === "/notifications" ? "text-primary" : "text-muted-foreground")}>
          <div className={cn("p-2 rounded-xl transition-all duration-300 relative", pathname === "/notifications" ? "bg-primary/10" : "")}>
            <Bell className="w-5 h-5" />
            {unreadNotifications && unreadNotifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{t("NAV_INBOX")}</span>
        </Link>
      </nav>
    </>
  );
}
