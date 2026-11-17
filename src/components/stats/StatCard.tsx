import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  valueColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  valueColor = 'text-paper',
  className = '',
}) => {
  return (
    <div className={`bg-ink border border-panel-line p-3 ${className}`}>
      <span className="text-muted text-[10px] uppercase tracking-wider block">{label}</span>
      <span className={`text-2xl sm:text-3xl font-700 ${valueColor} mt-1 block`}>{value}</span>
      {subtext && <span className="text-[10px] text-muted">{subtext}</span>}
    </div>
  );
};
