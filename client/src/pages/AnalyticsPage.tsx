import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  MessageSquare,
  Bot,
  Send,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// --- MOCK DATA ---
const KPI_DATA = [
  {
    title: 'Posts Générés',
    value: '142',
    change: '+12%',
    isPositive: true,
    icon: MessageSquare,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/30'
  },
  {
    title: 'Articles Autoblog',
    value: '24',
    change: '+4%',
    isPositive: true,
    icon: Bot,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  {
    title: 'Prospects Contactés',
    value: '840',
    change: '-2%',
    isPositive: false,
    icon: Send,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30'
  },
  {
    title: 'Leads Qualifiés (AI)',
    value: '38',
    change: '+24%',
    isPositive: true,
    icon: Target,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/30'
  }
];

const ACTIVITY_DATA = [
  { date: '1 Mai', posts: 4, outreach: 20, leads: 1 },
  { date: '5 Mai', posts: 6, outreach: 45, leads: 2 },
  { date: '10 Mai', posts: 3, outreach: 60, leads: 4 },
  { date: '15 Mai', posts: 8, outreach: 40, leads: 3 },
  { date: '20 Mai', posts: 5, outreach: 85, leads: 6 },
  { date: '25 Mai', posts: 12, outreach: 50, leads: 4 },
  { date: '30 Mai', posts: 7, outreach: 90, leads: 8 },
];

const TOP_PILLARS = [
  { name: 'Tech & Architecture', score: 88, posts: 45, trend: '+5%' },
  { name: 'Culture Produit', score: 82, posts: 32, trend: '+2%' },
  { name: 'Conseils Startup', score: 76, posts: 28, trend: '-1%' },
  { name: 'Tutoriels Go/Rust', score: 91, posts: 18, trend: '+12%' },
];
// ----------------

function KPICard({ data }: { data: typeof KPI_DATA[0] }) {
  const Icon = data.icon;
  return (
    <Card className="p-5 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{data.title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.value}</h4>
          <span className={clsx(
            "flex items-center text-xs font-semibold",
            data.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {data.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {data.change}
          </span>
        </div>
      </div>
      <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center shrink-0", data.bg, data.color)}>
        <Icon size={24} />
      </div>
    </Card>
  );
}

export function AnalyticsPage() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
              <TrendingUp size={22} />
            </div>
            Business Intelligence
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Vue macro des performances de génération et de prospection.
          </p>
        </div>
        <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                timeRange === range
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi, idx) => (
          <KPICard key={idx} data={kpi} />
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Activité Globale</h3>
            <Button variant="ghost" size="sm">Exporter</Button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutreach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area 
                  type="monotone" 
                  dataKey="outreach" 
                  name="Messages Envoyés" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorOutreach)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="posts" 
                  name="Posts Créés" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorPosts)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Lead Conversion */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Génération de Leads</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  cursor={{ fill: '#374151', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
                />
                <Bar 
                  dataKey="leads" 
                  name="Leads Qualifiés (AI)" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Performing Pillars */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Top Piliers de Contenu</h3>
          <Button variant="ghost" size="sm">Voir tous</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Thématique</th>
                <th className="px-6 py-4 font-medium">Score d'Engagement</th>
                <th className="px-6 py-4 font-medium">Posts Actifs</th>
                <th className="px-6 py-4 font-medium">Tendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {TOP_PILLARS.map((pillar, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {pillar.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[100px]">
                        <div 
                          className="bg-brand-500 h-1.5 rounded-full" 
                          style={{ width: `${pillar.score}%` }}
                        />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-semibold">{pillar.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {pillar.posts}
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "flex items-center font-semibold",
                      pillar.trend.startsWith('+') ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {pillar.trend.startsWith('+') ? <ArrowUpRight size={14} className="mr-1"/> : <ArrowDownRight size={14} className="mr-1"/>}
                      {pillar.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
