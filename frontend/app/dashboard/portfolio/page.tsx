'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import PortfolioScoresPanel from '../../../components/portfolio/PortfolioScoresPanel';
import PortfolioDocumentPreview from '../../../components/portfolio/PortfolioDocumentPreview';
import { PORTFOLIO_THEMES, normalizeTheme, getPreviewFontClass, type PortfolioTheme } from '../../../lib/portfolioThemes';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [liveName, setLiveName] = useState('Student Name');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields in React state for live real-time preview
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [careerObjective, setCareerObjective] = useState('');
  const [skillsSummary, setSkillsSummary] = useState('');
  const [theme, setTheme] = useState<PortfolioTheme>('professional');
  const [polishingFields, setPolishingFields] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'ai'>('profile');

  const handlePolishField = async (fieldName: string, currentText: string, setter: (val: string) => void) => {
    if (!currentText || currentText.trim().length === 0) {
      setError('Please enter some text in the field first before polishing.');
      return;
    }
    try {
      setPolishingFields(prev => ({ ...prev, [fieldName]: true }));
      setError('');
      setSuccess('');
      const res = await api.post('/portfolio/enhance', { text: currentText, fieldName });
      if (res.data?.success && res.data?.data) {
        setter(res.data.data);
        setIsDirty(true);
        setSuccess(`Polished ${fieldName} successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to polish section using AI.');
    } finally {
      setPolishingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handlePolishAll = async () => {
    try {
      setError('');
      setSuccess('');
      const fieldsToPolish = [
        { name: 'headline', text: headline, setter: setHeadline },
        { name: 'bio', text: bio, setter: setBio },
        { name: 'careerObjective', text: careerObjective, setter: setCareerObjective },
        { name: 'skillsSummary', text: skillsSummary, setter: setSkillsSummary },
      ].filter(f => f.text && f.text.trim().length > 0);

      if (fieldsToPolish.length === 0) {
        setError('Please enter some text in at least one field before polishing.');
        return;
      }

      const updates: Record<string, boolean> = {};
      fieldsToPolish.forEach(f => updates[f.name] = true);
      setPolishingFields(prev => ({ ...prev, ...updates }));

      const results = await Promise.all(
        fieldsToPolish.map(async f => {
          const res = await api.post('/portfolio/enhance', { text: f.text, fieldName: f.name });
          return { name: f.name, data: res.data?.data, setter: f.setter };
        })
      );

      results.forEach(r => {
        if (r.data) {
          r.setter(r.data);
        }
      });

      setIsDirty(true);
      setSuccess('All selected sections polished successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to polish sections using AI.');
    } finally {
      const updates: Record<string, boolean> = {};
      Object.keys(polishingFields).forEach(k => updates[k] = false);
      setPolishingFields(prev => ({ ...prev, ...updates }));
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleSaveField = useCallback(async () => {
    if (!isDirty || saving) return;
    try {
      setSaving(true);
      setError('');
      const res = await api.put('/portfolio/me', {
        bio,
        headline,
        careerObjective,
        skillsSummary,
        theme
      });
      if (res.data?.data) {
        setPortfolio(res.data.data);
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Failed to save field:', err);
      setError('Save failed. Check server connection.');
    } finally {
      setSaving(false);
    }
  }, [isDirty, saving, bio, headline, careerObjective, skillsSummary, theme]);

  // Debounced Auto-Save
  useEffect(() => {
    if (!isDirty) return;
    const timeout = setTimeout(() => {
      handleSaveField();
    }, 1500);
    return () => clearTimeout(timeout);
  }, [bio, headline, careerObjective, skillsSummary, theme, isDirty, handleSaveField]);

  // Ctrl+S keyboard shortcut to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveField();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveField]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/portfolio/me');
      const data = res.data;
      if (data) {
        setPortfolio(data);
        setLiveName(data.studentName || 'Student Name');

        if (!data.isNew) {
          setHeadline(data.headline || '');
          setBio(data.bio || '');
          setCareerObjective(data.careerObjective || '');
          setSkillsSummary(data.skillsSummary || '');
          setTheme(normalizeTheme(data.theme));
        } else {
          setHeadline('');
          setBio('');
          setCareerObjective('');
          setSkillsSummary('');
          setSuccess('Workspace ready! You can manually draft your details before clicking Generate.');
        }
      }
    } catch (err: any) {
      setError('Failed to fetch portfolio data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      const response = await api.post('/portfolio/generate', {
        bio,
        headline,
        careerObjective,
        skillsSummary
      });
      const p = response.data.data || response.data;
      setPortfolio(p);
      setLiveName(p.studentName || 'Student Name');
      setBio(p.bio || '');
      setHeadline(p.headline || '');
      setCareerObjective(p.careerObjective || '');
      setSkillsSummary(p.skillsSummary || '');
      setTheme(normalizeTheme(p.theme));
      setSuccess('AI Portfolio compiled successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to compile AI portfolio. Ensure achievements are approved.');
    } finally {
      setGenerating(false);
    }
  };

  const handleThemeChange = async (newTheme: PortfolioTheme) => {
    setTheme(newTheme);
    setIsDirty(true);
  };

  const handleExportPDF = async () => {
    try {
      setError('');
      setIsGeneratingPdf(true);
      const res = await api.get('/portfolio/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${liveName.replace(/\s+/g, '_')}_Portfolio.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF Export failed', err);
      setError('Failed to export PDF file.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      setError('');
      const res = await api.get('/portfolio/export/docx', { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${liveName.replace(/\s+/g, '_')}_Portfolio.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('DOCX Export failed', err);
      setError('Failed to export Word document.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f19] transition-colors pb-20">
      <Navbar />

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter italic">Smart <span className="text-blue-600 dark:text-blue-400">Portfolio</span></h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium pl-[60px]">
          Build your professional presence · Powered by AI
        </p>
      </div>

      {/* Feedback Banners */}
      <div className="max-w-7xl mx-auto px-6">
        {error && (
          <div className="bg-rose-950/50 backdrop-blur-md border border-rose-500/30 text-rose-300 px-5 py-4 rounded-2xl mb-4 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-950/50 backdrop-blur-md border border-emerald-500/30 text-emerald-300 px-5 py-4 rounded-2xl mb-4 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {success}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-36 space-y-6">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300/70 animate-pulse">Loading workspace...</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN — Portfolio Editor */}
          <div className="lg:col-span-5 bg-white dark:bg-[#131b2e] rounded-2xl sm:rounded-[40px] overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800/80 relative min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-800"></div>
            
            {/* Sticky bar: title + Generate button */}
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#131b2e]/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
                  Builder
                  {saving && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>}
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Auto-saving enabled</p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Auto Generate
                  </>
                )}
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${activeTab === 'profile' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                📝 Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                className={`pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${activeTab === 'academic' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                🎓 Data
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${activeTab === 'ai' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                🤖 Insights
              </button>
            </div>

            {/* Form body */}
            <div className="px-6 py-6 custom-scrollbar max-h-[calc(100vh-250px)] overflow-y-auto">

              {/* Save status row */}
              <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg px-4 py-2 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {saving ? (
                    <span className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                      <div className="w-3.5 h-3.5 border-2 border-blue-600 dark:border-blue-450 border-t-transparent rounded-full animate-spin"></div>
                      Saving to cloud...
                    </span>
                  ) : isDirty ? (
                    <span className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-450">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Unsaved changes
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      All changes saved
                    </span>
                  )}
                </div>
                {activeTab === 'profile' && (
                  <button
                    onClick={handlePolishAll}
                    disabled={Object.values(polishingFields).some(Boolean)}
                    className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-1.5 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    Polish All Sections
                  </button>
                )}
              </div>

              {/* TAB 1: Core Profile inputs */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Professional Headline */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Headline
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePolishField('headline', headline, setHeadline)}
                        disabled={polishingFields['headline'] || !headline}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-800"
                      >
                        {polishingFields['headline'] ? '✨ Polishing...' : '✨ AI Polish'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => { setHeadline(e.target.value); setIsDirty(true); }}
                      placeholder="e.g. Full Stack Developer | React | Node.js"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-550 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-550 shadow-sm font-semibold"
                    />
                  </div>

                  {/* Professional Bio */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Summary
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePolishField('bio', bio, setBio)}
                        disabled={polishingFields['bio'] || !bio}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-800"
                      >
                        {polishingFields['bio'] ? '✨ Polishing...' : '✨ AI Polish'}
                      </button>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => { setBio(e.target.value); setIsDirty(true); }}
                      placeholder="Write a concise 3-4 sentence professional overview..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-550 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-550 resize-none leading-relaxed shadow-sm font-semibold"
                      style={{ minHeight: '130px' }}
                    />
                  </div>

                  {/* Career Objective */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        Career Objective
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePolishField('careerObjective', careerObjective, setCareerObjective)}
                        disabled={polishingFields['careerObjective'] || !careerObjective}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-800"
                      >
                        {polishingFields['careerObjective'] ? '✨ Polishing...' : '✨ AI Polish'}
                      </button>
                    </div>
                    <textarea
                      value={careerObjective}
                      onChange={(e) => { setCareerObjective(e.target.value); setIsDirty(true); }}
                      placeholder="e.g. Seeking a challenging role to deploy full-stack engineering skills..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-550 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-550 resize-none leading-relaxed shadow-sm font-semibold"
                      style={{ minHeight: '100px' }}
                    />
                  </div>

                  {/* Technical Skills Summary */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        Technical Skills
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePolishField('skillsSummary', skillsSummary, setSkillsSummary)}
                        disabled={polishingFields['skillsSummary'] || !skillsSummary}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-800"
                      >
                        {polishingFields['skillsSummary'] ? '✨ Polishing...' : '✨ AI Polish'}
                      </button>
                    </div>
                    <textarea
                      value={skillsSummary}
                      onChange={(e) => { setSkillsSummary(e.target.value); setIsDirty(true); }}
                      placeholder="Summarize core domains of expert capabilities..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-550 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-550 resize-none leading-relaxed shadow-sm font-semibold"
                      style={{ minHeight: '100px' }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Academics Profile & Proofs */}
              {activeTab === 'academic' && (
                <div className="space-y-6">
                  {portfolio && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-450">Verified Profile</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                        <div className="flex flex-col"><span className="text-slate-500 dark:text-slate-400 mb-1">Name</span> <span className="text-slate-900 dark:text-white font-semibold">{liveName}</span></div>
                        <div className="flex flex-col"><span className="text-slate-500 dark:text-slate-400 mb-1">USN</span> <span className="text-slate-900 dark:text-white font-semibold">{portfolio.usn || 'N/A'}</span></div>
                        <div className="flex flex-col"><span className="text-slate-500 dark:text-slate-400 mb-1">Email</span> <span className="text-slate-900 dark:text-white font-semibold">{portfolio.email || 'N/A'}</span></div>
                        <div className="flex flex-col"><span className="text-slate-500 dark:text-slate-400 mb-1">Department</span> <span className="text-slate-900 dark:text-white font-semibold">{portfolio.department || 'Computer Science'}</span></div>
                        <div className="flex flex-col col-span-2 mt-1"><span className="text-slate-500 dark:text-slate-400 mb-1">CGPA</span> <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black">{portfolio.cgpa || '9.0'}</span></div>
                      </div>
                      
                      {/* Detected Skills */}
                      {portfolio.skills && portfolio.skills.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Extracted Competencies</span>
                          <div className="flex flex-wrap gap-2">
                            {portfolio.skills.map((skill: string, index: number) => (
                              <span key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] border border-blue-100 dark:border-blue-900/40 font-semibold">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Linked Documents list */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Linked Achievements
                    </p>

                    {/* Achievements */}
                    <div className="mb-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Institutional Achievements</p>
                      {portfolio?.achievements && portfolio.achievements.length > 0 ? (
                        <div className="space-y-3">
                          {portfolio.achievements.map((ach: any, idx: number) => (
                            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                              <div className="flex justify-between items-start gap-3">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{ach.title}</span>
                                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded text-[9px] font-bold tracking-widest shrink-0">{ach.year}</span>
                              </div>
                              {ach.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{ach.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">No achievements compiled yet.</p>
                      )}
                    </div>

                    {/* Papers */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Scholarly Papers</p>
                      {portfolio?.papers && portfolio.papers.length > 0 ? (
                        <div className="space-y-3">
                          {portfolio.papers.map((paper: any, idx: number) => (
                            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                              <div className="flex justify-between items-start gap-3">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{paper.title}</span>
                                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded text-[9px] font-bold tracking-widest shrink-0">{paper.year}</span>
                              </div>
                              {paper.abstract && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">{paper.abstract}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">No approved papers compiled yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AI Insights */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  {portfolio?.datasetMetrics && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Dataset Intelligence
                      </p>
                      {typeof portfolio.datasetMetrics === 'string' ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300">{portfolio.datasetMetrics}</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-x-4 gap-y-4 text-xs">
                          <div className="bg-white dark:bg-[#131b2e] p-3 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm"><span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase mb-1">Internships</span><span className="text-slate-900 dark:text-white font-bold text-lg">{portfolio.datasetMetrics.internships}</span></div>
                          <div className="bg-white dark:bg-[#131b2e] p-3 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm"><span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase mb-1">Projects</span><span className="text-slate-900 dark:text-white font-bold text-lg">{portfolio.datasetMetrics.projects}</span></div>
                          <div className="bg-white dark:bg-[#131b2e] p-3 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm"><span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase mb-1">Workshops</span><span className="text-slate-900 dark:text-white font-bold text-lg">{portfolio.datasetMetrics.workshops}</span></div>
                          <div className="bg-white dark:bg-[#131b2e] p-3 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm"><span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase mb-1">Soft Skills</span><span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{portfolio.datasetMetrics.softSkills}<span className="text-sm text-slate-400">/5</span></span></div>
                          <div className="bg-white dark:bg-[#131b2e] p-3 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm col-span-2"><span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase mb-1">Training & Status</span><span className="text-slate-900 dark:text-white font-medium text-xs">{portfolio.datasetMetrics.placementTraining} · {portfolio.datasetMetrics.placementStatus}</span></div>
                        </div>
                      )}
                    </div>
                  )}

                  {portfolio?.careerAnalytics && (
                    <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 mb-5">
                        <span className="text-lg">🤖</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-800 dark:text-blue-400 font-black">AI Career Recommender</span>
                      </div>

                      {/* Placement Readiness */}
                      {portfolio.careerAnalytics.placement_readiness && (
                        <div className="mb-6 p-4 bg-white dark:bg-[#131b2e] rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                          <div className="flex justify-between items-end mb-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Placement Readiness</span>
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{portfolio.careerAnalytics.placement_readiness.overall_score}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mb-4 border border-slate-200 dark:border-slate-800">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${portfolio.careerAnalytics.placement_readiness.overall_score}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-[10px] text-center">
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800"><span className="block text-slate-500 dark:text-slate-400 mb-1">CGPA</span><span className="font-bold text-slate-900 dark:text-white">{portfolio.careerAnalytics.placement_readiness.cgpa_factor}%</span></div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800"><span className="block text-slate-500 dark:text-slate-400 mb-1">Experience</span><span className="font-bold text-slate-900 dark:text-white">{portfolio.careerAnalytics.placement_readiness.experience_factor}%</span></div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800"><span className="block text-slate-500 dark:text-slate-400 mb-1">Alignment</span><span className="font-bold text-slate-900 dark:text-white">{portfolio.careerAnalytics.placement_readiness.skill_alignment}%</span></div>
                          </div>
                        </div>
                      )}

                      {/* Internship Recommendations */}
                      {portfolio.careerAnalytics.internship_recommendations && portfolio.careerAnalytics.internship_recommendations.length > 0 && (
                        <div className="mb-5">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Top Matches</span>
                          <div className="space-y-3">
                            {portfolio.careerAnalytics.internship_recommendations.map((job: any, index: number) => (
                              <div key={index} className="p-3.5 bg-white dark:bg-[#131b2e] hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 transition-all flex justify-between items-center gap-3">
                                <div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">{job.title}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{job.company_name} · {job.location}</p>
                                </div>
                                <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] font-black tracking-wider">
                                  {Math.round(job.match_score * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skill Gap Analysis */}
                      {portfolio.careerAnalytics.skill_gap_analysis && portfolio.careerAnalytics.skill_gap_analysis.filter((s: any) => s.gap > 0).length > 0 && (
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Growth Areas</span>
                          <div className="flex flex-wrap gap-2">
                            {portfolio.careerAnalytics.skill_gap_analysis
                              .filter((s: any) => s.gap > 0)
                              .map((item: any, index: number) => (
                                <span key={index} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                                  <svg className="w-3 h-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                  {item.skill}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Live Preview */}
          <div className="lg:col-span-7 lg:sticky lg:top-8 space-y-5 min-w-0">
            <PortfolioScoresPanel
              data={{
                headline,
                bio,
                careerObjective,
                skillsSummary,
                skills: portfolio?.skills,
                achievements: portfolio?.achievements,
                papers: portfolio?.papers,
                cgpa: portfolio?.cgpa,
                careerAnalytics: portfolio?.careerAnalytics,
              }}
            />

            {/* Row: "Live Preview" label + theme toggle + export buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#131b2e] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-md">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-450 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Live Preview
              </p>
              <div className="flex items-center gap-3">

                {/* Theme toggle */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  {PORTFOLIO_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleThemeChange(t.id)}
                      className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        theme === t.id
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Export: PDF */}
                <button
                  onClick={handleExportPDF}
                  disabled={isGeneratingPdf}
                  className={`flex items-center gap-2 px-4 py-2 ${isGeneratingPdf ? 'bg-blue-50 dark:bg-blue-950/20 cursor-wait text-blue-600 dark:text-blue-450 border border-blue-200 dark:border-blue-900/30' : 'bg-white dark:bg-[#131b2e] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm'} rounded-xl text-xs font-bold transition-all`}
                >
                  {isGeneratingPdf ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  {isGeneratingPdf ? 'Exporting...' : 'PDF'}
                </button>

                {/* Export: DOCX */}
                <button
                  onClick={handleExportDocx}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl text-xs font-bold transition-all"
                >
                  <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  DOCX
                </button>
              </div>
            </div>
            {/* Resume preview — read-only document layout matching PDF export */}
            <div className={`bg-white rounded-2xl shadow-2xl transform-gpu transition-all duration-500 ${getPreviewFontClass(theme)}`}>
              <PortfolioDocumentPreview
                theme={theme}
                name={liveName}
                headline={headline}
                bio={bio}
                careerObjective={careerObjective}
                skillsSummary={skillsSummary}
                data={{
                  email: portfolio?.email,
                  usn: portfolio?.usn,
                  department: portfolio?.department,
                  cgpa: portfolio?.cgpa,
                  skills: portfolio?.skills,
                  papers: portfolio?.papers,
                  achievements: portfolio?.achievements,
                  careerAnalytics: portfolio?.careerAnalytics,
                }}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
