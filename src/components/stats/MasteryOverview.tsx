import React from 'react';

export interface MasteryOverviewProps {
  conceptsSeen?: string[];
  masteryCounts: {
    mastered: number;
    familiar: number;
    practicing: number;
    shaky: number;
    new: number;
  };
}

export const MasteryOverview: React.FC<MasteryOverviewProps> = ({
  conceptsSeen,
  masteryCounts,
}) => {
  return (
    <div className="space-y-3">
      {conceptsSeen && conceptsSeen.length > 0 && (
        <div className="pt-2 text-left">
          <span className="text-muted text-xs font-mono uppercase tracking-wider block mb-2">
            Session Syllabus ({conceptsSeen.length} tells encountered)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {conceptsSeen.map((concept) => (
              <span
                key={concept}
                className="px-2 py-0.5 bg-ink border border-panel-line text-signal font-mono text-[11px]"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs pt-1">
        <div className="bg-ink p-2 border border-panel-line text-center">
          <span className="text-muted text-[10px] uppercase block">Mastered</span>
          <span className="text-good font-700 text-base">{masteryCounts.mastered}</span>
        </div>
        <div className="bg-ink p-2 border border-panel-line text-center">
          <span className="text-muted text-[10px] uppercase block">Familiar</span>
          <span className="text-good/80 font-700 text-base">{masteryCounts.familiar}</span>
        </div>
        <div className="bg-ink p-2 border border-panel-line text-center">
          <span className="text-muted text-[10px] uppercase block">Practicing</span>
          <span className="text-signal font-700 text-base">{masteryCounts.practicing}</span>
        </div>
        <div className="bg-ink p-2 border border-panel-line text-center">
          <span className="text-muted text-[10px] uppercase block">Shaky</span>
          <span className="text-bad font-700 text-base">{masteryCounts.shaky}</span>
        </div>
        <div className="bg-ink p-2 border border-panel-line text-center">
          <span className="text-muted text-[10px] uppercase block">New</span>
          <span className="text-muted font-700 text-base">{masteryCounts.new}</span>
        </div>
      </div>
    </div>
  );
};
