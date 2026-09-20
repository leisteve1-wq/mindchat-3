import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { verifyPrivacyPin } from '../lib/auth';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';

interface PrivacyLockProps {
  onUnlock: () => void;
}

export default function PrivacyLock({ onUnlock }: PrivacyLockProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  // Handle PIN input
  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  // Handle unlock
  const handleUnlock = async () => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsVerifying(true);
    const isValid = await verifyPrivacyPin(pin);
    
    if (isValid) {
      toast.success('Unlocked!');
      onUnlock();
    } else {
      toast.error('Incorrect PIN');
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    
    setIsVerifying(false);
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleUnlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="min-h-screen bg-[var(--mc-bg-primary)] flex items-center justify-center p-4">
      <div className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
        {/* Lock Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Privacy Lock</h1>
          <p className="text-[var(--mc-text-secondary)]">Enter your PIN to unlock</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`
                w-4 h-4 rounded-full transition-all duration-200
                ${i < pin.length 
                  ? 'bg-[var(--mc-accent-primary)] scale-110' 
                  : 'bg-[var(--mc-bg-tertiary)]'
                }
              `}
            />
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="aspect-square rounded-xl bg-[var(--mc-bg-secondary)] border border-[var(--mc-border)] text-2xl font-semibold hover:bg-[var(--mc-bg-tertiary)] active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setShowPin(!showPin)}
            className="aspect-square rounded-xl bg-[var(--mc-bg-secondary)] border border-[var(--mc-border)] hover:bg-[var(--mc-bg-tertiary)] active:scale-95 transition-all flex items-center justify-center"
          >
            {showPin ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="aspect-square rounded-xl bg-[var(--mc-bg-secondary)] border border-[var(--mc-border)] text-2xl font-semibold hover:bg-[var(--mc-bg-tertiary)] active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="aspect-square rounded-xl bg-[var(--mc-bg-secondary)] border border-[var(--mc-border)] hover:bg-[var(--mc-bg-tertiary)] active:scale-95 transition-all flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H21a2 2 0 002-2V7a2 2 0 00-2-2h-9.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>

        {/* Unlock Button */}
        <Button
          onClick={handleUnlock}
          disabled={pin.length < 4 || isVerifying}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-6"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              Unlock
            </span>
          )}
        </Button>

        {/* Show PIN (if enabled) */}
        {showPin && pin && (
          <p className="text-center mt-4 text-[var(--mc-text-muted)] font-mono">
            {pin}
          </p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
