import { useState, useCallback } from 'react';
import { runValidators, type Validator } from './validate';

export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  rules: Record<string, Validator[]>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((name: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const fieldErrors = runValidators({ [name as string]: value } as Record<string, string>, {
        [name as string]: rules[name as string] || [],
      });
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name as string] }));
    }
  }, [touched, rules]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setValue(name as keyof T, value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const fieldErrors = runValidators(
        { [name as string]: values[name] } as Record<string, string>,
        { [name as string]: rules[name as string] || [] }
      );
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name as string] }));
    },
    [values, rules]
  );

  const validateAll = useCallback(() => {
    const allErrors = runValidators(values as Record<string, string>, rules);
    setErrors(allErrors as Partial<Record<keyof T, string>>);
    setTouched(
      Object.keys(rules).reduce((acc, key) => ({ ...acc, [key]: true }), {} as Partial<Record<keyof T, boolean>>)
    );
    return Object.keys(allErrors).length === 0;
  }, [values, rules]);

  const clearErrors = useCallback(() => setErrors({}), []);

  return {
    values,
    errors,
    touched,
    setValues,
    setValue,
    handleChange,
    handleBlur,
    validateAll,
    clearErrors,
    setErrors,
  };
}
