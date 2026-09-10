import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Expense,
  ExpenseStatus,
  PaymentMethod,
  MoneyTransactionType
} from '../../types';
import { uploadToStorage } from '../../lib/supabase';
import { sound } from '../../utils/sound';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  IndianRupee,
  UploadCloud,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Receipt,
  FileText,
  ExternalLink,
  Trash2,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  DollarSign
} from 'lucide-react';

const EARNING_CATEGORIES = [
  'Client Retainer',
  'Pilot Project',
  'SaaS Subscription',
  'Government Grant',
  'Consulting',
  'Angel / SAFE',
  'Product Sales',
  'Licensing',
  'Misc Inflow'
];

const EXPENSE_CATEGORIES = [
  'Software',
  'Travel',
  'Legal',
  'Marketing',
  'Payroll',
  'Hardware',
  'Office',
  'Misc'
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Bank Wire',
  'UPI',
  'Corporate Card',
  'Personal Card',
  'Cheque / Draft',
  'Cash',
  'Reimbursement'
];

const MONTHLY_BUDGET = 500000; // ₹5,00,000 monthly operational benchmark

export const ExpenseView: React.FC = () => {
  const {
    expenses,
    addExpense,
    updateExpenseStatus,
    deleteExpense,
    currentUser,
    users
  } = useWorkspace();

  // Navigation Filter: All vs Inflow (Earnings) vs Outflow (Expenses)
  const [flowTab, setFlowTab] = useState<'all' | 'earnings' | 'expenses'>('all');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formType, setFormType] = useState<MoneyTransactionType>('earning');
  const [previewReceipt, setPreviewReceipt] = useState<{ url: string; name: string; isInvoice?: boolean } | null>(null);
  const [approvalModal, setApprovalModal] = useState<{ expense: Expense; action: 'approve' | 'reject' | 'reimburse' } | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [currency] = useState('INR');
  const [category, setCategory] = useState<string>('Client Retainer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Wire');
  const [vendor, setVendor] = useState(''); // Client / Source for earnings, Vendor for expenses
  const [description, setDescription] = useState('');
  const [submittedBy, setSubmittedBy] = useState(currentUser.id);

  // Document Upload State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Financial Calculations
  const earningsList = expenses.filter(e => e.type === 'earning');
  const expensesList = expenses.filter(e => e.type !== 'earning');

  const totalEarnings = earningsList.reduce((sum, e) => sum + e.amount, 0);
  const totalSpend = expensesList.reduce((sum, e) => sum + e.amount, 0);
  const netCashFlow = totalEarnings - totalSpend;

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthEarnings = earningsList
    .filter(e => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + e.amount, 0);
  const currentMonthSpend = expensesList
    .filter(e => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + e.amount, 0);
  const currentMonthNet = currentMonthEarnings - currentMonthSpend;

  const approvedCount = expenses.filter(e => e.status === 'approved' || e.status === 'reimbursed').length;

  // Category Breakdown for Earnings
  const earningsCategoryBreakdown = EARNING_CATEGORIES.map(cat => {
    const total = earningsList
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      category: cat,
      total,
      percentage: totalEarnings > 0 ? Math.round((total / totalEarnings) * 100) : 0
    };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

  // Category Breakdown for Operational Burn
  const expenseCategoryBreakdown = EXPENSE_CATEGORIES.map(cat => {
    const total = expensesList
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      category: cat,
      total,
      percentage: totalSpend > 0 ? Math.round((total / totalSpend) * 100) : 0
    };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

  // Filtered Rows
  const filteredTransactions = expenses.filter(e => {
    // Flow Tab Filter
    if (flowTab === 'earnings' && e.type !== 'earning') return false;
    if (flowTab === 'expenses' && e.type === 'earning') return false;

    // Standard Filters
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && e.status !== selectedStatus) return false;
    if (selectedUser !== 'all' && e.submittedBy !== selectedUser) return false;

    // Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchVendor = e.vendor.toLowerCase().includes(q);
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      if (!matchVendor && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Handle Drag & Drop Document
  const handleReceiptDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setReceiptFile(file);
    setReceiptName(file.name);
    setIsUploadingReceipt(true);
    try {
      const folder = formType === 'earning' ? 'invoices' : 'receipts';
      const uploadPath = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { url } = await uploadToStorage(file, uploadPath, file.type);
      setReceiptUrl(url);
    } catch (err) {
      console.error('File upload to Supabase storage failed:', err);
      const localBlobUrl = URL.createObjectURL(file);
      setReceiptUrl(localBlobUrl);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!vendor.trim()) {
      alert(formType === 'earning' ? 'Please provide a client or payer name.' : 'Please provide a vendor or payee name.');
      return;
    }

    await addExpense({
      type: formType,
      amount: numAmount,
      currency,
      category,
      date,
      paymentMethod,
      vendor: vendor.trim(),
      description: description.trim(),
      submittedBy,
      receiptUrl: receiptUrl || undefined,
      receiptName: receiptName || undefined,
      status: 'approved',
      approvedBy: currentUser.id,
      approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });

    // Reset Form
    setAmount('');
    setVendor('');
    setDescription('');
    setReceiptFile(null);
    setReceiptUrl('');
    setReceiptName('');
    setIsAddOpen(false);
  };

  const handleApprovalConfirm = () => {
    if (!approvalModal) return;
    const { expense, action } = approvalModal;
    const nextStatus: ExpenseStatus =
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reimbursed';

    updateExpenseStatus(expense.id, nextStatus, approvalComment.trim() || undefined);
    setApprovalModal(null);
    setApprovalComment('');
  };

  // Export to CSV
  const exportToCSV = () => {
    sound.click();
    const headers = [
      'Transaction ID',
      'Flow Type',
      'Date',
      'Client/Vendor',
      'Category',
      'Amount (INR)',
      'Currency',
      'Payment Method',
      'Logged By',
      'Status',
      'Document Attached',
      'Description',
      'Recorded At'
    ];

    const rows = filteredTransactions.map(e => {
      const uploader = users.find(u => u.id === e.submittedBy)?.name || e.submittedBy;
      const typeLabel = e.type === 'earning' ? 'EARNING' : 'EXPENSE';
      return [
        `"${e.id}"`,
        `"${typeLabel}"`,
        `"${e.date}"`,
        `"${e.vendor.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        (e.type === 'earning' ? e.amount : -e.amount).toFixed(2),
        `"${e.currency}"`,
        `"${e.paymentMethod}"`,
        `"${uploader}"`,
        `"${e.status.toUpperCase()}"`,
        `"${e.receiptUrl ? 'YES' : 'NO'}"`,
        `"${e.description.replace(/"/g, '""')}"`,
        `"${e.createdAt || 'N/A'}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `uvl-treasury-money-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header & Primary Actions */}
      <section className="border-b border-white/20 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>finance & treasury</span>
              <span>/</span>
              <span className="text-emerald-400">earnings & revenue</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">operational burn</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              Money tracker & treasury.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Track enterprise revenue, client earnings, operational burn, and net cash flow with real-time treasury analytics in direct zero-approval mode.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 border border-[#A1A1AA] hover:border-white text-white font-semibold text-xs tracking-wide transition-all uppercase"
            >
              <Download size={14} className="text-[#A1A1AA]" />
              <span>Export CSV</span>
            </button>

            {/* Record Earning (Inflow) */}
            <button
              onClick={() => {
                sound.click();
                setFormType('earning');
                setCategory('Client Retainer');
                setPaymentMethod('Bank Wire');
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-emerald-500/80 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 font-bold text-xs tracking-wide transition-all uppercase"
            >
              <TrendingUp size={15} />
              <span>+ Record Earning</span>
            </button>

            {/* Add Expense (Outflow) */}
            <button
              onClick={() => {
                sound.click();
                setFormType('expense');
                setCategory('Software');
                setPaymentMethod('Corporate Card');
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs tracking-wide transition-all uppercase"
            >
              <Plus size={15} />
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>

        {/* 4-Card Financial Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {/* Card 1: Total Inflow (Earnings) */}
          <div className="p-4 border border-emerald-500/30 bg-black relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-emerald-400 block">Total Inflow (Earnings)</span>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-emerald-400 meta-number">
              +₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-white/40 mt-1 block">
              Across {earningsList.length} revenue records
            </span>
          </div>

          {/* Card 2: Total Outflow (Expenses) */}
          <div className="p-4 border border-white/20 bg-black relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-white/50 block">Total Outflow (Expenses)</span>
              <TrendingDown size={14} className="text-white/40" />
            </div>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white meta-number">
              -₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-white/40 mt-1 block">
              Across {expensesList.length} operational records
            </span>
          </div>

          {/* Card 3: Net Cash Position */}
          <div className="p-4 border border-white/20 bg-black">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-white/50 block">Net Cash Position</span>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.5 font-mono font-bold tracking-wider ${
                  netCashFlow >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
              >
                {netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <div
              className={`text-2xl lg:text-3xl font-bold tracking-tight meta-number ${
                netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {netCashFlow >= 0 ? '+' : ''}₹{netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-white/40 mt-1 block">
              Lifetime Inflow vs Outflow delta
            </span>
          </div>

          {/* Card 4: Current Month Cash Flow */}
          <div className="p-4 border border-white/20 bg-black">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-white/50">Current Month Net</span>
              <span className="meta-number text-[10px] text-[#A1A1AA]">
                {currentMonthStr}
              </span>
            </div>
            <div
              className={`text-2xl lg:text-3xl font-bold tracking-tight meta-number ${
                currentMonthNet >= 0 ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {currentMonthNet >= 0 ? '+' : ''}₹{currentMonthNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-white/40 mt-1 block truncate">
              +₹{currentMonthEarnings.toLocaleString('en-IN')} in · -₹{currentMonthSpend.toLocaleString('en-IN')} out
            </span>
          </div>
        </div>

        {/* Dual Revenue & Burn Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {/* Revenue Distribution */}
          <div className="p-4 border border-emerald-500/20 bg-black">
            <div className="flex items-center justify-between mb-3">
              <span className="micro-label text-emerald-400 flex items-center gap-1.5">
                <TrendingUp size={12} /> Top Revenue Streams (Inflow)
              </span>
              <span className="text-[11px] text-white/40 font-mono">
                {earningsCategoryBreakdown.length} active sources
              </span>
            </div>

            {earningsCategoryBreakdown.length === 0 ? (
              <div className="py-4 text-center text-xs text-white/40 font-mono">
                No revenue entries recorded yet. Click "+ Record Earning" above.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {earningsCategoryBreakdown.slice(0, 6).map(item => (
                  <div key={item.category} className="p-2 border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] text-emerald-400/70 uppercase block truncate">{item.category}</span>
                    <span className="text-xs font-bold text-emerald-400 meta-number block mt-1">
                      +₹{item.total.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-white/40 block mt-0.5 font-mono">{item.percentage}% of inflow</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Burn Distribution */}
          <div className="p-4 border border-white/10 bg-black">
            <div className="flex items-center justify-between mb-3">
              <span className="micro-label text-white/60 flex items-center gap-1.5">
                <TrendingDown size={12} /> Operational Burn (Outflow)
              </span>
              <span className="text-[11px] text-white/40 font-mono">
                {expenseCategoryBreakdown.length} active cost centers
              </span>
            </div>

            {expenseCategoryBreakdown.length === 0 ? (
              <div className="py-4 text-center text-xs text-white/40 font-mono">
                No expense entries recorded yet. Click "+ Add Expense" above.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {expenseCategoryBreakdown.slice(0, 6).map(item => (
                  <div key={item.category} className="p-2 border border-white/10 bg-white/5">
                    <span className="text-[10px] text-white/50 uppercase block truncate">{item.category}</span>
                    <span className="text-xs font-bold text-white meta-number block mt-1">
                      ₹{item.total.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-white/40 block mt-0.5 font-mono">{item.percentage}% of burn</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filter & Flow Navigation Strip */}
      <section className="space-y-4">
        {/* Flow Switcher Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { sound.click(); setFlowTab('all'); }}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                flowTab === 'all'
                  ? 'bg-white text-black'
                  : 'border border-white/20 text-white/60 hover:text-white'
              }`}
            >
              All Flows ({expenses.length})
            </button>
            <button
              onClick={() => { sound.click(); setFlowTab('earnings'); }}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                flowTab === 'earnings'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'border border-emerald-500/30 text-emerald-400 hover:border-emerald-500'
              }`}
            >
              <TrendingUp size={13} />
              <span>Earnings ({earningsList.length})</span>
            </button>
            <button
              onClick={() => { sound.click(); setFlowTab('expenses'); }}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                flowTab === 'expenses'
                  ? 'bg-[#A1A1AA] text-black font-bold'
                  : 'border border-white/20 text-white/60 hover:text-white'
              }`}
            >
              <TrendingDown size={13} />
              <span>Expenses ({expensesList.length})</span>
            </button>
          </div>

          <div className="text-xs text-white/50 font-mono">
            Displaying {filteredTransactions.length} of {expenses.length} records
          </div>
        </div>

        {/* Detailed Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search client, vendor, description..."
              className="w-full bg-black border border-white/20 text-white text-xs pl-9 pr-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black border border-white/20 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
          >
            <option value="all">All Categories</option>
            <optgroup label="Revenue & Inflow">
              {EARNING_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="Operational Burn">
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          </select>

          {/* User / Member Filter */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="bg-black border border-white/20 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
          >
            <option value="all">All Team Members</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Reset Filters */}
          {(searchTerm || selectedCategory !== 'all' || selectedUser !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedUser('all');
              }}
              className="px-3 py-2 border border-white/20 hover:border-white text-white/70 hover:text-white text-xs uppercase"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Ledger Table */}
      <section className="border border-white/20 bg-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/20 bg-white/5 text-white/60 uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Flow & Date</th>
                <th className="py-3 px-4">Client / Payee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Logged By</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Invoice/Doc</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-white/40 font-mono">
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const submitter = users.find(u => u.id === tx.submittedBy);
                  const isEarning = tx.type === 'earning';

                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      {/* Flow Type & Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isEarning ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                              <TrendingUp size={11} /> Earning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-white/20 bg-white/5 text-white/70 text-[10px] uppercase font-bold tracking-wider">
                              <TrendingDown size={11} /> Expense
                            </span>
                          )}
                          <span className="meta-number text-white/60 text-[11px]">{tx.date}</span>
                        </div>
                      </td>

                      {/* Client / Payee & Description */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white tracking-tight flex items-center gap-1.5">
                          <span>{tx.vendor}</span>
                          <span className="text-[9px] uppercase px-1 py-0.2 bg-white/10 text-white/50 font-mono">
                            {isEarning ? 'Payer' : 'Payee'}
                          </span>
                        </div>
                        {tx.description && (
                          <div className="text-[11px] text-white/40 truncate max-w-xs mt-0.5">
                            {tx.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 border text-[11px] ${
                          isEarning
                            ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/5'
                            : 'border-white/20 text-white/80 bg-white/5'
                        }`}>
                          {tx.category}
                        </span>
                      </td>

                      {/* Logged By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {submitter ? (
                            <PatchAvatar
                              user={submitter}
                              size="sm"
                              showCallsign={false}
                            />
                          ) : (
                            <div className="w-5 h-5 bg-white/10 flex items-center justify-center text-[10px]">
                              ?
                            </div>
                          )}
                          <span className="text-white/80">{submitter?.name || 'Unknown'}</span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 text-white/70 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>

                      {/* Amount */}
                      <td className={`py-3 px-4 text-right meta-number font-bold text-sm whitespace-nowrap ${
                        isEarning ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {isEarning ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Receipt / Invoice */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {tx.receiptUrl ? (
                          <button
                            onClick={() => setPreviewReceipt({ url: tx.receiptUrl!, name: tx.receiptName || (isEarning ? 'Invoice' : 'Receipt'), isInvoice: isEarning })}
                            className={`inline-flex items-center gap-1 px-2 py-1 border text-[10px] transition-colors ${
                              isEarning
                                ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black'
                                : 'border-[#A1A1AA] hover:bg-[#A1A1AA] hover:text-black text-white'
                            }`}
                            title={isEarning ? 'Preview invoice' : 'Preview receipt'}
                          >
                            <Receipt size={11} />
                            <span>{isEarning ? 'Invoice' : 'Receipt'}</span>
                          </button>
                        ) : (
                          <span className="text-white/30 text-[10px] uppercase font-mono">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-white text-white bg-white/10 text-[10px] uppercase font-bold">
                            <CheckCircle2 size={10} /> Cleared
                          </span>
                        )}
                        {tx.status === 'reimbursed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-500/40 text-emerald-400 text-[10px] uppercase font-bold">
                            <Check size={10} /> Settled
                          </span>
                        )}
                        {tx.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-yellow-500/40 text-yellow-400 text-[10px] uppercase">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                        {tx.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-red-500/40 text-red-400 text-[10px] uppercase">
                            <XCircle size={10} /> Void
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {tx.status === 'approved' && !isEarning && (
                            <button
                              onClick={() => setApprovalModal({ expense: tx, action: 'reimburse' })}
                              className="px-2 py-1 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 text-[10px] uppercase"
                              title="Mark as reimbursed/settled"
                            >
                              Settle
                            </button>
                          )}

                          <button
                            onClick={() => deleteExpense(tx.id)}
                            className="p-1 border border-transparent hover:border-red-500/50 text-white/40 hover:text-red-400 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* RECORD TRANSACTION MODAL (EARNING OR EXPENSE) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-black border border-white/40 max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                {formType === 'earning' ? (
                  <TrendingUp size={16} className="text-emerald-400" />
                ) : (
                  <TrendingDown size={16} className="text-white/60" />
                )}
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {formType === 'earning' ? 'Record Company Earning' : 'Record Operational Expense'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Type Selector Toggle */}
            <div className="grid grid-cols-2 p-1 border border-white/20 bg-white/5 gap-1">
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  setFormType('earning');
                  setCategory('Client Retainer');
                  setPaymentMethod('Bank Wire');
                }}
                className={`py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  formType === 'earning'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <TrendingUp size={14} />
                <span>+ Earning (Inflow)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  setFormType('expense');
                  setCategory('Software');
                  setPaymentMethod('Corporate Card');
                }}
                className={`py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  formType === 'expense'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <TrendingDown size={14} />
                <span>- Expense (Outflow)</span>
              </button>
            </div>

            <form onSubmit={handleAddTransactionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="micro-label text-white/70 block mb-1.5">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black border border-white/30 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#A1A1AA] meta-number"
                  />
                </div>

                <div>
                  <label className="micro-label text-white/70 block mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black border border-white/30 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
                  >
                    {formType === 'earning' ? (
                      EARNING_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    ) : (
                      EXPENSE_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="micro-label text-white/70 block mb-1.5">
                  {formType === 'earning' ? 'Client / Payer / Source *' : 'Vendor / Payee *'}
                </label>
                <input
                  type="text"
                  required
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder={
                    formType === 'earning'
                      ? 'e.g. Acme Corp, Ministry Grant, Enterprise Pilot Partner'
                      : 'e.g. AWS Cloud, WeWork, Stripe, Delta Air Lines'
                  }
                  className="w-full bg-black border border-white/30 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="micro-label text-white/70 block mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black border border-white/30 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#A1A1AA] meta-number"
                  />
                </div>

                <div>
                  <label className="micro-label text-white/70 block mb-1.5">
                    Payment Channel *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-black border border-white/30 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="micro-label text-white/70 block mb-1.5">
                  Logged By
                </label>
                <select
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  className="w-full bg-black border border-white/30 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="micro-label text-white/70 block mb-1.5">
                  Description & Context
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    formType === 'earning'
                      ? 'Contract deliverables, grant milestone, invoice terms...'
                      : 'Business justification, team allocation, budget reference...'
                  }
                  className="w-full bg-black border border-white/30 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              {/* Document Upload Zone */}
              <div>
                <label className="micro-label text-white/70 block mb-1.5">
                  {formType === 'earning' ? 'Invoice / Agreement Attachment (PDF, JPG, PNG)' : 'Receipt / Vendor Invoice (PDF, JPG, PNG)'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleReceiptDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 border border-dashed transition-all cursor-pointer text-center ${
                    isDragging
                      ? 'border-white bg-white/10'
                      : 'border-white/30 hover:border-white bg-white/5'
                  }`}
                >
                  {isUploadingReceipt ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#A1A1AA]">
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent" />
                      <span>Uploading to Supabase Storage...</span>
                    </div>
                  ) : receiptName ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-white">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span className="font-mono truncate max-w-xs">{receiptName}</span>
                      <span className="text-[10px] text-white/40">Ready</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud size={20} className="mx-auto text-white/40" />
                      <span className="text-xs text-white font-medium block">
                        Drag document here or click to browse
                      </span>
                      <span className="text-[10px] text-white/40 block font-mono">
                        Auto-indexes to Central File Repo under "{formType === 'earning' ? 'Earnings' : 'Expenses'}"
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-white/30 text-white text-xs hover:border-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingReceipt}
                  className={`px-5 py-2 font-bold text-xs uppercase transition-colors ${
                    formType === 'earning'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                      : 'bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black'
                  }`}
                >
                  {formType === 'earning'
                    ? `Record Earning (+₹${amount || '0'})`
                    : `Record Expense (-₹${amount || '0'})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black border border-white/40 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-[#A1A1AA]" />
                <h3 className="text-sm font-bold text-white font-mono truncate max-w-md">
                  {previewReceipt.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border border-white/20 p-2 bg-white/5 flex items-center justify-center min-h-[300px]">
              {previewReceipt.url.endsWith('.pdf') ? (
                <div className="text-center p-8 space-y-3">
                  <FileText size={40} className="mx-auto text-white/40" />
                  <p className="text-xs text-white font-mono">PDF Document Preview</p>
                  <a
                    href={previewReceipt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-white text-xs text-white uppercase hover:bg-white hover:text-black"
                  >
                    <ExternalLink size={12} /> Open in new tab
                  </a>
                </div>
              ) : (
                <img
                  src={previewReceipt.url}
                  alt={previewReceipt.name}
                  className="max-h-[500px] w-auto object-contain"
                  style={{ filter: 'none' }}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href={previewReceipt.url}
                target="_blank"
                rel="noreferrer"
                download={previewReceipt.name}
                className="px-4 py-2 bg-[#A1A1AA] text-black font-semibold text-xs uppercase flex items-center gap-1.5"
              >
                <Download size={13} /> Download Document
              </a>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL / SETTLEMENT MODAL */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-black border border-white/40 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <h3 className="text-sm font-bold text-white uppercase">
                {approvalModal.action === 'approve'
                  ? 'Authorize Transaction'
                  : approvalModal.action === 'reject'
                  ? 'Void Transaction'
                  : 'Confirm Settlement / Reimbursement'}
              </h3>
              <button
                onClick={() => setApprovalModal(null)}
                className="text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/50">Entity:</span>
                <span className="text-white font-bold">{approvalModal.expense.vendor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/50">Amount:</span>
                <span className="text-white font-bold meta-number">₹{approvalModal.expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/50">Category:</span>
                <span className="text-white">{approvalModal.expense.category}</span>
              </div>
            </div>

            <div>
              <label className="micro-label text-white/70 block mb-1.5">
                Audit Settlement Note
              </label>
              <input
                type="text"
                placeholder="Optional settlement reference..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="w-full bg-black border border-white/30 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2 border border-white/30 text-white text-xs hover:border-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalConfirm}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
