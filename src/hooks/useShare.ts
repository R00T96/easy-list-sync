import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
  successMessage?: {
    title: string;
    description: string;
  };
  errorMessage?: {
    title: string;
    description: string;
  };
}

export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [justShared, setJustShared] = useState(false);

  const share = async (options: ShareOptions) => {
    const {
      title = 'Share',
      text = 'Check this out!',
      url,
      successMessage = {
        title: "🔗 Link copied!",
        description: "The link has been copied to your clipboard.",
      },
      errorMessage = {
        title: "Couldn't copy link",
        description: "Please copy this URL manually: " + url,
      }
    } = options;

    setIsSharing(true);
    
    try {
      // Try to use native Web Share API first (mobile-friendly)
      if (navigator.share) {
        const shareData = { title, text, url };
        
        try {
          await navigator.share(shareData);
          setJustShared(true);
          setTimeout(() => setJustShared(false), 2000);
          return; // Success, no need to show toast
        } catch (err) {
          // User cancelled share or share failed, fall back to clipboard
          console.log('Share cancelled or failed, falling back to clipboard');
        }
      }

      // Try Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setJustShared(true);
        setTimeout(() => setJustShared(false), 2000);
        
        toast({
          title: successMessage.title,
          description: successMessage.description,
        });
      } else {
        // Fallback: Select text method for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setJustShared(true);
            setTimeout(() => setJustShared(false), 2000);
            
            toast({
              title: successMessage.title,
              description: successMessage.description,
            });
          } else {
            throw new Error('Copy command failed');
          }
        } catch (err) {
          // Final fallback: Show the URL in toast
          toast({
            title: "Share this link:",
            description: url,
            duration: 10000,
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      toast({
        title: errorMessage.title,
        description: errorMessage.description,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  return {
    share,
    isSharing,
    justShared,
  };
};