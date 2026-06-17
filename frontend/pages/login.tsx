import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../lib/api';
import FormCard from '../components/forms/FormCard';
import FormField from '../components/forms/FormField';
import FormAlert from '../components/forms/FormAlert';
import SubmitButton from '../components/forms/SubmitButton';
import { useFormValidation } from '../lib/useFormValidation';
import { consumeAuthRedirect } from '../lib/auth';
import { getDashboardPath } from '../lib/navigation';
import { validators } from '../lib/validate';

export default function Login() {
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
        { email: '', password: '' },
        {
            email: [validators.required('Email or USN is required')],
            password: [validators.required('Password is required'), validators.minLength(4, 'Password is too short')],
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        if (!validateAll()) return;

        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email: values.email, password: values.password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            const role = res.data.user.role;
            const redirect = consumeAuthRedirect(getDashboardPath(role));
            router.push(redirect);
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Login failed. Please check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormCard
            title="Welcome Back"
            subtitle="Sign in to access your research portal"
            backHref="/"
            backLabel="Back to Home"
        >
            {serverError && <FormAlert>{serverError}</FormAlert>}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <FormField
                    label="Email Address or USN"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    error={errors.email}
                    hint="Faculty & Admin: use email. Students: use USN or email."
                    placeholder="Email or USN (e.g. 1MS22CSE001)"
                    required
                    autoComplete="username"
                />

                <FormField
                    label="Password"
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    error={errors.password}
                    placeholder="Enter your password"
                    required
                />

                <SubmitButton loading={loading} loadingText="Signing in...">
                    Sign In
                </SubmitButton>
            </form>

            <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-slate-400">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300">
                        Create Account
                    </Link>
                </p>
            </div>
        </FormCard>
    );
}
