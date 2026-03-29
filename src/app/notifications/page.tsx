
"use client";

import { useMemoFirebase, useCollection, useFirestore, useUser } from "@/firebase";
import { collection, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, Check, Trash2, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateDocumentNonBlocking } from "@/firebase";

export default function NotificationsPage() {
  const { user } = useUser();
  const { firestore } = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      orderBy("timestamp", "desc")
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const markAsRead = (id: string) => {
    if (!firestore || !user) return;
    const ref = doc(firestore, "users", user.uid, "notifications", id);
    updateDocumentNonBlocking(ref, { read: true });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
        <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Login Required</h2>
        <p className="text-muted-foreground text-sm">Sign in to view your health alerts and tips.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Health Inbox</h1>
          <p className="text-muted-foreground">Alerts and personalized tips for you.</p>
        </div>
        <Bell className="w-8 h-8 text-primary/20" />
      </div>

      <div className="space-y-4">
        {notifications?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border/60">
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          notifications?.map((n) => (
            <Card key={n.id} className={`rounded-2xl border transition-all ${n.read ? 'bg-white opacity-70' : 'bg-primary/5 border-primary/20 shadow-sm'}`}>
              <div className="p-6 flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-secondary' : 'bg-primary/10'}`}>
                  <Info className={`w-5 h-5 ${n.read ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm">{n.title}</h3>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(n.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{n.message}</p>
                  {!n.read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => markAsRead(n.id)}
                      className="h-8 text-xs font-bold text-primary hover:bg-primary/5 px-0"
                    >
                      <Check className="w-3 h-3 mr-1.5" /> Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
