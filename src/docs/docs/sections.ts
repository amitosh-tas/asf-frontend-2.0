export interface DocSubsection {
  id: string;
  title: string;
}

export interface DocSectionMeta {
  id: string;
  title: string;
  group: "Get started" | "Reference";
  children?: readonly DocSubsection[];
}

/**
 * Single source of truth for navigation. Every `id` here must exist as an
 * element id in DocsPage.tsx; the sidebar, table of contents and scroll-spy
 * all read from this list.
 */
export const SECTIONS: readonly DocSectionMeta[] = [
  { id: "introduction", title: "Introduction", group: "Get started" },
  { id: "installation", title: "Installation", group: "Get started" },
  {
    id: "initialize-configuration",
    title: "Initialize the configuration",
    group: "Get started",
  },
  {
    id: "initialize-sdk",
    title: "Initialize the SDK in React",
    group: "Get started",
  },
  {
    id: "payment-button",
    title: "Add a payment button",
    group: "Get started",
    children: [
      { id: "button-attributes", title: "Button attributes" },
      { id: "amount-and-gateways", title: "Amount units and gateways" },
    ],
  },
  {
    id: "non-npm-sites",
    title: "Sites without npm (Shopify, WordPress)",
    group: "Get started",
    children: [
      { id: "api-setup", title: "Before you start" },
      { id: "endpoint-touches", title: "POST /v1/touches" },
      { id: "endpoint-identify", title: "POST /v1/identify" },
      { id: "endpoint-checkout-sessions", title: "POST /v1/checkout-sessions" },
      { id: "non-npm-example", title: "Putting it together" },
    ],
  },
  {
    id: "payment-gateways",
    title: "Connect your payment gateway",
    group: "Get started",
    children: [
      { id: "gateway-connect", title: "One-click connect" },
      { id: "gateway-token", title: "Where to put the checkout token" },
      { id: "reading-data", title: "Reading your data" },
    ],
  },
  {
    id: "configuration-reference",
    title: "Configuration reference",
    group: "Reference",
    children: [{ id: "config-to-confirm", title: "What to confirm" }],
  },
  {
    id: "integration-checklist",
    title: "Integration checklist",
    group: "Reference",
  },
  { id: "troubleshooting", title: "Troubleshooting", group: "Reference" },
];

export const ALL_IDS: readonly string[] = SECTIONS.flatMap((section) => [
  section.id,
  ...(section.children?.map((child) => child.id) ?? []),
]);

/** Maps every id (section or subsection) to its top-level section id. */
export const PARENT_OF: Readonly<Record<string, string>> = Object.fromEntries(
  SECTIONS.flatMap((section) => [
    [section.id, section.id] as const,
    ...(section.children?.map((child) => [child.id, section.id] as const) ?? []),
  ]),
);
