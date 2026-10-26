import { useState, type ReactNode } from "react";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { DocSection, SubHeading } from "../components/DocSection";
import { DocTable } from "../components/DocTable";
import { InlineCode } from "../components/InlineCode";
import { SDK_NAME } from "./meta";
import {
  CHECKOUT_SESSION_REQUEST,
  CHECKOUT_SESSION_RESPONSE,
  CONFIG_PLACEHOLDER,
  CONNECT_GATEWAY_REQUESTS,
  ERROR_RESPONSE,
  IDENTIFY_REQUEST,
  IDENTIFY_RESPONSE,
  INIT_CLI,
  INSTALL_NPM,
  INSTALL_PNPM,
  NON_NPM_SNIPPET,
  PAYMENT_BUTTON,
  READ_API_EXAMPLE,
  REACT_INIT,
  TOUCHES_REQUEST,
  TOUCHES_RESPONSE,
} from "./snippets";

const CHECKLIST_ITEMS = [
  "Install the package.",
  "Generate the config file.",
  "Configure the correct API endpoint and client-safe credentials.",
  "Initialize Elysium.",
  "Add the required payment-button class and data attributes.",
  "Verify payment amount units and supported gateway identifiers.",
  "Test the integration in the appropriate environment.",
] as const;

function Checklist() {
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());

  function toggle(index: number) {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <>
      <ul className="mt-4! list-none! pl-0!">
        {CHECKLIST_ITEMS.map((item, index) => {
          const inputId = `checklist-item-${index}`;
          return (
            <li key={item} className="pl-0!">
              <label
                htmlFor={inputId}
                className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked.has(index)}
                  onChange={() => toggle(index)}
                  className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer rounded border-neutral-300 accent-[#4f46e5]"
                />
                <span
                  className={
                    checked.has(index)
                      ? "text-neutral-500 line-through"
                      : "text-neutral-800"
                  }
                >
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-sm! text-neutral-500!">
        {checked.size} of {CHECKLIST_ITEMS.length} complete. Ticks are for your
        own tracking while reading and are not saved.
      </p>
    </>
  );
}

function TroubleshootingItem({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-neutral-200 bg-white open:bg-neutral-50/60">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3 text-[15px] font-medium text-neutral-900 marker:hidden [&::-webkit-details-marker]:hidden">
        {summary}
        <svg
          viewBox="0 0 20 20"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-neutral-500 transition-transform group-open:rotate-180"
        >
          <path d="m5 8 5 5 5-5" />
        </svg>
      </summary>
      <div className="border-t border-neutral-200 px-4 pb-4">{children}</div>
    </details>
  );
}

export function DocsPage() {
  return (
    <article className="mx-auto max-w-3xl">
      {/* 2. Introduction */}
      <section id="introduction" aria-labelledby="introduction-heading" className="scroll-mt-24">
        <p className="text-sm font-medium text-accent">Developer documentation</p>
        <h1
          id="introduction-heading"
          className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-[2.5rem]"
        >
          {SDK_NAME}
        </h1>
        <p className="mt-3 text-lg leading-8 text-neutral-600">
          Integrate attribution tracking and payment flows into your application.
        </p>

        <div className="prose-doc">
          <p>
            With Elysium you install the SDK, configure your project, initialize
            Elysium when your app starts, and attach payment handling to the
            buttons you choose. This guide walks through each step in order.
          </p>

          <ol className="mt-5! grid list-none gap-2 pl-0! sm:grid-cols-2">
            {[
              { href: "#installation", label: "Install the package" },
              { href: "#initialize-configuration", label: "Generate the configuration file" },
              { href: "#initialize-sdk", label: "Initialize the SDK in React" },
              { href: "#payment-button", label: "Add a payment button" },
            ].map((step, index) => (
              <li key={step.href} className="mt-0! pl-0!">
                <a
                  href={step.href}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700"
                  >
                    {index + 1}
                  </span>
                  {step.label}
                </a>
              </li>
            ))}
          </ol>

          <Callout variant="note" title="Not using npm?">
            <p>
              On platforms like Shopify or WordPress you can skip the package
              and call the HTTP API directly. See{" "}
              <a href="#non-npm-sites">Sites without npm</a>.
            </p>
          </Callout>

          <Callout variant="confirm" title="Items marked “Needs confirmation”">
            <p>
              This page documents the integration flow. Details that are defined
              by the SDK itself, such as configuration options, supported gateway
              identifiers, and amount units, are not listed as fact until they
              have been verified against the SDK source. They are flagged where
              they come up.
            </p>
          </Callout>
        </div>
      </section>

      {/* 3. Installation */}
      <DocSection id="installation" title="Installation">
        <p>
          Add the <InlineCode>elysium-attribution</InlineCode> package to your
          project with your package manager.
        </p>
        <CodeBlock title="pnpm" language="bash" code={INSTALL_PNPM} />
        <CodeBlock title="npm" language="bash" code={INSTALL_NPM} />
      </DocSection>

      {/* 4. Initialize the configuration */}
      <DocSection id="initialize-configuration" title="Initialize the configuration">
        <p>
          Run the Elysium CLI from your project to generate the configuration
          file:
        </p>
        <CodeBlock language="bash" code={INIT_CLI} />
        <p>
          The command creates <InlineCode>elysium.config.js</InlineCode> in your
          project. Open it and set the API URL, your credentials, and any other
          required options, following the layout of the generated template.
        </p>
        <Callout variant="confirm" title="Needs confirmation: generated file contents and location">
          <p>
            This page does not list individual configuration options, because the
            generated template has not been verified. Use the file the CLI
            creates as the source of truth. The examples here assume it sits in
            the project root, one level above <InlineCode>src/</InlineCode>;
            confirm where the CLI actually writes it.
          </p>
        </Callout>
      </DocSection>

      {/* 5. Initialize the SDK in React */}
      <DocSection id="initialize-sdk" title="Initialize the SDK in React">
        <p>
          Import the SDK and your configuration, then initialize Elysium once
          when your root component mounts.
        </p>
        <CodeBlock language="tsx" code={REACT_INIT} />
        <ul>
          <li>
            Import the SDK (<InlineCode>elysium-attribution</InlineCode>) and the
            configuration file you generated.
          </li>
          <li>
            Call <InlineCode>Elysium.init(elysiumConfig)</InlineCode> when the
            component mounts. The empty dependency array in{" "}
            <InlineCode>useEffect</InlineCode> runs the call on mount.
          </li>
          <li>
            Adjust the <InlineCode>../elysium.config.js</InlineCode> import path
            to match where the file lives relative to your component.
          </li>
          <li>
            Avoid exposing secret server-side credentials in frontend code.
          </li>
        </ul>
        <Callout variant="warning" title="Frontend code is public">
          <p>
            Anything bundled into your frontend can be read by anyone who loads
            your site. Keep server-side secrets out of{" "}
            <InlineCode>elysium.config.js</InlineCode> and out of your client
            code, and only configure values that are safe to ship to the browser.
          </p>
        </Callout>
      </DocSection>

      {/* 6. Add a payment button */}
      <DocSection id="payment-button" title="Add a payment button">
        <p>
          The SDK identifies payment buttons by the{" "}
          <InlineCode>elysium-payment-button</InlineCode> class. Add the class to
          a button and describe the payment with <InlineCode>data-*</InlineCode>{" "}
          attributes.
        </p>
        <CodeBlock language="tsx" code={PAYMENT_BUTTON} highlightAs="xml" />
        <p>
          The Tailwind utilities in this example only style the button. The
          parts the SDK reads are the{" "}
          <InlineCode>elysium-payment-button</InlineCode> class and the{" "}
          <InlineCode>data-gateway</InlineCode>,{" "}
          <InlineCode>data-amount</InlineCode>, and{" "}
          <InlineCode>data-currency</InlineCode> attributes.
        </p>

        <SubHeading id="button-attributes" title="Button attributes" />
        <DocTable
          caption="Payment button attributes"
          columns={["Attribute", "Purpose", "Example"]}
          rows={[
            [
              <InlineCode key="a">class</InlineCode>,
              <>
                Identifies the button to the SDK through{" "}
                <InlineCode>elysium-payment-button</InlineCode>.
              </>,
              <InlineCode key="e">elysium-payment-button</InlineCode>,
            ],
            [
              <InlineCode key="a">data-gateway</InlineCode>,
              "Selects the payment gateway.",
              <InlineCode key="e">razorpay</InlineCode>,
            ],
            [
              <InlineCode key="a">data-amount</InlineCode>,
              "Specifies the payment amount.",
              <InlineCode key="e">1499</InlineCode>,
            ],
            [
              <InlineCode key="a">data-currency</InlineCode>,
              "Specifies the currency.",
              <InlineCode key="e">INR</InlineCode>,
            ],
          ]}
        />
        <p>
          In JSX you write <InlineCode>className</InlineCode>; React renders it
          as the HTML <InlineCode>class</InlineCode> attribute.
        </p>

        <SubHeading id="amount-and-gateways" title="Amount units and gateways" />
        <Callout variant="warning" title="Verify amount units before going live">
          <p>
            Do not assume what unit <InlineCode>data-amount</InlineCode> expects.
            A value like <InlineCode>1499</InlineCode> could be read as a whole
            currency amount or as a smaller sub-unit (for example rupees versus
            paise). Check the SDK implementation, then test with a small amount
            in a non-production environment.
          </p>
        </Callout>
        <Callout variant="confirm" title="Needs confirmation: supported gateways">
          <p>
            <InlineCode>razorpay</InlineCode> is the gateway used in the example.
            The full list of supported <InlineCode>data-gateway</InlineCode>{" "}
            identifiers has not been verified, so confirm it against the SDK
            before relying on any other value.
          </p>
        </Callout>
      </DocSection>


      {/* 7. Sites without npm */}
      <DocSection id="non-npm-sites" title="Sites without npm (Shopify, WordPress)">
        <p>
          If your site cannot install the npm package, such as a Shopify store
          or a WordPress site, send tracking data straight to the HTTP API from
          the browser. Three endpoints cover the browser side of tracking:
        </p>
        <DocTable
          caption="Browser tracking endpoints"
          columns={["Endpoint", "Call it when", "Returns"]}
          rows={[
            [
              <InlineCode key="a">POST /v1/touches</InlineCode>,
              "A visitor views a page or lands from an ad.",
              "The recorded touch and its channel.",
            ],
            [
              <InlineCode key="a">POST /v1/identify</InlineCode>,
              "A visitor submits a form or signs in with an email or phone.",
              "The customer ID the visitor is linked to.",
            ],
            [
              <InlineCode key="a">POST /v1/checkout-sessions</InlineCode>,
              "A visitor is about to check out or pay.",
              "A token that freezes the visitor’s touches.",
            ],
          ]}
        />

        <SubHeading id="api-setup" title="Before you start" />
        <ul>
          <li>
            <strong>Base URL.</strong> Local development uses{" "}
            <InlineCode>http://localhost:5000</InlineCode>. In production, use
            the API URL for your deployment. Examples below write it as{" "}
            <InlineCode>https://api.yourdomain.com</InlineCode>.
          </li>
          <li>
            <strong>Register your site.</strong> Add and verify your domain as
            a site in the dashboard. Browser requests are checked against the
            allowed origins registered on the site and its API key, so your
            store’s origin (for example{" "}
            <InlineCode>https://example.com</InlineCode>) must be listed.
          </li>
          <li>
            <strong>Use a publishable key.</strong> Send it as{" "}
            <InlineCode>Authorization: Bearer &lt;API_KEY&gt;</InlineCode> or{" "}
            <InlineCode>X-Api-Key: &lt;API_KEY&gt;</InlineCode>. Publishable
            keys start with <InlineCode>pk_live_</InlineCode> or{" "}
            <InlineCode>pk_test_</InlineCode>.
          </li>
          <li>
            <strong>Send JSON.</strong> Set{" "}
            <InlineCode>Content-Type: application/json</InlineCode>.
          </li>
        </ul>
        <Callout variant="warning" title="Never put a secret key in theme or page code">
          <p>
            Anything in a Shopify theme or WordPress page is public. Secret
            keys (<InlineCode>sk_…</InlineCode>) are the only keys that can
            issue refunds, edit records and read your data, so they must stay
            on your server. Use only a publishable key in the browser.
          </p>
        </Callout>
        <p>Errors use a single shape:</p>
        <CodeBlock title="Error response" language="json" code={ERROR_RESPONSE} />
        <Callout variant="confirm" title="Needs confirmation: required fields and error codes">
          <p>
            The API specification lists example request bodies but does not
            state which fields are required, nor the status codes for failed
            origin or key checks. Confirm both against the API before launch.
          </p>
        </Callout>

        <SubHeading id="endpoint-touches" title="POST /v1/touches" />
        <p>
          Records one touch. Call it on every page view or ad landing. The
          server assigns the marketing channel (for example{" "}
          <InlineCode>paid_search</InlineCode>) and returns it.
        </p>
        <DocTable
          caption="Touch request fields"
          columns={["Field", "Description", "Example"]}
          rows={[
            [<InlineCode key="a">visitorId</InlineCode>, "Anonymous visitor ID that you generate and keep in localStorage.", <InlineCode key="e">3f0c1b6e-…</InlineCode>],
            [<InlineCode key="a">touchedAt</InlineCode>, "When the touch happened, as an ISO 8601 timestamp.", <InlineCode key="e">2026-03-01T15:30:00.000Z</InlineCode>],
            [<InlineCode key="a">source</InlineCode>, "UTM source.", <InlineCode key="e">google</InlineCode>],
            [<InlineCode key="a">medium</InlineCode>, "UTM medium.", <InlineCode key="e">cpc</InlineCode>],
            [<InlineCode key="a">campaign</InlineCode>, "UTM campaign.", <InlineCode key="e">summer_sale</InlineCode>],
            [<InlineCode key="a">term</InlineCode>, "UTM term.", <InlineCode key="e">running shoes</InlineCode>],
            [<InlineCode key="a">content</InlineCode>, "UTM content.", <InlineCode key="e">ad_variant_1</InlineCode>],
            [<InlineCode key="a">referrer</InlineCode>, "The referring URL.", <InlineCode key="e">https://google.com</InlineCode>],
            [<InlineCode key="a">landingPage</InlineCode>, "Full URL of the page, including query string.", <InlineCode key="e">https://example.com/shoes?…</InlineCode>],
            [<InlineCode key="a">pageTitle</InlineCode>, "The page title.", <InlineCode key="e">Shoes Collection | Acme</InlineCode>],
            [
              <>
                <InlineCode key="a">gclid</InlineCode>,{" "}
                <InlineCode key="b">fbclid</InlineCode>,{" "}
                <InlineCode key="c">ttclid</InlineCode>,{" "}
                <InlineCode key="d">msclkid</InlineCode>
              </>,
              "Ad click IDs from the landing URL. Send null when absent.",
              <InlineCode key="e">Cj0KCQjwp…</InlineCode>,
            ],
            [
              <>
                <InlineCode key="a">fbc</InlineCode>,{" "}
                <InlineCode key="b">fbp</InlineCode>,{" "}
                <InlineCode key="c">ga</InlineCode>
              </>,
              "Values from the Meta and Google Analytics cookies, when present.",
              <InlineCode key="e">_fbp.1.12345678</InlineCode>,
            ],
          ]}
        />
        <CodeBlock title="Request" language="bash" code={TOUCHES_REQUEST} />
        <CodeBlock title="Response · 201 Created" language="json" code={TOUCHES_RESPONSE} />

        <SubHeading id="endpoint-identify" title="POST /v1/identify" />
        <p>
          Links an anonymous <InlineCode>visitorId</InlineCode> to a
          customer’s email or phone. Call it when the visitor submits a form or
          signs in, so earlier touches belong to that customer.
        </p>
        <CodeBlock title="Request body" language="json" code={IDENTIFY_REQUEST} />
        <CodeBlock title="Response · 200 OK" language="json" code={IDENTIFY_RESPONSE} />
        <p>
          <InlineCode>isNew</InlineCode> is <InlineCode>false</InlineCode> when
          the customer already existed.
        </p>

        <SubHeading id="endpoint-checkout-sessions" title="POST /v1/checkout-sessions" />
        <p>
          Freezes the visitor’s current marketing touches into a snapshot and
          returns a token. Create one just before checkout or payment and
          attach the token to that session.
        </p>
        <DocTable
          caption="Checkout session request fields"
          columns={["Field", "Description", "Example"]}
          rows={[
            [<InlineCode key="a">visitorId</InlineCode>, "The visitor whose touches are frozen.", <InlineCode key="e">3f0c1b6e-…</InlineCode>],
            [<InlineCode key="a">expiresInMs</InlineCode>, "How long the token stays valid, in milliseconds.", <InlineCode key="e">7200000</InlineCode>],
          ]}
        />
        <CodeBlock title="Request body" language="json" code={CHECKOUT_SESSION_REQUEST} />
        <CodeBlock title="Response · 201 Created" language="json" code={CHECKOUT_SESSION_RESPONSE} />
        <p>
          When the order is later ingested through{" "}
          <InlineCode>/v1/orders</InlineCode>, send this token as{" "}
          <InlineCode>checkoutToken</InlineCode> so the order is tied to the
          frozen touches. Ingesting orders is typically done from your server
          or a connector, not from the browser.
        </p>
        <Callout variant="note" title="Carrying the token through checkout">
          <p>
            Store the token in the payment system&apos;s extra data so it reaches
            the order, for example Stripe metadata or Razorpay notes. The exact
            field for each gateway is listed in{" "}
            <a className="underline" href="#gateway-token">
              Where to put the checkout token
            </a>
            .
          </p>
        </Callout>

        <SubHeading id="non-npm-example" title="Putting it together" />
        <p>
          This snippet creates the visitor ID, records a touch on each page
          load, and exposes helpers for the other two calls. Paste it where
          your platform lets you add a script to every page: the theme layout
          file on Shopify, or a header and footer scripts plugin or your theme
          on WordPress.
        </p>
        <CodeBlock title="Site-wide script" language="html" code={NON_NPM_SNIPPET} />
        <p>
          Then call the helpers where they apply, for example{" "}
          <InlineCode>ElysiumDirect.identify(email)</InlineCode> after a form
          submit and{" "}
          <InlineCode>ElysiumDirect.createCheckoutSession()</InlineCode> just
          before checkout.
        </p>
      </DocSection>

      {/* Payment gateways */}
      <DocSection id="payment-gateways" title="Connect your payment gateway">
        <p>
          Connect Stripe, PayPal or Razorpay from{" "}
          <strong>Settings → Connectors</strong>. Once connected, paid orders and
          refunds arrive automatically and are matched to the visitor&apos;s marketing
          touches.
        </p>

        <SubHeading id="gateway-connect" title="One-click connect" />
        <DocTable
          caption="How each gateway connects"
          columns={["Gateway", "What you provide", "What happens"]}
          rows={[
            ["Stripe", "A secret or restricted API key", "We create the webhook in Stripe and store its signing secret. Your key is used once and never stored. A restricted key needs Write access to Webhook Endpoints."],
            ["PayPal", "Environment, client ID and client secret", "We create the webhook in PayPal. The credentials are stored encrypted to verify each event."],
            ["Razorpay", "Nothing", "Razorpay only lets partner accounts create webhooks through its API, so we generate a URL and secret. Add them in Razorpay Dashboard → Account & Settings → Webhooks. The secret is shown once."],
          ]}
        />
        <CodeBlock title="What the dashboard sends" language="bash" code={CONNECT_GATEWAY_REQUESTS} />
        <p>
          A new connector shows <strong>Waiting for first event</strong> until the
          first signed event arrives, then <strong>Healthy</strong>. Use{" "}
          <strong>Details → Run health check</strong> to confirm the webhook is set
          up correctly, and the <strong>Event log</strong> to see failed events and
          replay them. Replaying is safe: an order or refund is never counted twice.
        </p>
        <Callout variant="note" title="The server must be reachable over HTTPS">
          <p>
            Payment gateways only deliver webhooks to a public HTTPS address. If the
            dashboard says gateway setup is unavailable, ask your administrator to
            configure the server&apos;s public URL.
          </p>
        </Callout>

        <SubHeading id="gateway-token" title="Where to put the checkout token" />
        <DocTable
          caption="Checkout token field per gateway"
          columns={["System", "Put the token in"]}
          rows={[
            ["Stripe PaymentIntent", <InlineCode key="a">metadata.attribution_token</InlineCode>],
            ["Stripe Checkout Session", <InlineCode key="b">payment_intent_data.metadata.attribution_token</InlineCode>],
            ["Razorpay", <InlineCode key="c">notes.attribution_token</InlineCode>],
            ["PayPal", <InlineCode key="d">custom_id</InlineCode>],
            ["Shopify", "A cart or note attribute named attribution_token"],
            ["Your own server", <InlineCode key="e">checkoutToken in POST /v1/orders</InlineCode>],
          ]}
        />
        <p>
          Without a token the platform falls back to matching by email, phone or click
          ID, which is less reliable. Orders show how they were matched.
        </p>

        <SubHeading id="reading-data" title="Reading your data" />
        <p>
          Reports and lists can be read from your server with a{" "}
          <strong>secret key</strong>. Publishable keys are rejected. Dates such as{" "}
          <InlineCode>2026-03-01</InlineCode> mean whole days in your company&apos;s
          timezone, and <InlineCode>to</InlineCode> includes the entire last day.
        </p>
        <CodeBlock title="Example" language="bash" code={READ_API_EXAMPLE} />
      </DocSection>

      {/* 7. Configuration reference */}
      <DocSection id="configuration-reference" title="Configuration reference">
        <p>
          Elysium is configured through <InlineCode>elysium.config.js</InlineCode>,
          which you pass to <InlineCode>Elysium.init</InlineCode>. The exact
          options are defined by the file that <InlineCode>npx elysium init</InlineCode>{" "}
          generates.
        </p>
        <Callout variant="confirm" title="Needs confirmation: option names and types">
          <p>
            The configuration options are not documented here yet. Replace the
            placeholder below with the real fields once they are confirmed against
            the SDK source or the generated template. Do not treat any option name
            you have not seen in that file as supported.
          </p>
        </Callout>
        <CodeBlock language="js" code={CONFIG_PLACEHOLDER} copyable={false} />

        <SubHeading id="config-to-confirm" title="What to confirm" />
        <DocTable
          caption="Configuration details that require confirmation"
          columns={["Area", "What to check", "Status"]}
          rows={[
            [
              "API URL",
              "The endpoint your project should point the SDK at, and the option that holds it.",
              "Needs confirmation",
            ],
            [
              "Credentials",
              "Which credentials the SDK needs, and that only client-safe values are used in the browser.",
              "Needs confirmation",
            ],
            [
              "Other required options",
              "Any further options marked as required in the generated template.",
              "Needs confirmation",
            ],
            [
              "File location",
              "Where the CLI writes the file, so the import path in your app is correct.",
              "Needs confirmation",
            ],
          ]}
        />
      </DocSection>

      {/* 8. Integration checklist */}
      <DocSection id="integration-checklist" title="Integration checklist">
        <p>Work through these steps to complete an integration.</p>
        <Checklist />
      </DocSection>

      {/* 9. Troubleshooting */}
      <DocSection id="troubleshooting" title="Troubleshooting">
        <p>
          These checks are general starting points. They describe common causes,
          not specific SDK errors or guaranteed behavior.
        </p>
        <div className="mt-4 space-y-3">
          <TroubleshootingItem summary="The CLI command is not found, or the config file is not generated">
            <ul>
              <li>
                Confirm the package is installed in the project you are running
                the command from, and that the install finished without errors.
              </li>
              <li>
                Run <InlineCode>npx elysium init</InlineCode> from the project
                root, then look for <InlineCode>elysium.config.js</InlineCode>.
              </li>
              <li>
                Check that your Node.js and package manager installation work
                and that <InlineCode>npx</InlineCode> is available on your path.
              </li>
              <li>
                If the file still does not appear, confirm the expected output
                location and CLI behavior with the SDK maintainers.
              </li>
            </ul>
          </TroubleshootingItem>

          <TroubleshootingItem summary="The configuration import path is wrong">
            <ul>
              <li>
                The import in the example,{" "}
                <InlineCode>../elysium.config.js</InlineCode>, is relative to the
                file that contains it. Adjust the number of{" "}
                <InlineCode>../</InlineCode> segments for your folder structure.
              </li>
              <li>
                Confirm the file name and extension match exactly, including
                case.
              </li>
              <li>
                If your editor or bundler cannot resolve the import, check that
                the file exists where the path points.
              </li>
            </ul>
          </TroubleshootingItem>

          <TroubleshootingItem summary="SDK initialization does not seem to run">
            <ul>
              <li>
                <InlineCode>Elysium.init</InlineCode> is called inside{" "}
                <InlineCode>useEffect</InlineCode>, so it runs only after the
                component mounts in the browser. Make sure the component that
                calls it is actually rendered.
              </li>
              <li>
                In React development with <InlineCode>StrictMode</InlineCode>,
                effects can run more than once. Confirm whether repeated
                initialization is safe for the SDK.
              </li>
              <li>
                Check the browser console and network panel for anything
                unexpected, and verify your configuration values.
              </li>
            </ul>
          </TroubleshootingItem>

          <TroubleshootingItem summary="The payment button is not detected">
            <ul>
              <li>
                Check that the class is spelled exactly{" "}
                <InlineCode>elysium-payment-button</InlineCode> and appears in
                the rendered HTML as a <InlineCode>class</InlineCode> attribute.
              </li>
              <li>
                Confirm Elysium is initialized and that the button is rendered
                on the page. Confirm with the SDK source whether buttons added
                after initialization are picked up.
              </li>
              <li>
                Make sure no other code is replacing or re-creating the element
                in a way that drops its attributes.
              </li>
            </ul>
          </TroubleshootingItem>

          <TroubleshootingItem summary="The gateway or amount is incorrect">
            <ul>
              <li>
                Check that <InlineCode>data-gateway</InlineCode> uses an
                identifier the SDK supports. The list is not confirmed on this
                page.
              </li>
              <li>
                Verify what unit <InlineCode>data-amount</InlineCode> expects
                before testing. Do not assume whole currency units or sub-units.
              </li>
              <li>
                Confirm <InlineCode>data-currency</InlineCode> is valid for the
                chosen gateway, and test in a non-production environment first.
              </li>
            </ul>
          </TroubleshootingItem>
        </div>
      </DocSection>
    </article>
  );
}
