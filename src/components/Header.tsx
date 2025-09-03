import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { usePin } from "@/hooks/usePin";

type HeaderProps = {
  isOnline: boolean;
  requestSync: () => void;
  isSyncing: boolean;
};

export const Header = ({ isOnline, requestSync, isSyncing }: HeaderProps) => {
  const { pin, clearPin } = usePin();
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
          </>
        )}
      </div>
    </div>
  );
};