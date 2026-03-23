'use client';

import { CriterionTranslation } from '@/lib/i18n';

interface CriteriaCardProps {
  criterion: CriterionTranslation;
  selectedScore?: number;
  onSelect: (criterionId: number, score: number) => void;
  index: number;
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

const scoreColors: Record<number, string> = {
  1: 'border-danger/30 bg-red-50 text-danger hover:border-danger hover:bg-red-100',
  2: 'border-orange-300/30 bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-orange-100',
  3: 'border-warning/30 bg-yellow-50 text-yellow-700 hover:border-warning hover:bg-yellow-100',
  4: 'border-green-300/30 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100',
  5: 'border-success/30 bg-emerald-50 text-success hover:border-success hover:bg-emerald-100',
};

const scoreSelectedColors: Record<number, string> = {
  1: 'border-danger bg-danger text-white shadow-lg shadow-danger/30',
  2: 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/30',
  3: 'border-warning bg-warning text-dark shadow-lg shadow-warning/30',
  4: 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-500/30',
  5: 'border-success bg-success text-white shadow-lg shadow-success/30',
};

export default function CriteriaCard({ criterion, selectedScore, onSelect, index, isFocused = true, onToggleFocus }: CriteriaCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
      isFocused ? 'border-primary/30 shadow-md' : 'border-gray-100'
    }`}>
      {/* Header — clickable to toggle */}
      <div
        className={`px-4 py-3 ${isFocused ? 'bg-primary/5' : 'bg-gray-50'} border-b border-gray-100 cursor-pointer`}
        onClick={onToggleFocus}
      >
        <div className="flex items-start gap-3">
          <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            selectedScore ? 'bg-success text-white' : 'bg-primary text-dark'
          }`}>
            {selectedScore ? '✓' : index}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-dark text-sm leading-tight">{criterion.name}</h3>
            {isFocused && (
              <>
                <p className="text-xs text-gray-400 mt-0.5">{criterion.description}</p>
                {criterion.hint && (
                  <p className="text-[11px] text-gray-400 mt-1 italic leading-relaxed">{criterion.hint}</p>
                )}
              </>
            )}
          </div>
          {selectedScore && (
            <span className="flex-shrink-0 text-sm font-bold text-primary">{selectedScore}/5</span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isFocused ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Options — collapsible */}
      {isFocused && (
        <div className="p-3 space-y-2">
          {criterion.options.map((option) => {
            const isSelected = selectedScore === option.score;
            return (
              <button
                key={option.score}
                onClick={() => onSelect(criterion.id, option.score)}
                className={`score-btn w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                  isSelected
                    ? scoreSelectedColors[option.score]
                    : scoreColors[option.score]
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    isSelected ? 'border-white/50 bg-white/20' : 'border-current opacity-60'
                  }`}>
                    {option.score}
                  </span>
                  <span className="flex-1 text-xs sm:text-sm leading-tight">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
