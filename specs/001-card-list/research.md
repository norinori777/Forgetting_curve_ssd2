# research.md

Decision: Language / Runtime
- Decision: TypeScript for frontend and Node.js (TypeScript) for backend.
- Rationale: Spec targets a Web UI with rich interactivity (無限スクロール、キーボード操作)。TypeScript + React ecosystem provides strong typing, mature tooling, and common libraries for UI, testing, and build pipelines.
- Alternatives considered: Python backend with Flask/FastAPI (better for ML/analytics); rejected because initial feature is UI-heavy and JS stack simplifies integration.

Decision: Frontend framework
- Decision: React + TypeScript (候補) and Storybook for component development.
- Rationale: React is widespread, has strong community support for component libraries, Storybook integrates well for UI contracts and visual tests.
- Alternatives: Vue / Svelte — valid but less alignment with typical TS stacks in many projects.

Decision: CSS
- Decision: Tailwind CSS (recommended) or CSS Modules if preference is different.
- Rationale: Rapid styling, consistency, small runtime cost, fits component-driven design.

Decision: Backend / API
- Decision: Node.js + Express / Fastify with TypeScript. Provide RESTful endpoints for card listing with cursor-based pagination.
- Rationale: Matches frontend stack, easy to implement cursor-based APIs and paging.

Decision: Storage / DB
- Decision: PostgreSQL (relational DB) for card metadata, with indexes supporting cursor pagination and filter queries.
- Rationale: Cards are structured with relations (tags, collections); Postgres handles queries and consistency well.
- Alternatives: NoSQL (MongoDB) — possible but relational queries and joins for tags/collections make Postgres preferable.

Decision: ORM
- Decision: Prisma (TypeScript-friendly) recommended.
- Rationale: Prisma offers type-safe queries and good developer DX with TypeScript.

Decision: Pagination
- Decision: Cursor-based (nextCursor) already chosen in spec.
- Rationale: Prevents offset anomalies and scales better with large datasets.

Decision: Infinite scroll trigger
- Decision: Auto load when near bottom (already chosen).
- Rationale: Matches modern UX; provide visible loader and retry control on failure.

Decision: Testing
- Decision: Unit tests with Jest/Vitest, E2E with Playwright, component visual tests with Storybook + Chromatic (optional).
- Rationale: Ensures core flows and E2E quality for SCs.

Decision: Performance targets
- Decision: Align with spec SC-002: initial interactive state visible within 2s on common consumer devices; further perf goals to be refined in Phase 1.

Decision: Deletion semantics
- Decision: Physical deletion (irreversible) as per clarifications; design must include audit/backup handling per constitution.
- Rationale: Decision from product; Constitution requires user ability to fully delete data — ensure backups and retention policies respect this.

Next steps (Phase 1 prerequisites)
- Produce `data-model.md` describing `Card`, `Tag`, `Collection` entities, indexes for cursor pagination, and API contracts (request/response) for listing and bulk operations.
- Create `/contracts/` with API schemas (OpenAPI/JSON Schema) and `quickstart.md` for dev setup.


