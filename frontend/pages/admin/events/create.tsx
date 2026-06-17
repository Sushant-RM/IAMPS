import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import api from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import Toast from '../../../components/dashboard/Toast';
import { FormPage } from '../../../components/forms/FormCard';
import FormField from '../../../components/forms/FormField';
import FormAlert from '../../../components/forms/FormAlert';
import SubmitButton from '../../../components/forms/SubmitButton';
import { useToast } from '../../../lib/useToast';
import { useFormValidation } from '../../../lib/useFormValidation';
import { validators } from '../../../lib/validate';

export default function CreateEvent() {
    const router = useRouter();
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const { toast, showToast } = useToast();

    const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
        {
            title: '',
            type: 'Webinar',
            date: '',
            time: '',
            venue: '',
            organizer: '',
            description: '',
            maxParticipants: '',
        },
        {
            title: [validators.required()],
            date: [validators.required()],
            time: [validators.required()],
            venue: [validators.required()],
            organizer: [validators.required()],
            description: [validators.required(), validators.minLength(10)],
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        if (!validateAll()) return;

        setLoading(true);
        try {
            const data = new FormData();
            Object.entries(values).forEach(([key, val]) => data.append(key, val));
            if (image) data.append('file', image);

            await api.post('/events/create', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showToast('Event created successfully!', 'success');
            setTimeout(() => router.push('/dashboard/admin'), 1200);
        } catch {
            setServerError('Failed to create event. Please check all fields and try again.');
        } finally {
            setLoading(false);
        }
    };

    const typeOptions = [
        { value: 'Webinar', label: 'Webinar' },
        { value: 'Workshop', label: 'Workshop' },
        { value: 'Seminar', label: 'Seminar' },
        { value: 'Conference', label: 'Conference' },
        { value: 'Hackathon', label: 'Hackathon' },
    ];

    return (
        <div className="min-h-screen bg-[#0b0f19] pb-20">
            <Head><title>Create Event | Admin</title></Head>
            <Navbar />
            <Toast toast={toast} />

            <FormPage
                title="Create Event"
                subtitle="Publish an institutional event for students and faculty"
                action={
                    <Link href="/dashboard/admin" className="text-xs font-bold text-blue-400 uppercase tracking-wider hover:text-blue-300">
                        ← Dashboard
                    </Link>
                }
            >
                {serverError && <FormAlert>{serverError}</FormAlert>}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <FormField
                        label="Event Title"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        onBlur={() => handleBlur('title')}
                        error={errors.title}
                        required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                            label="Type"
                            name="type"
                            type="select"
                            value={values.type}
                            onChange={handleChange}
                            options={typeOptions}
                        />
                        <FormField
                            label="Max Participants"
                            name="maxParticipants"
                            type="number"
                            value={values.maxParticipants}
                            onChange={handleChange}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                            label="Date"
                            name="date"
                            type="date"
                            value={values.date}
                            onChange={handleChange}
                            onBlur={() => handleBlur('date')}
                            error={errors.date}
                            required
                        />
                        <FormField
                            label="Time"
                            name="time"
                            type="time"
                            value={values.time}
                            onChange={handleChange}
                            onBlur={() => handleBlur('time')}
                            error={errors.time}
                            required
                        />
                    </div>

                    <FormField
                        label="Venue (or URL)"
                        name="venue"
                        value={values.venue}
                        onChange={handleChange}
                        onBlur={() => handleBlur('venue')}
                        error={errors.venue}
                        required
                    />

                    <FormField
                        label="Organizer (Dept / Club)"
                        name="organizer"
                        value={values.organizer}
                        onChange={handleChange}
                        onBlur={() => handleBlur('organizer')}
                        error={errors.organizer}
                        required
                    />

                    <FormField
                        label="Description"
                        name="description"
                        type="textarea"
                        value={values.description}
                        onChange={handleChange}
                        onBlur={() => handleBlur('description')}
                        error={errors.description}
                        required
                    />

                    <FormField
                        label="Banner Image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage((e.target as HTMLInputElement).files?.[0] || null)}
                    />

                    <SubmitButton loading={loading} loadingText="Creating event...">
                        Create Event
                    </SubmitButton>
                </form>
            </FormPage>
        </div>
    );
}
