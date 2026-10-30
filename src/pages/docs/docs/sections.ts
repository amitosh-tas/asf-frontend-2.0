export interface DocSubsection {
  id: string;
  title: string;
}

export interface DocSectionMeta {
  id: string;
  title: string;
  group: "Choose a path" | "SDK integration" | "Sites without NPM" | "Reference";
  children?: readonly DocSubsection[];
}

/** Navigation, search, table of contents, and scroll-spy share these anchors. */
export const SECTIONS: readonly DocSectionMeta[] = [
  { id: "introduction", title: "Choose an integration", group: "Choose a path" },
  {
    id: "sdk-integration", title: "SDK integration (NPM)", group: "SDK integration",
    children: [
      { id: "sdk-prerequisites", title: "Before you start" },
      { id: "sdk-install", title: "Install and configure" },
      { id: "sdk-initialize", title: "Initialize" },
      { id: "sdk-events", title: "Track identity and checkout" },
      { id: "sdk-verify", title: "Verify the integration" },
    ],
  },
  {
    id: "sites-without-npm", title: "Sites without NPM", group: "Sites without NPM",
    children: [
      { id: "no-npm-prerequisites", title: "What you need" },
    ],
  },
  {
    id: "shopify", title: "Shopify setup", group: "Sites without NPM",
    children: [
      { id: "shopify-prerequisites", title: "Prerequisites" },
      { id: "shopify-setup", title: "Add the script" },
      { id: "shopify-conversions", title: "Orders and checkout" },
      { id: "shopify-verify", title: "Verify and troubleshoot" },
    ],
  },
  {
    id: "wordpress", title: "WordPress setup", group: "Sites without NPM",
    children: [
      { id: "wordpress-prerequisites", title: "Prerequisites" },
      { id: "wordpress-setup", title: "Add the script" },
      { id: "wordpress-verify", title: "Verify and troubleshoot" },
    ],
  },
  {
    id: "verification", title: "Troubleshooting and next steps", group: "Reference",
    children: [
      { id: "verify-checklist", title: "Verification checklist" },
      { id: "common-errors", title: "Common errors" },
    ],
  },
];

export const ALL_IDS: readonly string[] = SECTIONS.flatMap((section) => [
  section.id,
  ...(section.children?.map((child) => child.id) ?? []),
]);

export const PARENT_OF: Readonly<Record<string, string>> = Object.fromEntries(
  SECTIONS.flatMap((section) => [
    [section.id, section.id] as const,
    ...(section.children?.map((child) => [child.id, section.id] as const) ?? []),
  ]),
);
