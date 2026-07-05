export type ValidationMessages = Record<string, string | ((error: unknown) => string)>;

export const DEFAULT_VALIDATION_MESSAGES: ValidationMessages = {
  required: 'This field is required.',
  email: 'Enter a valid email address.',
  minlength: (error) => `Must be at least ${(error as { requiredLength: number }).requiredLength} characters.`,
  maxlength: (error) => `Must be no more than ${(error as { requiredLength: number }).requiredLength} characters.`,
  passwordComplexity: 'Must be 8+ characters with an uppercase letter, lowercase letter, number, and symbol.',
  pattern: 'Invalid format.',
};
