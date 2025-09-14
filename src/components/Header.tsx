import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cloud, Share, Check } from "lucide-react";
import { usePin } from "@/hooks/usePin";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type HeaderProps = {
  isOnline: boolean;
  requestSync: () => void;
  isSyncing: boolean;
};

export const Header = ({ isOnline, requestSync, isSyncing }: HeaderProps) => {
  const { pin, clearPin } = usePin();
  const [isSharing, setIsSharing] = useState(false);
  const [justShared, setJustShared] = useState(false);

  const handleShare = async () => {
    if (!pin) return;
    
    setIsSharing(true);
    const shareUrl = `${window.location.origin}/?pin=${pin}`;
    
    try {
      // Try to use Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        
        setJustShared(true);
        setTimeout(() => setJustShared(false), 2000);
        
        toast({
          title: "🔗 Share link copied!",
          description: "Send this link to others so they can join your list instantly.",
        });
      } else {
        // Fallback: Select text method
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setJustShared(true);
          setTimeout(() => setJustShared(false), 2000);
          
          toast({
            title: "🔗 Share link copied!",
            description: "Send this link to others so they can join your list instantly.",
          });
        } catch (err) {
          // Final fallback: Show the URL in toast
          toast({
            title: "Share this link:",
            description: shareUrl,
            duration: 10000,
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      toast({
        title: "Couldn't copy link",
        description: "Please copy this URL manually: " + shareUrl,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="container px-4 py-4 flex items-center justify-between gap-3">
      <h1 className="text-2xl md:text-3xl font-bold">Our List</h1>
      <div className="flex items-center gap-2">
        <Badge variant={isOnline ? "default" : "secondary"}>
          {isOnline ? "Live" : "Offline"}
        </Badge>
        {pin && (
          <>
            <span className="text-sm text-muted-foreground">Room: {pin}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare}
              disabled={isSharing}
              aria-label="Share room link"
              title="Copy shareable link"
            >
              {justShared ? (
                <Check className="h-4 w-4" />
              ) : (
                <Share className="h-4 w-4" />
              )}
              {justShared ? "Copied!" : "Share"}
            </Button>
            <Button variant="ghost" size="sm" onClick={clearPin} aria-label="Change Room">
              Switch
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={requestSync} 
              disabled={!isOnline || isSyncing} 
              aria-label="Sync progress" 
              aria-busy={isSyncing}
            >
              <Cloud className="mr-2 h-4 w-4" /> Sync
            </Button>
            {/* {pin && permission !== "granted" && (
              <Button variant="ghost" size="sm" onClick={enable} title="Enable notifications">
                Enable Notifications
              </Button>
            )} */}
          </>
        )}
        <ThemeToggle />
        {pin && (
          <Link to="/privacy">
            <Button variant="ghost" size="sm" className="text-xs">
              Privacy
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};