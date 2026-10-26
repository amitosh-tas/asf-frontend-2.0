import { useState } from "react";
import { Link } from "react-router-dom";
import {
  registerCompany,
  type RegisterCompanyCredentials,
} from "@/services/authService";
import { restoreSession } from "@/services/restoreSession";
import { useAppDispatch } from "@/app/hooks";
import toast from "react-hot-toast";
import CompanyDetailsFields, {
  type CompanyDetailsValues,
} from "@/components/workspace/CompanyDetailsFields";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Title from "@/components/ui/Title";
import Select from "@/components/ui/Select";
import { passwordProblem } from "@/features/auth/passwordPolicy";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";

interface SignUpForm extends CompanyDetailsValues {
  adminName: string;
  email: string;
  password: string;
  confirmPassword: string;
  websiteUrl: string;
  weekStart: string;
}

const initialForm: SignUpForm = {
  adminName: "",
  email: "",
  password: "",
  confirmPassword: "",
  websiteUrl: "",
  weekStart: "1",
  name: "",
  country: "",
  industry: "",
  timezone: "",
  dataRegion: "",
  currency: "",
  // paymentMethod: "",
};

const sectionTitleClass = "font-heading text-base font-semibold tracking-tight text-text";

const sectionDescriptionClass = "mt-1 text-sm leading-6 text-text-muted";

function SignUp() {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<SignUpForm>(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState<{ message: string; approvalRequired?: boolean } | null>(null);

  function updateField<K extends keyof SignUpForm>(
    field: K,
    value: SignUpForm[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  }

  async function handleSignUp(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const weak = passwordProblem(form.password, form.email);
    if (weak) {
      setError(weak);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Connect this to your backend signup endpoint.
      // Never send confirmPassword to the backend.
      const payload: RegisterCompanyCredentials = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        adminName: form.adminName.trim(),
        country: form.country,
        timezone: form.timezone,
        currency: form.currency,
        industry: form.industry,
        dataRegion: form.dataRegion,
        websiteUrl: form.websiteUrl.trim() || undefined,
        weekStart: Number(form.weekStart),
        // paymentMethod: form.paymentMethod.trim(),
      };

      const result = await registerCompany(payload);
      // The account can sign in once the email is confirmed (and, if required, the company approved).
      setDone({ message: result?.message ?? "Check your inbox to confirm your email address.", approvalRequired: result?.approvalRequired });
      toast.success("Your company account has been created.");
      void restoreSession(dispatch);
    } catch (err) {
      setError(getRequestErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="cursor-default min-h-dvh w-full bg-page-background px-4 py-8 text-text sm:px-6 sm:py-12">
      <main className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card px-5 py-8 shadow-lg sm:px-10 sm:py-10">
          <div className="w-full">
            {/* Brand */}
            <div className="mb-10">
              <Link
                to="/signin"
                className="font-heading text-2xl font-bold tracking-tight"
              >
                <Title/>
                <span className="text-text-muted">.</span>
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-10">
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Create your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-text-muted">
                Set up your company workspace and start tracking revenue.
              </p>
            </div>

            {done ? (
              <div className="flex flex-col gap-4 text-sm leading-6">
                <Alert variant="info">{done.message}</Alert>
                {done.approvalRequired && <p className="text-text-muted">After you confirm your email, our team reviews new companies. We'll email you when your dashboard is ready.</p>}
                <Link to="/signin" className="font-semibold underline underline-offset-4">Go to sign in</Link>
              </div>
            ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-9">
              {/* Account details */}
              <section className="flex flex-col gap-5">
                <div>
                  <h2 className={sectionTitleClass}>Account details</h2>
                  <p className={sectionDescriptionClass}>
                    Your personal login information.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <FormField label="Full name *" htmlFor="adminName">
                    <Input
                      id="adminName"
                      name="adminName"
                      type="text"
                      autoComplete="adminName"
                      placeholder="Your full name"
                      required
                      value={form.adminName}
                      onChange={(e) => updateField("adminName", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Work email *" htmlFor="email">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      required
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Password *" htmlFor="password">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      showPasswordToggle
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Confirm password *" htmlFor="confirmPassword">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      showPasswordToggle
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      minLength={8}
                      required
                      value={form.confirmPassword}
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                    />
                  </FormField>
                </div>
              </section>

              <div className="h-px bg-border" />

              <CompanyDetailsFields
                values={form}
                onChange={(field, value) => updateField(field, value)}
              />

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <FormField label="Website" htmlFor="websiteUrl">
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="text"
                    inputMode="url"
                    placeholder="www.yourcompany.com"
                    value={form.websiteUrl}
                    onChange={(e) => updateField("websiteUrl", e.target.value)}
                  />
                </FormField>
                <FormField label="Week starts on" htmlFor="weekStart">
                  <Select id="weekStart" value={form.weekStart} onChange={(e) => updateField("weekStart", e.target.value)} className="w-full">
                    <option value="1">Monday</option>
                    <option value="0">Sunday</option>
                    <option value="6">Saturday</option>
                  </Select>
                </FormField>
              </div>

              {/* Error */}
              {error && <Alert>{error}</Alert>}

              {/* Submit */}
              <Button
                type="submit"
                loading={isSubmitting}
                className="mt-1 w-full"
              >
                Create account
              </Button>
            </form>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-text-muted">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="font-semibold text-text underline underline-offset-4 decoration-border hover:decoration-primary"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-8 border-t border-border pt-5">
              <p className="text-center text-xs text-text-muted">
                Revenue management &amp; analytics
              </p>
            </div>
          </div>
      </main>
    </div>
  );
}

export default SignUp;