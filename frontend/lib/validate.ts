export type Validator = (value: string) => string | null;

export const validators = {
  required: (message = 'This field is required'): Validator => (value) =>
    value?.trim() ? null : message,

  email: (message = 'Enter a valid email address'): Validator => (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message,

  minLength: (min: number, message?: string): Validator => (value) =>
    value.length >= min ? null : message || `Must be at least ${min} characters`,

  usn: (message = 'Enter a valid USN (e.g. 1MS22CSE001)'): Validator => (value) =>
    /^[0-9][A-Za-z]{2}[0-9]{2}[A-Za-z]{3}[0-9]{3}$/i.test(value.trim()) ? null : message,

  url: (message = 'Enter a valid URL'): Validator => (value) => {
    if (!value?.trim()) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return message;
    }
  },

  pdfFile: (message = 'Only PDF files are allowed'): Validator => () => null, // validated separately on file object
};

export function runValidators(
  values: Record<string, string>,
  rules: Record<string, Validator[]>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const err = rule(values[field] ?? '');
      if (err) {
        errors[field] = err;
        break;
      }
    }
  }
  return errors;
}
