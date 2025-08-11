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
      title: "New list created",
      description: `Share this PIN to collaborate: ${newPin}`,
    });
  };

  return (
    <section aria-labelledby="pin-heading" className="mx-auto max-w-md">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle id="pin-heading">Enter PIN to access your list</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <InputOTP maxLength={6} value={pin} onChange={setPin} aria-label="PIN code">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="flex w-full gap-2">
              <Button className="w-1/2" onClick={handleContinue} disabled={pin.length !== 6}>
                Continue
              </Button>
              <Button variant="secondary" className="w-1/2" onClick={handleCreateNew}>
                Create new list
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
