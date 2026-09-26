# NEER Documentation Audit

**Audit date:** 2026-09-25  
**Repository version inspected:** `0.0.1`  
**Documentation site:** <https://docs.neer.ai/>

## Scope and method

The repository already contains a substantial Mintlify documentation site; it was not empty. This pass inventoried the documentation tree and navigation, checked all navigation targets and internal links, ran the Mintlify validator, and reviewed selected implementation areas that informed the edits below. It was not a line-by-line audit of every source file or every existing page. Existing worktree changes were left outside the scope of this pass.

## 1. Documentation framework

The site uses Mintlify (`theme: mint` in `docs/docs.json`). `docs/CNAME` names `docs.neer.ai`, but that file does not create a DNS record. On 2026-09-25, public Cloudflare and Google DNS resolvers both returned `NXDOMAIN` for `docs.neer.ai`, while `neer.ai` resolved. The live docs hostname therefore cannot reach Mintlify until its DNS record and custom-domain setup are configured.

## 2. Documentation source directory

Canonical documentation source is `docs/`. The inventory found **646 `.md` and `.mdx` files**, including translated and unlisted pages. The docs navigation contains **526 routes**: 265 English (`en`), 258 Simplified Chinese (`zh-Hans`), and 3 Japanese (`ja`). All 526 navigation targets resolve to local pages. There are 185 configured redirects.

## 3. Pages created

This pass created **1 indexed site page**: `docs/architecture/index.md`, an architecture overview with Mermaid diagrams, source locations, request flow, and trust boundaries.

## 4. Pages modified

This pass edited **20 existing Markdown pages**, plus the Mintlify configuration:

- Reworked the English landing page and NEER overview; updated CLI coverage, project identity, credits, security wording, group-message and heartbeat guidance, configuration examples/reference, templates, an unverified protocol proposal, and experimental-memory status.
- Replaced unsupported claims in two existing untracked draft documents with source-grounded status notes and excluded those drafts from indexing.
- Corrected table formatting in `docs/channels/feishu.md` and one configuration-reference table row.
- Updated `docs/docs.json` with the NEER site description and the Architecture navigation group.

Counts describe files changed for this pass, not the repository's pre-existing dirty state. `NEER_DOCUMENTATION_AUDIT.md` is the requested repository-root audit report and is not counted as a site page.

## 5. Navigation structure

English navigation has ten tabs: **Get started**, **Install**, **Channels**, **Agents**, **Tools**, **Models**, **Platforms**, **Gateway & Ops**, **Reference**, and **Help**. The Architecture page is in the Agents tab. Simplified Chinese has corresponding translated tabs; Japanese currently has a smaller introduction/setup navigation.

## 6. Major topics documented

The existing site covers onboarding and installation, concepts and agent sessions, channels, tools and skills, plugins/extensions, model providers, platform guides, gateway operations and security, configuration, CLI commands, RPC/API protocols, troubleshooting, testing, deployment, and contributor/developer references. Coverage is spread across the existing site rather than newly authored in this pass.

## 7. Architecture

The new architecture overview explains the verified high-level request path and links to the implementation areas for the gateway, agent runtime, routing, sessions, providers, memory, plugins, cognition, and platform apps. It distinguishes the configurable general memory subsystem from the separate JSON-backed cognitive goal/memory code reviewed in this pass. Diagrams describe the flow without asserting that all inference or data handling is local.

The source review verified that the gateway starts the live loop; `NEER_AUTONOMOUS_MODE=true` gates the cognitive pulse worker, but does not by itself disable the live proactive loop. The production live-loop timing and guards are implemented in source. These details are summarized in the architecture documentation, not presented as a general guarantee of autonomous behavior.

## 8. CLI

The CLI reference is organized under `docs/cli/`. The root CLI index was updated to include the actual top-level `completion`, `console`, and legacy `daemon` commands found in CLI help/source. The full command tree and every command's options, failure modes, and security implications were not cross-checked page by page in this pass.

## 9. APIs and protocols

The navigation already includes Gateway protocol, bridge protocol, RPC, OpenAI-compatible HTTP, OpenResponses HTTP, and tools-invoke HTTP reference pages. Link and Mintlify validation passed. This pass did not independently reconcile every request/event schema or every RPC method against implementation.

## 10. Providers and models

Provider and model documentation exists under `docs/providers/` and the Models navigation, including Ollama and remote-provider pages. Provider availability and option details can change with code; a full provider-by-provider source audit was not completed here. Do not infer cost, local execution, or feature parity from provider names alone.

## 11. Tools

