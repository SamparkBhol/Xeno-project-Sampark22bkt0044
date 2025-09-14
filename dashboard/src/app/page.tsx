'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react'; // Import authentication hooks
import { redirect } from 'next/navigation'; // Import redirect function
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ShoppingCart, DollarSign, BarChart3, LogOut, ChevronDown } from 'lucide-react';

// --- Data Type Definitions (Unchanged) ---
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

// =================================================================
// NEW: User Button and Logout Component
// =================================================================
const UserButton = () => {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);

    if (!session?.user) return null;

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-2 rounded-full transition-colors hover:bg-slate-200"
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
                        className="absolute top-14 right-0 w-48 rounded-lg shadow-2xl border bg-white border-slate-200 z-10"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors"
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
// Reusable UI Components from your original code (Unchanged)
// =================================================================

const StatCard = ({ title, value, icon, format = "number" }: { title: string, value: number, icon: React.ReactNode, format?: "number" | "currency" }) => {
    const formattedValue = format === "currency" ? `$${value.toFixed(2)}` : value.toLocaleString();
    return (
        <motion.div 
            className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-violet-100 transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-500">{title}</h3>
                <div className="bg-violet-100 text-violet-600 p-2 rounded-lg">
                    {icon}
                </div>
            </div>
            <p className="text-4xl font-bold text-gray-800 mt-2">{formattedValue}</p>
        </motion.div>
    );
};

const MainChart = ({ data }: { data: ChartData[] }) => (
    <motion.div 
        className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200 h-[28rem]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
    >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Trends</h3>
        <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/><stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" angle={-20} textAnchor="end" height={50} />
                <YAxis yAxisId="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                <Legend verticalAlign="top" height={36}/>
                <Area yAxisId="left" type="monotone" dataKey="Revenue" stroke="#8884d8" fill="url(#colorRevenue)" />
                <Area yAxisId="right" type="monotone" dataKey="Customers" stroke="#82ca9d" fill="url(#colorCustomers)" />
            </AreaChart>
        </ResponsiveContainer>
    </motion.div>
);

const TopProductsChart = ({ data }: { data: TopProduct[] }) => (
    <motion.div 
        className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200 h-[28rem]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
    >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Products by Revenue</h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis type="number" stroke="#666" />
                <YAxis type="category" width={100} dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} cursor={{fill: 'rgba(238, 237, 254, 0.6)'}} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                <Bar dataKey="revenue" fill="#8884d8" barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    </motion.div>
);

const TopCustomersTable = ({ data }: { data: TopCustomer[] }) => (
  <motion.div 
    className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
  >
    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Customers by Spend</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((customer, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">${customer.totalSpend.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

// --- We move your entire dashboard logic into a new component ---
// --- to keep it clean and separate from the auth logic.    ---
const DashboardContent = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      const now = new Date();
      let startDate = '2024-01-01'; // Default for "All Time"
      const endDate = now.toISOString().split('T')[0];

      if (dateRange === '7d') {
          startDate = new Date(new Date().setDate(now.getDate() - 7)).toISOString().split('T')[0];
      } else if (dateRange === '30d') {
          startDate = new Date(new Date().setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
      }
      
      try {
        const [statsRes, ordersRes, newCustomersRes, topCustomersRes, topProductsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch(`/api/orders-by-date?startDate=${startDate}&endDate=${endDate}`),
          fetch(`/api/new-customers-by-date?startDate=${startDate}&endDate=${endDate}`),
          fetch('/api/top-customers'),
          fetch('/api/top-products'),
        ]);
        if (!statsRes.ok || !ordersRes.ok || !newCustomersRes.ok || !topCustomersRes.ok || !topProductsRes.ok) throw new Error('Failed to fetch dashboard data');
        
        const statsData: Omit<Stats, 'avgOrderValue'> = await statsRes.json();
        const ordersData: { [key: string]: number } = await ordersRes.json();
        const newCustomersData: { [key: string]: number } = await newCustomersRes.json();
        const topCustomersData: TopCustomer[] = await topCustomersRes.json();
        const topProductsData: TopProduct[] = await topProductsRes.json();

        setStats({ ...statsData, avgOrderValue: statsData.totalOrders > 0 ? statsData.totalRevenue / statsData.totalOrders : 0 });
        setTopCustomers(topCustomersData);
        setTopProducts(topProductsData);

        const combinedData: { [key: string]: { Revenue: number, Customers: number } } = {};
        Object.entries(ordersData).forEach(([date, revenue]) => {
            if (!combinedData[date]) combinedData[date] = { Revenue: 0, Customers: 0 };
            combinedData[date].Revenue = revenue;
        });
        Object.entries(newCustomersData).forEach(([date, newCustomers]) => {
            if (!combinedData[date]) combinedData[date] = { Revenue: 0, Customers: 0 };
            combinedData[date].Customers = newCustomers;
        });

        const formattedChartData = Object.entries(combinedData)
            .map(([date, values]) => ({ date, ...values }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setChartData(formattedChartData);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, [dateRange]);

  if (loading && !stats) { // Initial loading state
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-xl font-semibold text-gray-500">Loading Dashboard...</div>
      </main>
    );
  }

  const DateFilter = () => (
    <div className="flex items-center space-x-2">
        {['7d', '30d', 'all'].map(range => (
            <button key={range} onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range ? 'bg-violet-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-violet-50 border'}`}>
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
        ))}
    </div>
  );

  return (
    <main className="bg-slate-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Shopify Insights</h1>
            <p className="text-lg text-gray-600 mt-1">An overview of your store&rsquo;s performance.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
             <DateFilter />
             <UserButton /> {/* ADD THE USER BUTTON HERE */}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Revenue" value={stats?.totalRevenue || 0} icon={<DollarSign size={24} />} format="currency" />
          <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={<ShoppingCart size={24} />} />
          <StatCard title="Total Customers" value={stats?.totalCustomers || 0} icon={<Users size={24} />} />
          <StatCard title="Avg. Order Value" value={stats?.avgOrderValue || 0} icon={<BarChart3 size={24} />} format="currency" />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            <MainChart data={chartData} />
            <TopProductsChart data={topProducts} />
        </div>

        <TopCustomersTable data={topCustomers} />
        
      </div>
    </main>
  );
}


// --- Main Dashboard Page Component ---
// This now handles ONLY the authentication logic
export default function DashboardPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // If the session status is determined and the user is not authenticated, redirect to login.
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  // While the session is being verified, show a loading screen.
  if (status === 'loading') {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-xl font-semibold text-gray-500">Verifying Session...</div>
      </main>
    );
  }

  // If the user is authenticated, we render the full DashboardContent component.
  if (status === 'authenticated') {
    return <DashboardContent />;
  }

  // This is a fallback case, e.g., while the redirect is happening.
  return null;
}