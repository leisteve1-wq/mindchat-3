import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Wind, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdAfterExhale: number;
  cycles: number;
  category: string;
}

const EXERCISES: Exercise[] = [
  {
    id: '4-7-8',
    name: '4-7-8 Breathing',
    description: 'Calm your nervous system with this relaxing technique',
    inhale: 4,
    hold: 7,
    exhale: 8,
    holdAfterExhale: 0,
    cycles: 4,
    category: 'calm'
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Used by Navy SEALs for focus and calm',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfterExhale: 4,
    cycles: 4,
    category: 'focus'
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: 'Balance your heart rate and reduce stress',
    inhale: 5,
    hold: 0,
    exhale: 5,
    holdAfterExhale: 0,
    cycles: 6,
    category: 'calm'
  },
  {
    id: 'relaxing',
    name: 'Relaxing Breath',
    description: 'Deep, slow breaths for deep relaxation',
    inhale: 6,
    hold: 2,
    exhale: 8,
    holdAfterExhale: 0,
    cycles: 5,
    category: 'sleep'
  }
];

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale' | 'idle';

export default function BreathingExercise() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play bell sound
  const playBell = (frequency: number = 440, duration: number = 0.5) => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  // Start exercise
  const startExercise = () => {
    if (!selectedExercise) return;
    
    setIsActive(true);
    setCycle(1);
    setShowSummary(false);
    playBell(528, 1);
    runPhase('inhale');
  };

  // Run a phase
  const runPhase = (phaseName: Phase) => {
    setPhase(phaseName);
    setProgress(0);
    
    if (!selectedExercise) return;
    
    const durationMap: Record<string, number> = {
      inhale: selectedExercise.inhale,
      hold: selectedExercise.hold,
      exhale: selectedExercise.exhale,
      holdAfterExhale: selectedExercise.holdAfterExhale
    };
    
    const duration = durationMap[phaseName] || 0;
    
    if (duration === 0) {
      nextPhase(phaseName);
      return;
    }
    
    if (phaseName === 'inhale') playBell(440, 0.3);
    else if (phaseName === 'exhale') playBell(330, 0.3);
    
    const interval = 50;
    const steps = (duration * 1000) / interval;
    let currentStep = 0;
    
    timerRef.current = window.setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);
      
      if (currentStep >= steps) {
        if (timerRef.current) clearInterval(timerRef.current);
        nextPhase(phaseName);
      }
    }, interval);
  };

  // Move to next phase
  const nextPhase = (currentPhase: Phase) => {
    if (!selectedExercise) return;
    
    const phases: Phase[] = ['inhale', 'hold', 'exhale', 'holdAfterExhale'];
    const currentIndex = phases.indexOf(currentPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    const nextPhaseName = phases[nextIndex];
    
    const durationMap: Record<string, number> = {
      inhale: selectedExercise.inhale,
      hold: selectedExercise.hold,
      exhale: selectedExercise.exhale,
      holdAfterExhale: selectedExercise.holdAfterExhale
    };
    
    const nextDuration = durationMap[nextPhaseName] || 0;
    
    if (nextDuration === 0 && nextPhaseName === 'holdAfterExhale') {
      if (cycle >= selectedExercise.cycles) {
        finishExercise();
        return;
      }
      setCycle(c => c + 1);
      runPhase('inhale');
      return;
    }
    
    if (currentPhase === 'holdAfterExhale') {
      if (cycle >= selectedExercise.cycles) {
        finishExercise();
        return;
      }
      setCycle(c => c + 1);
      runPhase('inhale');
      return;
    }
    
    runPhase(nextPhaseName);
  };

  // Finish exercise
  const finishExercise = () => {
    setIsActive(false);
    setPhase('idle');
    setShowSummary(true);
    playBell(660, 1.5);
    toast.success('Exercise completed! Great job!');
  };

  // Stop exercise
  const stopExercise = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsActive(false);
    setPhase('idle');
    setCycle(0);
    setProgress(0);
  };

  // Get phase text
  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'holdAfterExhale': return 'Hold';
      default: return 'Ready';
    }
  };

  // Get phase color
  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return '#10b981';
      case 'hold': return '#f59e0b';
      case 'exhale': return '#3b82f6';
      case 'holdAfterExhale': return '#8b5cf6';
      default: return '#6366f1';
    }
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text">Breathing Exercises</h1>
          <p className="text-[var(--mc-text-secondary)]">
            Calm your mind with guided breathing
          </p>
        </div>

        {/* Exercise Selection */}
        {!isActive && !showSummary && (
          <div className="grid gap-4">
            {EXERCISES.map((exercise) => (
              <Card
                key={exercise.id}
                className={`
                  bg-[var(--mc-bg-secondary)] border-[var(--mc-border)] cursor-pointer transition-all
                  ${selectedExercise?.id === exercise.id 
                    ? 'border-[var(--mc-accent-primary)] ring-1 ring-[var(--mc-accent-primary)]' 
                    : 'hover:border-[var(--mc-accent-primary)]/50'
                  }
                `}
                onClick={() => setSelectedExercise(exercise)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <p className="text-sm text-[var(--mc-text-secondary)]">
                        {exercise.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--mc-text-muted)]">
                        <span>{exercise.inhale}s in</span>
                        {exercise.hold > 0 && <span>{exercise.hold}s hold</span>}
                        <span>{exercise.exhale}s out</span>
                        <span>{exercise.cycles} cycles</span>
                      </div>
                    </div>
                    <Wind className="w-8 h-8 text-[var(--mc-accent-primary)]" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {selectedExercise && (
              <Button
                onClick={startExercise}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Exercise
              </Button>
            )}
          </div>
        )}

        {/* Active Exercise */}
        {isActive && selectedExercise && (
          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-8">
              {/* Controls */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-lg hover:bg-[var(--mc-bg-tertiary)]"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              {/* Breathing Circle */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <div 
                  className="absolute inset-0 rounded-full opacity-20"
                  style={{ 
                    background: getPhaseColor(),
                    transform: `scale(${1 + progress / 200})`,
                    transition: 'transform 0.1s linear'
                  }}
                />
                <div 
                  className="absolute inset-4 rounded-full opacity-30"
                  style={{ 
                    background: getPhaseColor(),
                    transform: `scale(${1 + progress / 150})`,
                    transition: 'transform 0.1s linear'
                  }}
                />
                
                <div 
                  className="absolute inset-8 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{ 
                    background: `linear-gradient(135deg, ${getPhaseColor()}, ${getPhaseColor()}80)`,
                    boxShadow: `0 0 40px ${getPhaseColor()}40`
                  }}
                >
                  <div className="text-center text-white">
                    <p className="text-2xl font-bold">{getPhaseText()}</p>
                    <p className="text-lg opacity-80">
                      {phase === 'idle' ? '' : Math.ceil((100 - progress) / 100 * 
                        (phase === 'inhale' ? selectedExercise.inhale : 
                         phase === 'hold' ? selectedExercise.hold :
                         phase === 'exhale' ? selectedExercise.exhale :
                         selectedExercise.holdAfterExhale)
                      ) + 's'}
                    </p>
                  </div>
                </div>

                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    fill="none"
                    stroke="var(--mc-bg-tertiary)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    fill="none"
                    stroke={getPhaseColor()}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                </svg>
              </div>

              {/* Cycle Counter */}
              <div className="text-center mb-6">
                <p className="text-[var(--mc-text-secondary)]">
                  Cycle {cycle} of {selectedExercise.cycles}
                </p>
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: selectedExercise.cycles }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < cycle ? 'bg-[var(--mc-accent-primary)]' : 'bg-[var(--mc-bg-tertiary)]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Stop Button */}
              <Button
                onClick={stopExercise}
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Stop Exercise
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {showSummary && (
          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Wind className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Great Job!</h2>
              <p className="text-[var(--mc-text-secondary)] mb-6">
                You completed {selectedExercise?.cycles} cycles of {selectedExercise?.name}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setShowSummary(false);
                    setSelectedExercise(null);
                  }}
                  variant="outline"
                >
                  Choose Another
                </Button>
                <Button
                  onClick={startExercise}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repeat
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
