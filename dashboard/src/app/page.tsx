/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { type ReactNode, useEffect, useState, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, LabelList, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Users, ShoppingCart, DollarSign, BarChart3, LogOut, ChevronDown, TrendingUp, 
  TrendingDown, AlertTriangle, Download, Filter, Calendar, Eye, EyeOff,
  Package, ShoppingBag, UserCheck, CreditCard, Percent
} from 'lucide-react';

// --- Enhanced Data Type Definitions ---
interface Stats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface ChartData {
  date: string;
  Revenue: number;
  Customers: number;
  Orders: number;
}

interface TopCustomer {
  name: string;
  email: string;
  totalSpend: number;
}

interface TopProduct {
  name: string;
  revenue: number;
}

interface CategoryRevenue {
  name: string;
  value: number;
}

interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

interface PerformanceMetric {
  title: string;
  current: number;
  previous: number;
  format: 'number' | 'currency' | 'percentage';
  icon: ReactNode;
}

// =================================================================
// Enhanced Custom Components
// =================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1" style={{ color: pld.color }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pld.color }}></div>
            <span className="text-sm">
              {`${pld.name}: ${
                pld.dataKey === 'Revenue' || pld.name.includes('Revenue') ? '$' : ''
              }${pld.value?.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 2 
              })}`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TrendIndicator = ({ current, previous, format = 'number' }: { current: number, previous: number, format?: 'number' | 'currency' | 'percentage' }) => {
  const difference = current - previous;
  const percentage = previous > 0 ? ((difference / previous) * 100) : 0;
  const isPositive = difference > 0;
  
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency': return `$${Math.abs(value).toFixed(2)}`;
      case 'percentage': return `${Math.abs(value).toFixed(1)}%`;
      default: return Math.abs(value).toLocaleString();
    }
  };

  if (Math.abs(percentage) < 0.1) {
    return (
      <div className="flex items-center text-gray-500 text-sm">
        <span>No change</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      <span>{formatValue(difference)} ({Math.abs(percentage).toFixed(1)}%)</span>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
);

// =================================================================
// Authentication Components
// =================================================================
const UserButton = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!session?.user) return null;
  
  return (
    <div className="relative">
      <motion.button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center space-x-2 p-2 rounded-full transition-colors hover:bg-slate-100" 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {session.user.name?.charAt(0)}
        </div>
        <span className="text-sm font-medium text-slate-800">{session.user.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-14 right-0 w-48 rounded-lg shadow-2xl border bg-white border-slate-200 z-50" 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
          >
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })} 
              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =================================================================
