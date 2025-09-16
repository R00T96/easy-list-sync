import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { usePin } from "@/hooks/usePin";

type PinGateProps = {
  onPinSet: (pin: string) => void;
  urlPin?: string; // PIN from URL parameter
};

function randomAlphaNumPin(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // skip lookalikes like 0/O/1/I
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

const PIN_REGEX = /^[A-Za-z0-9]{6}$/;

const normalizePin = (v: string) =>
  v.trim().toUpperCase(); // keep links/user input consistent

export const PinGateStage = ({ onPinSet, urlPin }: PinGateProps) => {
  const [pin, setPin] = useState("");
  const { savePin } = usePin();
  const otpRef = useRef<HTMLInputElement>(null);
  const [isAutoJoining, setIsAutoJoining] = useState(false);

  // Auto-fill PIN from URL parameter and attempt auto-join
  useEffect(() => {
    if (!urlPin) return;
    const candidate = normalizePin(urlPin);
    if (PIN_REGEX.test(candidate)) {
      setPin(candidate);
      handleAutoJoin(candidate);
    }
  }, [urlPin]);

  const handleAutoJoin = async (urlPinValue: string) => {
    const p = normalizePin(urlPinValue);
    if (!PIN_REGEX.test(p)) return;
    
    setIsAutoJoining(true);
    try {
      // Brief delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      onPinSet(p); // use the normalized, validated value
      toast({
        title: "🎉 Joined the list!",
        description: "You're now connected to the shared room.",
      });
    } catch (error) {
      toast({
        title: "Invalid PIN",
        description: "The shared link contains an invalid PIN. Please enter manually.",
        variant: "destructive",
      });
      setIsAutoJoining(false);
    }
  };

  useEffect(() => {
    // Auto-focus PIN input when component mounts
    if (otpRef.current) {
      otpRef.current.focus();
    }
  }, []);

  const handleContinue = () => {
    const p = normalizePin(pin);
    if (PIN_REGEX.test(p)) onPinSet(p);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const p = normalizePin(pin);
    if (e.key === "Enter" && PIN_REGEX.test(p)) 
      handleContinue();
  };

  const handleCreateNew = () => {
    const newPin = randomAlphaNumPin();
    savePin(newPin);
    toast({
      title: "🎉 Room created! Feel the chaos snap into place",
      description: `Share room ${newPin} — everyone sees progress in real-time`,
    });
  };

  // Show loading state while auto-joining
  if (isAutoJoining) {
    return (
      <section aria-labelledby="joining-heading" className="mx-auto max-w-md">
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
            <h2 id="joining-heading" className="text-xl font-semibold mb-2">
              Joining shared list...
            </h2>
            <p className="text-muted-foreground">
              You've been invited to room {urlPin}
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="pin-heading" className="mx-auto max-w-md">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle id="pin-heading">
            {urlPin ? "Join the shared list" : "One list. Shared live.'"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {urlPin 
              ? "You've been invited to join this live list. The code has been filled in for you."
              : "From last-minute chaos to group calm — in under 30 seconds.\nNo logins. No installs. Just one shared list, live and simple."
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                {urlPin ? "Shared live list code (from your invite link)" : "Enter your live list code or start a fresh list"}
              </p>
              <InputOTP 
                ref={otpRef}
                maxLength={6} 
                value={pin} 
                onChange={(v) => setPin(normalizePin(v).replace(/[^A-Za-z0-9]/g, ""))}
                onKeyDown={handleKeyDown}
                aria-label="live list code"
                inputMode="text" // so keyboards aren’t numeric-only
                pattern="[A-Za-z0-9]*"          // hint to mobile keyboards
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex w-full gap-2">
              <Button className="w-1/2" onClick={handleContinue} disabled={!PIN_REGEX.test(normalizePin(pin))}>
                {urlPin ? "Join crew" : "Your crew joins with this code"}
              </Button>
              {!urlPin && (
                <Button variant="secondary" className="w-1/2" onClick={handleCreateNew}>
                  Create New Live List
                </Button>
              )}
            </div>
            <div className="text-center space-y-1 text-xs text-muted-foreground">
              {urlPin ? (
                <>
                  <p>✅ You've been invited to join this shared live list</p>
                  <p>🔄 Changes auto sync live across all devices</p>
                  <p>📱 No app needed — works anywhere</p>
                </>
              ) : (
                <>
                  <p>✅ Use it for live long distance planning of trips, groceries, chores, or parties</p>
                  <p>📱 No app needed — works on any device</p>
                  <p>🔄 You see live changes across all devices</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
