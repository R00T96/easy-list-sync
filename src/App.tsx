import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";


import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import { PinProvider } from "@/hooks/usePin";
import Landing from "./pages/Landing";
import Goals from "./pages/Goals";
import { EventProvider } from "@/events/EventProvider";
import { ClientIdProvider } from "@/context/ClientIdContext";
import { PinPreferencesProvider } from "@/context/PinPreferencesContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <ClientIdProvider>
          <EventProvider>
            <PinProvider>
              <PinPreferencesProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/public" element={<Index />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/goals" element={<Goals />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </PinPreferencesProvider>
            </PinProvider>
          </EventProvider>
        </ClientIdProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
