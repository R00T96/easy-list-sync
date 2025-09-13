import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/Layout/Layout";
import Index from "./pages/Index";
import OpenList from "./pages/OpenList";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import { PinProvider } from "@/hooks/usePin";

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
        <PinProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* All routes wrapped in Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="open" element={<OpenList />} />
                <Route path="privacy" element={<Privacy />} />
              </Route>
              
              {/* Routes that should NOT have sidebar (if any) */}
              {/* 
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/onboarding" element={<Onboarding />} />
              */}
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PinProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;