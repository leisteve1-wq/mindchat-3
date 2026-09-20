import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { User as FirebaseUser } from 'firebase/auth';
import type { ChatMessage, DetectedEmotion } from '../types';
import { 
  Send, 
  Mic, 
  Sparkles, 
  Heart, 
  Copy, 
  Trash2, 
  Brain
} from 'lucide-react';

interface ChatInterfaceProps {
  user: FirebaseUser | null;
}

// Crisis detection patterns
const CRISIS_PATTERNS = [
  /\b(suicide|kill myself|end it all|want to die|not worth living|better off dead)\b/i,
  /\b(self.?harm|cutting myself|hurt myself|burning myself)\b/i,
  /\b(can't take it anymore|giving up|no point|nothing to live for)\b/i,
  /\b(have a plan|pills|rope|gun|bridge|jump off|overdose)\b/i
];

// Emotion detection
function detectEmotions(text: string): DetectedEmotion[] {
  const emotions: { [key: string]: RegExp[] } = {
    anxiety: [/\b(anxious|worried|nervous|panic|stressed|overwhelmed|scared)\b/i],
    sadness: [/\b(sad|depressed|down|hopeless|empty|lonely|crying)\b/i],
    anger: [/\b(angry|mad|frustrated|annoyed|irritated|furious)\b/i],
    fear: [/\b(afraid|terrified|scared|frightened|worried|anxious)\b/i],
    joy: [/\b(happy|excited|joyful|great|amazing|wonderful|good)\b/i],
    neutral: [/\b(okay|fine|alright|neutral|idk|not sure)\b/i]
  };

  const detected: DetectedEmotion[] = [];
  
  for (const [emotion, patterns] of Object.entries(emotions)) {
    const matches = patterns.filter(p => p.test(text)).length;
    if (matches > 0) {
      detected.push({ emotion, confidence: Math.min(matches * 0.3 + 0.4, 0.95) });
    }
  }
  
  return detected.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

// Check for crisis
function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some(pattern => pattern.test(text));
}

// Crisis response
function getCrisisResponse(): string {
  return `🆘 **I'm really concerned about you right now.**

**Please reach out immediately:**
• **Call or text 988** — Suicide & Crisis Lifeline (24/7, free, confidential)
• **Text HOME to 741741** — Crisis Text Line
• **Call 911** if you're in immediate danger

**You don't have to go through this alone.** These feelings are temporary, even when they feel permanent.

Is there someone you trust who you can call right now?`;
}

// Welcome suggestions
const SUGGESTIONS = [
  "I'm feeling anxious today",
  "Help me with stress management",
  "Tell me about CBT therapy",
  "I need grounding techniques"
];

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [detectedEmotions, setDetectedEmotions] = useState<DetectedEmotion[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  // Listen for voice input
  useEffect(() => {
    const handleVoiceInput = (e: CustomEvent) => {
      const transcript = e.detail;
      setInputText(transcript);
      handleSend(transcript);
    };
    
    window.addEventListener('voice-input', handleVoiceInput as EventListener);
    return () => window.removeEventListener('voice-input', handleVoiceInput as EventListener);
  }, []);

  // Send message
  const handleSend = async (textOverride?: string) => {
    const text = textOverride || inputText;
    if (!text.trim() || isTyping) return;

    // Detect emotions in user message
    const emotions = detectEmotions(text);
    setDetectedEmotions(emotions);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
      emotions
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Check for crisis
    if (detectCrisis(text)) {
      setIsTyping(false);
      const crisisMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: getCrisisResponse(),
        timestamp: new Date(),
        metadata: { isCrisis: true, provider: 'crisis-detection' }
      };
      setMessages(prev => [...prev, crisisMessage]);
      return;
    }

    try {
      // Call AI API
      const response = await fetch('/.netlify/functions/groq-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            sender: m.sender,
            text: m.text,
            content: m.text
          })),
          userId: user?.uid
        })
      });

      const data = await response.json();

      if (data.response) {
        // Stream the response
        await streamResponse(data.response, data);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I'm here to help, though I'm experiencing some technical difficulties. Could you try again? In the meantime, remember that taking deep breaths can help calm your mind.",
        timestamp: new Date(),
        metadata: { provider: 'fallback' }
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  // Stream response character by character
  const streamResponse = async (text: string, metadata: any) => {
    setStreamingText('');
    
    const chars = text.split('');
    let currentText = '';
    
    for (let i = 0; i < chars.length; i++) {
      currentText += chars[i];
      setStreamingText(currentText);
      
      // Add delay for natural feel
      const delay = chars[i] === ' ' ? 20 : 15;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Longer pause at punctuation
      if ('.!?'.includes(chars[i])) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setStreamingText('');
    setIsTyping(false);

    // Add complete message
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: text,
      timestamp: new Date(),
      metadata: {
        provider: metadata.provider || 'groq',
        model: metadata.model
      }
    };

    setMessages(prev => [...prev, aiMessage]);
  };

  // Copy message
  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--mc-border)] bg-[var(--mc-bg-secondary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">MindChat AI</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-live" />
              <span className="text-xs text-[var(--mc-text-secondary)]">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {detectedEmotions.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--mc-bg-tertiary)]">
              <Sparkles className="w-3 h-3 text-[var(--mc-accent-primary)]" />
              <span className="text-xs text-[var(--mc-text-secondary)]">
                Detected: {detectedEmotions[0].emotion}
              </span>
            </div>
          )}
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-muted)]"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
              <Brain className="w-10 h-10 text-[var(--mc-accent-primary)]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Welcome to MindChat</h3>
            <p className="text-[var(--mc-text-secondary)] max-w-md mb-8">
              I'm your AI mental health companion. I'm here to listen, support, and help you navigate your thoughts and feelings.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="px-4 py-2 rounded-full bg-[var(--mc-bg-tertiary)] text-sm text-[var(--mc-text-secondary)] hover:bg-[var(--mc-accent-primary)]/20 hover:text-[var(--mc-accent-primary)] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 message-enter ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${message.sender === 'user' 
                    ? 'bg-[var(--mc-accent-primary)]' 
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }
                `}>
                  {message.sender === 'user' ? (
                    <span className="text-sm">{user?.email?.[0].toUpperCase() || 'U'}</span>
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`
                    px-4 py-3 rounded-2xl
                    ${message.sender === 'user'
                      ? 'bg-[var(--mc-accent-primary)] text-white rounded-br-md'
                      : 'bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-primary)] rounded-bl-md'
                    }
                    ${message.metadata?.isCrisis ? 'border-2 border-red-500/50' : ''}
                  `}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                    
                    {/* Crisis badge */}
                    {message.metadata?.isCrisis && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                        <Heart className="w-3 h-3" />
                        <span>Crisis resources provided</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-[var(--mc-text-muted)]">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.sender === 'ai' && (
                      <button
                        onClick={() => copyMessage(message.text)}
                        className="p-1 rounded hover:bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-muted)]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingText && (
              <div className="flex gap-3 message-enter">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="max-w-[80%]">
                  <div className="px-4 py-3 rounded-2xl bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-primary)] rounded-bl-md">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {streamingText}
                      <span className="inline-block w-2 h-4 ml-1 bg-[var(--mc-accent-primary)] animate-pulse" />
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && !streamingText && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-[var(--mc-bg-tertiary)] rounded-bl-md">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--mc-text-muted)] typing-dot" />
                    <span className="w-2 h-2 rounded-full bg-[var(--mc-text-muted)] typing-dot" />
                    <span className="w-2 h-2 rounded-full bg-[var(--mc-text-muted)] typing-dot" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--mc-border)] bg-[var(--mc-bg-secondary)]">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="pr-12 py-3 bg-[var(--mc-bg-tertiary)] border-[var(--mc-border)] rounded-xl"
              disabled={isTyping}
            />
            <button
              onClick={() => {/* Open voice input */}}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--mc-bg-secondary)] text-[var(--mc-text-muted)]"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-center text-[var(--mc-text-muted)]">
          MindChat is here to support, not replace professional help.
        </p>
      </div>
    </div>
  );
}
