import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceInputProps {
  onResult: (transcript: string) => void;
  onClose: () => void;
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceInput({ onResult, onClose }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in your browser');
      onClose();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let final = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0]?.transcript || '';
          if (result.isFinal) {
            final += transcriptText;
          } else {
            interim += transcriptText;
          }
        }

        if (final) {
          setTranscript(prev => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied');
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Start listening automatically
    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log('Recognition already started');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSubmit = () => {
    const finalText = transcript + interimTranscript;
    if (finalText.trim()) {
      onResult(finalText.trim());
    } else {
      toast.error('No speech detected');
    }
    stopListening();
    onClose();
  };

  const handleCancel = () => {
    stopListening();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--mc-bg-secondary)] border border-[var(--mc-border)] rounded-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Voice Input</h3>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-[var(--mc-bg-tertiary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Wave Animation */}
        <div className="flex justify-center mb-6">
          <div className={`
            w-24 h-24 rounded-full flex items-center justify-center
            ${isListening 
              ? 'bg-red-500/20 animate-pulse' 
              : 'bg-[var(--mc-bg-tertiary)]'
            }
          `}>
            {isListening ? (
              <div className="voice-wave">
                <span className="voice-wave-bar" />
                <span className="voice-wave-bar" />
                <span className="voice-wave-bar" />
                <span className="voice-wave-bar" />
                <span className="voice-wave-bar" />
              </div>
            ) : (
              <MicOff className="w-10 h-10 text-[var(--mc-text-muted)]" />
            )}
          </div>
        </div>

        {/* Status */}
        <p className="text-center text-[var(--mc-text-secondary)] mb-6">
          {isListening ? 'Listening...' : 'Click the microphone to start'}
        </p>

        {/* Transcript */}
        <div className="min-h-[100px] max-h-[200px] overflow-auto p-4 rounded-xl bg-[var(--mc-bg-tertiary)] mb-6">
          <p className="text-[var(--mc-text-primary)]">
            {transcript}
            <span className="text-[var(--mc-text-muted)]">{interimTranscript}</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            onClick={isListening ? stopListening : startListening}
            variant="outline"
            className="flex-1"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!transcript && !interimTranscript}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
