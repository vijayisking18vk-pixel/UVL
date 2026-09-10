import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Expense, ExpenseCategory, ExpenseStatus, PaymentMethod } from '../../types';
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
  AlertCircle,
  ExternalLink,
  Trash2,
  Check,
  X,
  Eye,
  CreditCard,
  Building2,
  TrendingUp,
  PieChart
} from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = [
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
  'Corporate Card',
  'Bank Wire',
  'UPI',
  'Personal Card',
  'Cash',
  'Reimbursement'
];

const MONTHLY_BUDGET = 500000; // ₹5,00,000 monthly budget

export const ExpenseView: React.FC = () => {
  const {
    expenses,
    addExpense,
    updateExpenseStatus,
    deleteExpense,
    currentUser,
    users,
    isVijayrajkumar
  } = useWorkspace();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<{ url: string; name: string } | null>(null);
  const [approvalModal, setApprovalModal] = useState<{ expense: Expense; action: 'approve' | 'reject' | 'reimburse' } | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [category, setCategory] = useState<ExpenseCategory>('Software');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Corporate Card');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [submittedBy, setSubmittedBy] = useState(currentUser.id);

  // Receipt Upload State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Financial Calculations
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
  const currentMonthSpend = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const approvedCount = expenses.filter(e => e.status === 'approved').length;

  const budgetUsagePercent = Math.min(100, Math.round((currentMonthSpend / MONTHLY_BUDGET) * 100));

  // Spend by Category Breakdown
  const categoryBreakdown = CATEGORIES.map(cat => {
    const total = expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      category: cat,
      total,
      percentage: totalSpend > 0 ? Math.round((total / totalSpend) * 100) : 0
    };
  }).sort((a, b) => b.total - a.total);

  // Filtered Expense Rows
  const filteredExpenses = expenses.filter(e => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && e.status !== selectedStatus) return false;
    if (selectedUser !== 'all' && e.submittedBy !== selectedUser) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchVendor = e.vendor.toLowerCase().includes(q);
      const matchDesc = e.description.toLowerCase().includes(q);
      if (!matchVendor && !matchDesc) return false;
    }
    return true;
  });

  // Handle Drag & Drop Receipt
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
      const uploadPath = `receipts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { url } = await uploadToStorage(file, uploadPath, file.type);
      setReceiptUrl(url);
    } catch (err) {
      console.error('Receipt upload to Supabase storage failed:', err);
      // Local fallback blob preview
      const localBlobUrl = URL.createObjectURL(file);
      setReceiptUrl(localBlobUrl);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    if (!vendor.trim()) {
      alert('Please provide a vendor or payee name.');
      return;
    }

    await addExpense({
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
      'Expense ID',
      'Date',
      'Vendor/Payee',
      'Category',
      'Amount',
      'Currency',
      'Payment Method',
      'Submitted By',
      'Status',
      'Receipt Attached',
      'Description',
      'Approved By',
      'Approved At',
      'Approver Comment'
    ];

    const rows = filteredExpenses.map(e => {
      const uploader = users.find(u => u.id === e.submittedBy)?.name || e.submittedBy;
      const approver = users.find(u => u.id === e.approvedBy)?.name || e.approvedBy || 'N/A';
      return [
        `"${e.id}"`,
        `"${e.date}"`,
        `"${e.vendor.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        e.amount.toFixed(2),
        `"${e.currency}"`,
        `"${e.paymentMethod}"`,
        `"${uploader}"`,
        `"${e.status.toUpperCase()}"`,
        `"${e.receiptUrl ? 'YES' : 'NO'}"`,
        `"${e.description.replace(/"/g, '""')}"`,
        `"${approver}"`,
        `"${e.approvedAt || 'N/A'}"`,
        `"${(e.approverComment || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `uvl-expense-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header & Metric Strip */}
      <section className="border-b border-white/20 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>finance & capital</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">expense ledger</span>
              <span>/</span>
              <span>audit trail</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              Expense tracker & audit.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Track operational burn, upload receipts directly to cloud storage, execute direct zero-approval ledger entries, and export verified records.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#A1A1AA] hover:border-white text-white font-semibold text-xs tracking-wide transition-all uppercase"
            >
              <Download size={14} className="text-[#A1A1AA]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs tracking-wide transition-all uppercase"
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* 4-Card Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-4 border border-white/20 bg-black">
            <span className="micro-label text-white/50 block mb-1">Total Lifetime Spend</span>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white meta-number">
              ₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-white/40 mt-1 block">Across {expenses.length} ledger records</span>
          </div>

          <div className="p-4 border border-white/20 bg-black">
            <div className="flex items-center justify-between mb-1">
              <span className="micro-label text-white/50">Current Month Burn</span>
              <span className="meta-number text-[10px] text-[#A1A1AA]">BUDGET: ₹{MONTHLY_BUDGET.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white meta-number">
              ₹{currentMonthSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {/* Visual Budget Gauge */}
            <div className="w-full bg-white/10 h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  budgetUsagePercent > 90 ? 'bg-red-500' : 'bg-[#A1A1AA]'
                }`}
                style={{ width: `${budgetUsagePercent}%` }}
              />
            </div>
          </div>

          <div className="p-4 border border-white/20 bg-black">
            <span className="micro-label text-white/50 block mb-1">Direct Approved</span>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white meta-number">
              {approvedCount}
            </div>
            <span className="text-[11px] text-white/40 mt-1 block">Cleared with zero admin approval</span>
          </div>

          <div className="p-4 border border-white/20 bg-black">
            <span className="micro-label text-white/50 block mb-1">Settled & Reimbursed</span>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-emerald-400 meta-number">
              {expenses.filter(e => e.status === 'reimbursed').length}
            </div>
            <span className="text-[11px] text-white/40 mt-1 block">Disbursed / Settled</span>
          </div>
        </div>

        {/* Category Distribution Micro-Strip */}
        <div className="mt-6 p-4 border border-white/10 bg-black">
          <div className="flex items-center justify-between mb-3">
            <span className="micro-label text-white/60">Category Spend Distribution</span>
            <span className="text-[11px] text-white/40 font-mono">Real-time telemetry</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categoryBreakdown.map(item => (
              <div key={item.category} className="p-2.5 border border-white/10 bg-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-white/50 uppercase block truncate">{item.category}</span>
                  <span className="text-sm font-bold text-white meta-number block mt-1">
                    ₹{item.total.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#A1A1AA] font-mono">
                  <span>{item.percentage}%</span>
                  <div className="w-10 bg-white/10 h-1 overflow-hidden">
                    <div className="bg-[#A1A1AA] h-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendor, description, payee..."
              className="w-full bg-black border border-white/20 focus:border-[#A1A1AA] text-white text-xs pl-9 pr-4 py-2 focus:outline-none transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black border border-white/20 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-black border border-white/20 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="reimbursed">Reimbursed</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Team Member Filter */}
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-black border border-white/20 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Operators</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense Records Table */}
        <div className="border border-white/20 bg-black overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/20 bg-white/5 font-mono text-[10px] text-white/50 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vendor / Payee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-white/40 font-mono">
                    No expense entries matched the active filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => {
                  const submitter = users.find(u => u.id === expense.submittedBy);

                  return (
                    <tr key={expense.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 meta-number text-white/70 whitespace-nowrap">
                        {expense.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="font-bold">{expense.vendor}</div>
                        {expense.description && (
                          <div className="text-[11px] text-white/50 font-normal truncate max-w-xs">
                            {expense.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 border border-white/20 text-[10px] uppercase tracking-wider text-white">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {submitter && (
                          <div className="flex items-center gap-2">
                            <PatchAvatar user={submitter} size="sm" />
                            <span className="text-white/80">{submitter.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white/70">
                        {expense.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right meta-number font-bold text-white text-sm whitespace-nowrap">
                        ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {expense.receiptUrl ? (
                          <button
                            onClick={() => setPreviewReceipt({ url: expense.receiptUrl!, name: expense.receiptName || 'Receipt' })}
                            className="inline-flex items-center gap-1 px-2 py-1 border border-[#A1A1AA] hover:bg-[#A1A1AA] hover:text-black text-white text-[10px] transition-colors"
                            title="Preview receipt"
                          >
                            <Receipt size={11} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-white/30 text-[10px] uppercase font-mono">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {expense.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-yellow-500/40 text-yellow-400 text-[10px] uppercase">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                        {expense.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-white text-white bg-white/10 text-[10px] uppercase font-bold">
                            <CheckCircle2 size={10} /> Approved
                          </span>
                        )}
                        {expense.status === 'reimbursed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-500/40 text-emerald-400 text-[10px] uppercase font-bold">
                            <Check size={10} /> Reimbursed
                          </span>
                        )}
                        {expense.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-red-500/40 text-red-400 text-[10px] uppercase">
                            <XCircle size={10} /> Rejected
                          </span>
                        )}
                        {expense.approverComment && (
                          <div className="text-[10px] text-white/40 mt-0.5 italic max-w-xs truncate">
                            Note: {expense.approverComment}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isVijayrajkumar && expense.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setApprovalModal({ expense, action: 'approve' })}
                                className="p-1 border border-white/40 hover:border-white text-white hover:bg-white hover:text-black transition-colors"
                                title="Approve expense"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setApprovalModal({ expense, action: 'reject' })}
                                className="p-1 border border-white/40 hover:border-red-500 text-white/70 hover:text-red-400 transition-colors"
                                title="Reject expense"
                              >
                                <X size={12} />
                              </button>
                            </>
                          )}

                          {expense.status === 'approved' && (
                            <button
                              onClick={() => setApprovalModal({ expense, action: 'reimburse' })}
                              className="px-2 py-1 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 text-[10px] uppercase"
                              title="Mark as reimbursed"
                            >
                              Reimburse
                            </button>
                          )}

                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="p-1 border border-transparent hover:border-red-500/50 text-white/40 hover:text-red-400 transition-colors"
                            title="Delete record"
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

      {/* ADD EXPENSE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-white/40 max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <IndianRupee size={18} className="text-[#A1A1AA]" />
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  Record New Expense
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
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
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-black border border-white/30 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="micro-label text-white/70 block mb-1.5">
                  Vendor / Payee *
                </label>
                <input
                  type="text"
                  required
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. AWS, Delta Air Lines, Stripe, Figma"
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
                    Payment Method *
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
                  Assigned Team Member
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
                  Description & Justification
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Business context, purpose, or milestone allocation..."
                  className="w-full bg-black border border-white/30 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              {/* Receipt Upload Zone */}
              <div>
                <label className="micro-label text-white/70 block mb-1.5">
                  Receipt / Invoice Attachment (PDF, JPG, PNG)
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
                        Drag receipt here or click to browse
                      </span>
                      <span className="text-[10px] text-white/40 block font-mono">
                        Auto-indexes to Central File Repo under "Expenses"
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
                  className="px-5 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-bold text-xs uppercase transition-colors"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW LIGHTBOX MODAL */}
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
                <Download size={13} /> Download Receipt
              </a>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL ACTION MODAL */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-black border border-white/40 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <h3 className="text-sm font-bold text-white uppercase">
                {approvalModal.action === 'approve'
                  ? 'Authorize Expense'
                  : approvalModal.action === 'reject'
                  ? 'Reject Expense'
                  : 'Confirm Reimbursement'}
              </h3>
              <button
                onClick={() => setApprovalModal(null)}
                className="text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 border border-white/10 bg-white/5 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-white/50">Vendor:</span>
                <span className="text-white font-bold">{approvalModal.expense.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Amount:</span>
                <span className="text-white font-bold meta-number">₹{approvalModal.expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Category:</span>
                <span className="text-white">{approvalModal.expense.category}</span>
              </div>
            </div>

            <div>
              <label className="micro-label text-white/70 block mb-1.5">
                Audit Note / Comment (Optional)
              </label>
              <textarea
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Reasoning, invoice confirmation, or disbursement reference..."
                className="w-full bg-black border border-white/30 text-white text-xs px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/20">
              <button
                onClick={() => setApprovalModal(null)}
                className="px-3 py-1.5 border border-white/30 text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalConfirm}
                className={`px-4 py-1.5 font-bold text-xs uppercase ${
                  approvalModal.action === 'approve'
                    ? 'bg-white text-black'
                    : approvalModal.action === 'reject'
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-500 text-black'
                }`}
              >
                Confirm {approvalModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
