'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ShoppingCart, DollarSign, BarChart3, Award, Moon, Sun, Terminal, Filter, X, ChevronDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

// --- Data Type Definitions ---
interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  abandonedCarts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
}
interface ChartData {
  date: string;
  Revenue: number;
  "New Customers": number;
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
interface CategoryData {
  name: string;
  value: number;
}

// --- Theme Context for Dark Mode ---
const ThemeContext = React.createContext<{ isDark: boolean; toggleTheme: () => void }>({ isDark: false, toggleTheme: () => {} });
const useTheme = () => React.useContext(ThemeContext);

// =================================================================
// Reusable UI Components
// =================================================================
const StatCard = ({ title, value, icon, format = "number", trendValue }: { title: string; value: number; icon: ReactNode; format?: "number" | "currency"; trendValue?: number; }) => {
    const formattedValue = format === "currency" ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value.toLocaleString();
    const { isDark } = useTheme();
    const trend = trendValue === undefined || trendValue === null ? "stable" : trendValue > 0 ? "up" : trendValue < 0 ? "down" : "stable";
    const getTrendIcon = () => { switch (trend) { case "up": return <ArrowUpRight className="w-4 h-4" />; case "down": return <ArrowDownRight className="w-4 h-4" />; default: return <Minus className="w-4 h-4" />; } };
    const getTrendColor = () => { switch (trend) { case "up": return "text-emerald-500"; case "down": return "text-red-500"; default: return isDark ? "text-slate-400" : "text-slate-500"; } };
    return (
        <motion.div className="group relative" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 15 }} whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}>
            <div className={`absolute inset-0 backdrop-blur-sm border rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 ${isDark ? "bg-gradient-to-br from-slate-800 to-slate-900/80 border-slate-700/50" : "bg-gradient-to-br from-white to-slate-50/80 border-white/20"}`} />
            <div className="relative p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>{title}</h3>
                        {trendValue !== undefined && trendValue !== null && (
                            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                                {getTrendIcon()}
                                <span className="text-xs font-bold">{trendValue > 0 ? "+" : ""}{trendValue?.toFixed(1)}% vs prev period</span>
                            </div>
                        )}
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">{icon}</div>
                </div>
                <p className={`text-3xl lg:text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{formattedValue}</p>
            </div>
        </motion.div>
    );
};

const MainChart = ({ data }: { data: ChartData[] }) => {
    const { isDark } = useTheme();
    return (
        <motion.div className="relative" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className={`absolute inset-0 rounded-3xl shadow-2xl ${isDark ? "bg-slate-800/50 border border-slate-700" : "bg-white/70 border border-white/20"}`} />
            <div className="relative p-6 h-[28rem]">
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Performance Trends</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient><linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#475569" : "#e2e8f0"} />
                        <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} />
                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(5px)", border: `1px solid ${isDark ? '#475569' : '#ddd'}`, borderRadius: '0.5rem', color: isDark ? '#fff' : '#000' }} />
                        <Legend wrapperStyle={{color: isDark ? '#fff' : '#000'}} />
                        <Area yAxisId="left" type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" />
                        <Area yAxisId="right" type="monotone" dataKey="New Customers" stroke="#10b981" strokeWidth={2} fill="url(#colorCustomers)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
};

const TopProductsChart = ({ data }: { data: TopProduct[] }) => {
    const { isDark } = useTheme();
    return (
        <motion.div className="relative" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <div className={`absolute inset-0 rounded-3xl shadow-2xl ${isDark ? "bg-slate-800/50 border border-slate-700" : "bg-white/70 border border-white/20"}`} />
            <div className="relative p-6 h-[28rem]">
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Top 5 Products</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#475569" : "#e2e8f0"} />
                        <XAxis type="number" stroke={isDark ? "#94a3b8" : "#64748b"} />
                        <YAxis type="category" width={100} dataKey="name" stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} cursor={{fill: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(238, 237, 254, 0.6)'}} contentStyle={{ backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(5px)", border: `1px solid ${isDark ? '#475569' : '#ddd'}`, borderRadius: '0.5rem', color: isDark ? '#fff' : '#000' }} />
                        <Bar dataKey="revenue" fill="#8884d8" barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

const TopCustomersTable = ({ data }: { data: TopCustomer[] }) => {
    const { isDark } = useTheme();
    return (
      <motion.div className="relative" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
         <div className={`absolute inset-0 rounded-3xl shadow-2xl ${isDark ? "bg-slate-800/50 border border-slate-700" : "bg-white/70 border border-white/20"}`} />
          <div className="relative p-6">
              <h3 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Top 5 Customers</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className={isDark ? "bg-slate-700/50" : "bg-gray-50"}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {data.map((customer, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">{customer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-100 text-right font-semibold">${customer.totalSpend.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
      </motion.div>
    );
};

const CategoryPieChart = ({ data }: { data: CategoryData[] }) => {
    const { isDark } = useTheme();
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return (
        <motion.div className="relative" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
            <div className={`absolute inset-0 rounded-3xl shadow-2xl ${isDark ? "bg-slate-800/50 border border-slate-700" : "bg-white/70 border border-white/20"}`} />
            <div className="relative p-6 h-[28rem]">
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Revenue by Category</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}>
                            {data.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} contentStyle={{ backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(5px)", border: `1px solid ${isDark ? '#475569' : '#ddd'}`, borderRadius: '0.5rem', color: isDark ? '#fff' : '#000' }} />
                        <Legend wrapperStyle={{color: isDark ? '#fff' : '#000'}}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
};

const TerminalInterface = ({ stats, topCustomers, topProducts }: { stats: Stats | null; topCustomers: TopCustomer[]; topProducts: TopProduct[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [output, setOutput] = useState<string[]>([]);
    const { isDark } = useTheme();

    const commands = {
        help: () => ["Available commands:", "• stats - Show key metrics", "• customers - Top 5 customers", "• products - Top 5 products", "• clear - Clear terminal"],
        stats: () => stats ? [
            `Total Revenue: $${stats.totalRevenue.toLocaleString()}`,
            `Total Orders: ${stats.totalOrders.toLocaleString()}`,
            `Total Customers: ${stats.totalCustomers.toLocaleString()}`,
            `Avg Order Value: $${stats.avgOrderValue.toFixed(2)}`,
            `Revenue Growth (vs prev period): ${stats.revenueGrowth.toFixed(1)}%`,
        ] : ["Stats not available."],
        customers: () => ["Top Customers:", ...topCustomers.map((c, i) => `${i + 1}. ${c.name} - $${c.totalSpend.toLocaleString()}`)],
        products: () => ["Top Products:", ...topProducts.map((p, i) => `${i + 1}. ${p.name} - $${p.revenue.toLocaleString()}`)],
        clear: () => { setOutput([]); return []; },
    };

    const executeCommand = (cmd: string) => {
        const trimmed = cmd.trim().toLowerCase();
        const result = commands[trimmed as keyof typeof commands]?.() || [`Command not found: ${cmd}`];
        setOutput(prev => [...prev, `$ ${cmd}`, ...result, ""]);
        setInput("");
    };
    
    return (
        <>
            <motion.button onClick={() => setIsOpen(true)} className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl backdrop-blur-sm border transition-all z-40 ${isDark ? "bg-slate-800/90 border-slate-700 text-green-400 hover:bg-slate-700/90" : "bg-white/90 border-white/20 text-slate-700 hover:bg-slate-50/90"}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
                <Terminal className="w-6 h-6" />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)}>
                        <motion.div className={`w-full max-w-4xl h-96 rounded-2xl shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900/95 border-slate-700" : "bg-white/95 border-white/20"}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                            <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50/50"}`}>
                                <h3 className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Analytics Terminal</h3>
                                <button onClick={() => setIsOpen(false)} aria-label="Close terminal" className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}><X className="w-4 h-4" /></button>
                            </div>
                            <div className={`flex-1 p-4 font-mono text-sm overflow-y-auto h-[calc(100%-120px)] ${isDark ? "bg-slate-900 text-green-400" : "bg-white text-slate-800"}`}>
                                <div className="space-y-1">{output.length === 0 ? "Welcome! Type 'help' for commands." : output.map((line, i) => <div key={i}>{line}</div>)}</div>
                            </div>
                            <div className={`p-4 border-t ${isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50/50"}`}>
                                <div className="flex items-center space-x-2">
                                    <span className={`font-mono ${isDark ? "text-yellow-400" : "text-blue-600"}`}>$</span>
                                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeCommand(input)} className={`w-full bg-transparent outline-none font-mono ${isDark ? "text-green-400" : "text-slate-800"}`} placeholder="Type a command..." autoFocus />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const BackgroundAnimation = () => (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-white dark:bg-slate-900">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000"></div>
    </div>
);


