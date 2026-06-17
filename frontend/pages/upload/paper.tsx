import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getRoleNavigation } from '../../lib/navigation';
import { FormPage } from '../../components/forms/FormCard';
import FormField from '../../components/forms/FormField';
import FormAlert from '../../components/forms/FormAlert';
import { useFormValidation } from '../../lib/useFormValidation';
import { validators } from '../../lib/validate';
import { getDashboardPath } from '../../lib/navigation';

interface Department {
    _id: string;
    name: string;
}

export default function UploadPaper() {
    const [step, setStep] = useState(1);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');
    const [plagiarismChecked, setPlagiarismChecked] = useState(false);
    const [plagiarismResult, setPlagiarismResult] = useState<any>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const router = useRouter();

    const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
        {
            title: '',
            abstract: '',
            authors: '',
            departmentId: '',
            year: String(new Date().getFullYear()),
            type: 'Research Paper',
            venue: '',
        },
        {
            title: [validators.required(), validators.minLength(5, 'Title must be at least 5 characters')],
            abstract: [validators.required(), validators.minLength(20, 'Abstract must be at least 20 characters')],
            authors: [validators.required()],
            departmentId: [validators.required('Select a department')],
            year: [validators.required()],
        }
    );

    useEffect(() => {
        api.get('/departments').then((res) => setDepartments(res.data)).catch(() => {});
    }, []);

    const deptOptions = [
        { value: '', label: 'Select Department' },
        ...departments.map((d) => ({ value: d._id, label: d.name })),
    ];

    const typeOptions = [
        { value: 'Research Paper', label: 'Research Paper' },
        { value: 'Journal', label: 'Journal' },
        { value: 'Conference', label: 'Conference' },
        { value: 'Thesis', label: 'Thesis' },
        { value: 'Patent', label: 'Patent' },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        setFileError('');
        if (!selected) {
            setFile(null);
            return;
        }
        if (selected.type !== 'application/pdf') {
            setFileError('Only PDF files are allowed for paper submissions');
            setFile(null);
            return;
        }
        if (selected.size > 10 * 1024 * 1024) {
            setFileError('PDF must be under 10 MB');
            setFile(null);
            return;
        }
        setFile(selected);
        setPlagiarismChecked(false);
        setPlagiarismResult(null);
    };

    const goToStep2 = () => {
        setServerError('');
        if (!validateAll()) return;
        setStep(2);
    };

    const handleAnalyze = async () => {
        if (!file) {
            setFileError('Please upload a PDF file first');
            return;
        }
        setAnalysisLoading(true);
        setServerError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/papers/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPlagiarismResult(res.data);
            setPlagiarismChecked(true);
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Analysis failed. Please try again.');
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!plagiarismChecked) {
            setServerError('You must complete the plagiarism check before submitting.');
            return;
        }
        if (!file) {
            setFileError('PDF file is required');
            return;
        }

        setSubmitLoading(true);
        setServerError('');
        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('abstract', values.abstract);
            const authorsArray = values.authors.split(',').map((a) => a.trim()).filter(Boolean);
            formData.append('authors', JSON.stringify(authorsArray));
            formData.append('departmentId', values.departmentId);
            formData.append('year', values.year);
            formData.append('type', values.type);
            formData.append('venue', values.venue);
            formData.append('file', file);
            if (plagiarismResult) {
                formData.append('plagiarismScore', plagiarismResult.score);
                formData.append('plagiarismReport', plagiarismResult.report);
            }

            await api.post('/papers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            router.push(getDashboardPath(user.role || 'student'));
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <DashboardShell role="student" sidebarItems={getRoleNavigation('student')} activeHref="/upload/paper">
            <FormPage
                title="Submit Research Paper"
                subtitle={`Step ${step} of 2 — ${step === 1 ? 'Paper details' : 'Upload & verify'}`}
                action={
                    <Link href="/dashboard/student" className="text-xs font-bold text-blue-400 uppercase tracking-wider hover:text-blue-300">
                        ← Dashboard
                    </Link>
                }
            >
                {serverError && <FormAlert>{serverError}</FormAlert>}

                {step === 1 && (
                    <div className="space-y-5">
                        <FormField
                            label="Paper Title"
                            name="title"
                            value={values.title}
                            onChange={handleChange}
                            onBlur={() => handleBlur('title')}
                            error={errors.title}
                            required
                        />
                        <FormField
                            label="Abstract"
                            name="abstract"
                            type="textarea"
                            value={values.abstract}
                            onChange={handleChange}
                            onBlur={() => handleBlur('abstract')}
                            error={errors.abstract}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                                label="Authors (comma separated)"
                                name="authors"
                                value={values.authors}
                                onChange={handleChange}
                                onBlur={() => handleBlur('authors')}
                                error={errors.authors}
                                placeholder="Dr. A. Smith, R. Jones"
                                required
                            />
                            <FormField
                                label="Department"
                                name="departmentId"
                                type="select"
                                value={values.departmentId}
                                onChange={handleChange}
                                onBlur={() => handleBlur('departmentId')}
                                error={errors.departmentId}
                                options={deptOptions}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <FormField
                                label="Year"
                                name="year"
                                type="number"
                                value={values.year}
                                onChange={handleChange}
                                onBlur={() => handleBlur('year')}
                                error={errors.year}
                                required
                            />
                            <FormField
                                label="Type"
                                name="type"
                                type="select"
                                value={values.type}
                                onChange={handleChange}
                                options={typeOptions}
                            />
                            <FormField
                                label="Venue Name"
                                name="venue"
                                value={values.venue}
                                onChange={handleChange}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={goToStep2}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-sm uppercase tracking-wider transition-all"
                        >
                            Next: Upload PDF →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        <FormField
                            label="Upload Paper (PDF only, max 10 MB)"
                            name="file"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            error={fileError}
                        />

                        {file && (
                            <div className="border border-slate-800 rounded-[12px] p-5 bg-slate-900/30">
                                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Plagiarism Check (Required)</h3>
                                {!plagiarismChecked ? (
                                    <div className="text-center py-4">
                                        <p className="text-slate-400 text-sm mb-4">Run analysis before submitting your paper.</p>
                                        <button
                                            type="button"
                                            onClick={handleAnalyze}
                                            disabled={analysisLoading}
                                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-[12px] text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                        >
                                            {analysisLoading ? 'Analyzing PDF...' : 'Check Plagiarism'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-[12px] p-4">
                                        <p className="font-bold text-emerald-400 text-sm">Analysis Complete</p>
                                        <p className="text-sm text-emerald-300 mt-1">Score: <strong>{plagiarismResult?.score}%</strong></p>
                                        <p className="text-xs text-emerald-400/80 mt-1">{plagiarismResult?.report}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-6 py-3.5 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-wider"
                            >
                                ← Back to Details
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!plagiarismChecked || !file || submitLoading}
                                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[12px] font-bold text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {submitLoading ? 'Submitting...' : 'Submit Paper'}
                            </button>
                        </div>
                    </div>
                )}
            </FormPage>
        </DashboardShell>
    );
}
