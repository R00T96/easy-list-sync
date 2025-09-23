import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { seedLists } from "@/hooks/useDemoSeeds";

// Demo: Each goal gets a PIN (for now, just use the category name as a PIN)
const generatePin = (category: string) => {
  // For demo, just use first 3 letters + 3 random digits
  return (
    category.replace(/[^A-Z0-9]/gi, "").substring(0, 3).toUpperCase() +
    Math.floor(100 + Math.random() * 900)
  );
};

const QUESTIONS = [
  {
    text: "What is your main focus right now?",
    options: ["Wellbeing", "Productivity", "Learning", "Finance", "Fun"],
  },
  {
    text: "How do you prefer to work?",
    options: ["Solo", "With friends", "With family", "With a team"],
  },
  {
    text: "How much time do you want to invest?",
    options: ["5 min", "15 min", "30 min", "1 hour+"]
  }
];

const INITIAL_CREDITS = 3;

const Goals: React.FC = () => {
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const navigate = useNavigate();

  // When user selects a goal
  const handleGoalSelect = (category: string) => {
    setSelectedGoal(category);
    setPin(generatePin(category));
    setStep(1);
  };

  // When user answers a question
  const handleAnswer = (answer: string) => {
    setAnswers((prev) => [...prev, answer]);
    if (step < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      // Done! Deduct credit and show summary
      setCredits((c) => c - 1);
      setStep(QUESTIONS.length + 1);
    }
  };

  // Reset to pick another goal
  const handleRestart = () => {
    setSelectedGoal(null);
    setPin(null);
    setStep(0);
    setAnswers([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-4 text-center">
          <div className="text-lg font-bold">Credits: {credits}</div>
        </div>
        {/* Step 0: Show goals */}
        {step === 0 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-center mb-4">Pick a Life Blueprint</h1>
            {seedLists.map((goal) => (
              <Card key={goal.category} className="mb-2 cursor-pointer hover:shadow-lg transition" onClick={() => handleGoalSelect(goal.category)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-semibold">{goal.items[0]?.text.split(" ")[0]} {goal.category}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">PIN: {generatePin(goal.category)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Step 1+: Questions */}
        {step > 0 && step <= QUESTIONS.length && selectedGoal && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-center">{QUESTIONS[step - 1].text}</h2>
            <div className="flex flex-col gap-3">
              {QUESTIONS[step - 1].options.map((opt) => (
                <Button key={opt} variant="default" className="w-full" onClick={() => handleAnswer(opt)}>
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        )}
        {/* Step: Summary */}
        {step > QUESTIONS.length && selectedGoal && (
          <div className="space-y-6 animate-in fade-in duration-500 text-center">
            <h2 className="text-xl font-bold">Your Blueprint is Ready!</h2>
            <div className="bg-gradient-subtle rounded-xl p-6 border border-border">
              <div className="mb-2 font-semibold">Goal: {selectedGoal}</div>
              <div className="mb-2">PIN: <span className="font-mono text-primary">{pin}</span></div>
              <div className="mb-2">Profile:</div>
              <ul className="text-left list-disc list-inside">
                {QUESTIONS.map((q, i) => (
                  <li key={q.text}><span className="font-medium">{q.text}</span>: {answers[i]}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  // Find the selected goal's items
                  const goal = seedLists.find(g => g.category === selectedGoal);
                  if (goal && pin) {
                    // Store items in localStorage for LiveList to pick up
                    localStorage.setItem(`seedItems_${pin}`, JSON.stringify(goal.items.map(i => i.text)));
                  }
                  navigate(`/public?pin=${pin}`);
                }}
              >
                Go to List
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleRestart} disabled={credits <= 0}>
                {credits > 0 ? "Try Another" : "No Credits Left"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;
