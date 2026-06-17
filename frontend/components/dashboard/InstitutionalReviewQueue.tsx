'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { formatPdfUrl } from '../../lib/formatPdfUrl';

type ReviewAction = 'approve' | 'reject' | 'request_revision';

interface InstitutionalReviewQueueProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

export default function InstitutionalReviewQueue({ onToast }: InstitutionalReviewQueueProps) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'title'>('oldest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pdfViewed, setPdfViewed] = useState(false);
  const [comments, setComments] = useState('');
  const [assignee, setAssignee] = useState('');
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/papers/pending');
      setQueue(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load review queue.');
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    api.get('/admin/users').then((res) => {
      setReviewers((res.data || []).filter((u: any) => ['faculty', 'hod', 'committee_member'].includes(u.role)));
    }).catch(() => setReviewers([]));
  }, []);

  const filteredQueue = useMemo(() => {
    let items = [...queue];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((p) =>
        p.title?.toLowerCase().includes(q) ||
        p.submittedBy?.fullName?.toLowerCase().includes(q) ||
        p.departmentId?.name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      items = items.filter((p) => p.status === statusFilter);
    }
    items.sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
    });
    return items;
  }, [queue, search, statusFilter, sortBy]);

  const selectPaper = async (paper: any) => {
    setSelectedId(paper._id);
    setPdfViewed(false);
    setComments('');
    setAssignee('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/papers/${paper._id}`);
      setSelectedPaper(res.data);
    } catch {
      setSelectedPaper(paper);
      onToast('Could not load full paper details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (action: ReviewAction) => {
    if (!selectedPaper) return;
    if (action === 'approve' && !pdfViewed) {
      onToast('Review the PDF before approving.', 'error');
      return;
    }

    const payloadComments = [
      assignee ? `Assigned reviewer: ${assignee}` : '',
      comments.trim(),
    ].filter(Boolean).join('\n');

    setActionLoading(true);
    try {
      await api.put(`/papers/${selectedPaper._id}/status`, { action, comments: payloadComments || undefined });
      onToast(`Paper ${action.replace('_', ' ')} successfully.`, 'success');
      setSelectedId(null);
      setSelectedPaper(null);
      setComments('');
      setAssignee('');
      await loadQueue();
    } catch (err: any) {
      onToast(err.response?.data?.message || 'Review action failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const facultyRemarks = (selectedPaper?.workflowLogs || [])
    .filter((log: any) => ['faculty', 'hod', 'committee_member'].includes(log.stage))
    .slice()
    .reverse();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-[640px]">
      {/* LEFT — Queue */}
      <section className="xl:col-span-3 bg-[#131b2e] border border-slate-800 rounded-[16px] p-4 flex flex-col min-h-[480px]">
        <div className="mb-3">
          <h3 className="text-sm font-black text-white uppercase tracking-wide">Review Queue</h3>
          <p className="text-xs text-slate-500 mt-1">{filteredQueue.length} submission(s)</p>
        </div>

        <div className="space-y-2 mb-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, student, department..."
            className="w-full bg-slate-900 border border-slate-800 rounded-[10px] px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-[10px] px-2 py-2 text-[11px] text-white"
            >
              <option value="all">All statuses</option>
              <option value="pending_admin">Pending Admin</option>
              <option value="revision_requested">Revision Requested</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-slate-900 border border-slate-800 rounded-[10px] px-2 py-2 text-[11px] text-white"
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-900/60 rounded-[10px] animate-pulse" />)}</div>
          ) : error ? (
            <div className="p-4 rounded-[10px] border border-rose-900/40 bg-rose-950/20 text-rose-300 text-xs">{error}</div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-700 rounded-[10px]">
              <p className="text-[10px] font-black uppercase text-slate-500">Queue Clear</p>
              <p className="text-xs text-slate-600 mt-1">No papers awaiting institutional review.</p>
            </div>
          ) : (
            filteredQueue.map((paper) => (
              <button
                key={paper._id}
                type="button"
                onClick={() => selectPaper(paper)}
                className={`w-full text-left p-3 rounded-[10px] border transition-all ${
                  selectedId === paper._id
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-slate-900/40 border-slate-800 hover:border-blue-700'
                }`}
              >
                <p className="text-sm font-bold text-white line-clamp-2">{paper.title}</p>
                <p className="text-[11px] text-slate-400 mt-1">{paper.submittedBy?.fullName || 'Unknown student'}</p>
                <div className="flex items-center justify-between mt-2 text-[10px]">
                  <span className="text-slate-500">{paper.departmentId?.name || 'Department'}</span>
                  <span className="uppercase font-bold text-amber-400">{formatStatus(paper.status)}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1">
                  {paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : '—'}
                </p>
              </button>
            ))
          )}
        </div>
      </section>

      {/* CENTER — Details */}
      <section className="xl:col-span-6 bg-[#131b2e] border border-slate-800 rounded-[16px] overflow-hidden flex flex-col min-h-[480px]">
        {!selectedPaper ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-sm font-bold text-slate-400">Select a submission from the queue</p>
              <p className="text-xs text-slate-600 mt-2 max-w-sm">Review metadata, faculty remarks, and the PDF without leaving this workspace.</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-slate-800 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="px-2 py-1 bg-red-500/15 text-red-400 rounded text-[10px] font-bold uppercase">Final Authorization</span>
                  <h2 className="text-lg font-black text-white mt-2 leading-snug">{selectedPaper.title}</h2>
                </div>
                <a
                  href={formatPdfUrl(selectedPaper.pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-blue-600 text-white rounded-[8px] text-xs font-bold shrink-0"
                >
                  Open PDF ↗
                </a>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/50 border border-slate-800 rounded-[10px] p-3">
                  <p className="text-slate-500 uppercase text-[10px] font-bold">Authors</p>
                  <p className="text-white mt-1">{(selectedPaper.authors || []).join(', ') || selectedPaper.submittedBy?.fullName || '—'}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[10px] p-3">
                  <p className="text-slate-500 uppercase text-[10px] font-bold">Publication Metadata</p>
                  <p className="text-white mt-1">{selectedPaper.type || 'Research Paper'} · {selectedPaper.year || '—'}</p>
                  <p className="text-slate-400 mt-1">{selectedPaper.venue || 'Venue not specified'}</p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[10px] p-3">
                <p className="text-slate-500 uppercase text-[10px] font-bold mb-1">Abstract</p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedPaper.abstract || selectedPaper.summary || 'No abstract provided.'}</p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[10px] p-3">
                <p className="text-slate-500 uppercase text-[10px] font-bold mb-1">Keywords</p>
                <p className="text-sm text-slate-400">Derived from title and abstract for search indexing.</p>
              </div>

              {facultyRemarks.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-[10px] p-3">
                  <p className="text-slate-500 uppercase text-[10px] font-bold mb-2">Faculty Remarks</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {facultyRemarks.map((log: any, idx: number) => (
                      <div key={idx} className="text-xs border-l-2 border-blue-500 pl-2">
                        <p className="text-slate-300"><span className="font-bold capitalize">{log.stage}</span> · {log.action?.replace('_', ' ')}</p>
                        <p className="text-slate-500 mt-0.5">{log.comments || 'No comment'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 bg-slate-950 min-h-[260px] relative">
              {!pdfViewed ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setPdfViewed(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[10px] text-xs font-bold uppercase"
                  >
                    Load PDF Preview
                  </button>
                </div>
              ) : selectedPaper.pdfUrl ? (
                <iframe
                  src={formatPdfUrl(selectedPaper.pdfUrl)}
                  title="Paper PDF preview"
                  className="w-full h-full min-h-[260px] border-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">No PDF attachment available.</div>
              )}
            </div>
          </>
        )}
      </section>

      {/* RIGHT — Actions + History */}
      <section className="xl:col-span-3 bg-[#131b2e] border border-slate-800 rounded-[16px] p-4 flex flex-col min-h-[480px]">
        <h3 className="text-sm font-black text-white uppercase tracking-wide mb-3">Review Actions</h3>

        {!selectedPaper ? (
          <p className="text-xs text-slate-500">Choose a paper to unlock review controls.</p>
        ) : (
          <div className="space-y-3 flex-1 flex flex-col">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Assign Reviewer (optional)</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-[10px] px-3 py-2 text-xs text-white"
              >
                <option value="">Select faculty reviewer</option>
                {reviewers.map((r) => (
                  <option key={r._id} value={r.fullName}>{r.fullName} ({r.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Admin Comment</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Decision notes for the student and audit trail..."
                className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-[10px] p-3 text-xs text-white h-24 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={actionLoading || !pdfViewed}
                onClick={() => handleAction('approve')}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-[10px] text-xs font-bold uppercase"
              >
                Approve & Publish
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleAction('request_revision')}
                className="py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-[10px] text-xs font-bold uppercase"
              >
                Request Revision
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleAction('reject')}
                className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-[10px] text-xs font-bold uppercase"
              >
                Reject
              </button>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Activity Timeline</p>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {(selectedPaper.workflowLogs || []).length === 0 ? (
                  <p className="text-xs text-slate-600">No workflow history yet.</p>
                ) : (
                  [...(selectedPaper.workflowLogs || [])].reverse().map((log: any, idx: number) => (
                    <div key={idx} className="text-[11px] border-l-2 border-slate-600 pl-2">
                      <p className="text-slate-300 font-semibold capitalize">{log.stage} · {log.action?.replace('_', ' ')}</p>
                      <p className="text-slate-500">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</p>
                      {log.comments && <p className="text-slate-400 mt-0.5">{log.comments}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
