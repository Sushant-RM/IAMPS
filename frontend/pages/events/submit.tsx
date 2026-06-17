import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import { FormPage } from '../../components/forms/FormCard';
import FormField from '../../components/forms/FormField';
import FormAlert from '../../components/forms/FormAlert';
import SubmitButton from '../../components/forms/SubmitButton';
import { useFormValidation } from '../../lib/useFormValidation';
import { validators } from '../../lib/validate';

export default function SubmitEvent() {
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const router = useRouter();

    const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
        {
            title: '',
            type: 'Hackathon',
            organizer: '',
            date: '',
            venue: '',
            outcome: 'Participation',
            teamMembers: '',
            description: '',
        },
        {
            title: [validators.required()],
            organizer: [validators.required()],
            date: [validators.required('Date is required')],
            venue: [validators.required()],
        }
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        setFileError('');
        if (!selected) {
            setFile(null);
            return;
        }
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(selected.type)) {
            setFileError('Only PDF or image files are allowed (max 5 MB)');
            setFile(null);
            return;
        }
        if (selected.size > 5 * 1024 * 1024) {
            setFileError('File must be under 5 MB');
            setFile(null);
            return;
        }
        setFile(selected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        if (!validateAll()) return;

        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, val]) => {
                if (key === 'teamMembers') {
                    const members = val.split(',').map((m) => m.trim()).filter(Boolean);
                    formData.append('teamMembers', JSON.stringify(members));
                } else {
                    formData.append(key, val);
                }
            });
            if (file) formData.append('certificate', file);

            await api.post('/events', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            router.push('/events/my');
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const typeOptions = [
        { value: 'Hackathon', label: 'Hackathon' },
        { value: 'Workshop', label: 'Workshop' },
        { value: 'Conference', label: 'Conference' },
        { value: 'Competition', label: 'Competition' },
    ];

    return (
        <div className="min-h-screen bg-[#0b0f19] pb-20">
            <Navbar />
            <FormPage title="Submit Event Proof" subtitle="Record external event participation with certificate evidence">
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
                            label="Date"
                            name="date"
                            type="date"
                            value={values.date}
                            onChange={handleChange}
                            onBlur={() => handleBlur('date')}
                            error={errors.date}
                            required
                        />
                    </div>

                    <FormField
                        label="Organizer / Institution"
                        name="organizer"
                        value={values.organizer}
                        onChange={handleChange}
                        onBlur={() => handleBlur('organizer')}
                        error={errors.organizer}
                        required
                    />

                    <FormField
                        label="Venue / Location"
                        name="venue"
                        value={values.venue}
                        onChange={handleChange}
                        onBlur={() => handleBlur('venue')}
                        error={errors.venue}
                        required
                    />

                    <FormField
                        label="Team Members"
                        name="teamMembers"
                        value={values.teamMembers}
                        onChange={handleChange}
                        placeholder="Comma separated names (optional)"
                    />

                    <FormField
                        label="Outcome / Achievement"
                        name="outcome"
                        value={values.outcome}
                        onChange={handleChange}
                        placeholder="e.g. 1st Prize, Certified"
                    />

                    <FormField
                        label="Description"
                        name="description"
                        type="textarea"
                        value={values.description}
                        onChange={handleChange}
                        rows={3}
                    />

                    <FormField
                        label="Upload Certificate / Proof"
                        name="certificate"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        error={fileError}
                        hint="PDF or image, max 5 MB"
                    />

                    <SubmitButton loading={loading} loadingText="Submitting...">
                        Submit Participation
                    </SubmitButton>
                </form>
            </FormPage>
        </div>
    );
}
