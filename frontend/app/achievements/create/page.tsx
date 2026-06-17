'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { FormPage } from '../../../components/forms/FormCard';
import FormField from '../../../components/forms/FormField';
import FormAlert from '../../../components/forms/FormAlert';
import SubmitButton from '../../../components/forms/SubmitButton';
import { useFormValidation } from '../../../lib/useFormValidation';
import { validators } from '../../../lib/validate';

const DEPT_OPTIONS = [
  { value: '', label: 'Select Department' },
  { value: 'CSE', label: 'CSE' },
  { value: 'ECE', label: 'ECE' },
  { value: 'ME', label: 'ME' },
  { value: 'CE', label: 'CE' },
  { value: 'EEE', label: 'EEE' },
  { value: 'CIVIL', label: 'CIVIL' },
  { value: 'IT', label: 'IT' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select Category' },
  { value: 'Academic', label: 'Academic' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Cultural', label: 'Cultural' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Research', label: 'Research' },
  { value: 'Social Service', label: 'Social Service' },
  { value: 'Other', label: 'Other' },
];

export default function CreateAchievementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
    {
      studentName: '',
      usn: '',
      department: '',
      achievementTitle: '',
      category: '',
      description: '',
      achievementDate: '',
      certificateLink: '',
    },
    {
      studentName: [validators.required()],
      usn: [validators.required()],
      department: [validators.required('Select a department')],
      achievementTitle: [validators.required()],
      category: [validators.required('Select a category')],
      description: [validators.required(), validators.minLength(10, 'Description must be at least 10 characters')],
      achievementDate: [validators.required('Achievement date is required')],
      certificateLink: [validators.url()],
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validateAll()) return;

    setLoading(true);
    try {
      await api.post('/achievements', values);
      router.push('/achievements');
      router.refresh();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Error creating achievement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage
      title="Add Achievement"
      subtitle="Submit a new student milestone for review"
      action={
        <Link href="/achievements" className="text-sm font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">
          ← Back
        </Link>
      }
    >
      {serverError && <FormAlert>{serverError}</FormAlert>}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            label="Student Name"
            name="studentName"
            value={values.studentName}
            onChange={handleChange}
            onBlur={() => handleBlur('studentName')}
            error={errors.studentName}
            required
          />
          <FormField
            label="USN"
            name="usn"
            value={values.usn}
            onChange={handleChange}
            onBlur={() => handleBlur('usn')}
            error={errors.usn}
            placeholder="e.g. 1MS22CSE001"
            required
          />
          <FormField
            label="Department"
            name="department"
            type="select"
            value={values.department}
            onChange={handleChange}
            onBlur={() => handleBlur('department')}
            error={errors.department}
            options={DEPT_OPTIONS}
            required
          />
          <FormField
            label="Category"
            name="category"
            type="select"
            value={values.category}
            onChange={handleChange}
            onBlur={() => handleBlur('category')}
            error={errors.category}
            options={CATEGORY_OPTIONS}
            required
          />
        </div>

        <FormField
          label="Achievement Title"
          name="achievementTitle"
          value={values.achievementTitle}
          onChange={handleChange}
          onBlur={() => handleBlur('achievementTitle')}
          error={errors.achievementTitle}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            label="Achievement Date"
            name="achievementDate"
            type="date"
            value={values.achievementDate}
            onChange={handleChange}
            onBlur={() => handleBlur('achievementDate')}
            error={errors.achievementDate}
            required
          />
          <FormField
            label="Certificate Link"
            name="certificateLink"
            type="url"
            value={values.certificateLink}
            onChange={handleChange}
            onBlur={() => handleBlur('certificateLink')}
            error={errors.certificateLink}
            placeholder="https://example.com/certificate"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <SubmitButton loading={loading} loadingText="Creating..." fullWidth={false} className="flex-1 w-full sm:w-auto">
            Create Achievement
          </SubmitButton>
          <Link
            href="/achievements"
            className="flex-1 text-center px-6 py-3.5 rounded-[12px] font-bold text-sm uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            Cancel
          </Link>
        </div>
      </form>
    </FormPage>
  );
}
