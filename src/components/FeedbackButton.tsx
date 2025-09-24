import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePin } from "@/hooks/usePin";
import { useToast } from "@/hooks/use-toast";

export const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    message: "",
    name: "",
    email: "",
    social_link: "",
  });
  
  const { pin } = usePin();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("feedback")
        .insert({
          message: formData.message.trim(),
          pin: pin || null,
          name: formData.name.trim() || null,
          email: formData.email.trim() || null,
          social_link: formData.social_link.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Feedback sent",
        description: "Thank you for your feedback!",
      });

      setFormData({
        message: "",
        name: "",
        email: "",
        social_link: "",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          aria-label="Send Feedback" 
          className="gap-2 relative group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 transition-all duration-500 border border-transparent hover:border-blue-200 hover:shadow-md"
        >
          <div className="relative">
            <Megaphone className="h-4 w-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 blur-sm animate-pulse"></div>
            <div className="absolute -inset-1 rounded-full bg-blue-400 opacity-15 animate-pulse group-hover:animate-ping"></div>
          </div>
          <span className="text-xs font-semibold tracking-wide group-hover:scale-105 transition-transform duration-300">
            💬 Help improve this
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts or report issues. We'd love to hear from you!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Your feedback..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="social_link">Social/Profile Link (optional)</Label>
            <Input
              id="social_link"
              placeholder="https://twitter.com/yourhandle"
              value={formData.social_link}
              onChange={(e) =>
                setFormData({ ...formData, social_link: e.target.value })
              }
            />
          </div>
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open("https://ko-fi.com/romesh", "_blank")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 gap-1"
            >
              <Coffee className="h-4 w-4" />
              Support ☕
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};