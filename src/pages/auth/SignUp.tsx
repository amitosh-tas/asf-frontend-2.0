import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  registerCompany,
  type RegisterCompanyCredentials,
} from "@/services/authService";
import { restoreSession } from "@/services/restoreSession";
import { useAppDispatch } from "@/app/hooks";
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
import PlanCards from "@/features/billing/components/PlanCards";
import {
  getAvailablePlans,
  type BillingInterval,
  type Plan,
} from "@/services/billingService";

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
  // dataRegion: "",
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState("");
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  useEffect(() => {
    let active = true;
    void getAvailablePlans()
      .then((availablePlans) => {
        if (active) {
          setPlans(availablePlans);
          setSelectedTier(availablePlans[0]?.tier ?? "");
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(getRequestErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setPlansLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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

    if (!selectedTier) {
      setError("Choose a plan before creating your account.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: RegisterCompanyCredentials = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        adminName: form.adminName.trim(),
        country: form.country,
        timezone: form.timezone,
        currency: form.currency,
        industry: form.industry,
        // dataRegion: form.dataRegion,
        websiteUrl: form.websiteUrl.trim() || undefined,
        weekStart: Number(form.weekStart),
        tier: selectedTier,
        interval,
      };

      const result = await registerCompany(payload);
      if (typeof result?.checkoutUrl === "string") {
        window.location.assign(result.checkoutUrl);
        return;
      }
      await restoreSession(dispatch);
      setDone({
        message: result?.message ?? "Your account has been created. Check your inbox to continue.",
        approvalRequired: result?.approvalRequired,
      });
    } catch (err) {
      setError(getRequestErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="cursor-default min-h-dvh w-full bg-page-background px-4 py-8 text-text sm:px-6 sm:py-12">
      <main className="mx-auto w-full max-w-6xl rounded-3xl border border-border bg-card px-5 py-8 shadow-lg sm:px-10 sm:py-10">
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

              <section className="flex flex-col gap-5">
                <div>
                  <h2 className={sectionTitleClass}>Choose your plan</h2>
                  <p className={sectionDescriptionClass}>
                    Plans and pricing are provided by the billing service. Your workspace is created only after the backend verifies payment.
                  </p>
                </div>
                <div className="flex gap-2">
                  {(["monthly", "annually"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={interval === value ? "primary" : "outline"}
                      onClick={() => setInterval(value)}
                    >
                      {value === "monthly" ? "Monthly" : "Annually"}
                    </Button>
                  ))}
                </div>
                {plansLoading ? (
                  <p className="text-sm text-text-muted">Loading available plans...</p>
                ) : plans.length === 0 ? (
                  <Alert>No plans are currently available. Please try again later.</Alert>
                ) : (
                  <PlanCards
                    plans={plans}
                    interval={interval}
                    selectedTier={selectedTier}
                    actionLabel={() => "Select plan"}
                    onSelect={setSelectedTier}
                    onAction={(plan) => setSelectedTier(plan.tier)}
                  />
                )}
              </section>

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