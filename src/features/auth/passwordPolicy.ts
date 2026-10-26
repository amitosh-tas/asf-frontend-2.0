/** Mirrors the backend rule (utils/passwordPolicy.js): ≥10 characters, a letter and a digit, not the email. */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use at least one letter and one number.";
  if (email && password.toLowerCase().includes(email.toLowerCase().split("@")[0]) && email.split("@")[0].length >= 4) return "Don't use your email in the password.";
  return null;
}
