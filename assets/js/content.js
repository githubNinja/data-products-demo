/* ==========================================================
   PAGE CONTENT - edit this file to change what the page says.
   You do not need to touch index.html, styles.css or app.js.

   Rules:
   - Keep the commas and quotes as they are. Text goes "between quotes".
   - Status values are "ok", "warn" or "bad" (green, amber, red).
   - Everything below is SAMPLE data. Replace it with approved
     figures, and never put passwords, connection strings, internal
     hostnames or real personal data in this file.
   ========================================================== */

window.SITE = {
  brand: "Northwind Data Platform",
  // Shown as a strip at the very top. Set to "" to hide it.
  notice: "Sample content for illustration. Figures are not real.",
  eyebrow: "Enterprise data platform",
  headline: "Trusted data, shipped as products.",
  sub: "One governed platform that turns raw events from 40+ systems into data products every team can find, trust, and build on.",
  footer: "Internal use only · Sample figures for illustration",

  // Hero strip: the stages data passes through
  flow: [
    { name: "Sources", note: "ERP · CRM · events" },
    { name: "Ingest", note: "Batch + CDC" },
    { name: "Lakehouse", note: "Bronze → Gold" },
    { name: "Data products", note: "Contracts + SLAs" },
    { name: "Consumers", note: "BI · AI · APIs" }
  ],

  values: [
    { title: "Trusted by default", text: "Every product ships with a contract, quality checks, and an owner on call." },
    { title: "Self-serve", text: "Analysts find and query products in minutes, without filing a ticket." },
    { title: "Governed by design", text: "PII is tagged at ingest, and access follows policy, not spreadsheets." },
    { title: "Cost aware", text: "Spend is tracked per product, so we retire what nobody uses." }
  ],

  /* ---------- Platform tabs ----------
     Each capability has a small "snippet" card. Snippet types:
       stats   - title, badge, rows of [label, value], optional spark (numbers)
       code    - title, code text. Lines starting with + or − are colored.
       rows    - items of { label, sub, chip, status }, optional search text
       bars    - items of { label, value, pct } (pct = 0 to 100)
       tiles   - items as short words
       lineage - sources (list), model, outputs (list)
     Any snippet can also have a "note" shown underneath. */
  platform: {
    eyebrow: "The platform",
    title: "Four layers. One governed flow.",
    pillars: [
      {
        name: "Ingest", title: "Land every source once, reliably.",
        caps: [
          { title: "Streaming & CDC", text: "Change data capture from operational databases lands in under a minute.",
            snip: { type: "stats", title: "orders.cdc", badge: { text: "live", status: "ok" },
                    rows: [["Lag", "0.8s"], ["Events / min", "12,480"]],
                    spark: [12, 20, 16, 28, 24, 36, 30, 38, 32, 42, 38] } },
          { title: "Schema registry", text: "Schema changes are versioned and checked before they break anything downstream.",
            snip: { type: "code", title: "customer.v4", badge: { text: "backward compatible" },
                    code: "+ loyalty_tier   string\n  customer_id    uuid\n  email          string · pii\n− fax_number     string",
                    note: "Checked against 14 consumers · pass" } },
          { title: "Source connectors", text: "Managed connectors for the systems the business already runs on.",
            snip: { type: "tiles", items: ["SAP", "Salesforce", "Workday", "Postgres", "Kafka", "S3"],
                    note: "6 of 42 connectors shown" } }
        ]
      },
      {
        name: "Model", title: "Clean, tested, documented models.",
        caps: [
          { title: "Lineage", text: "See exactly which sources feed a metric, and what breaks if one changes.",
            snip: { type: "lineage", sources: ["erp.orders", "crm.accounts", "fx_rates"], model: "fct_revenue", outputs: ["ARR"] } },
          { title: "Quality checks", text: "Tests run on every load; failures stop bad data before it reaches a dashboard.",
            snip: { type: "rows", items: [
                      { label: "unique(order_id)", chip: "pass", status: "ok" },
                      { label: "not_null(customer_id)", chip: "pass", status: "ok" },
                      { label: "accepted_values(status)", chip: "pass", status: "ok" },
                      { label: "row_count Δ < 20%", chip: "review", status: "warn" } ],
                    note: "Last run 06:02 · 128 tests" } },
          { title: "Freshness SLAs", text: "Each model declares how fresh it must be, and we alert when it isn't.",
            snip: { type: "bars", items: [
                      { label: "fct_revenue", value: "12m / 1h", pct: 20 },
                      { label: "dim_customer", value: "35m / 1h", pct: 58 },
                      { label: "churn_features", value: "19h / 24h", pct: 79 } ],
                    note: "Data age vs. SLA · all within target" } }
        ]
      },
      {
        name: "Data products", title: "Products with owners, not tables.",
        caps: [
          { title: "Data contracts", text: "A versioned promise: schema, semantics, freshness, and who to call.",
            snip: { type: "code",
                    code: "product: customer_360\nversion: 3.2.0\nowner: sales-ops team\nfreshness: 1h\ngrain: one row per customer\nschema:\n  customer_id: uuid, pk\n  lifetime_value: decimal(12,2)" } },
          { title: "Catalog", text: "Search products by business term and see usage, owner, and trust score.",
            snip: { type: "rows", search: "Search: \"active customers\"", items: [
                      { label: "Customer 360", sub: "Sales Ops", chip: "trust 98" },
                      { label: "Subscriptions", sub: "Billing", chip: "trust 94" },
                      { label: "Web Sessions", sub: "Marketing", chip: "trust 87" } ] } },
          { title: "Serve anywhere", text: "Query in SQL, pull through an API, or feed a model with the same product.",
            snip: { type: "code", title: "GET /products/customer-360/{id}",
                    code: "{\n  \"customer_id\": \"c-20931\",\n  \"segment\": \"enterprise\",\n  \"lifetime_value\": 184250.00\n}",
                    note: "p95 latency 38 ms" } }
        ]
      },
      {
        name: "Governance", title: "Safe to share, easy to audit.",
        caps: [
          { title: "Access policies", text: "Role and purpose-based access, applied the same way in every tool.",
            snip: { type: "rows", items: [
                      { label: "Finance analyst", sub: "→ orders", chip: "full", status: "ok" },
                      { label: "Marketing", sub: "→ customer_360", chip: "masked", status: "warn" },
                      { label: "Contractor", sub: "→ customer_360", chip: "denied", status: "bad" } ],
                    note: "Policy: purpose-based · reviewed quarterly" } },
          { title: "PII classification", text: "Sensitive columns are detected at ingest and masked automatically.",
            snip: { type: "stats", rows: [["email", "j•••@example.com"], ["phone", "+1 •••-•••-0100"], ["dob", "19••-••-••"], ["region", "Midwest"]],
                    note: "3 PII columns found at ingest · auto-masked" } },
          { title: "Cost observability", text: "Compute and storage spend broken down by product and team.",
            snip: { type: "bars", items: [
                      { label: "Customer 360", value: "$4,200/mo", pct: 100 },
                      { label: "Orders & Revenue", value: "$2,900/mo", pct: 69 },
                      { label: "Churn Features", value: "$1,650/mo", pct: 39 },
                      { label: "Web Sessions", value: "$880/mo", pct: 21 } ] } }
        ]
      }
    ]
  },

  /* ---------- Architecture ----------
     Columns are drawn left to right. Each node lists the ids it feeds in "to".
     Clicking a node highlights everything upstream and downstream of it. */
  architecture: {
    eyebrow: "Architecture",
    title: "Click any component to trace its flow.",
    intro: "Selecting a component highlights everything upstream and downstream of it.",
    selected: "gold",
    columns: [
      { name: "Sources", nodes: [
        { id: "erp", name: "SAP ERP", tech: "Oracle", to: ["cdc"],
          detail: "Order, invoice, and material master tables. Replicated with change data capture so finance sees updates within a minute." },
        { id: "crm", name: "Salesforce", tech: "SaaS API", to: ["batch"],
          detail: "Accounts, opportunities, and cases pulled every 15 minutes through the bulk API." },
        { id: "web", name: "Web & app events", tech: "Event SDK", to: ["stream"],
          detail: "Clickstream and in-app events, about 18M per day, published to Kafka topics." } ] },
      { name: "Ingest", nodes: [
        { id: "cdc", name: "CDC", tech: "Debezium", to: ["bronze"],
          detail: "Reads the database log instead of querying tables, so source systems see no extra load." },
        { id: "batch", name: "Batch loads", tech: "Managed connectors", to: ["bronze"],
          detail: "Retries, schema drift, and rate limits are handled by the connector service." },
        { id: "stream", name: "Streaming", tech: "Kafka", to: ["bronze"],
          detail: "Topics with schemas enforced by the registry. Consumers can replay 7 days of history." } ] },
      { name: "Lakehouse", nodes: [
        { id: "bronze", name: "Bronze · raw", tech: "Delta Lake", to: ["silver"],
          detail: "Raw data exactly as it arrived, append-only. This is the audit trail and the replay source." },
        { id: "silver", name: "Silver · cleaned", tech: "dbt", to: ["gold"],
          detail: "Deduplicated, typed, and conformed. PII columns are masked here by policy." },
        { id: "gold", name: "Gold · modeled", tech: "dbt + tests", to: ["cust360", "orders", "churn"],
          detail: "Business-ready models with tests on keys, nulls, and accepted values. Every load is tested." } ] },
      { name: "Data products", nodes: [
        { id: "cust360", name: "Customer 360", tech: "v3.2 · Sales Ops", to: ["bi", "api"],
          detail: "One row per customer with lifetime value, segments, and support history. Freshness SLA: 1 hour." },
        { id: "orders", name: "Orders & Revenue", tech: "v2.0 · Finance", to: ["bi"],
          detail: "Certified revenue numbers that reconcile to the general ledger." },
        { id: "churn", name: "Churn Features", tech: "v1.4 · Data Science", to: ["ml"],
          detail: "Feature table for the churn model, point-in-time correct to avoid training leakage." } ] },
      { name: "Consumers", nodes: [
        { id: "bi", name: "BI dashboards", tech: "Exec reporting", to: [],
          detail: "Executive and regional dashboards built only on certified data products." },
        { id: "ml", name: "ML models", tech: "Churn scoring", to: [],
          detail: "Batch scoring runs nightly; scores flow back into Customer 360." },
        { id: "api", name: "Product APIs", tech: "REST · GraphQL", to: [],
          detail: "Low-latency reads for customer-facing apps, cached and rate limited." } ] }
    ]
  },

  products: {
    eyebrow: "Data products",
    title: "What teams use today.",
    rows: [
      { name: "Customer 360", owner: "Sales Ops", fresh: "1h", uptime: 99.8, users: 412, status: "ok" },
      { name: "Orders & Revenue", owner: "Finance", fresh: "15m", uptime: 99.95, users: 287, status: "ok" },
      { name: "Churn Features", owner: "Data Science", fresh: "24h", uptime: 98.9, users: 34, status: "warn" },
      { name: "Inventory Positions", owner: "Supply Chain", fresh: "30m", uptime: 99.6, users: 158, status: "ok" }
    ],
    statusText: { ok: "Healthy", warn: "SLA at risk", bad: "Incident" }
  },

  cta: {
    title: "Build your next product on the platform.",
    text: "Talk to the platform team to onboard a source or publish a data product."
  }
};
