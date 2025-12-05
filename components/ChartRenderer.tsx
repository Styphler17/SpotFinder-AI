import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChartData } from '../types';

interface ChartRendererProps {
  data: ChartData;
}

const COLORS = ['#7c3aed', '#c026d3', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b'];

export const ChartRenderer: React.FC<ChartRendererProps> = ({ data }) => {
  if (!data || !data.data || data.data.length === 0) return null;

  const renderChart = () => {
    switch (data.type) {
      case 'line':
        return (
          <LineChart data={data.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              cursor={{ stroke: '#7c3aed', strokeWidth: 1 }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#7c3aed" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
              name={data.yLabel || 'Value'}
            />
          </LineChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data.data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={data.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              fill="#7c3aed" 
              radius={[4, 4, 0, 0]} 
              name={data.yLabel || 'Value'}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      {data.title && (
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 text-center">
          {data.title}
        </h4>
      )}
      <div className="w-full h-64 text-xs font-sans">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};