The Tools navigation covers built-in execution, web, browser, patching, elevated access, agent coordination, and related tool guides. A complete tool inventory with every input schema, permission, side effect, and error behavior was not produced in this pass.

## 12. Skills

Skill usage, configuration, authoring, and related documentation are present under `docs/tools/`. The existence of these guides does not mean every bundled skill or permission boundary was independently audited here.

## 13. Extensions

The site contains plugin/extension guides, including extension-specific pages. The `extensions/` tree is broad; this pass did not verify every extension's manifest, lifecycle, configuration, or compatibility against its current source.

## 14. Channels

The Channels navigation covers WhatsApp, Telegram, Discord, IRC, Slack, Feishu, Google Chat, Mattermost, Signal, iMessage, Microsoft Teams, LINE, Matrix, Zalo, and Zalo User, with pairing, routing, group-message, and troubleshooting guidance. This is the documentation navigation inventory, not a claim that every channel's current implementation and setup instructions were fully re-audited.

## 15. Security

Gateway security, authentication, pairing, sandboxing, and security reference pages already exist. This pass revised the gateway security example to use generic operator/agent names and made its hypothetical nature clear, avoiding unsupported personal ownership claims. A complete threat-model review of all features and deployment modes remains outstanding.

## 16. Deployment

The site has local installation, Docker, and hosted-platform guides, including Fly.io, Hetzner, GCP, Railway, Render, Northflank, and exe.dev. The existence of a guide is not proof that a deployment target or sample command was exercised in this pass. The production Mintlify publishing workflow was not verifiable from the checked-out repository.

## 17. Troubleshooting

Gateway, channel, environment, installation, and general troubleshooting pages are present. The live Gateway deployment and its real logs were not available as part of this repository audit, so no runtime issue was reproduced.

## 18. Missing information and audit gaps

- An exhaustive feature-to-source audit of all 646 documentation files was not completed.
- Complete parity checks for every CLI option, configuration field/default, tool schema, provider capability, channel setup path, extension, and protocol method remain to be done.
- The local repository does not verify the production docs hosting/deployment configuration beyond the Mintlify config and `docs/CNAME`.
- Public DNS currently returns `NXDOMAIN` for `docs.neer.ai`; the configured root domain uses 101domain nameservers. A DNS-zone change and Mintlify custom-domain configuration are required outside this checkout.
- Search/canonical/OpenGraph behavior was not independently tested against the live site.
- Some existing concepts and provider pages may describe inherited or evolving behavior; verify those pages against the current implementation before treating every detail as authoritative.

## 19. Unverified or status-sensitive features

Features that could not be established from the selected source review should be labeled **“Not verified in the current repository.”** In particular, do not describe the whole system as local-first, claim that all model requests remain on-device, or imply that `NEER_AUTONOMOUS_MODE` is a master switch for every proactive behavior. The cognitive pulse worker and live proactive loop have distinct gates. The protocol-consolidation page is now marked as a historical proposal, not an implementation specification. Experimental/proposal pages should remain clearly marked as such.

## 20. Build and test results

- `pnpm dlx mint validate` from `docs/`: **passed** (`build validation passed`). This validates the local Mintlify documentation build; it does not publish the live site. The live hostname remains unavailable because public DNS returns `NXDOMAIN`.
- `pnpm docs:check-links`: **passed**, 2,800 internal links checked, 0 broken.
- Targeted `markdownlint-cli2` on the edited/documentation pages: **passed**, 0 issues in the 18 files included by the lint configuration.
- Repository-wide `pnpm lint:docs`: **not clean**; 169 MD060 table-column-style findings remain across 13 files. The edited page subset passes targeted lint.
- `pnpm check:docs` / `pnpm format:docs:check`: the formatter wrapper uses `xargs`, which is unavailable in this Windows shell, so the aggregate script cannot complete here.
- Project tests were not run; this pass changed documentation rather than runtime code.

## 21. Broken links found or fixed

The repository link audit found **0 broken internal links** among 2,800 checked. No link repairs were needed based on that check. Mintlify validation also passed navigation/page validation.

## 22. Remaining limitations and audit result

The local documentation tree is populated, its configured navigation resolves, its Mintlify build succeeds, and internal-link validation reports no broken links. Public DNS currently prevents users from reaching `docs.neer.ai`; fix the DNS/custom-domain configuration to make the site reachable. This pass adds a source-grounded architecture entry point and corrects selected unsupported or stale claims. The documentation is **not certified as exhaustively complete**; tool, provider, config, extension, deployment, and API details still need systematic implementation cross-checking.
