import { AppFooter } from '@/components/AppFooter';
import { FeedbackButton } from '@/components/FeedbackButton';
import { Header } from '@/components/Header';
import LiveList from '@/components/LiveList';
import { useEffect, useState } from 'react';

const Index = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

   useEffect(() => {
     const handleOnline = () => setIsOnline(true);
     const handleOffline = () => setIsOnline(false);
     window.addEventListener("online", handleOnline);
     window.addEventListener("offline", handleOffline);
     return () => {
       window.removeEventListener("online", handleOnline);
       window.removeEventListener("offline", handleOffline);
     };
   }, []);
 
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <Header 
          isOnline={isOnline}
        />
      </header>

      <main className="container px-4 py-6 sm:py-10">
        <LiveList />
        {/* <AppFooter /> */}
      </main>
      
      <div className="border-t bg-muted/30 py-4">
        <div className="container px-4 text-center">
          <div className="flex justify-center items-center gap-4">
            <FeedbackButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;