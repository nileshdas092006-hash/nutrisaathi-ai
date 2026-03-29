
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/hooks/use-language";
import { useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, Send, Loader2 } from "lucide-react";

const feedbackSchema = z.object({
  useful: z.enum(["yes", "no"], {
    required_error: "Please select if this was useful.",
  }),
  confusion: z.string().optional(),
  improvement: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user } = useUser();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      confusion: "",
      improvement: "",
    },
  });

  async function onSubmit(values: FeedbackFormValues) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const feedbackRef = collection(firestore, "feedback");
      addDocumentNonBlocking(feedbackRef, {
        ...values,
        userId: user?.uid || "guest",
        language,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Feedback Received!",
        description: "Thank you for helping us improve NutriSaathi AI.",
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "We couldn't save your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-xl font-bold flex items-center gap-2 text-primary hover:bg-primary/5">
          <MessageSquarePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Give Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Share Your Thoughts</DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground">
            Help us make NutriSaathi smarter for everyone.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="useful"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Was NutriSaathi useful today?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0 bg-secondary/30 px-4 py-2 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-bold cursor-pointer">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0 bg-secondary/30 px-4 py-2 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-bold cursor-pointer">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confusion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">What confused you?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Health score was unclear..."
                      className="rounded-xl bg-secondary/30 border-none resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="improvement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">What should we improve?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Add more regional dishes..."
                      className="rounded-xl bg-secondary/30 border-none resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Submit Feedback
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
