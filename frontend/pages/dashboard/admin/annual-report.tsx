import { useState } from 'react';
import api from '../../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AnnualReport() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/report/annual?year=${year}`);
            setData(res.data);
        } catch {
            setError('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => {
        if (!data) return;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(`Annual Report - ${year}`, 14, 22);

        doc.setFontSize(12);
        doc.text(`Total Papers: ${data.total_papers}`, 14, 35);
        doc.text(`Total Events: ${data.total_events}`, 14, 42);

        // Dept Counts Table
        const deptRows = Object.entries(data.dept_wise_counts).map(([dept, count]) => [dept, count]);
        autoTable(doc, {
            startY: 50,
            head: [['Department', 'Paper Count']],
            body: deptRows as any,
        });

        // Papers List
        doc.text('Approved Papers:', 14, (doc as any).lastAutoTable.finalY + 10);
        const paperRows = data.papers.map((p: any) => [p.title, p.departmentId?.name, p.type]);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Title', 'Department', 'Type']],
            body: paperRows as any,
        });

        doc.save(`annual-report-${year}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
                <h1 className="text-2xl font-bold mb-6">Generate Annual Report</h1>

                <div className="flex gap-4 mb-8">
                    <input
                        type="number"
                        value={year}
                        onChange={e => setYear(parseInt(e.target.value))}
                        className="border rounded p-2"
                    />
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>

                {data && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded text-center">
                                <h3 className="text-lg font-semibold text-blue-800">Total Papers</h3>
                                <p className="text-3xl font-bold text-blue-600">{data.total_papers}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded text-center">
                                <h3 className="text-lg font-semibold text-green-800">Total Events</h3>
                                <p className="text-3xl font-bold text-green-600">{data.total_events}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold mb-2">Department Breakdown</h3>
                            <ul className="list-disc pl-5">
                                {Object.entries(data.dept_wise_counts).map(([dept, count]: any) => (
                                    <li key={dept}>{dept}: {count} papers</li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={exportPDF}
                            className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 w-full"
                        >
                            Export to PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
