import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share, Check, Settings, Shield, Moon, Sun, Monitor } from 'lucide-react';
import { usePin } from "@/hooks/usePin";
import { useShare } from "@/hooks/useShare";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type HeaderProps = {
  isOnline: boolean;
};

export const Header = ({ isOnline }: HeaderProps) => {
  const { pin, clearPin } = usePin();
  const { share, isSharing, justShared } = useShare();
  const { theme, setTheme } = useTheme();

  const handleShare = async () => {
    if (!pin) return;
    
    const shareUrl = `${window.location.origin}/?pin=${pin}`;
    
    await share({
      title: 'Join my list',
      text: `Join my shared list with code: ${pin}`,
      url: shareUrl,
      successMessage: {
        title: "🔗 Share link copied!",
        description: "Send this link to others so they can join your list instantly.",
      }
    });
  };

  return (
    <div className="container px-4 py-4 flex items-center justify-between gap-3">
      {!pin && <h1 className="text-2xl md:text-3xl font-bold">Live List</h1>}
      {pin && (
      <>
        <h1 className="text-2xl md:text-3xl font-bold">Our List: {pin}</h1>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share list link"
            title="Copy shareable link"
          >
            {justShared ? <Check className="h-4 w-4" /> : <Share className="h-4 w-4" />}
            {justShared ? "Copied!" : "Share"}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearPin} aria-label="Change List" title="Change List">
            Switch
          </Button>
        </div>
      </>
      )}
      <div className="flex items-center gap-2">
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative cursor-pointer">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 hover:bg-primary/20 transition-colors">
                <div className="w-6 h-6 bg-primary/30 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">U</span>
                </div>
              </div>
              {/* Online status indicator */}
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border border-border z-50">
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => setTheme("light")}
            >
              <Sun className="w-4 h-4" />
              <span>Light Theme</span>
              {theme === "light" && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => setTheme("dark")}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Theme</span>
              {theme === "dark" && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => setTheme("system")}
            >
              <Monitor className="w-4 h-4" />
              <span>System Theme</span>
              {theme === "system" && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer" asChild>
              <Link to="/goals">
                <span role="img" aria-label="Goals" className="w-4 h-4">🎯</span>
                <span>Goals</span>
              </Link>
            </DropdownMenuItem>
            {pin && (
              <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer" asChild>
                <Link to="/privacy">
                  <Shield className="w-4 h-4" />
                  <span>Privacy</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};