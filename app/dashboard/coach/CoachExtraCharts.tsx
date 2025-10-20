'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Line = dynamic(() => import('react-chartjs-2').then(m => m.Line), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(m => m.Bar), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface Client {
  id: string;
  name: string;
  lastWorkout?: string | null;
  programs: string[];
}

interface Props { clients: Client[] }

export default function CoachExtraCharts({ clients }: Props) {
  // weekly active clients for past 8 weeks
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weeks: string[] = [];
    const counts: number[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(now.getDate() - i * 7); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 7);
      const label = `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
      weeks.push(label);
      const count = clients.filter(c => c.lastWorkout && (new Date(c.lastWorkout) >= start && new Date(c.lastWorkout) < end)).length;
      counts.push(count);
    }
    return { labels: weeks, datasets: [{ label: 'Clients actifs (hebdo)', data: counts, borderColor: '#06B6D4', backgroundColor: '#06B6D4', tension: 0.25 }] };
  }, [clients]);

  // clients per program horizontal bar (top 8)
  const programsData = useMemo(() => {
    const tally: Record<string, number> = {};
    clients.forEach(c => c.programs.forEach(p => tally[p] = (tally[p] || 0) + 1));
    const entries = Object.entries(tally).sort((a,b) => b[1] - a[1]).slice(0,8);
    const labels = entries.map(e => e[0]);
    const data = entries.map(e => e[1]);
    return { labels, datasets: [{ label: 'Clients', data, backgroundColor: '#F59E0B' }] };
  }, [clients]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <Line data={weeklyData as any} options={{ plugins: { title: { display: true, text: 'Clients actifs par semaine (8 dernières semaines)' }, legend: { display: false } } }} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <Bar data={programsData as any} options={{ indexAxis: 'y' as const, plugins: { title: { display: true, text: 'Top programmes (clients)' }, legend: { display: false } }, scales: { x: { beginAtZero: true } } }} />
      </div>
    </div>
  );
}
