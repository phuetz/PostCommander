import { useState } from 'react';
import { Plus, Trash2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SequenceStep {
  stepNumber: number;
  delayDays: number;
  promptTemplate: string;
}

interface SequenceBuilderProps {
  steps: SequenceStep[];
  onChange: (steps: SequenceStep[]) => void;
}

export function SequenceBuilder({ steps, onChange }: SequenceBuilderProps) {
  const addStep = () => {
    onChange([
      ...steps,
      {
        stepNumber: steps.length + 1,
        delayDays: 3,
        promptTemplate: 'Write a follow-up message asking if they saw my previous message...',
      },
    ]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    // Re-index
    const reindexed = newSteps.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    onChange(reindexed);
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sequence Steps</h3>
        <p className="text-sm text-gray-500">Configure your multi-day drip campaign</p>
      </div>

      <div className="space-y-6 relative border-l-2 border-indigo-200 dark:border-indigo-800 ml-4 pl-6">
        <AnimatePresence>
          {steps.map((step, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={step.stepNumber} 
              className="relative bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
            >
            {/* Timeline Dot */}
            <div className="absolute -left-9 top-6 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{step.stepNumber}</span>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {index === 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <MessageSquare size={14} />
                    Initial Contact (Day 0)
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Clock size={14} />
                      Wait
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={step.delayDays}
                      onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value))}
                      className="w-16 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">days, then send:</span>
                  </div>
                )}
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                AI Prompt Template
              </label>
              <textarea
                value={step.promptTemplate}
                onChange={(e) => updateStep(index, 'promptTemplate', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800 dark:text-gray-200 resize-none"
                placeholder="Instruct the AI on what to say..."
              />
              <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                <AlertCircle size={12} />
                The AI will automatically inject the prospect's profile, past conversation, and long-term memory.
              </p>
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={addStep}
        className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
      >
        <Plus size={16} />
        Add Follow-up Step
      </button>
    </div>
  );
}
