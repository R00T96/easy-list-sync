import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MessageCircleX, Brain, Luggage, Clock, Smartphone, X } from "lucide-react";
import { usePin } from "@/hooks/usePin";

const painPoints = [
  {
    icon: MessageCircleX,
    text: "Everyone asking, no one remembering.",
    subtext: "Constantly reminding people of the plan"
  },
  {
    icon: Brain,
    text: "\"Didn't we agree someone was bringing the drinks?\"",
    subtext: "Forgetting who's responsible for what"
  },
  {
    icon: Luggage,
    text: "\"Wait, didn't you already pack the sunscreen?\"",
    subtext: "Overpacking or forgetting key items"
  },
  {
    icon: Clock,
    text: "\"We're missing plates again?!\"",
    subtext: "Last-minute scrambles to fill gaps"
  },
  {
    icon: Smartphone,
    text: "\"Sorry, I didn't install it…\"",
    subtext: "Being forced to download an app"
  }
];

const useCases = [
  "Pack for road trips with friends",
  "Sort out the family dinner plan (without texting 5 times)",
  "Pull off a surprise party without dropping the ball",
  "Get the groceries sorted — without roommate confusion",
  "Stay on track for event day (no forgotten tasks)",
  "Prep for weekend getaways without double-packing",
  "Keep everyone aligned for a group dinner",
  "Plan surprise parties like a stealth pro",
  "Share the grocery run with zero overlap",
  "Avoid chaos before birthdays, barbecues, or big days"
];

export const AppFooter = () => {
  const { pin } = usePin();
  const [currentUseCases, setCurrentUseCases] = useState(useCases.slice(0, 3));

  // Hide footer if there's a PIN (simplified logic)
  const shouldHideFooter = pin !== null;

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

  // Don't render if should hide
  if (shouldHideFooter) {
    return null;
  }

  return (
    <section className="mt-16 pb-8 w-full relative">
      {/* Use Case Hints */}
      <div className="text-center mb-8 px-4">
        <p className="text-xs text-muted-foreground mb-2">
          📌 People are using this right now to:
        </p>
        <div className="space-y-1">
          {currentUseCases.map((useCase, index) => (
            <p key={index} className="text-xs text-muted-foreground animate-fade-in">
              {useCase}
            </p>
          ))}
        </div>
      </div>

      {/* Pain Points Carousel */}
      <div className="w-full px-4">
        <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
          What this helps you avoid:
        </h3>
        <div className="max-w-6xl mx-auto">
          <Carousel className="w-full" opts={{ align: "center", loop: true }}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <Card className="h-full">
                      <CardContent className="flex flex-col items-center p-4 text-center">
                        <Icon className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-s text-muted-foreground leading-relaxed">
                          {point.text}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {point.subtext}
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
      </div>
    </section>
  );
};