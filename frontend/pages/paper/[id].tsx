import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';

const formatPdfUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const host = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
};
// import ReactMarkdown from 'react-markdown'; // Removed to avoid dependency issue

export default function PaperDetails() {
    const router = useRouter();
    const { id } = router.query;
    const [paper, setPaper] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<string>('');
    const [summarizing, setSummarizing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchPaper();
    }, [id]);

    const fetchPaper = async () => {
        try {
            // Try fetching from public approved papers (or specific endpoint if needed)
            const res = await api.get('/papers');
            // Ideally we should have a GET /papers/:id endpoint publicly accessible for approved papers
            // Since we don't know if that exists, let's search in the list or implement GET /:id in backend if needed.
            // Actually, backend/routes/papers.js does NOT seem to have a public GET /:id. 
            // But let's assume one exists or filtering the list works for now.
            // Wait, standard CRUD usually has it. 
            // Looking at previous analyze, there was no GET /:id public. Only GET /.
            // We will filter client side for now or I will add GET /:id to backend quickly.

            const found = res.data.find((p: any) => p._id === id);
            if (found) {
                setPaper(found);
            } else {
                // Try fetching all params? Or maybe authorized route?
                // Let's assume we can add a specific route, or fallback.
                setError('Paper not found or access denied.');
            }
        } catch (err) {
            setError('Failed to load paper.');
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (!paper) return;
        setSummarizing(true);
        try {
            const res = await api.post('/ai/summary', {
                abstract: paper.abstract,
                title: paper.title,
                text: paper.abstract // In real app, we'd extract text from PDF on backend
            });
            setSummary(res.data.summary);
        } catch (err) {
            setError('Failed to generate summary');
        } finally {
            setSummarizing(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (error || !paper) return <div className="p-10 text-center text-red-600">{error || 'Paper not found'}</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-20">
            <Navbar />
            <Head>
                <title>{paper.title} | Portal</title>
            </Head>

            <div className="max-w-4xl mx-auto px-4 pt-44 pb-8">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center">
                    ← Back to Papers
                </button>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{paper.title}</h1>
                                <p className="text-gray-500">
                                    {paper.year} • {paper.departmentId?.name || 'Department'} • {paper.type}
                                </p>
                            </div>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                {paper.status}
                            </span>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Abstract</h3>
                            <p className="text-gray-600 leading-relaxed">{paper.abstract}</p>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-semibold text-gray-900 mb-2">Authors</h3>
                            <div className="flex flex-wrap gap-2">
                                {paper.authors && paper.authors.length > 0 ? (
                                    paper.authors.map((author: string, idx: number) => (
                                        <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                                            {author}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-500 text-sm">No authors listed</span>
                                )}
                            </div>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex flex-wrap gap-4 border-t pt-6">
                            {/* PDF Viewer Toggle / Download */}
                            <a
                                href={formatPdfUrl(paper.pdfUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View / Download PDF
                            </a>

                            {/* Summarize Button */}
                            <button
                                onClick={handleSummarize}
                                disabled={summarizing}
                                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {summarizing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating Summary...
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span> Summarize with AI
                                    </>
                                )}
                            </button>
                        </div>

                        {/* AI Summary Section */}
                        {summary && (
                            <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-100 animate-fade-in">
                                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                                    <span>✨</span> AI Summary
                                </h3>
                                <div className="prose text-gray-700 max-w-none whitespace-pre-line">
                                    {summary}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* PDF Preview (Iframe) */}
                <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">
                        Document Preview
                    </div>
                    <div className="h-[800px] bg-gray-200">
                        {paper.pdfUrl ? (
                            <iframe
                                src={formatPdfUrl(paper.pdfUrl)}
                                className="w-full h-full"
                                title="Paper PDF"
                            ></iframe>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500">PDF not available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
