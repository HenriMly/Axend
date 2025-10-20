'use client';

import React from 'react';

interface Props {
  percent: number; // 0-100
  size?: number;
  stroke?: number;
}

export default function MiniDonut({ percent, size = 48, stroke = 6 }: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
      <defs>
        <linearGradient id="g1" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size/2}, ${size/2})`}>
        <circle r={radius} fill="none" stroke="#e6eef6" strokeWidth={stroke} />
        <circle r={radius} fill="none" stroke="url(#g1)" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90)`} />
        <text x="0" y="4" textAnchor="middle" fontSize={Math.max(10, size * 0.22)} fill="#0f172a" className="dark:text-white">{`${Math.round(percent)}%`}</text>
      </g>
    </svg>
  );
}
