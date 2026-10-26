import { getMe, loginUser, resendVerification, verifyTwoFactor } from "@/services/authService";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch } from "@/app/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import { getRequestErrorData, getRequestErrorMessage } from "@/features/reports/utils/requestError";
import Title from "@/components/ui/Title";

interface ISignInData {
  api?: string,
  email: string;
  password: string;
}

function SignIn() {

  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<ISignInData>({
    api: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  async function handleSignIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (challenge) {
        await verifyTwoFactor(challenge, code);
      } else {
        const result = await loginUser(formData);
        if (result.twoFactorRequired && result.challengeToken) {
          setChallenge(result.challengeToken);
          toast("Enter the 6-digit code from your authenticator app.");
          return;
        }
      }
      const user = await getMe();
      dispatch(setCredentials(user))
      toast.success("Signed in successfully.");
    } catch (e) {
      const { code: errorCode } = getRequestErrorData(e);
      setUnverified(errorCode === "email_unverified");
      if (errorCode === "workspace_pending") setNotice("Your company is waiting for approval. We'll email you as soon as it is live.");
      else if (errorCode === "email_unverified") setNotice("Verify your email address first. Check your inbox for the link.");
      else setNotice(null);
      toast.error(getRequestErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className=" cursor-default flex min-h-dvh w-full items-center justify-center bg-page-background px-4 py-10 text-text sm:px-6">
      <main className="w-full max-w-md rounded-3xl border border-border bg-card px-6 py-9 shadow-lg sm:px-10 sm:py-10">
        <div className="w-full">
          {/* Brand */}
          <div className="mb-12">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              <Title/>
              <span className="text-text-muted">.</span>
            </h1>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back
            </h2>

            <p className="mt-3 text-sm leading-6 text-text-muted">
              Sign in to access your revenue dashboard.
            </p>
          </div>

          {notice && (
            <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm">
              {notice}
              {unverified && (
                <button
                  type="button"
                  className="ml-2 font-semibold underline"
                  onClick={async () => {
                    try {
                      await resendVerification(formData.email.trim());
                      toast.success("If the account needs it, a new link is on its way.");
                    } catch (err) {
                      toast.error(getRequestErrorMessage(err));
                    }
                  }}
                >
                  Resend link
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="flex flex-col gap-7">
            {/* <div className="flex flex-col gap-2">
              <label htmlFor="email" className={labelClass}>
                Api Url
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="https://api.example.com"
                // required
                value={formData.api}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div> */}

            {challenge ? (
              <FormField label="Authentication code" htmlFor="code">
                <Input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                />
              </FormField>
            ) : (
              <>
            <FormField label="Email address" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Password" htmlFor="password">
              {/* <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // Connect your forgot-password flow here.
                  }}
                  className="text-xs font-medium text-text-muted transition hover:text-primary"
                >
                  Forgot password?
                </button>
              </div> */}

              <Input
                id="password"
                name="password"
                type="password"
                showPasswordToggle
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </FormField>

                <Link to="/forgot-password" className="-mt-4 self-end text-xs font-medium text-text-muted hover:text-primary">
                  Forgot password?
                </Link>
              </>
            )}

            <Button
              type="submit"
              loading={isLoading}
              className="mt-2 w-full"
            >
              {challenge ? "Verify" : "Sign in"}
            </Button>
            {challenge && (
              <button type="button" className="text-xs text-text-muted hover:text-primary" onClick={() => { setChallenge(null); setCode(""); }}>
                Use a different account
              </button>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-text-muted">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-text underline underline-offset-4 decoration-border hover:decoration-primary"
              >
                Create account
              </Link>
            </p>
          </div>

          <div className="mt-10 border-t border-border pt-5">
            <p className="text-center text-xs text-text-muted">
              Revenue management & analytics
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

export default SignIn;