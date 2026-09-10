import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Investor,
  InvestorStage,
  InvestorRoundType,
  InvestorInteraction
} from '../../types';
import { uploadToStorage } from '../../lib/supabase';
import { sound } from '../../utils/sound';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  Briefcase,
  TrendingUp,
  IndianRupee,
  Calendar,
  Clock,
  Plus,
  UploadCloud,
  FileText,
  MessageSquare,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  User,
  X,
  Eye,
  Download,
  Phone,
  Mail,
  Building,
  Filter,
  CheckSquare
} from 'lucide-react';

const PIPELINE_STAGES: { id: InvestorStage; label: string; description: string }[] = [
  { id: 'contacted', label: 'Contacted', description: 'Initial outreach & warm intro' },
  { id: 'meeting_scheduled', label: 'Meeting Set', description: 'Partner call or screening scheduled' },
  { id: 'pitched', label: 'Pitched', description: 'Formal deck presented to partnership' },
  { id: 'due_diligence', label: 'Due Diligence', description: 'Data room & technical audit active' },
  { id: 'term_sheet', label: 'Term Sheet', description: 'Negotiating economics & governance' },
  { id: 'committed', label: 'Committed', description: 'Allocation locked & wires pending' },
  { id: 'closed', label: 'Closed / Passed', description: 'Completed or archived leads' }
];

const ROUND_TYPES: InvestorRoundType[] = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'SAFE',
  'Convertible Note'
];

const TARGET_RAISE = 15000000; // ₹1.5 Cr (₹1,50,00,000) target raise

