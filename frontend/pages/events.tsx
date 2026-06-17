import { useState, useEffect } from 'react';
import api from '../lib/api';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Toast from '../components/dashboard/Toast';
import { useToast } from '../lib/useToast';

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const { toast, showToast } = useToast();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (err: any) {
            console.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const handleRSVP = async (eventId: string) => {
        try {
            await api.post(`/events/${eventId}/rsvp`);
            showToast('You are registered for this event.', 'success');
            fetchEvents();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to RSVP', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] transition-colors pb-20">
            <Navbar />
            <Toast toast={toast} />

            {/* Premium Hero Section */}
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 pt-44 pb-32 text-white relative overflow-hidden mb-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -mr-64 -mt-64 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -ml-40 -mb-40"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="max-w-2xl text-center md:text-left">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 italic">
                                Institutional <span className="text-blue-400">Pulse</span>
                            </h1>
                            <p className="text-xl text-blue-100/70 font-medium leading-relaxed">
                                Join our specialized research summits, workshops, and scholarly gatherings across all academic wings.
                            </p>
                        </div>
                        {user && ['admin', 'faculty', 'hod', 'committee_member'].includes(user.role) && (
                            <Link
                                href="/events/create"
                                className="px-10 py-5 bg-white text-blue-900 rounded-[32px] font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl flex items-center gap-3 group"
                            >
                                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white p-1">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                </span>
                                Host Ecosystem Event
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                {loading ? (
                    <div className="p-24 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[48px] border-2 border-dashed dark:border-slate-800">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Ecosystem Calendar...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="p-32 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[60px] border-2 border-dashed dark:border-slate-800">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No Active Sessions</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {events.map((event: any) => (
                            <div key={event._id} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[48px] border border-white/20 dark:border-slate-800/30 shadow-xl overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col">
                                <div className="h-4 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                                <div className="p-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-8">
                                        <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100/50 dark:border-blue-800/50">
                                            {event.departmentId?.name || 'General'}
                                        </span>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(event.createdAt).getFullYear()} REF
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition tracking-tight line-clamp-2 italic">
                                        {event.title}
                                    </h3>

                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8 line-clamp-3">
                                        {event.description}
                                    </p>

                                    <div className="space-y-4 mb-10 mt-auto">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Date</p>
                                                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                    {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Venue</p>
                                                <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{event.venue}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        {user && (
                                            <button
                                                onClick={() => handleRSVP(event._id)}
                                                disabled={event.participants?.includes(user.id) || event.participants?.includes(user._id)}
                                                className={`flex-1 py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all ${(event.participants?.includes(user.id) || event.participants?.includes(user._id))
                                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                    : 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-105 active:scale-95'
                                                    }`}
                                            >
                                                {(event.participants?.includes(user.id) || event.participants?.includes(user._id)) ? '✓ Access Granted' : 'Register Now'}
                                            </button>
                                        )}
                                        {event.registrationLink && (
                                            <a
                                                href={event.registrationLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-16 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-[28px] transition-all"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                            </a>
                                        )}
                                    </div>

                                    {user && ['admin', 'faculty', 'hod', 'committee_member'].includes(user.role) && (
                                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-400">?</div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{event.participants?.length || 0} Registered</span>
                                            </div>
                                            {event.maxAttendees && <span className="text-[10px] font-bold text-slate-400">CAP {event.maxAttendees}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
