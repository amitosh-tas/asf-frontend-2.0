import { getMe, loginUser } from "@/services/authService";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch } from "@/app/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
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

  async function handleSignIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await loginUser(formData);
      const user = await getMe();
      dispatch(setCredentials(user))
      toast.success("Signed in successfully.");
    } catch (e) {
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

            <Button
              type="submit"
              loading={isLoading}
              className="mt-2 w-full"
            >
              Sign in
            </Button>
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