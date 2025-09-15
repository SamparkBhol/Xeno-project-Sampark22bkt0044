/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, ShoppingCart, DollarSign, BarChart3, LogOut, ChevronDown } from 'lucide-react';

// --- Data Type Definitions ---
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
// BUG FIX: Custom Tooltip to Prevent Rendering Errors
// =================================================================
 
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg">
                <p className="font-bold text-slate-800 mb-2">{label}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.dataKey === 'Revenue' ? '$' : ''}${pld.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// =================================================================
// Authentication Components
// =================================================================
const UserButton = () => {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    if (!session?.user) return null;
    return (
        <div className="relative">
            <motion.button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-2 rounded-full transition-colors hover:bg-slate-100" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">{session.user.name?.charAt(0)}</div>
                <span className="text-sm font-medium text-slate-800">{session.user.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div className="absolute top-14 right-0 w-48 rounded-lg shadow-2xl border bg-white border-slate-200" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center space-x-2 px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors">
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
// Main Dashboard Content (Protected)
// =================================================================
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
            let startDate = '2024-01-01';
            const endDate = now.toISOString().split('T')[0];
            if (dateRange === '7d') startDate = new Date(new Date().setDate(now.getDate() - 7)).toISOString().split('T')[0];
            else if (dateRange === '30d') startDate = new Date(new Date().setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
            
            try {
                const [statsRes, ordersRes, newCustomersRes, topCustomersRes, topProductsRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch(`/api/orders-by-date?startDate=${startDate}&endDate=${endDate}`),
                    fetch(`/api/new-customers-by-date?startDate=${startDate}&endDate=${endDate}`),
                    fetch('/api/top-customers'),
                    fetch('/api/top-products'),
                ]);
                
                if ([statsRes, ordersRes, newCustomersRes, topCustomersRes, topProductsRes].some(res => !res.ok)) {
                    throw new Error('One or more API requests failed');
                }
                
                const statsData = await statsRes.json();
                const ordersData: { [key: string]: number } = await ordersRes.json();
                const newCustomersData: { [key: string]: number } = await newCustomersRes.json();
                const topCustomersData: TopCustomer[] = await topCustomersRes.json();
                const topProductsData: TopProduct[] = await topProductsRes.json();

                // BUG FIX: Safely access properties on the statsData object
                const safeStatsData = statsData.allTime || statsData;
                setStats({ 
                    totalCustomers: safeStatsData.customers ?? safeStatsData.totalCustomers ?? 0,
                    totalOrders: safeStatsData.orders ?? safeStatsData.totalOrders ?? 0,
                    totalRevenue: safeStatsData.revenue ?? safeStatsData.totalRevenue ?? 0,
                    avgOrderValue: (safeStatsData.totalOrders > 0 ? safeStatsData.totalRevenue / safeStatsData.totalOrders : 0) || (safeStatsData.orders > 0 ? safeStatsData.revenue / safeStatsData.orders : 0) || 0
                });

                setTopCustomers(topCustomersData);
                setTopProducts(topProductsData);

                const combinedData: { [key: string]: { Revenue: number, Customers: number } } = {};
                Object.entries(ordersData).forEach(([date, revenue]) => { if (!combinedData[date]) combinedData[date] = { Revenue: 0, Customers: 0 }; combinedData[date].Revenue = revenue; });
                Object.entries(newCustomersData).forEach(([date, newCustomers]) => { if (!combinedData[date]) combinedData[date] = { Revenue: 0, Customers: 0 }; combinedData[date].Customers = newCustomers; });

                const formattedChartData = Object.entries(combinedData).map(([date, values]) => ({ date, ...values })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setChartData(formattedChartData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAllData();
    }, [dateRange]);

    if (loading && !stats) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-slate-100">
                <div className="text-xl font-semibold text-gray-500">Loading Dashboard...</div>
            </main>
        );
    }

    // Your original UI components are preserved below
    const StatCard = ({ title, value, icon, format = "number" }: { title: string, value: number, icon: ReactNode, format?: "number" | "currency" }) => {
        const formattedValue = format === "currency" ? `$${value.toFixed(2)}` : value.toLocaleString();
        return (
            <motion.div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-violet-100 transition-shadow duration-300" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-500">{title}</h3>
                    <div className="bg-violet-100 text-violet-600 p-2 rounded-lg">{icon}</div>
                </div>
                <p className="text-4xl font-bold text-gray-800 mt-2">{formattedValue}</p>
            </motion.div>
        );
    };

    const MainChart = ({ data }: { data: ChartData[] }) => (
        <motion.div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200 h-[28rem]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Trends</h3>
            <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient><linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/><stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" angle={-20} textAnchor="end" height={50} />
                    <YAxis yAxisId="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36}/>
                    <Area yAxisId="left" type="monotone" dataKey="Revenue" stroke="#8884d8" fill="url(#colorRevenue)" />
                    <Area yAxisId="right" type="monotone" dataKey="Customers" stroke="#82ca9d" fill="url(#colorCustomers)" />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );

    const TopProductsChart = ({ data }: { data: TopProduct[] }) => (
        <motion.div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200 h-[28rem]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Products by Revenue</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis type="category" width={100} dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} cursor={{fill: 'rgba(238, 237, 254, 0.6)'}} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    <Bar dataKey="revenue" fill="#8884d8" barSize={20}><LabelList dataKey="name" position="insideRight" fill="#fff" /></Bar>
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );

    const TopCustomersTable = ({ data }: { data: TopCustomer[] }) => (
        <motion.div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
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

    const DateFilter = () => (
        <div className="flex items-center space-x-2">
            {['7d', '30d', 'all'].map(range => (
                <button key={range} onClick={() => setDateRange(range)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range ? 'bg-violet-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-violet-50 border'}`}>
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
                       <UserButton />
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
};

// --- Main Page Component: The Authentication Gatekeeper ---
export default function DashboardPage() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-xl font-semibold text-gray-500">Verifying Session...</div>
      </main>
    );
  }

  if (status === 'authenticated') {
    return <DashboardContent />;
  }
  return null;
}

