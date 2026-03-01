'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { CategoryScore } from '@/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface ScoreRadarProps {
  categoryScores: CategoryScore[];
  size?: 'sm' | 'md';
}

export default function ScoreRadar({ categoryScores, size = 'md' }: ScoreRadarProps) {
  const data = {
    labels: categoryScores.map((cs) => cs.categoryName.split(' & ')[0]),
    datasets: [
      {
        label: 'Điểm đánh giá',
        data: categoryScores.map((cs) => cs.percentage),
        backgroundColor: 'rgba(255, 192, 51, 0.2)',
        borderColor: '#FFC033',
        borderWidth: 2,
        pointBackgroundColor: '#FFC033',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#FFC033',
        pointRadius: size === 'sm' ? 3 : 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          font: { size: size === 'sm' ? 8 : 10 },
          backdropColor: 'transparent',
        },
        pointLabels: {
          font: {
            size: size === 'sm' ? 10 : 12,
            weight: 'bold' as const,
            family: 'Montserrat',
          },
          color: '#1C1C1C',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) => `${context.raw}%`,
        },
      },
    },
  };

  return (
    <div className={size === 'sm' ? 'w-full max-w-[200px] mx-auto' : 'w-full max-w-[300px] mx-auto'}>
      <Radar data={data} options={options} />
    </div>
  );
}
