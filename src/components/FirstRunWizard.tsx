import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Share, ArrowRight, QrCode, Loader2, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import syncDemo from '@/assets/sync-demo.jpg';
import { Link, useNavigate } from 'react-router-dom';
import { usePin } from '@/hooks/usePin';
import { useShare } from '@/hooks/useShare';
import { FeedbackButton } from './FeedbackButton';
import { toast } from "@/hooks/use-toast";
import { useContext } from "react";
import { EventContext } from "@/events/EventContext";
import type { AppEvent } from "@/events/eventTypes";
import { useClientId } from "@/context/ClientIdContext";

interface FirstRunWizardProps {
  onComplete?: () => void;
}

const PIN_REGEX = /^[A-Za-z0-9]{6}$/;
const normalizePin = (v: string) =>
  v.trim().toUpperCase(); // keep links/user input consistent

const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onComplete }) => {
  // Event context for emitting onboarding/AI events
  const eventCtx = useContext(EventContext);
  const { clientId, setClientId } = useClientId();

  // Helper to emit onboarding events for AI/notifications
  const emitOnboardingEvent = (stepIdx: number, stepObj: any) => {
    if (!eventCtx) return;
    eventCtx.emit({
      type: "ShoppingList",
      item: null,
      meta: {
        action: "onboarding-step",
        step: stepIdx,
        headline: stepObj.headline,
        subtext: stepObj.subtext,
        cta: stepObj.cta,
        clientId,
        pin,
        urlPin,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }
    });
  };

  const [currentStep, setCurrentStep] = useState(0);
  const { pin, savePin } = usePin();
  const { share, isSharing, justShared } = useShare();
  const [urlPin, setUrlPin] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const navigate = useNavigate();
  const [isAutoJoining, setIsAutoJoining] = useState(false);
  const [pendingUrlPinEvent, setPendingUrlPinEvent] = useState(null);

      // Emit event for detected PIN from URL as soon as urlPin and eventCtx are available
    // Emit when eventCtx is ready
    useEffect(() => {
      if (!pendingUrlPinEvent || !eventCtx) return;
      
      eventCtx.emit({
        type: "ShoppingList",
        item: null,
        meta: {
          action: "pin-detected-from-url",
          clientId,
          pin,
          ...pendingUrlPinEvent,
        }
      });
      
      setPendingUrlPinEvent(null); // Clear after emitting
    }, [pendingUrlPinEvent, eventCtx, clientId, pin]);
    
    // Auto-fill PIN from URL parameter and attempt auto-join
    useEffect(() => {
      if (!urlPin) return;
      const candidate = normalizePin(urlPin);
      if (PIN_REGEX.test(candidate)) {
        savePin(candidate);
        handleAutoJoin(candidate);
        console.log(`🔗 Auto-joining list with PIN from URL: ${candidate}`);
        // Store the event data to emit later
        setPendingUrlPinEvent({
          urlPin: candidate,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
      }
    }, [urlPin]);

    const handleAutoJoin = async (urlPinValue: string) => {
        const p = normalizePin(urlPinValue);
        if (!PIN_REGEX.test(p)) return;
        
        setIsAutoJoining(true);
        try {
          // Brief delay to show loading state
          await new Promise(resolve => setTimeout(resolve, 800));
          //onPinSet(p); // use the normalized, validated value
          savePin(p);
          setShowShoppingList(true);
          //setUrlPin(null); // Clear URL pin after successful entry
          toast({
            title: "🎉 Joined the list!",
            description: "You're now connected to the shared list.",
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
    

    // Process URL parameters on mount
    useEffect(() => {
      const processUrlParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const raw = urlParams.get("pin");
        if (!raw) return;
  
        const candidate = raw.trim().toUpperCase();
        const isValid = /^[A-Z0-9]{6}$/.test(candidate);
        if (!isValid) return;
  
        // If already in a room and incoming is different, show PinGate for auto-join
        if (!pin || pin !== candidate) {
          console.log(`🔗 Switching to PIN from URL: ${candidate}`);
          setUrlPin(candidate);
        }
  
        // Clean up URL after capturing it
        //const newUrl = new URL(window.location.href);
        //newUrl.searchParams.delete("pin");
        //window.history.replaceState({}, document.title, newUrl.toString());
  
        console.log(`🔗 Detected PIN from URL: ${candidate}`);

         // Store the event data to emit later
        setPendingUrlPinEvent({
          urlPin: candidate,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
        
        // Emit event for detected PIN from URL for AI/analytics
        // if (eventCtx) {
        //   eventCtx.emit({
        //     type: "ShoppingList",
        //     item: null,
        //     meta: {
        //       action: "pin-detected-from-url",
        //       clientId,
        //       pin,
        //       urlPin: candidate,
        //       timestamp: new Date().toISOString(),
        //       userAgent: navigator.userAgent,
        //     }
        //   });
        // }
      };
  
      processUrlParams();
      // re-run when pin changes (e.g., to handle copy/paste navigation in SPA)

    }, [pin]);


  const generatePin = () => {
    const words = ['TRIP', 'LIST', 'SYNC', 'TEAM', 'SHOP', 'PLAN', 'WORK', 'HOME'];
    const numbers = Math.floor(Math.random() * 100);
    const word = words[Math.floor(Math.random() * words.length)];
    return `${word}${numbers.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (currentStep === 1 && !pin) {
      savePin(generatePin());
    }
  }, [currentStep, pin]);
 
  const getShareUrl = () => {
    return `${window.location.origin}?pin=${pin}`;
  };

  const handleShare = async () => {
    if (!pin) return;
    
    const shareUrl = getShareUrl();
    
    await share({
      title: 'Join my list',
      text: `Join my shared list with code: ${pin}`,
      url: shareUrl,
      successMessage: {
        title: "🔗 Share link ready!",
        description: "Send this link to others so they can join your list instantly.",
      }
    });
  };

  const handleShowQR = () => {
    setShowQR(!showQR);
  };

  const nextStep = () => {
    // Emit onboarding event for this step
    emitOnboardingEvent(currentStep, steps[currentStep]);
    if (currentStep < 3) {
      // TODO: till I figure out how to pull item count for the PIN to continue with next steps
      if (currentStep === 2 && pin) {
        setShowShoppingList(true);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      setShowShoppingList(true);
    }
  };

  // Subtext options for the PIN step
  const pinSubtextOptions = [
    "Sharing this code is where the magic happens.",
    "This code is your key—share it to unlock real-time collaboration.",
    "Invite your crew—sharing this code brings your list to life.",
    "Pass this code along and watch your list sync instantly.",
    "Sharing connects everyone—let the magic begin.",
    "Give this code to friends and start collaborating live.",
    "The magic starts when you share—sync up together.",
    "Share this code and see your list grow in real time.",
    "Collaboration begins here—share your code to get started."
  ];

  const [pinStepSubtext, setPinStepSubtext] = useState(pinSubtextOptions[0]);

  useEffect(() => {
    if (currentStep === 1) {
      // Pick a random subtext for the PIN step each time step 1 is shown
      setPinStepSubtext(pinSubtextOptions[Math.floor(Math.random() * pinSubtextOptions.length)]);
    }
  }, [currentStep]);

  const steps = [
    {
      headline: pin ? "Welcome Back ♥" : "One list. Shared live.",
      subtext: pin ? "Pick up where you left off. Your list is ready" : "No installs. No logins. Just sync.",
      cta: pin ? "Continue" : "Start a List",
    },
    {
      headline: pin ? "Your current PIN is:" : "Your list code is ready.",
      subtext: pinStepSubtext,
      cta: null,
    },
    {
      headline: "This is where the magic happens.",
      subtext: "Everyone stays in sync — live.",
      cta: null,
    },
    {
      headline: "Ready to try?",
      subtext: "Add your first item. Your crew will see it too.",
      cta: "Go to My List",
    },
  ];

  // Show shopping list after wizard completion
  // if (showShoppingList) {
  //   return <ShoppingList />;
  // }
  useEffect(() => {
    // PIN already set? Navigate directly
    if (showShoppingList || urlPin) {
      // Emit onboarding completion event for AI/notifications
      emitOnboardingEvent(999, { headline: "Onboarding Complete", subtext: "User finished onboarding; PIN already set. Navigating to /public directly", cta: null });
      navigate('/public');
    }
  }, [showShoppingList, navigate]);

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
                You've been invited to list {urlPin}
              </p>
            </CardContent>
          </Card>
        </section>
      );
    }
  
    
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Progress Dots */}
        <div className="flex justify-center mb-8 space-x-2">
          {[0, 1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${step === currentStep
                  ? 'bg-primary scale-125'
                  : step < currentStep
                    ? 'bg-success'
                    : 'bg-muted'
                }`}
            />
          ))}
        </div>

        {/* Main Card */}
        <Card className="p-8 text-center bg-card/80 backdrop-blur-sm border-border shadow-card transition-all duration-500">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {steps[0].headline}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {steps[0].subtext}
                </p>
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={nextStep}
                className="w-full"
              >
                {steps[0].cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: PIN Generation */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  {steps[1].headline}
                </h2>
                <p className="text-muted-foreground">
                  {steps[1].subtext}
                </p>
              </div>

              <div className="bg-gradient-subtle rounded-xl p-6 border border-border">
                <div className="text-4xl font-bold text-primary mb-4 tracking-wider">
                  {pin}
                </div>

                {showQR && (
                  <div className="mb-4 p-4 bg-white rounded-lg">
                    <QRCode
                      size={200}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      value={getShareUrl()}
                      viewBox={`0 0 200 200`}
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <Button
                    variant="default"
                    onClick={handleShowQR}
                    className="flex-1"
                  >
                    <QrCode className="mr-2 w-4 h-4" />
                    {showQR ? 'Hide QR' : 'Show QR'}
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex-1"
                  >
                    {justShared ? <Check className="mr-2 w-4 h-4" /> : <Share className="mr-2 w-4 h-4" />}
                    {justShared ? 'Shared!' : isSharing ? 'Sharing...' : 'Share'}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={nextStep}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Sync Demo */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  {steps[2].headline}
                </h2>
                <p className="text-muted-foreground">
                  {steps[2].subtext}
                </p>
              </div>

              <div className="bg-gradient-subtle rounded-xl p-6 border border-border">
                <img
                  src={syncDemo}
                  alt="Two phones showing live sync - left phone adds 'Milk' and right phone shows it appear instantly"
                  className="w-full max-w-sm mx-auto rounded-lg shadow-soft"
                />
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={nextStep}
                className="w-full"
              >
                Amazing! Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 3: Ready to Use */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  {steps[3].headline}
                </h2>
                <p className="text-muted-foreground">
                  {steps[3].subtext}
                </p>
              </div>

              <div className="bg-gradient-subtle rounded-xl p-6 border border-border">
                <div className="bg-white rounded-lg p-4 text-left border border-input">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-muted rounded-sm"></div>
                    <span className="text-muted-foreground italic">Add item...</span>
                    <div className="w-0.5 h-4 bg-primary animate-pulse"></div>
                  </div>
                </div>
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={nextStep}
                className="w-full"
              >
                {steps[3].cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <FeedbackButton />
          <Link to="/privacy">
            <Button variant="ghost" size="sm" className="text-xs">
              Privacy
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FirstRunWizard;