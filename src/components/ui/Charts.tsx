'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`h-8 w-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <span className="text-lg">{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface SimpleBarChartProps {
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
}

export function SimpleBarChart({ title, data, height = 200 }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" style={{ height }}>
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium text-gray-600 truncate">
                {item.label}
              </div>
              <div className="flex-1 relative">
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      item.color || 'bg-blue-500'
                    } rounded-full`}
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
                <span className="absolute right-2 top-0 text-xs font-semibold text-gray-700 leading-6">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SimpleLineChartProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  height?: number;
}

export function SimpleLineChart({ title, data, height = 200 }: SimpleLineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 280; // chart width
    const y = height - 40 - ((item.value - minValue) / range) * (height - 80);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          <svg width="100%" height={height} className="overflow-visible">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <g key={ratio}>
                <line
                  x1="0"
                  y1={40 + ratio * (height - 80)}
                  x2="280"
                  y2={40 + ratio * (height - 80)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x="-10"
                  y={45 + ratio * (height - 80)}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="end"
                >
                  {Math.round(maxValue - ratio * range)}
                </text>
              </g>
            ))}
            
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            
            {/* Points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 280;
              const y = height - 40 - ((item.value - minValue) / range) * (height - 80);
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#3b82f6"
                    className="drop-shadow-sm"
                  />
                  <text
                    x={x}
                    y={height - 15}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

interface SimplePieChartProps {
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}

export function SimplePieChart({ title, data, size = 150 }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  let cumulativePercentage = 0;
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const startAngle = (cumulativePercentage / 100) * 360 - 90;
                const endAngle = ((cumulativePercentage + percentage) / 100) * 360 - 90;
                
                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = (endAngle * Math.PI) / 180;
                
                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);
                
                const largeArcFlag = percentage > 50 ? 1 : 0;
                
                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');
                
                cumulativePercentage += percentage;
                
                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={item.color}
                    className="drop-shadow-sm"
                  />
                );
              })}
            </svg>
          </div>
          
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { Card, CardContent, CardHeader, CardTitle };