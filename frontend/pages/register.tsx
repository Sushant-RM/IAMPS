import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../lib/api';
import FormCard from '../components/forms/FormCard';
import FormField from '../components/forms/FormField';
import FormAlert from '../components/forms/FormAlert';
import SubmitButton from '../components/forms/SubmitButton';
import { useFormValidation } from '../lib/useFormValidation';
import { validators } from '../lib/validate';

interface Department {
    _id: string;
    name: string;
}

export default function Register() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
        { fullName: '', email: '', password: '', role: 'student', departmentId: '' },
        {
            fullName: [validators.required('Full name is required'), validators.minLength(2)],
            email: [validators.required(), validators.email()],
            password: [validators.required(), validators.minLength(6, 'Password must be at least 6 characters')],
            departmentId: [validators.required('Please select a department')],
        }
    );

    useEffect(() => {
        api.get('/departments').then((res) => setDepartments(res.data)).catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        if (!validateAll()) return;

        setLoading(true);
        try {
            await api.post('/auth/register', values);
            router.push('/login');
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const deptOptions = [
        { value: '', label: 'Select Department' },
        ...departments.map((d) => ({ value: d._id, label: d.name })),
    ];

    const roleOptions = [
        { value: 'student', label: 'Student' },
        { value: 'faculty', label: 'Faculty' },
        { value: 'alumni', label: 'Alumni' },
        { value: 'admin', label: 'Admin' },
    ];

    return (
        <FormCard title="Create Account" subtitle="Join the research community">
            {serverError && <FormAlert>{serverError}</FormAlert>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <FormField
                    label="Full Name"
                    name="fullName"
                    value={values.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    error={errors.fullName}
                    placeholder="John Doe"
                    required
                />

                <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    error={errors.email}
                    placeholder="john@college.edu"
                    required
                />

                <FormField
                    label="Password"
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    error={errors.password}
                    placeholder="Minimum 6 characters"
                    required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        label="Role"
                        name="role"
                        type="select"
                        value={values.role}
                        onChange={handleChange}
                        options={roleOptions}
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

                <SubmitButton loading={loading} loadingText="Creating account...">
                    Create Account
                </SubmitButton>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                    Sign In
                </Link>
            </p>
        </FormCard>
    );
}
