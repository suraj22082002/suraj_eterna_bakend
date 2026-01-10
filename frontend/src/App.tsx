import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ArrowRightLeft, 
  History, 
  LayoutDashboard, 
  Settings, 
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Search,
  Trash2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type OrderStatus = 'PENDING' | 'ROUTING' | 'BUILDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

interface Order {
  id: string;
  type: 'MARKET' | 'LIMIT' | 'SNIPER';
  inputToken: string;
  outputToken: string;
  amount: number;
  status: OrderStatus;
  txHash?: string;
  executionPrice?: number;
  limitPrice?: number;
  createdAt: string;
}

const App = () => {
  const [activeTab, setActiveTab] = useState<'trade' | 'history'>('trade');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    inputToken: string;
    outputToken: string;
    amount: string;
    type: 'MARKET' | 'LIMIT' | 'SNIPER';
    limitPrice: string;
  }>({
    inputToken: 'SOL',
    outputToken: 'USDC',
    amount: '',
    type: 'MARKET',
    limitPrice: ''
  });

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/history');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/orders/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          limitPrice: formData.type !== 'MARKET' ? parseFloat(formData.limitPrice) : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
        setActiveTab('history');
      } else {
        alert(data.error || 'Execution failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      fetchOrders();
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const configs: Record<OrderStatus, { icon: any, color: string }> = {
      PENDING: { icon: Clock, color: 'text-yellow-500 bg-yellow-500/10' },
      ROUTING: { icon: Activity, color: 'text-blue-400 bg-blue-400/10' },
      BUILDING: { icon: Settings, color: 'text-purple-400 bg-purple-400/10' },
      SUBMITTED: { icon: Zap, color: 'text-orange-400 bg-orange-400/10' },
      CONFIRMED: { icon: CheckCircle2, color: 'text-green-400 bg-green-400/10' },
      FAILED: { icon: XCircle, color: 'text-red-400 bg-red-400/10' },
      CANCELLED: { icon: AlertCircle, color: 'text-gray-400 bg-gray-400/10' }
    };
    const { icon: Icon, color } = configs[status];
    return (
      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium w-fit", color)}>
        <Icon size={12} className={status === 'ROUTING' || status === 'BUILDING' ? 'animate-pulse' : ''} />
        {status}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#edeff2] font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-16 border-r border-white/5 bg-[#0d0d0e] flex flex-col items-center py-8 gap-8">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Zap className="text-white" fill="currentColor" size={24} />
        </div>
        <div className="flex flex-col gap-6 flex-1">
          <button onClick={() => setActiveTab('trade')} className={cn("p-3 rounded-xl transition-all", activeTab === 'trade' ? "bg-white/5 text-blue-400" : "text-gray-500 hover:text-gray-300")}>
            <LayoutDashboard size={24} />
          </button>
          <button onClick={() => setActiveTab('history')} className={cn("p-3 rounded-xl transition-all", activeTab === 'history' ? "bg-white/5 text-blue-400" : "text-gray-500 hover:text-gray-300")}>
            <History size={24} />
          </button>
        </div>
        <button className="p-3 text-gray-500 hover:text-gray-300">
          <Settings size={24} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="pl-16 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">ETERNA <span className="text-blue-500">TERMINAL</span></h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Mainnet Connected</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-sm font-medium text-gray-400">Wallet</span>
                <span className="text-sm font-mono font-bold text-white">4xK9...2vPq</span>
             </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'trade' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Trading Form */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <section className="bg-[#0d0d0e] border border-white/5 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold">Swap Tokens</h2>
                    <Zap size={18} className="text-blue-500" />
                  </div>

                  <form onSubmit={handleExecute} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Type</label>
                      <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-xl">
                        {(['MARKET', 'LIMIT', 'SNIPER'] as const).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: t })}
                            className={cn(
                              "py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest",
                              formData.type === t ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                        <div className="flex justify-between mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">You Pay</label>
                          <span className="text-xs text-gray-500">Balance: 12.45 SOL</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            className="bg-transparent text-2xl font-bold w-full focus:outline-none"
                            required
                          />
                          <div className="flex items-center gap-2 bg-[#1a1a1c] px-3 py-1.5 rounded-xl border border-white/10">
                             <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold">S</div>
                             <span className="font-bold text-sm">SOL</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center -my-6 relative z-10">
                         <div className="bg-[#1a1a1c] p-2 rounded-xl border border-white/10 text-blue-400 shadow-xl">
                            <ArrowRightLeft size={16} />
                         </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">You Receive</label>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="text"
                            value={formData.amount ? (parseFloat(formData.amount) * 148.5).toFixed(2) : '0.00'}
                            disabled
                            className="bg-transparent text-2xl font-bold w-full text-gray-400"
                          />
                          <div className="flex items-center gap-2 bg-[#1a1a1c] px-3 py-1.5 rounded-xl border border-white/10">
                             <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">$</div>
                             <span className="font-bold text-sm">USDC</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {formData.type !== 'MARKET' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {formData.type === 'LIMIT' ? 'Minimum Output Amount' : 'Snipe Target Amount'}
                        </label>
                        <input
                          type="number"
                          value={formData.limitPrice}
                          onChange={e => setFormData({ ...formData, limitPrice: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-xl p-3 w-full font-bold focus:outline-none focus:border-blue-500/50"
                          placeholder="150.00"
                          required
                        />
                      </div>
                    )}

                    <button
                      disabled={loading}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl",
                        loading ? "bg-gray-800 text-gray-500" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                      )}
                    >
                      {loading ? 'Processing...' : formData.type === 'SNIPER' ? 'Initialize Sniper' : 'Execute Order'}
                      {!loading && <Zap size={18} fill="currentColor" />}
                    </button>
                  </form>
                </section>

                <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                   <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 h-fit">
                      <AlertCircle size={20} />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-blue-400 mb-1">Sniper Mode Active</h4>
                      <p className="text-xs text-blue-400/70 leading-relaxed">
                        Sniper orders execute immediately once the best DEX quote meets or exceeds your target.
                      </p>
                   </div>
                </div>
              </div>

              {/* Live Activity & Quotes */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0d0d0e] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                          <TrendingUp size={24} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Raydium Price</p>
                          <p className="text-xl font-bold">$149.32</p>
                       </div>
                    </div>
                    <div className="bg-[#0d0d0e] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                          <Activity size={24} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Meteora Price</p>
                          <p className="text-xl font-bold">$148.85</p>
                       </div>
                    </div>
                 </div>

                 <section className="bg-[#0d0d0e] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                       <h3 className="font-bold flex items-center gap-2">
                          <Activity size={18} className="text-blue-500" />
                          Real-time Order Monitor
                       </h3>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Auto-Refresh On</span>
                       </div>
                    </div>
                    <div className="flex-1 overflow-auto max-h-[500px]">
                       <table className="w-full text-left">
                          <thead className="bg-white/[0.02] sticky top-0">
                             <tr>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase">ID</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase">Asset</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase">Amount</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase">Type</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase">Status</th>
                                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase text-right">Action</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {orders.length === 0 ? (
                                <tr>
                                   <td colSpan={6} className="p-12 text-center text-gray-500 italic text-sm">
                                      No recent activity detected
                                   </td>
                                </tr>
                             ) : orders.map(order => (
                                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                   <td className="p-4 font-mono text-xs text-gray-400">{order.id.slice(0, 8)}...</td>
                                   <td className="p-4 font-bold text-sm">{order.inputToken} → {order.outputToken}</td>
                                   <td className="p-4 font-mono text-sm">{order.amount}</td>
                                   <td className="p-4">
                                      <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                        order.type === 'SNIPER' ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                                      )}>
                                        {order.type}
                                      </span>
                                   </td>
                                   <td className="p-4">
                                      <StatusBadge status={order.status} />
                                   </td>
                                   <td className="p-4 text-right">
                                      {order.status === 'PENDING' && (
                                         <button onClick={() => cancelOrder(order.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                         </button>
                                      )}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </section>
              </div>
            </div>
          ) : (
            <div className="bg-[#0d0d0e] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <History className="text-blue-500" /> 
                  Full Transaction History
                </h2>
                <div className="relative">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                   <input 
                    type="text" 
                    placeholder="Search by ID or token..." 
                    className="bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                   />
                </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/[0.02]">
                       <tr>
                          <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                          <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID</th>
                          <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                          <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Asset Pair</th>
                          <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                          <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Result</th>
                          <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">TX Hash</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {orders.map(order => (
                          <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                             <td className="p-6 text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleString()}
                             </td>
                             <td className="p-6 font-mono text-xs text-blue-400">
                                {order.id}
                             </td>
                             <td className="p-6">
                                <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded tracking-widest uppercase">
                                   {order.type}
                                </span>
                             </td>
                             <td className="p-6 font-bold">
                                {order.inputToken} <ArrowRightLeft size={12} className="inline mx-2 text-gray-600" /> {order.outputToken}
                             </td>
                             <td className="p-6 font-mono text-sm">
                                {order.amount.toFixed(4)}
                             </td>
                             <td className="p-6">
                                <StatusBadge status={order.status} />
                             </td>
                             <td className="p-6 text-right font-mono text-xs text-gray-500">
                                {order.txHash ? (
                                   <a href="#" className="text-blue-500 hover:underline">{order.txHash.slice(0, 12)}...</a>
                                ) : '—'}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
