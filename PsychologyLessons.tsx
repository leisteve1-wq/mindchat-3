import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Brain, 
  Heart, 
  Sparkles, 
  Lightbulb, 
  ChevronRight,
  CheckCircle,
  Lock,
  Star
} from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  content: string;
  keyPoints: string[];
  quiz?: QuizQuestion[];
  completed?: boolean;
  locked?: boolean;
}

const LESSONS: Lesson[] = [
  {
    id: '1',
    title: 'Understanding Anxiety',
    description: 'Learn what anxiety is and how it affects your body and mind',
    category: 'Anxiety',
    difficulty: 'beginner',
    duration: 10,
    content: `Anxiety is your body's natural response to stress. It's a feeling of fear or apprehension about what's to come.

The Science:
When you feel anxious, your body goes into "fight or flight" mode. Your heart rate increases, your breathing quickens, and your muscles tense up. This is your body's way of preparing you to face a perceived threat.

Common Symptoms:
- Racing thoughts
- Rapid heartbeat
- Sweating
- Trembling
- Difficulty concentrating
- Sleep problems

Remember: Anxiety is a normal emotion. It becomes a problem when it's constant, overwhelming, or interferes with your daily life.`,
    keyPoints: [
      'Anxiety is a natural stress response',
      'It triggers the "fight or flight" response',
      'Symptoms are both mental and physical',
      'Help is available and effective'
    ],
    quiz: [
      {
        question: 'What is the "fight or flight" response?',
        options: [
          'A type of therapy',
          'The body\'s natural reaction to perceived threats',
          'A medication for anxiety',
          'A breathing technique'
        ],
        correct: 1
      }
    ]
  },
  {
    id: '2',
    title: 'CBT Basics',
    description: 'Introduction to Cognitive Behavioral Therapy',
    category: 'Therapy',
    difficulty: 'beginner',
    duration: 15,
    content: `Cognitive Behavioral Therapy (CBT) is one of the most effective treatments for anxiety and depression.

The Core Concept:
Your thoughts, feelings, and behaviors are connected. Changing one can change the others.

The Process:
1. Identify negative thoughts
2. Challenge their accuracy
3. Replace with balanced thoughts
4. Change behaviors based on new thinking

Example:
Thought: "I'll fail this presentation"
-> Challenge: "What's the evidence? I've prepared well"
-> New thought: "I've prepared and can handle this"
-> Behavior: Give the presentation with confidence`,
    keyPoints: [
      'Thoughts affect feelings and behaviors',
      'Negative thoughts can be challenged',
      'CBT is skills-based and practical',
      'It\'s effective for many conditions'
    ]
  },
  {
    id: '3',
    title: 'Grounding Techniques',
    description: 'Learn techniques to stay present during anxiety',
    category: 'Coping',
    difficulty: 'beginner',
    duration: 8,
    content: `Grounding techniques help you stay connected to the present moment when anxiety tries to pull you away.

5-4-3-2-1 Technique:
- 5 things you can SEE
- 4 things you can HEAR
- 3 things you can TOUCH
- 2 things you can SMELL
- 1 thing you can TASTE

Why It Works:
Anxiety often comes from worrying about the future or ruminating on the past. Grounding forces your brain to focus on the present moment through your senses.

When to Use:
- During panic attacks
- When feeling overwhelmed
- Before stressful events
- When you can't sleep due to racing thoughts`,
    keyPoints: [
      'Grounding brings you to the present',
      'Use your five senses',
      'Works quickly in moments of anxiety',
      'Practice makes it more effective'
    ]
  },
  {
    id: '4',
    title: 'Understanding Depression',
    description: 'Learn about depression and its treatments',
    category: 'Depression',
    difficulty: 'beginner',
    duration: 12,
    content: `Depression is more than feeling sad. It's a serious condition that affects how you feel, think, and handle daily activities.

Key Facts:
- It's a real medical condition
- It's not a sign of weakness
- It's treatable
- You're not alone

Common Symptoms:
- Persistent sad or empty mood
- Loss of interest in activities
- Changes in sleep or appetite
- Difficulty concentrating
- Feelings of worthlessness

Treatment Options:
- Therapy (CBT, interpersonal therapy)
- Medication
- Lifestyle changes
- Support groups`,
    keyPoints: [
      'Depression is a real medical condition',
      'It\'s treatable with professional help',
      'Symptoms affect daily life',
      'You don\'t have to face it alone'
    ],
    locked: false
  }
];

