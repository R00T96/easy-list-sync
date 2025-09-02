import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "@/hooks/use-toast";
import { MessageCircleX, Brain, Luggage, Clock, Smartphone } from "lucide-react";

type PinGateProps = {
  onPinSet: (pin: string) => void;
};

function randomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

const painPoints = [
  {
    icon: MessageCircleX,
    text: "Endless group texts asking \"who's bringing what?\""
  },
  {
    icon: Brain,
    text: "People forgetting what was discussed"
  },
  {
    icon: Luggage,
    text: "Duplicate packing or missing essentials"
  },
  {
    icon: Clock,
    text: "Chaos 30 minutes before a trip or event"
  },
  {
    icon: Smartphone,
    text: "Needing an app download or sign-up"
  }
];

const useCases = [
  "Grocery lists with roommates",
  "Packing for group trips", 
  "Prepping for family dinners",
  "Planning a surprise party",
  "Event checklists with friends"
];

export const PinGate = ({ onPinSet }: PinGateProps) => {
  const [pin, setPin] = useState("");
  const [currentUseCases, setCurrentUseCases] = useState(useCases.slice(0, 3));

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

  // Rotate use cases every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUseCases(prev => {
        const startIndex = Math.floor(Math.random() * (useCases.length - 2));
        return useCases.slice(startIndex, startIndex + 3);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
                Join with Code
              </Button>
              <Button variant="secondary" className="w-1/2" onClick={handleCreateNew}>
                Start a New List
              </Button>
            </div>
            <div className="text-center space-y-1 text-xs text-muted-foreground">
              <p>✅ Built for trips, groceries, events, or crews</p>
              <p>📱 Works on any device, no app needed</p>
              <p>🔄 Real-time updates — see everyone's changes live</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pain Points Carousel */}
      <div className="mt-8 max-w-lg mx-auto">
        <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
          What this helps you avoid:
        </h3>
        <Carousel className="w-full" opts={{ align: "center", loop: true }}>
          <CarouselContent className="-ml-2 md:-ml-4">
            {painPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="flex flex-col items-center p-4 text-center">
                      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {point.text}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Use Case Hints */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground mb-2">
          👇 People are using this right now for:
        </p>
        <div className="space-y-1">
          {currentUseCases.map((useCase, index) => (
            <p key={index} className="text-xs text-muted-foreground animate-fade-in">
              – {useCase}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};
