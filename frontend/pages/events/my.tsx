import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Link from 'next/link';

export default function MyEvents() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/events/my')
            .then(res => setEvents(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
                    <Link href="/events/submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        + Report New Event
                    </Link>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500">You haven't submitted any event participations yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {events.map((e: any) => (
                            <div key={e._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-gray-800">{e.title}</h3>
                                        <span className={`px-2 py-0.5 text-xs rounded-full uppercase font-bold ${e.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                e.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>{e.status}</span>
                                    </div>
                                    <p className="text-gray-600">{e.type} • {new Date(e.date).toLocaleDateString()} • {e.venue}</p>
                                    <p className="text-sm text-gray-500 mt-2">Outcome: <span className="font-medium text-gray-700">{e.outcome}</span></p>
                                </div>

                                {e.certificateUrl && (
                                    <a href={e.certificateUrl} target="_blank" rel="noopener noreferrer" className="mt-4 md:mt-0 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                        <span>View Certificate</span>
                                        <span>↗</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