export default function PsychologyLessons() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Start lesson
  const startLesson = (lesson: Lesson) => {
    if (lesson.locked) {
      toast.error('Complete previous lessons first');
      return;
    }
    setSelectedLesson(lesson);
  };

  // Complete lesson
  const completeLesson = () => {
    if (selectedLesson?.quiz) {
      setShowQuiz(true);
      setCurrentQuestion(0);
      setQuizScore(0);
    } else {
      finishLesson();
    }
  };

  // Finish lesson
  const finishLesson = () => {
    if (selectedLesson) {
      setCompletedLessons([...completedLessons, selectedLesson.id]);
      toast.success('Lesson completed!');
      setSelectedLesson(null);
      setShowQuiz(false);
    }
  };

  // Submit quiz answer
  const submitAnswer = () => {
    if (selectedAnswer === null || !selectedLesson?.quiz) return;

    const question = selectedLesson.quiz[currentQuestion];
    if (selectedAnswer === question.correct) {
      setQuizScore(s => s + 1);
    }

    if (currentQuestion < selectedLesson.quiz.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz complete
      const passed = quizScore >= selectedLesson.quiz.length * 0.7;
      if (passed) {
        finishLesson();
      } else {
        toast.info('Review the lesson and try again!');
        setShowQuiz(false);
      }
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'anxiety': return Brain;
      case 'depression': return Heart;
      case 'therapy': return Sparkles;
      case 'coping': return Lightbulb;
      default: return BookOpen;
    }
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold gradient-text">Psychology Lessons</h1>
          <p className="text-[var(--mc-text-secondary)]">
            Learn about mental health from evidence-based resources
          </p>
        </div>

        {/* Progress */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--mc-text-secondary)]">Your Progress</span>
              <span className="text-sm font-medium">
                {completedLessons.length} / {LESSONS.length} completed
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--mc-bg-tertiary)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                style={{ width: `${(completedLessons.length / LESSONS.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lessons Grid */}
        <div className="grid gap-4">
          {LESSONS.map((lesson) => {
            const Icon = getCategoryIcon(lesson.category);
            const isCompleted = completedLessons.includes(lesson.id);
            
            return (
              <Card
                key={lesson.id}
                className={`
                  bg-[var(--mc-bg-secondary)] border-[var(--mc-border)] cursor-pointer transition-all
                  ${lesson.locked ? 'opacity-60' : 'hover:border-[var(--mc-accent-primary)]/50'}
                `}
                onClick={() => startLesson(lesson)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isCompleted 
                        ? 'bg-green-500/20' 
                        : lesson.locked 
                          ? 'bg-[var(--mc-bg-tertiary)]' 
                          : 'bg-[var(--mc-accent-primary)]/20'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : lesson.locked ? (
                        <Lock className="w-6 h-6 text-[var(--mc-text-muted)]" />
                      ) : (
                        <Icon className="w-6 h-6 text-[var(--mc-accent-primary)]" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{lesson.title}</h3>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--mc-text-secondary)] mb-2">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--mc-text-muted)]">
                        <span className={getDifficultyColor(lesson.difficulty)}>
                          {lesson.difficulty}
                        </span>
                        <span>{lesson.duration} min</span>
                        <span>{lesson.category}</span>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-[var(--mc-text-muted)]" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Lesson Dialog */}
        <Dialog open={!!selectedLesson && !showQuiz} onOpenChange={() => setSelectedLesson(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            {selectedLesson && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{selectedLesson.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  {/* Content */}
                  <div className="prose prose-invert max-w-none">
                    {selectedLesson.content.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-[var(--mc-text-primary)] leading-relaxed mb-4">
                        {paragraph.startsWith('**') ? (
                          <span className="font-semibold text-[var(--mc-accent-primary)]">
                            {paragraph.replace(/\*\*/g, '')}
                          </span>
                        ) : (
                          paragraph
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Key Points */}
                  <div className="bg-[var(--mc-bg-tertiary)] rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-[var(--mc-accent-primary)]" />
                      Key Points
                    </h4>
                    <ul className="space-y-2">
                      {selectedLesson.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-[var(--mc-accent-primary)]">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Complete Button */}
                  <Button
                    onClick={completeLesson}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
                  >
                    {selectedLesson.quiz ? 'Take Quiz' : 'Complete Lesson'}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Quiz Dialog */}
        <Dialog open={showQuiz} onOpenChange={() => setShowQuiz(false)}>
          <DialogContent className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <DialogHeader>
              <DialogTitle>Quick Quiz</DialogTitle>
            </DialogHeader>
            {selectedLesson?.quiz && (
              <div className="space-y-4 pt-4">
                <p className="text-sm text-[var(--mc-text-muted)]">
                  Question {currentQuestion + 1} of {selectedLesson.quiz.length}
                </p>
                <p className="font-medium">
                  {selectedLesson.quiz[currentQuestion].question}
                </p>
                <div className="space-y-2">
                  {selectedLesson.quiz[currentQuestion].options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedAnswer(i)}
                      className={`
                        w-full p-3 rounded-lg text-left transition-colors
                        ${selectedAnswer === i
                          ? 'bg-[var(--mc-accent-primary)] text-white'
                          : 'bg-[var(--mc-bg-tertiary)] hover:bg-[var(--mc-bg-elevated)]'
                        }
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  {currentQuestion < selectedLesson.quiz.length - 1 ? 'Next' : 'Finish'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
