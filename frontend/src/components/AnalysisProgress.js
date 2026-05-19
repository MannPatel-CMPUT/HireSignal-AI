import React from 'react';
import { Progress } from './ui/progress';
import { CheckCircle2, Loader2 } from 'lucide-react';

const steps = [
  { id: 1, label: 'Validating inputs', duration: 1000 },
  { id: 2, label: 'Connecting to AI engine', duration: 2000 },
  { id: 3, label: 'Analyzing ATS compatibility', duration: 3000 },
  { id: 4, label: 'Detecting AI tone patterns', duration: 2000 },
  { id: 5, label: 'Matching keywords', duration: 2000 },
  { id: 6, label: 'Generating recruiter feedback', duration: 3000 },
  { id: 7, label: 'Creating improvement suggestions', duration: 2000 },
  { id: 8, label: 'Finalizing report', duration: 1000 }
];

const AnalysisProgress = ({ currentStep }) => {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-8" data-testid="analysis-progress">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
          Analyzing Your Resume
        </h3>
        <p className="text-zinc-600">This may take 15-30 seconds. Please don't close this page.</p>
      </div>

      <Progress value={progress} className="mb-6" data-testid="progress-bar" />

      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 text-sm ${
              step.id < currentStep
                ? 'text-emerald-600'
                : step.id === currentStep
                ? 'text-black font-medium'
                : 'text-zinc-400'
            }`}
            data-testid={`step-${step.id}`}
          >
            {step.id < currentStep ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : step.id === currentStep ? (
              <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
            ) : (
              <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-zinc-300" />
            )}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisProgress;