import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { usePin } from "@/hooks/usePin";

function randomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

export const PinGateStage = () => {
  const [pin, setPin] = useState("");
  const { savePin } = usePin();
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus PIN input when component mounts
    if (otpRef.current) {
      otpRef.current.focus();
    }
  }, []);

  const handleContinue = () => {
    if (pin.length === 6) savePin(pin);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 6) {
      handleContinue();
    }
  };

  const handleCreateNew = () => {
    const newPin = randomPin();
    savePin(newPin);
    toast({
      title: "🎉 Room created! Feel the chaos snap into place",
      description: `Share room ${newPin} — everyone sees progress in real-time`,
    });
  };

  return (
    <section aria-labelledby="pin-heading" className="mx-auto max-w-md">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle id="pin-heading">No more 'who's got what?'</CardTitle>
          <p className="text-sm text-muted-foreground">
            From last-minute chaos to group calm — in under 30 seconds.<br />
            No logins. No installs. Just one shared list, live and simple.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Enter a room code or start a fresh list</p>
              <InputOTP 
                ref={otpRef}
                maxLength={6} 
                value={pin} 
                onChange={setPin} 
                onKeyDown={handleKeyDown}
                aria-label="Room code"
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
              <Button className="w-1/2" onClick={handleContinue} disabled={pin.length !== 6}>
                Join with Code
              </Button>
              <Button variant="secondary" className="w-1/2" onClick={handleCreateNew}>
                Start a New List
              </Button>
            </div>
            <div className="text-center space-y-1 text-xs text-muted-foreground">
              <p>✅ Use it for trips, groceries, chores, or parties</p>
              <p>📱 No app needed — works on any device</p>
              <p>🔄 You see live changes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};