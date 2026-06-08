import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface BurndownChartProps {
  data: number[]; // Valores acumulados reais
  ideal: number[]; // Valores acumulados ideais
  width?: number;
  height?: number;
  className?: string;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ 
  data, 
  ideal, 
  width = 600, 
  height = 200,
  className 
}) => {
  const max = Math.max(...data, ...ideal, 100);
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const getPoints = (points: number[]) => {
    return points.map((val, i) => ({
      x: padding + (i / (points.length - 1)) * chartWidth,
      y: height - padding - (val / max) * chartHeight
    }));
  };

  const dataPoints = getPoints(data);
  const idealPoints = getPoints(ideal);

  const createPath = (points: Point[]) => 
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className={className} style={{ width: '100%', aspectRatio: `${width}/${height}` }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border)" strokeWidth="1" />

        {/* Ideal Path (dashed) */}
        <path d={createPath(idealPoints)} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Real Path */}
        <path d={createPath(dataPoints)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        
        {/* Dots on Real Path */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
        ))}

        {/* Today line (demo) */}
        <line x1={dataPoints[Math.floor(dataPoints.length / 2)].x} y1={padding} x2={dataPoints[Math.floor(dataPoints.length / 2)].x} y2={height - padding} stroke="var(--danger)" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    </div>
  );
};