// --- Main Dashboard Page Component ---
export default function DashboardPage() {
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");

  const toggleTheme = () => setIsDark(!isDark);

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      const now = new Date();
      let startDate = "2024-01-01";
      const endDate = now.toISOString().split("T")[0];

      if (dateRange === "7d") {
        startDate = new Date(new Date().setDate(now.getDate() - 7)).toISOString().split("T")[0];
      } else if (dateRange === "30d") {
        startDate = new Date(new Date().setMonth(now.getMonth() - 1)).toISOString().split("T")[0];
      }

      try {
        const apiEndpoints = [
          "/api/stats",
          `/api/orders-by-date?startDate=${startDate}&endDate=${endDate}`,
          `/api/new-customers-by-date?startDate=${startDate}&endDate=${endDate}`,
          "/api/top-customers",
          "/api/top-products",
          "/api/category-revenue",
          "/api/abandoned-carts",
        ];

        const results = await Promise.allSettled(apiEndpoints.map(url => fetch(url)));

        const getJson = async (result: PromiseSettledResult<Response>, endpoint: string) => {
            if (result.status === 'fulfilled' && result.value.ok) {
                return result.value.json();
            }
            if (result.status === 'rejected') {
                console.error(`API fetch failed for ${endpoint}:`, result.reason);
            } else if (result.status === 'fulfilled' && !result.value.ok) {
                 if (result.value.status !== 404) {
                    console.error(`API request failed for ${endpoint} with status:`, result.value.status);
                }
            }
            return null;
        };

        const [statsData, ordersData, newCustomersData, topCustomersData, topProductsData, categoryData, abandonedCartsData] = 
            await Promise.all(results.map((result, i) => getJson(result, apiEndpoints[i])));

        if (statsData) {
            const calculateGrowth = (current: number, previous: number) => {
                if(previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            const allTime = statsData.allTime || { revenue: 0, orders: 0, customers: 0 };
            const current = statsData.current || { revenue: 0, orders: 0, customers: 0 };
            const previous = statsData.previous || { revenue: 0, orders: 0, customers: 0 };

            const statsWithGrowth: Stats = {
                totalRevenue: allTime.revenue,
                totalOrders: allTime.orders,
                totalCustomers: allTime.customers,
                avgOrderValue: allTime.orders > 0 ? allTime.revenue / allTime.orders : 0,
                abandonedCarts: abandonedCartsData?.count || 0,
                revenueGrowth: calculateGrowth(current.revenue, previous.revenue),
                ordersGrowth: calculateGrowth(current.orders, previous.orders),
                customersGrowth: calculateGrowth(current.customers, previous.customers)
            };
            setStats(statsWithGrowth);
        }
        
        setTopCustomers(topCustomersData || []);
        setTopProducts(topProductsData || []);
        setCategoryData(categoryData || []);

        const combinedData: { [key: string]: { Revenue: number; "New Customers": number } } = {};
        if (ordersData) {
            Object.entries(ordersData).forEach(([date, revenue]) => { if (!combinedData[date]) combinedData[date] = { Revenue: 0, "New Customers": 0 }; combinedData[date].Revenue = revenue as number; });
        }
        if (newCustomersData) {
            Object.entries(newCustomersData).forEach(([date, newCustomers]) => { if (!combinedData[date]) combinedData[date] = { Revenue: 0, "New Customers": 0 }; combinedData[date]["New Customers"] = newCustomers as number; });
        }

        const formattedChartData = Object.entries(combinedData).map(([date, values]) => ({ date, ...values })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setChartData(formattedChartData);

      } catch (error) {
        console.error("Error in fetchAllData:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, [dateRange]);

  if (loading && !stats) {
    return (
      <main className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <div className={`text-xl font-semibold ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>Loading Dashboard...</div>
      </main>
    );
  }

  const DateFilter = () => (
    <motion.div className={`flex items-center space-x-1 backdrop-blur-sm rounded-2xl p-1 shadow-xl border ${isDark ? "bg-slate-800/80 border-slate-700/50" : "bg-white/80 border-white/20"}`} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {[{ key: "7d", label: "7 Days" }, { key: "30d", label: "30 Days" }, { key: "all", label: "All Time" }].map((range, i) => (
            <motion.button key={range.key} onClick={() => setDateRange(range.key)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${dateRange === range.key ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105" : isDark ? "text-slate-300 hover:bg-slate-700 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"}`} whileHover={{ scale: dateRange === range.key ? 1.05 : 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                {range.label}
            </motion.button>
        ))}
    </motion.div>
  );

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <main className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-500 ${isDark ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
        <BackgroundAnimation />
        <div className="relative max-w-7xl mx-auto space-y-8">
          <motion.header className="flex flex-col sm:flex-row justify-between items-start sm:items-center" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Advanced Analytics</h1>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <motion.button onClick={toggleTheme} aria-label="Toggle dark mode" className={`p-3 rounded-xl transition-all duration-300 ${ isDark ? "bg-slate-800/80 border border-slate-700 text-yellow-400 hover:bg-slate-700/80" : "bg-white/80 border border-white/20 text-slate-700 hover:bg-slate-50/80" } backdrop-blur-sm shadow-lg`} whileHover={{ scale: 1.05, rotate: 180 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, rotate: -180 }} animate={{ opacity: 1, rotate: 0 }} transition={{ delay: 0.5 }}>
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.button>
              <DateFilter />
            </div>
          </motion.header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard title="Total Revenue" value={stats?.totalRevenue || 0} icon={<DollarSign size={24} />} format="currency" trendValue={stats?.revenueGrowth} />
            <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={<ShoppingCart size={24} />} trendValue={stats?.ordersGrowth} />
            <StatCard title="Total Customers" value={stats?.totalCustomers || 0} icon={<Users size={24} />} trendValue={stats?.customersGrowth} />
            <StatCard title="Avg. Order Value" value={stats?.avgOrderValue || 0} icon={<BarChart3 size={24} />} format="currency" />
             <StatCard title="Abandoned Carts" value={stats?.abandonedCarts || 0} icon={<ShoppingCart size={24} />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <MainChart data={chartData} />
            <TopProductsChart data={topProducts} />
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
             <CategoryPieChart data={categoryData} />
             <TopCustomersTable data={topCustomers} />
          </div>

          <TerminalInterface stats={stats} topCustomers={topCustomers} topProducts={topProducts} />
        </div>
      </main>
    </ThemeContext.Provider>
  );
}

