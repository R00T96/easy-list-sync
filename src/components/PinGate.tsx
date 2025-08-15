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
          <CardTitle id="pin-heading">Plan it together. Right now.</CardTitle>
          <p className="text-sm text-muted-foreground">
            From chaos to checklist in seconds — no logins, no apps, just you and the crew.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Enter room code or start fresh</p>
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
                Start a List
              </Button>
            </div>
            <div className="text-center space-y-1 text-xs text-muted-foreground">
              <p>🚀 Live updates as you type</p>
              <p>📱 Works on any device</p>
              <p>⏱ Make a plan in under 30 seconds</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