export const InvestorView: React.FC = () => {
  const {
    investors,
    addInvestor,
    updateInvestor,
    updateInvestorStage,
    addInvestorInteraction,
    addInvestorDocument,
    scheduleInvestorFollowUp,
    currentUser,
    users
  } = useWorkspace();

  // Search & Stage Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(investors[0] || null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isScheduleFollowUpOpen, setIsScheduleFollowUpOpen] = useState(false);

  // Form State: Add Investor
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [relationshipOwnerId, setRelationshipOwnerId] = useState(currentUser.id);
  const [stage, setStage] = useState<InvestorStage>('contacted');
  const [dealSize, setDealSize] = useState('2500000');
  const [valuation, setValuation] = useState('50000000');
  const [roundType, setRoundType] = useState<InvestorRoundType>('Seed');
  const [targetCloseDate, setTargetCloseDate] = useState('');
  const [notes, setNotes] = useState('');

  // Form State: Interaction Log
  const [interactionType, setInteractionType] = useState<'Email' | 'Video Call' | 'In-Person' | 'Pitch' | 'Due Diligence'>('Video Call');
  const [interactionDate, setInteractionDate] = useState(new Date().toISOString().split('T')[0]);
  const [interactionSummary, setInteractionSummary] = useState('');

  // Form State: Document Upload
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('application/pdf');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUrl, setDocUrl] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Schedule Follow-up
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );
  const [followUpNote, setFollowUpNote] = useState('');

  // Pipeline Metrics
  const totalCommitted = investors
    .filter(i => i.stage === 'committed' || i.stage === 'closed')
    .reduce((sum, i) => sum + i.dealSize, 0);

  const totalPipelinePotential = investors
    .filter(i => i.stage !== 'closed' && i.stage !== 'passed')
    .reduce((sum, i) => sum + i.dealSize, 0);

  const fundingProgressPercent = Math.min(100, Math.round((totalCommitted / TARGET_RAISE) * 100));

  const filteredInvestors = investors.filter(inv => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        inv.name.toLowerCase().includes(q) ||
        inv.firm.toLowerCase().includes(q) ||
        inv.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Add Investor
  const handleAddInvestorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !firm.trim()) {
      alert('Please enter investor name and firm.');
      return;
    }

    const created = addInvestor({
      name: name.trim(),
      firm: firm.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      relationshipOwnerId,
      stage,
      dealSize: parseFloat(dealSize) || 250000,
      valuation: valuation ? parseFloat(valuation) : undefined,
      roundType,
      targetCloseDate: targetCloseDate || undefined,
      lastInteractionDate: new Date().toISOString().split('T')[0],
      notes: notes.trim()
    });

    setSelectedInvestor(created);
    setIsAddOpen(false);

    // Reset
    setName('');
    setFirm('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setNotes('');
  };

  // Handle Log Interaction
  const handleLogInteractionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !interactionSummary.trim()) return;

    addInvestorInteraction(selectedInvestor.id, {
      date: interactionDate,
      type: interactionType,
      summary: interactionSummary.trim(),
      authorId: currentUser.id
    });

    const updated = investors.find(i => i.id === selectedInvestor.id);
    if (updated) setSelectedInvestor(updated);

    setIsLogInteractionOpen(false);
    setInteractionSummary('');
  };

  // Handle Document Upload
  const handleDocUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || (!docFile && !docUrl)) {
      alert('Please select a file or provide a document name.');
      return;
    }

    let finalUrl = docUrl;
    if (docFile) {
      setIsUploadingDoc(true);
      try {
        const uploadPath = `investors/${Date.now()}-${docFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { url } = await uploadToStorage(docFile, uploadPath, docFile.type);
        finalUrl = url;
      } catch (err) {
        console.error('Storage upload failed:', err);
        finalUrl = URL.createObjectURL(docFile);
      } finally {
        setIsUploadingDoc(false);
      }
    }

    const versionNum = (selectedInvestor.documents?.length || 0) + 1;
    await addInvestorDocument(selectedInvestor.id, {
      name: docName.trim() || docFile?.name || 'Investor Document.pdf',
      url: finalUrl,
      type: docType,
      version: versionNum,
      uploadedBy: currentUser.id
    });

    const updated = investors.find(i => i.id === selectedInvestor.id);
    if (updated) setSelectedInvestor(updated);

    setIsUploadDocOpen(false);
    setDocName('');
    setDocFile(null);
    setDocUrl('');
  };

  // Handle Schedule Follow-up
  const handleScheduleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !followUpDate) return;

    scheduleInvestorFollowUp(selectedInvestor.id, followUpDate, followUpNote.trim() || undefined);

    const updated = investors.find(i => i.id === selectedInvestor.id);
    if (updated) setSelectedInvestor(updated);

    setIsScheduleFollowUpOpen(false);
    setFollowUpNote('');
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Top Header */}
      <section className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span>Capitalization</span>
              <span>•</span>
              <span className="text-black font-semibold">Investor Pipeline</span>
              <span>•</span>
              <span>Fundraising Telemetry</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-black font-normal tracking-tight">
              Institutional investor tracking.
            </h1>
            <p className="text-[#6E6E73] text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Stage pipeline, term sheets, deal size allocations, communication audit trails, and automatic follow-up tasks.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-xs font-medium">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-black shadow-xs font-semibold' : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  viewMode === 'table' ? 'bg-white text-black shadow-xs font-semibold' : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                List
              </button>
            </div>

            <button
              onClick={() => {
                sound.click();
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs tracking-wide transition-all shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Investor Lead</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#6E6E73]">Target Round Size</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#E5E5E7] bg-white text-black font-medium">GOAL</span>
            </div>
            <div className="text-2xl lg:text-3xl font-normal text-black font-serif mt-1">
              ₹{TARGET_RAISE.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-[#6E6E73] mt-1 block">Seed Equity & SAFE</span>
          </div>

          <div className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#6E6E73]">Committed Capital</span>
              <span className="text-xs text-emerald-700 font-semibold">{fundingProgressPercent}%</span>
            </div>
            <div className="text-2xl lg:text-3xl font-normal text-black font-serif mt-1">
              ₹{totalCommitted.toLocaleString('en-IN')}
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full bg-[#E5E5E7] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${fundingProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] shadow-xs">
            <span className="text-xs font-medium text-[#6E6E73] block mb-1">Active Pipeline Value</span>
            <div className="text-2xl lg:text-3xl font-normal text-black font-serif mt-1">
              ₹{totalPipelinePotential.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-[#6E6E73] mt-1 block">
              Across {investors.length} institutions
            </span>
          </div>

          <div className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] shadow-xs">
            <span className="text-xs font-medium text-[#6E6E73] block mb-1">Conversion Velocity</span>
            <div className="text-2xl lg:text-3xl font-normal text-black font-serif mt-1 flex items-center gap-2">
              <span>{Math.round((investors.filter(i => i.stage === 'term_sheet' || i.stage === 'committed').length / (investors.length || 1)) * 100)}%</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium">
                Active
              </span>
            </div>
            <span className="text-xs text-[#6E6E73] mt-1 block">Pitched to Term Sheet ratio</span>
          </div>
        </div>
      </section>

      {/* Main Pipeline Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Center Column: Kanban or Table */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search investor name, venture firm, notes..."
              className="w-full bg-[#F5F5F7] border border-[#E5E5E7] focus:border-black focus:bg-white text-black text-xs pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all"
            />
          </div>

          {viewMode === 'kanban' ? (
            /* KANBAN BOARD */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {PIPELINE_STAGES.map(col => {
                const stageInvestors = filteredInvestors.filter(i => i.stage === col.id);
                const colTotal = stageInvestors.reduce((s, i) => s + i.dealSize, 0);

                return (
                  <div key={col.id} className="border border-[#E5E5E7] bg-[#F5F5F7] rounded-3xl flex flex-col min-h-[380px] shadow-xs overflow-hidden">
                    {/* Stage Header */}
                    <div className="p-4 border-b border-[#E5E5E7] bg-[#F5F5F7] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-black uppercase tracking-wide">{col.label}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#E5E5E7] bg-white text-[#6E6E73] font-medium">
                            {stageInvestors.length}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6E6E73] block mt-1">{col.description}</span>
                      </div>
                      {colTotal > 0 && (
                        <span className="text-xs font-semibold text-black">
                          ₹{colTotal >= 10000000 ? `${(colTotal / 10000000).toFixed(2)}Cr` : colTotal >= 100000 ? `${(colTotal / 100000).toFixed(1)}L` : `${Math.round(colTotal / 1000)}k`}
                        </span>
                      )}
                    </div>

                    {/* Stage Cards */}
                    <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                      {stageInvestors.length === 0 ? (
                        <div className="h-32 border border-dashed border-[#E5E5E7] rounded-2xl flex items-center justify-center text-xs text-[#6E6E73] bg-white/40">
                          No leads in stage
                        </div>
                      ) : (
                        stageInvestors.map(inv => {
                          const isSelected = selectedInvestor?.id === inv.id;
                          const owner = users.find(u => u.id === inv.relationshipOwnerId);

                          return (
                            <div
                              key={inv.id}
                              onClick={() => {
                                sound.click();
                                setSelectedInvestor(inv);
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 bg-white shadow-xs hover:shadow-sm ${
                                isSelected
                                  ? 'border-black ring-1 ring-black'
                                  : 'border-[#E5E5E7] hover:border-black/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-serif text-sm font-normal text-black">
                                    {inv.name}
                                  </h4>
                                  <span className="text-xs text-[#6E6E73] flex items-center gap-1.5 mt-0.5">
                                    <Building size={12} className="text-[#6E6E73]" />
                                    {inv.firm}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-black px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] shrink-0">
                                  ₹{inv.dealSize >= 10000000 ? `${(inv.dealSize / 10000000).toFixed(2)}Cr` : inv.dealSize >= 100000 ? `${(inv.dealSize / 100000).toFixed(1)}L` : `${Math.round(inv.dealSize / 1000)}k`}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-[#6E6E73] pt-2 border-t border-[#E5E5E7]">
                                <span className="uppercase text-[10px] font-semibold">{inv.roundType}</span>
                                {owner && (
                                  <div className="flex items-center gap-1.5" title={`Owner: ${owner.name}`}>
                                    <PatchAvatar user={owner} size="sm" />
                                    <span className="text-xs text-black font-medium">{owner.callsign}</span>
                                  </div>
                                )}
                              </div>

                              {/* Stage advance shortcuts */}
                              <div className="flex items-center justify-between pt-1 text-xs">
                                <span className="text-[#6E6E73] font-mono text-[11px]">
                                  Last: {inv.lastInteractionDate}
                                </span>
                                <div className="flex items-center gap-1">
                                  {col.id !== 'closed' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIdx = PIPELINE_STAGES.findIndex(s => s.id === col.id);
                                        if (currentIdx < PIPELINE_STAGES.length - 1) {
                                          updateInvestorStage(inv.id, PIPELINE_STAGES[currentIdx + 1].id);
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-black text-[11px] font-medium flex items-center gap-1 transition-all"
                                      title="Advance stage"
                                    >
                                      <span>Advance</span>
                                      <ChevronRight size={11} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE LIST VIEW */
            <div className="border border-[#E5E5E7] bg-white rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E7] bg-[#F5F5F7] text-[11px] text-[#6E6E73] uppercase font-semibold">
                    <th className="py-3.5 px-4">Investor & Firm</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4">Round</th>
                    <th className="py-3.5 px-4 text-right">Deal Size</th>
                    <th className="py-3.5 px-4 text-right">Valuation</th>
                    <th className="py-3.5 px-4">Owner</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  {filteredInvestors.map(inv => {
                    const owner = users.find(u => u.id === inv.relationshipOwnerId);
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvestor(inv)}
                        className={`hover:bg-[#F5F5F7] cursor-pointer transition-colors ${
                          selectedInvestor?.id === inv.id ? 'bg-[#F5F5F7]' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-black">{inv.name}</div>
                          <div className="text-xs text-[#6E6E73]">{inv.firm}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full border border-[#E5E5E7] bg-white text-[10px] uppercase font-semibold text-black">
                            {inv.stage.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-black uppercase text-xs">
                          {inv.roundType}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-black font-mono">
                          ₹{inv.dealSize.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#6E6E73] font-mono">
                          {inv.valuation ? `₹${inv.valuation.toLocaleString('en-IN')}` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          {owner && (
                            <div className="flex items-center gap-1.5">
                              <PatchAvatar user={owner} size="sm" />
                              <span className="text-black font-medium">{owner.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvestor(inv);
                              setIsScheduleFollowUpOpen(true);
                            }}
                            className="px-3 py-1 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-xs font-medium text-black transition-all"
                          >
                            Follow Up
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Active Investor Detail Drawer */}
        <div className="lg:col-span-4 border border-[#E5E5E7] bg-white rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
          {selectedInvestor ? (
            <>
              {/* Profile Card */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
                  <div>
                    <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider block">Investor Dossier</span>
                    <h2 className="font-serif text-2xl font-normal text-black mt-1">{selectedInvestor.name}</h2>
                    <span className="text-xs text-[#6E6E73] font-medium block mt-0.5">{selectedInvestor.firm}</span>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full border border-black bg-black text-white font-medium uppercase">
                    {selectedInvestor.stage.replace('_', ' ')}
                  </span>
                </div>

                {/* Contact Strip */}
                <div className="mt-4 space-y-2 text-xs text-[#6E6E73]">
                  {selectedInvestor.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-[#6E6E73]" />
                      <a href={`mailto:${selectedInvestor.email}`} className="text-black hover:underline font-medium">
                        {selectedInvestor.email}
                      </a>
                    </div>
                  )}
                  {selectedInvestor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-[#6E6E73]" />
                      <span className="text-black font-medium">{selectedInvestor.phone}</span>
                    </div>
                  )}
                  {selectedInvestor.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink size={13} className="text-[#6E6E73]" />
                      <a href={selectedInvestor.website} target="_blank" rel="noreferrer" className="text-black hover:underline font-medium">
                        {selectedInvestor.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Terms Grid */}
              <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6E6E73]">Deal Size:</span>
                  <span className="text-black font-semibold font-mono">₹{selectedInvestor.dealSize.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6E73]">Valuation:</span>
                  <span className="text-black font-semibold font-mono">
                    {selectedInvestor.valuation ? `₹${selectedInvestor.valuation.toLocaleString('en-IN')}` : 'Uncapped / TBD'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6E73]">Instrument:</span>
                  <span className="text-black font-semibold uppercase">{selectedInvestor.roundType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6E73]">Relationship Lead:</span>
                  <span className="text-black font-medium">
                    {users.find(u => u.id === selectedInvestor.relationshipOwnerId)?.name || 'Vijayrajkumar'}
                  </span>
                </div>
                {selectedInvestor.nextFollowUpDate && (
                  <div className="flex justify-between border-t border-[#E5E5E7] pt-2 text-emerald-700">
                    <span className="font-medium">Follow-Up Due:</span>
                    <span className="font-semibold font-mono">{selectedInvestor.nextFollowUpDate}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    sound.click();
                    setIsLogInteractionOpen(true);
                  }}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <MessageSquare size={13} />
                  <span>Log Meeting</span>
                </button>
                <button
                  onClick={() => {
                    sound.click();
                    setIsScheduleFollowUpOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Calendar size={13} />
                  <span>Schedule Task</span>
                </button>
              </div>

              {/* Documents & Vault Attachments */}
              <div className="space-y-3 pt-4 border-t border-[#E5E5E7]">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-black tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-black" />
                    <span>Dossier Vault ({selectedInvestor.documents?.length || 0})</span>
                  </span>
                  <button
                    onClick={() => {
                      sound.click();
                      setIsUploadDocOpen(true);
                    }}
                    className="text-xs text-black font-medium hover:underline"
                  >
                    + Upload Doc
                  </button>
                </div>

                <div className="space-y-2">
                  {!selectedInvestor.documents || selectedInvestor.documents.length === 0 ? (
                    <div className="p-4 border border-dashed border-[#E5E5E7] rounded-2xl text-center text-xs text-[#6E6E73] bg-[#F5F5F7]">
                      No pitch decks or term sheets uploaded yet.
                    </div>
                  ) : (
                    selectedInvestor.documents.map(doc => (
                      <div key={doc.id} className="p-3 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="text-xs font-semibold text-black truncate">{doc.name}</div>
                          <span className="text-[10px] text-[#6E6E73] font-mono">
                            v{doc.version}.0 · {doc.uploadedAt}
                          </span>
                        </div>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            download={doc.name}
                            className="p-1.5 rounded-full border border-[#E5E5E7] bg-white hover:border-black text-black transition-all"
                            title="Download document"
                          >
                            <Download size={13} />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Interaction Timeline Log */}
              <div className="space-y-3 pt-4 border-t border-[#E5E5E7]">
                <span className="text-xs uppercase font-semibold text-black tracking-wider block">
                  Interaction Timeline ({selectedInvestor.interactions?.length || 0})
                </span>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {!selectedInvestor.interactions || selectedInvestor.interactions.length === 0 ? (
                    <p className="text-xs text-[#6E6E73] italic">No interactions logged yet.</p>
                  ) : (
                    selectedInvestor.interactions.map(int => {
                      const author = users.find(u => u.id === int.authorId);
                      return (
                        <div key={int.id} className="p-3.5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
                            <span className="px-2 py-0.5 rounded-full border border-[#E5E5E7] bg-white uppercase text-black font-semibold">
                              {int.type}
                            </span>
                            <span className="font-mono">{int.date}</span>
                          </div>
                          <p className="text-black leading-relaxed">{int.summary}</p>
                          {author && (
                            <span className="text-[11px] text-[#6E6E73] block">
                              By {author.name}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-[#6E6E73] text-xs">
              Select an investor to inspect deal terms, interactions, and documents.
            </div>
          )}
        </div>
      </div>

      {/* ADD INVESTOR MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">New Institutional Lead</span>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-black">
                  Onboard Investor Lead
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddInvestorSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Investor Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Venture Firm / Angel *</label>
                  <input
                    type="text"
                    required
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    placeholder="e.g. Apex Frontier Capital"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@firm.vc"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Pipeline Stage *</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as InvestorStage)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {PIPELINE_STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Target Ticket (₹ INR) *</label>
                  <input
                    type="number"
                    value={dealSize}
                    onChange={(e) => setDealSize(e.target.value)}
                    placeholder="2500000"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Round Structure</label>
                  <select
                    value={roundType}
                    onChange={(e) => setRoundType(e.target.value as InvestorRoundType)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {ROUND_TYPES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Target Valuation (₹ INR)</label>
                  <input
                    type="number"
                    value={valuation}
                    onChange={(e) => setValuation(e.target.value)}
                    placeholder="50000000"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Relationship Lead</label>
                  <select
                    value={relationshipOwnerId}
                    onChange={(e) => setRelationshipOwnerId(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Initial Notes & Thesis</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thesis match, sector focus, check size criteria..."
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs shadow-xs transition-all"
                >
                  Enroll Investor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG INTERACTION MODAL */}
      {isLogInteractionOpen && selectedInvestor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Log Meeting</span>
                <h3 className="font-serif text-xl font-normal text-black mt-0.5">
                  {selectedInvestor.name}
                </h3>
              </div>
              <button
                onClick={() => setIsLogInteractionOpen(false)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLogInteractionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Interaction Type</label>
                  <select
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    <option value="Video Call">Video Call</option>
                    <option value="Email">Email</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Pitch">Formal Pitch</option>
                    <option value="Due Diligence">Due Diligence Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={interactionDate}
                    onChange={(e) => setInteractionDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Discussion Summary & Action Points</label>
                <textarea
                  rows={4}
                  required
                  value={interactionSummary}
                  onChange={(e) => setInteractionSummary(e.target.value)}
                  placeholder="Key questions asked, valuation response, next steps promised..."
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E7]">
                <button
                  type="button"
                  onClick={() => setIsLogInteractionOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs shadow-xs transition-all"
                >
                  Save to Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadDocOpen && selectedInvestor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Attach Document</span>
                <h3 className="font-serif text-xl font-normal text-black mt-0.5">
                  {selectedInvestor.firm}
                </h3>
              </div>
              <button
                onClick={() => setIsUploadDocOpen(false)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDocUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Document Title / Description</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. UVL_Term_Sheet_Apex_Draft.pdf"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">File Attachment (PDF, DOCX, Deck)</label>
                <input
                  ref={docFileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const f = e.target.files[0];
                      setDocFile(f);
                      if (!docName) setDocName(f.name);
                    }
                  }}
                  className="hidden"
                />
                <div
                  onClick={() => docFileInputRef.current?.click()}
                  className="p-5 border border-dashed border-[#E5E5E7] hover:border-black rounded-2xl bg-[#F5F5F7] hover:bg-white text-center cursor-pointer transition-all"
                >
                  {docFile ? (
                    <div className="flex items-center justify-center gap-2 text-black">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="font-medium truncate">{docFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <UploadCloud size={22} className="mx-auto text-[#6E6E73]" />
                      <span className="text-xs text-black font-medium block">Click to select pitch deck or NDA</span>
                      <span className="text-[11px] text-[#6E6E73] block">Stored in Supabase central repository</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E7]">
                <button
                  type="button"
                  onClick={() => setIsUploadDocOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDoc}
                  className="px-5 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs shadow-xs transition-all"
                >
                  {isUploadingDoc ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE FOLLOW-UP TASK MODAL */}
      {isScheduleFollowUpOpen && selectedInvestor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Autonomous Task</span>
                <h3 className="font-serif text-xl font-normal text-black mt-0.5">
                  Schedule Follow-Up Task
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleFollowUpOpen(false)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleScheduleFollowUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Target Follow-Up Date</label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Action Task Details</label>
                <textarea
                  rows={3}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder={`Send revised pro-forma cap table to ${selectedInvestor.name} (${selectedInvestor.firm})`}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="p-3.5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-[#6E6E73] leading-relaxed">
                ⚡ This automatically creates a high-priority task in the **Tasks Kanban** assigned to the relationship owner.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E7]">
                <button
                  type="button"
                  onClick={() => setIsScheduleFollowUpOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs shadow-xs transition-all"
                >
                  Schedule & Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
