'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Bar = dynamic(() => import('react-chartjs-2').then(m => m.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface Client {
  id: string;
  name: string;
  lastWorkout?: string | null;
  programs: string[];
}

interface Props {
  clients: Client[];
}

export default function CoachCharts({ clients }: Props) {
  const activeCount = clients.filter(c => c.lastWorkout && (new Date(c.lastWorkout) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))).length;
  const inactiveCount = Math.max(0, clients.length - activeCount);

  const doughnutData = useMemo(() => ({
    labels: ['Actifs (7j)', 'Inactifs'],
    datasets: [{ data: [activeCount, inactiveCount], backgroundColor: ['#10B981', '#E5E7EB'] }]
  }), [activeCount, inactiveCount]);

  // programs distribution
  const barData = useMemo(() => {
    const tally: Record<string, number> = {};
    clients.forEach(c => c.programs.forEach(p => { tally[p] = (tally[p] || 0) + 1 }));
    const labels = Object.keys(tally);
    const data = labels.map(l => tally[l]);
    return { labels, datasets: [{ label: 'Clients par programme', data, backgroundColor: '#6366F1' }] };
  }, [clients]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <Doughnut data={doughnutData as any} options={{ plugins: { title: { display: true, text: 'Clients actifs vs inactifs (7j)' }, legend: { position: 'bottom' } } }} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <Bar data={barData as any} options={{ plugins: { title: { display: true, text: 'Répartition des clients par programme' }, legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
      </div>
    </div>
  );
}
