
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download } from 'lucide-react';
import { PWAService } from '@/lib/pwa';

export function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(PWAService.isInstalled());

    // Show prompt when install event is available
    const handleBeforeInstall = () => {
      if (!PWAService.isInstalled()) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    await PWAService.promptInstall();
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 p-4 shadow-lg z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5" />
            <h3 className="font-semibold">Install AutoJobr</h3>
          </div>
          <p className="text-sm opacity-90 mb-3">
            Install our app for faster access and offline support!
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              className="bg-white text-blue-600 hover:bg-gray-100"
              size="sm"
            >
              Install Now
            </Button>
            <Button
              onClick={() => setShowPrompt(false)}
              variant="ghost"
              className="text-white hover:bg-white/20"
              size="sm"
            >
              Maybe Later
            </Button>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-white/80 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
