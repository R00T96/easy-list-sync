import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";

type PinGateProps = {
  onPinSet: (pin: string) => void;
};

function randomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

export const PinGate = ({ onPinSet }: PinGateProps) => {
  const [pin, setPin] = useState("");

  const handleContinue = () => {
    if (pin.length === 6) onPinSet(pin);
  };

  const handleCreateNew = () => {
    const newPin = randomPin();
    onPinSet(newPin);
    toast({
      title: "🎉 Room created! Feel the chaos snap into place",
      description: `Share room ${newPin} — everyone sees progress in real-time`,
    });
  };

  return (
    <section aria-labelledby="pin-heading" className="mx-auto max-w-md">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle id="pin-heading">Join a Room</CardTitle>
          <p className="text-sm text-muted-foreground">
            You're not buying a checklist — you're buying the easiest way to get 10+ brains on the same page in 10 seconds.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Enter room code to join existing group:</p>
              <InputOTP maxLength={6} value={pin} onChange={setPin} aria-label="Room code">
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
                Join Room
              </Button>
              <Button variant="secondary" className="w-1/2" onClick={handleCreateNew}>
                Start New Group
              </Button>
            </div>
            <div className="text-center space-y-1 text-xs text-muted-foreground">
              <p>✨ No login required • Works on any device</p>
              <p>⚡ Plan it in minutes, live it for hours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
