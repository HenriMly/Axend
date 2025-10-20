'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-chartjs-2 to avoid SSR issues
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface Measurement {
  id: string;
  date: string;
  weight: number;
}

interface ChartsProps {
  measurements: Measurement[];
  workoutsThisWeek: number; // completed
  workoutsPlannedThisWeek: number; // planned
}

export default function Charts({ measurements, workoutsThisWeek, workoutsPlannedThisWeek }: ChartsProps) {
  const weightData = useMemo(() => {
    const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      labels: sorted.map(m => new Date(m.date).toLocaleDateString('fr-FR')),
      datasets: [
        {
          label: 'Poids (kg)',
          data: sorted.map(m => m.weight),
          fill: false,
          borderColor: 'rgba(99,102,241,0.9)',
          backgroundColor: 'rgba(99,102,241,0.6)',
          tension: 0.2,
          pointRadius: 4,
        }
      ]
    };
  }, [measurements]);

  const doughnutData = useMemo(() => {
    const remaining = Math.max(0, workoutsPlannedThisWeek - workoutsThisWeek);
    return {
      labels: ['Complétées', 'Restantes'],
      datasets: [
        {
          data: [workoutsThisWeek, remaining],
          backgroundColor: ['#10B981', '#CBD5E1'],
          hoverBackgroundColor: ['#059669', '#94A3B8'],
        }
      ]
    };
  }, [workoutsThisWeek, workoutsPlannedThisWeek]);

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Évolution du poids' }
    },
    scales: {
      y: { beginAtZero: false }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12 } },
      title: { display: true, text: 'Séances cette semaine' }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <Line data={weightData} options={lineOptions as any} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
        <div style={{ width: 260 }}>
          <Doughnut data={doughnutData} options={doughnutOptions as any} />
        </div>
      </div>
    </div>
  );
}
