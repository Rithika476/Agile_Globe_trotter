import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BudgetSummary } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  PieChart as PieIcon,
  BarChart2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface BudgetTabProps {
  tripId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  sightseeing: '#6366f1',
  accommodation: '#0284c7',
  food: '#d97706',
  activities: '#0d9488',
  transport: '#9333ea',
  shopping: '#db2777',
  other: '#64748b',
};

export const BudgetTab: React.FC<BudgetTabProps> = ({ tripId }) => {
  const { isDark } = useTheme();
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.budget.get(tripId);
      setBudget(res.budget);
    } catch (err: any) {
      setError(err.message || 'Failed to load budget analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [tripId]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Spinner size="lg" className="text-teal-600" />
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-sm">
        {error || 'Unable to load budget data.'}
      </div>
    );
  }

  const hasExpenses = budget.totalEstimated > 0;

  // Format data for Recharts Bar Chart
  const dailyChartData = budget.byDay.map((d) => ({
    date: formatDate(d.date),
    total: d.total,
  }));

  // Format data for Recharts Pie Chart
  const categoryChartData = budget.byCategory.map((c) => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    value: c.total,
    categoryKey: c.category,
    percent: c.percent,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Budget Analytics</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Live expense tracking calculated directly from all scheduled activities.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Estimated Budget */}
        <Card className="p-5 flex items-center space-x-4 border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Target Budget
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(budget.estimatedBudget)}
            </p>
          </div>
        </Card>

        {/* Total Planned */}
        <Card className="p-5 flex items-center space-x-4 border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Total Estimated Costs
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(budget.totalEstimated)}
            </p>
          </div>
        </Card>

        {/* Remaining or Over-Budget */}
        <Card
          className={`p-5 flex items-center space-x-4 ${
            budget.overBudget
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-100'
              : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100'
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              budget.overBudget
                ? 'bg-rose-600 dark:bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {budget.overBudget ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <DollarSign className="w-6 h-6" />
            )}
          </div>
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-wider ${
                budget.overBudget ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {budget.overBudget ? 'OVER BUDGET' : 'REMAINING BUDGET'}
            </p>
            <p
              className={`text-2xl font-black ${
                budget.overBudget ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {budget.overBudget
                ? `+${formatCurrency(budget.overBy)}`
                : formatCurrency(budget.remaining)}
            </p>
          </div>
        </Card>
      </div>

      {/* Visual Analytics */}
      {!hasExpenses ? (
        <EmptyState
          icon={<PieIcon className="w-10 h-10" />}
          title="No expenses recorded yet"
          description="Add activities with estimated costs to see category breakdowns and daily expense charts."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Pie Chart */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Expenses by Category</h4>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={CATEGORY_COLORS[entry.categoryKey] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Total Cost']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{
                      color: isDark ? '#f1f5f9' : '#0f172a',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      color: isDark ? '#94a3b8' : '#64748b',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Daily Costs Bar Chart */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Expenses per Day</h4>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Day Total']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{
                      color: isDark ? '#f1f5f9' : '#0f172a',
                    }}
                  />
                  <Bar dataKey="total" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