// Dashboard Alert System
// =================================================================
const AlertCard = ({ alert }: { alert: DashboardAlert }) => {
  const iconColor = {
    warning: 'text-amber-500',
    info: 'text-blue-500',
    success: 'text-green-500'
  }[alert.type];

  const bgColor = {
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200'
  }[alert.type];

  return (
    <motion.div
      className={`p-4 rounded-lg border ${bgColor}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 ${iconColor} mt-0.5`} />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{alert.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
        </div>
      </div>
    </motion.div>
  );
};

// =================================================================
// Enhanced Dashboard Components
// =================================================================
const StatCard = ({ 
  title, 
  value, 
  icon, 
  format = "number", 
  trend, 
  loading = false 
}: { 
  title: string; 
  value: number; 
  icon: ReactNode; 
  format?: "number" | "currency" | "percentage"; 
  trend?: { current: number; previous: number };
  loading?: boolean;
}) => {
  const formattedValue = useMemo(() => {
    if (loading) return "---";
    switch (format) {
      case "currency": return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case "percentage": return `${value.toFixed(1)}%`;
      default: return value.toLocaleString();
    }
  }, [value, format, loading]);

  return (
    <motion.div 
      className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        <div className="bg-violet-100 text-violet-600 p-2 rounded-lg">
          {loading ? <LoadingSpinner /> : icon}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-3xl font-bold text-gray-800">{formattedValue}</p>
        {trend && !loading && (
          <TrendIndicator 
            current={trend.current} 
            previous={trend.previous} 
            format={format} 
          />
        )}
      </div>
    </motion.div>
  );
};

const EnhancedChart = ({ 
  data, 
  title, 
  loading = false 
}: { 
  data: ChartData[]; 
  title: string; 
  loading?: boolean;
}) => (
  <motion.div 
    className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 h-[32rem]" 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      {loading && <LoadingSpinner />}
    </div>
    {!loading && data.length > 0 ? (
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06d6a0" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            angle={-45} 
            textAnchor="end" 
            height={80}
            fontSize={12}
          />
          <YAxis yAxisId="left" stroke="#8b5cf6" />
          <YAxis yAxisId="right" orientation="right" stroke="#06d6a0" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Area yAxisId="left" type="monotone" dataKey="Revenue" stroke="#8b5cf6" fill="url(#colorRevenue)" strokeWidth={2} />
          <Area yAxisId="right" type="monotone" dataKey="Orders" stroke="#f59e0b" fill="url(#colorOrders)" strokeWidth={2} />
          <Area yAxisId="right" type="monotone" dataKey="Customers" stroke="#06d6a0" fill="url(#colorCustomers)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    ) : loading ? (
      <div className="flex items-center justify-center h-80">
        <LoadingSpinner />
      </div>
    ) : (
      <div className="flex items-center justify-center h-80 text-gray-500">
        No data available for the selected period
      </div>
    )}
  </motion.div>
);

const CategoryRevenueChart = ({ 
  data, 
  loading = false 
}: { 
  data: CategoryRevenue[]; 
  loading?: boolean;
}) => {
  const COLORS = ['#8b5cf6', '#06d6a0', '#f59e0b', '#ef4444', '#3b82f6', '#f97316'];

  return (
    <motion.div 
      className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 h-[32rem]" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Revenue by Category</h3>
        {loading && <LoadingSpinner />}
      </div>
      {!loading && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => {
                const { name, value } = props;
                const total = data.reduce((sum, entry) => sum + entry.value, 0);
                const percent = total > 0 ? ((typeof value === 'number' ? value : 0) / total) * 100 : 0;
                return `${name}: ${percent.toFixed(0)}%`;
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      ) : loading ? (
        <div className="flex items-center justify-center h-80">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex items-center justify-center h-80 text-gray-500">
          No category data available
        </div>
      )}
    </motion.div>
  );
};

const TopProductsChart = ({ 
  data, 
  loading = false 
}: { 
  data: TopProduct[]; 
  loading?: boolean;
}) => (
  <motion.div 
    className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 h-[32rem]" 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.5, delay: 0.4 }}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-gray-800">Top 5 Products by Revenue</h3>
      {loading && <LoadingSpinner />}
    </div>
    {!loading && data.length > 0 ? (
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis 
            type="category" 
            width={120} 
            dataKey="name" 
            stroke="#64748b" 
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '0.5rem', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
            <LabelList 
              dataKey="revenue" 
              position="right" 
              formatter={(label: ReactNode) => {
                if (typeof label === 'number') {
                  return `$${label.toFixed(0)}`;
                }
                return label;
              }}
              fill="#64748b"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ) : loading ? (
      <div className="flex items-center justify-center h-80">
        <LoadingSpinner />
      </div>
    ) : (
      <div className="flex items-center justify-center h-80 text-gray-500">
        No product data available
      </div>
    )}
  </motion.div>
);

const TopCustomersTable = ({ 
  data, 
  loading = false 
}: { 
  data: TopCustomer[]; 
  loading?: boolean;
}) => (
  <motion.div 
    className="bg-white p-6 rounded-xl shadow-lg border border-slate-200" 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.5, delay: 0.5 }}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-gray-800">Top 5 Customers by Spend</h3>
      {loading && <LoadingSpinner />}
    </div>
    {!loading ? (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length > 0 ? data.map((customer, index) => (
              <motion.tr 
                key={index} 
                className="hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center w-8 h-8 bg-violet-100 text-violet-600 rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.name || 'Unknown Customer'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.email || 'No email'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">
                  ${customer.totalSpend?.toFixed(2) || '0.00'}
                </td>
              </motion.tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No customer data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="flex items-center justify-center h-40">
        <LoadingSpinner />
      </div>
    )}
  </motion.div>
);

const DateFilter = ({ 
  dateRange, 
  onDateRangeChange 
}: { 
  dateRange: string; 
  onDateRangeChange: (range: string) => void;
}) => (
  <div className="flex items-center space-x-2">
    <Calendar className="w-4 h-4 text-gray-500" />
    {['7d', '30d', '90d', 'all'].map(range => (
      <button 
        key={range} 
        onClick={() => onDateRangeChange(range)} 
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          dateRange === range 
            ? 'bg-violet-600 text-white shadow-md transform scale-105' 
            : 'bg-white text-gray-600 hover:bg-violet-50 border hover:border-violet-200'
        }`}
      >
        {range === '7d' ? 'Last 7 Days' : 
         range === '30d' ? 'Last 30 Days' : 
         range === '90d' ? 'Last 90 Days' : 'All Time'}
      </button>
    ))}
  </div>
);

const ExportButton = ({ onExport }: { onExport: () => void }) => (
  <motion.button
    onClick={onExport}
    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Download className="w-4 h-4" />
    Export Data
  </motion.button>
);

// =================================================================
// Enhanced Main Dashboard Content
// =================================================================
const DashboardContent = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());

  // Calculate derived metrics
  const conversionRate = useMemo(() => {
    if (!stats || stats.totalCustomers === 0) return 0;
    return (stats.totalOrders / stats.totalCustomers) * 100;
  }, [stats]);

  // Generate alerts based on data
  const generateAlerts = (data: any) => {
    const newAlerts: DashboardAlert[] = [];

    if (data.abandonedCarts > 10) {
      newAlerts.push({
        id: 'abandoned-carts',
        type: 'warning',
        title: 'High Abandoned Cart Rate',
        message: `You have ${data.abandonedCarts} abandoned carts. Consider sending recovery emails.`,
        timestamp: new Date()
      });
    }

    if (data.stats?.avgOrderValue && data.stats.avgOrderValue < 50) {
      newAlerts.push({
        id: 'low-aov',
        type: 'info',
        title: 'Low Average Order Value',
        message: 'Consider implementing upselling strategies to increase AOV.',
        timestamp: new Date()
      });
    }

    setAlerts(newAlerts);
  };

  const fetchAllData = async () => {
    setLoading(true);
    const now = new Date();
    let startDate = '2024-01-01';
    const endDate = now.toISOString().split('T')[0];
    
    // Calculate start date based on range
    if (dateRange === '7d') {
      startDate = new Date(new Date().setDate(now.getDate() - 7)).toISOString().split('T')[0];
    } else if (dateRange === '30d') {
      startDate = new Date(new Date().setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
    } else if (dateRange === '90d') {
      startDate = new Date(new Date().setDate(now.getDate() - 90)).toISOString().split('T')[0];
    }
    
    try {
      const [
        statsRes, 
        ordersRes, 
        newCustomersRes, 
        topCustomersRes, 
        topProductsRes,
        categoryRevenueRes,
        abandonedCartsRes
      ] = await Promise.all([
        fetch('/api/stats'),
        fetch(`/api/orders-by-date?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/new-customers-by-date?startDate=${startDate}&endDate=${endDate}`),
        fetch('/api/top-customers'),
        fetch('/api/top-products'),
        fetch('/api/category-revenue'),
        fetch('/api/abandoned-carts'),
      ]);
      
      if ([statsRes, ordersRes, newCustomersRes, topCustomersRes, topProductsRes, categoryRevenueRes, abandonedCartsRes].some(res => !res.ok)) {
        throw new Error('One or more API requests failed');
      }
      
      const [
        statsData,
        ordersData,
        newCustomersData,
        topCustomersData,
        topProductsData,
        categoryRevenueData,
        abandonedCartsData
      ] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        newCustomersRes.json(),
        topCustomersRes.json(),
        topProductsRes.json(),
        categoryRevenueRes.json(),
        abandonedCartsRes.json()
      ]);

      // Process stats data
      const safeStatsData = statsData.allTime || statsData;
      const processedStats = { 
        totalCustomers: safeStatsData.customers ?? safeStatsData.totalCustomers ?? 0,
        totalOrders: safeStatsData.orders ?? safeStatsData.totalOrders ?? 0,
        totalRevenue: safeStatsData.revenue ?? safeStatsData.totalRevenue ?? 0,
        avgOrderValue: (safeStatsData.totalOrders > 0 ? safeStatsData.totalRevenue / safeStatsData.totalOrders : 0) || 
                     (safeStatsData.orders > 0 ? safeStatsData.revenue / safeStatsData.orders : 0) || 0
      };

      setStats(processedStats);
      setTopCustomers(Array.isArray(topCustomersData) ? topCustomersData : []);
      setTopProducts(Array.isArray(topProductsData) ? topProductsData : []);
      setCategoryRevenue(Array.isArray(categoryRevenueData) ? categoryRevenueData : []);
      setAbandonedCarts(abandonedCartsData.count || 0);

      // Process chart data
      const combinedData: { [key: string]: { Revenue: number, Customers: number, Orders: number } } = {};
      
      // Handle different response formats for orders data
      if (Array.isArray(ordersData)) {
        // If it's an array of order objects
        const dailyRevenue = ordersData.reduce((acc: { [key: string]: number }, order: any) => {
          const date = new Date(order.createdAt).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + (order.totalPrice || 0);
          return acc;
        }, {});
        
        const dailyOrderCount = ordersData.reduce((acc: { [key: string]: number }, order: any) => {
          const date = new Date(order.createdAt).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        Object.entries(dailyRevenue).forEach(([date, revenue]) => {
          if (!combinedData[date]) combinedData[date] = { Revenue: 0, Customers: 0, Orders: 0 };
          combinedData[date].Revenue = revenue;
        });

        Object.entries(dailyOrderCount).forEach(([date, orders]) => {
          if (!combinedData[date]) combinedData[date] = { Revenue: 0, Customers: 0, Orders: 0 };
          combinedData[date].Orders = orders;
        });
      } else {
        // If it's an object with date keys
        Object.entries(ordersData as { [key: string]: number }).forEach(([date, revenue]) => {
          if (!combinedData[date]) combinedData[date] = { Revenue: 0, Customers: 0, Orders: 0 };
          combinedData[date].Revenue = revenue;
        });
      }

      Object.entries(newCustomersData).forEach(([date, newCustomers]) => {
        if (!combinedData[date]) combinedData[date] = { Revenue: 0, Customers: 0, Orders: 0 };
        combinedData[date].Customers = typeof newCustomers === 'number' ? newCustomers : Number(newCustomers) || 0;
      });

      const formattedChartData = Object.entries(combinedData)
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setChartData(formattedChartData);

      // Generate alerts
      generateAlerts({
        stats: processedStats,
        abandonedCarts: abandonedCartsData.count || 0
      });

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Set empty states on error
      setStats({ totalCustomers: 0, totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 });
      setTopCustomers([]);
      setTopProducts([]);
      setCategoryRevenue([]);
      setChartData([]);
      setAbandonedCarts(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const handleExportData = () => {
    const exportData = {
      stats,
      chartData,
      topCustomers,
      topProducts,
      categoryRevenue,
      abandonedCarts,
      exportDate: new Date().toISOString(),
      dateRange
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopify-insights-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const toggleWidget = (widgetId: string) => {
    const newHiddenWidgets = new Set(hiddenWidgets);
    if (newHiddenWidgets.has(widgetId)) {
      newHiddenWidgets.delete(widgetId);
    } else {
      newHiddenWidgets.add(widgetId);
    }
    setHiddenWidgets(newHiddenWidgets);
  };

  if (loading && !stats) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LoadingSpinner />
          <p className="text-xl font-semibold text-gray-500 mt-4">Loading Dashboard...</p>
          <p className="text-sm text-gray-400 mt-2">Fetching your business insights</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Shopify Insights
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Complete overview of your store&rsquo;s performance
            </p>
          </motion.div>
          <motion.div 
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <DateFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            <ExportButton onExport={handleExportData} />
            <UserButton />
          </motion.div>
        </header>

        {/* Alerts */}
        {alerts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Insights & Recommendations
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

        {/* Key Metrics */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Key Performance Metrics</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <button
                onClick={() => toggleWidget('metrics')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {hiddenWidgets.has('metrics') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {hiddenWidgets.has('metrics') ? 'Show' : 'Hide'} Metrics
              </button>
            </div>
          </div>
          
          {!hiddenWidgets.has('metrics') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <StatCard 
                title="Total Revenue" 
                value={stats?.totalRevenue || 0} 
                icon={<DollarSign size={24} />} 
                format="currency"
                loading={loading}
              />
              <StatCard 
                title="Total Orders" 
                value={stats?.totalOrders || 0} 
                icon={<ShoppingCart size={24} />}
                loading={loading}
              />
              <StatCard 
                title="Total Customers" 
                value={stats?.totalCustomers || 0} 
                icon={<Users size={24} />}
                loading={loading}
              />
              <StatCard 
                title="Avg. Order Value" 
                value={stats?.avgOrderValue || 0} 
                icon={<BarChart3 size={24} />} 
                format="currency"
                loading={loading}
              />
              <StatCard 
                title="Conversion Rate" 
                value={conversionRate} 
                icon={<Percent size={24} />} 
                format="percentage"
                loading={loading}
              />
              <StatCard 
                title="Abandoned Carts" 
                value={abandonedCarts} 
                icon={<ShoppingBag size={24} />}
                loading={loading}
              />
            </div>
          )}
        </section>

        {/* Performance Trends */}
        {!hiddenWidgets.has('trends') && (
          <EnhancedChart 
            data={chartData} 
            title="Performance Trends Over Time"
            loading={loading}
          />
        )}

        {/* Analytics Grid */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {!hiddenWidgets.has('categories') && (
            <CategoryRevenueChart data={categoryRevenue} loading={loading} />
          )}
          {!hiddenWidgets.has('products') && (
            <TopProductsChart data={topProducts} loading={loading} />
          )}
        </section>

        {/* Top Customers */}
        {!hiddenWidgets.has('customers') && (
          <TopCustomersTable data={topCustomers} loading={loading} />
        )}

        {/* Footer */}
        <motion.footer 
          className="text-center py-8 border-t border-gray-200 bg-white/50 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-gray-600">
            Dashboard last updated: {new Date().toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Data range: {dateRange === '7d' ? 'Last 7 Days' : 
                        dateRange === '30d' ? 'Last 30 Days' : 
                        dateRange === '90d' ? 'Last 90 Days' : 'All Time'}
          </p>
        </motion.footer>
      </div>
    </main>
  );
};

// =================================================================
// Main Page Component: Authentication Gatekeeper
// =================================================================
export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner />
          <p className="text-xl font-semibold text-gray-500 mt-4">Verifying Session...</p>
        </motion.div>
      </main>
    );
  }

  if (status === 'authenticated') {
    return <DashboardContent />;
  }

  return null;
}