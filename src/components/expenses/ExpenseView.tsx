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
      <section className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-medium tracking-wider uppercase text-[#6E6E73] mb-2 flex items-center gap-2">
              <span>Finance & Treasury</span>
              <span className="text-[#D1D1D6]">•</span>
              <span className="text-emerald-600 font-semibold">Earnings & Revenue</span>
              <span className="text-[#D1D1D6]">•</span>
              <span>Operational Burn</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold text-black tracking-tight">
              Money Tracker & Treasury.
            </h1>
            <p className="text-[#6E6E73] text-sm mt-2 max-w-xl">
              Track enterprise revenue, client earnings, operational burn, and net cash flow with real-time treasury analytics in direct zero-approval mode.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-black font-medium text-xs tracking-wide transition-all"
            >
              <Download size={14} className="text-[#6E6E73]" />
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
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs tracking-wide transition-all"
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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white font-medium text-xs tracking-wide transition-all shadow-sm"
            >
              <Plus size={15} />
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>

        {/* 4-Card Financial Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {/* Card 1: Total Inflow (Earnings) */}
          <div className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-emerald-700 block font-semibold">Total Inflow (Earnings)</span>
              <TrendingUp size={15} className="text-emerald-600" />
            </div>
            <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-emerald-700 meta-number">
              +₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#6E6E73] mt-1 block font-medium">
              Across {earningsList.length} revenue records
            </span>
          </div>

          {/* Card 2: Total Outflow (Expenses) */}
          <div className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-[#6E6E73] block font-medium">Total Outflow (Expenses)</span>
              <TrendingDown size={15} className="text-[#6E6E73]" />
            </div>
            <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-black meta-number">
              -₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#6E6E73] mt-1 block font-medium">
              Across {expensesList.length} operational records
            </span>
          </div>

          {/* Card 3: Net Cash Position */}
          <div className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-[#6E6E73] block font-medium">Net Cash Position</span>
              <span
                className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-medium ${
                  netCashFlow >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <div
              className={`text-2xl lg:text-3xl font-semibold tracking-tight meta-number ${
                netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {netCashFlow >= 0 ? '+' : ''}₹{netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#6E6E73] mt-1 block font-medium">
              Lifetime Inflow vs Outflow delta
            </span>
          </div>

          {/* Card 4: Current Month Cash Flow */}
          <div className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-[#6E6E73]">Current Month Net</span>
              <span className="meta-number text-[11px] text-[#6E6E73]">
                {currentMonthStr}
              </span>
            </div>
            <div
              className={`text-2xl lg:text-3xl font-semibold tracking-tight meta-number ${
                currentMonthNet >= 0 ? 'text-emerald-700' : 'text-black'
              }`}
            >
              {currentMonthNet >= 0 ? '+' : ''}₹{currentMonthNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#6E6E73] mt-1 block truncate font-medium">
              +₹{currentMonthEarnings.toLocaleString('en-IN')} in · -₹{currentMonthSpend.toLocaleString('en-IN')} out
            </span>
          </div>
        </div>

        {/* Dual Revenue & Burn Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Revenue Distribution */}
          <div className="p-6 rounded-3xl bg-[#F5F5F7] border border-[#E5E5E7]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <TrendingUp size={14} /> Top Revenue Streams (Inflow)
              </span>
              <span className="text-[11px] text-[#6E6E73]">
                {earningsCategoryBreakdown.length} active sources
              </span>
            </div>

            {earningsCategoryBreakdown.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#6E6E73] bg-white rounded-2xl border border-[#E5E5E7]">
                No revenue entries recorded yet. Click "+ Record Earning" above.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {earningsCategoryBreakdown.slice(0, 6).map(item => (
                  <div key={item.category} className="p-3 rounded-2xl bg-white border border-[#E5E5E7]">
                    <span className="text-[10px] text-[#6E6E73] uppercase font-medium block truncate">{item.category}</span>
                    <span className="text-xs font-semibold text-emerald-700 meta-number block mt-1">
                      +₹{item.total.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#6E6E73] block mt-0.5">{item.percentage}% of inflow</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Burn Distribution */}
          <div className="p-6 rounded-3xl bg-[#F5F5F7] border border-[#E5E5E7]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-black flex items-center gap-1.5">
                <TrendingDown size={14} /> Operational Burn (Outflow)
              </span>
              <span className="text-[11px] text-[#6E6E73]">
                {expenseCategoryBreakdown.length} active cost centers
              </span>
            </div>

            {expenseCategoryBreakdown.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#6E6E73] bg-white rounded-2xl border border-[#E5E5E7]">
                No expense entries recorded yet. Click "+ Add Expense" above.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {expenseCategoryBreakdown.slice(0, 6).map(item => (
                  <div key={item.category} className="p-3 rounded-2xl bg-white border border-[#E5E5E7]">
                    <span className="text-[10px] text-[#6E6E73] uppercase font-medium block truncate">{item.category}</span>
                    <span className="text-xs font-semibold text-black meta-number block mt-1">
                      ₹{item.total.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#6E6E73] block mt-0.5">{item.percentage}% of burn</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filter & Flow Navigation Strip */}
      <section className="space-y-4">
        {/* Apple Segmented Flow Switcher Control */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
          <div className="inline-flex p-1 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] gap-1">
            <button
              onClick={() => { sound.click(); setFlowTab('all'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                flowTab === 'all'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              All Flows ({expenses.length})
            </button>
            <button
              onClick={() => { sound.click(); setFlowTab('earnings'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                flowTab === 'earnings'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <TrendingUp size={13} />
              <span>Earnings ({earningsList.length})</span>
            </button>
            <button
              onClick={() => { sound.click(); setFlowTab('expenses'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                flowTab === 'expenses'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <TrendingDown size={13} />
              <span>Expenses ({expensesList.length})</span>
            </button>
          </div>

          <div className="text-xs text-[#6E6E73]">
            Displaying {filteredTransactions.length} of {expenses.length} records
          </div>
        </div>

        {/* Detailed Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search client, vendor, note..."
              className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-black text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-black text-xs px-4 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
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
            className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-black text-xs px-4 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
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
              className="px-4 py-2.5 rounded-full border border-[#E5E5E7] bg-white hover:border-black text-[#6E6E73] hover:text-black text-xs transition-all font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Ledger Table (Apple Minimal Surface) */}
      <section className="rounded-3xl border border-[#E5E5E7] bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73] uppercase font-medium tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Flow & Date</th>
                <th className="py-3.5 px-4">Client / Payee</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Logged By</th>
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4 text-center">Invoice/Doc</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E7]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-[#6E6E73]">
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const submitter = users.find(u => u.id === tx.submittedBy);
                  const isEarning = tx.type === 'earning';

                  return (
                    <tr key={tx.id} className="hover:bg-[#F5F5F7]/70 transition-colors">
                      {/* Flow Type & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isEarning ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] uppercase font-semibold">
                              <TrendingUp size={11} /> Earning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] text-black text-[10px] uppercase font-semibold">
                              <TrendingDown size={11} /> Expense
                            </span>
                          )}
                          <span className="meta-number text-[#6E6E73] text-[11px]">{tx.date}</span>
                        </div>
                      </td>

                      {/* Client / Payee & Description */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-black tracking-tight flex items-center gap-1.5">
                          <span>{tx.vendor}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-[#F5F5F7] text-[#6E6E73]">
                            {isEarning ? 'Payer' : 'Payee'}
                          </span>
                        </div>
                        {tx.description && (
                          <div className="text-[11px] text-[#6E6E73] truncate max-w-xs mt-0.5">
                            {tx.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          isEarning
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-500/20'
                            : 'bg-[#F5F5F7] text-black border border-[#E5E5E7]'
                        }`}>
                          {tx.category}
                        </span>
                      </td>

                      {/* Logged By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {submitter ? (
                            <PatchAvatar
                              user={submitter}
                              size="sm"
                              showCallsign={false}
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#6E6E73]">
                              ?
                            </div>
                          )}
                          <span className="text-black font-medium">{submitter?.name || 'Unknown'}</span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 text-[#6E6E73] whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>

                      {/* Amount */}
                      <td className={`py-3.5 px-4 text-right meta-number font-semibold text-sm whitespace-nowrap ${
                        isEarning ? 'text-emerald-700' : 'text-black'
                      }`}>
                        {isEarning ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Receipt / Invoice */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {tx.receiptUrl ? (
                          <button
                            onClick={() => setPreviewReceipt({ url: tx.receiptUrl!, name: tx.receiptName || (isEarning ? 'Invoice' : 'Receipt'), isInvoice: isEarning })}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                              isEarning
                                ? 'border border-emerald-500/30 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                                : 'border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-black'
                            }`}
                            title={isEarning ? 'Preview invoice' : 'Preview receipt'}
                          >
                            <Receipt size={11} />
                            <span>{isEarning ? 'Invoice' : 'Receipt'}</span>
                          </button>
                        ) : (
                          <span className="text-[#A1A1A6] text-[10px] uppercase">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-black text-[10px] uppercase font-semibold">
                            <CheckCircle2 size={10} /> Cleared
                          </span>
                        )}
                        {tx.status === 'reimbursed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] uppercase font-semibold">
                            <Check size={10} /> Settled
                          </span>
                        )}
                        {tx.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] uppercase font-semibold">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                        {tx.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] uppercase font-semibold">
                            <XCircle size={10} /> Void
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {tx.status === 'approved' && !isEarning && (
                            <button
                              onClick={() => setApprovalModal({ expense: tx, action: 'reimburse' })}
                              className="px-2.5 py-1 rounded-full border border-emerald-500/40 hover:bg-emerald-50 text-emerald-800 text-[10px] uppercase font-semibold"
                              title="Mark as reimbursed/settled"
                            >
                              Settle
                            </button>
                          )}

                          <button
                            onClick={() => deleteExpense(tx.id)}
                            className="p-1.5 rounded-full hover:bg-red-50 text-[#6E6E73] hover:text-red-600 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 size={13} />
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

      {/* RECORD TRANSACTION MODAL (Apple Card Sheet) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E7] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div className="flex items-center gap-2.5">
                {formType === 'earning' ? (
                  <TrendingUp size={18} className="text-emerald-700" />
                ) : (
                  <TrendingDown size={18} className="text-black" />
                )}
                <h3 className="text-base font-serif font-semibold text-black">
                  {formType === 'earning' ? 'Record Company Earning' : 'Record Operational Expense'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F5F5F7] text-[#6E6E73] hover:text-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Apple Segmented Type Selector */}
            <div className="inline-flex w-full p-1 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] gap-1">
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  setFormType('earning');
                  setCategory('Client Retainer');
                  setPaymentMethod('Bank Wire');
                }}
                className={`flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  formType === 'earning'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[#6E6E73] hover:text-black'
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
                className={`flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  formType === 'expense'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                <TrendingDown size={14} />
                <span>- Expense (Outflow)</span>
              </button>
            </div>

            <form onSubmit={handleAddTransactionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black text-sm px-3.5 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all meta-number"
                  />
                </div>

                <div>
                  <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black text-sm px-3.5 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
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
                <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
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
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black text-sm px-3.5 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black text-sm px-3.5 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all meta-number"
                  />
                </div>

                <div>
                  <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
                    Payment Channel *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black text-sm px-3.5 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
                  Logged By
                </label>
                <select
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black text-sm px-3.5 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
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
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black text-xs px-3.5 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              {/* Document Upload Zone */}
              <div>
                <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
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
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                    isDragging
                      ? 'border-black bg-[#EBEBED]'
                      : 'border-[#E5E5E7] hover:border-black/30 bg-[#F5F5F7]'
                  }`}
                >
                  {isUploadingReceipt ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#6E6E73]">
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent" />
                      <span>Uploading to Supabase Storage...</span>
                    </div>
                  ) : receiptName ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-black">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="font-medium truncate max-w-xs">{receiptName}</span>
                      <span className="text-[10px] text-[#6E6E73]">Ready</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud size={22} className="mx-auto text-[#6E6E73]" />
                      <span className="text-xs text-black font-medium block">
                        Drag document here or click to browse
                      </span>
                      <span className="text-[10px] text-[#6E6E73] block">
                        Auto-indexes to Central File Repo under "{formType === 'earning' ? 'Earnings' : 'Expenses'}"
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] text-black text-xs hover:border-black transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingReceipt}
                  className={`px-5 py-2.5 rounded-full font-medium text-xs transition-all shadow-sm ${
                    formType === 'earning'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-black hover:bg-neutral-800 text-white'
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E7] rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div className="flex items-center gap-2">
                <Receipt size={17} className="text-[#6E6E73]" />
                <h3 className="text-sm font-semibold text-black truncate max-w-md">
                  {previewReceipt.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="p-1 rounded-full hover:bg-[#F5F5F7] text-[#6E6E73] hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-[#E5E5E7] p-3 bg-[#F5F5F7] flex items-center justify-center min-h-[300px]">
              {previewReceipt.url.endsWith('.pdf') ? (
                <div className="text-center p-8 space-y-3">
                  <FileText size={40} className="mx-auto text-[#6E6E73]" />
                  <p className="text-xs font-semibold text-black">PDF Document Preview</p>
                  <a
                    href={previewReceipt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-xs text-white hover:bg-neutral-800 font-medium"
                  >
                    <ExternalLink size={12} /> Open in new tab
                  </a>
                </div>
              ) : (
                <img
                  src={previewReceipt.url}
                  alt={previewReceipt.name}
                  className="max-h-[500px] w-auto object-contain rounded-xl"
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
                className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Download size={13} /> Download Document
              </a>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL / SETTLEMENT MODAL */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E7] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <h3 className="text-sm font-serif font-semibold text-black">
                {approvalModal.action === 'approve'
                  ? 'Authorize Transaction'
                  : approvalModal.action === 'reject'
                  ? 'Void Transaction'
                  : 'Confirm Settlement'}
              </h3>
              <button
                onClick={() => setApprovalModal(null)}
                className="p-1 rounded-full hover:bg-[#F5F5F7] text-[#6E6E73] hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E5E5E7]">
                <span className="text-[#6E6E73]">Entity:</span>
                <span className="text-black font-semibold">{approvalModal.expense.vendor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5E5E7]">
                <span className="text-[#6E6E73]">Amount:</span>
                <span className="text-black font-semibold meta-number">₹{approvalModal.expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5E5E7]">
                <span className="text-[#6E6E73]">Category:</span>
                <span className="text-black">{approvalModal.expense.category}</span>
              </div>
            </div>

            <div>
              <label className="micro-label text-[#6E6E73] block mb-1.5 font-medium">
                Audit Settlement Note
              </label>
              <input
                type="text"
                placeholder="Optional settlement reference..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black text-xs px-3.5 py-2.5 focus:outline-none focus:border-black focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2 rounded-full border border-[#E5E5E7] text-black text-xs hover:border-black font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalConfirm}
                className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white font-medium text-xs shadow-sm"
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
