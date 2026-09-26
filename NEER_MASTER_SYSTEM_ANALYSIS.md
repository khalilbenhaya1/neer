# NEER MASTER SYSTEM ANALYSIS

> **Engineered by Khalil Benhaya** | Version 0.0.1 | February 2026
> Full internal system documentation — generated via deep structural analysis

---

## 1️⃣ EXECUTIVE OVERVIEW

### What Is NEER?

**Neer** is a sophisticated **Personal AI Assistant** that operates as a **Cognitive Infrastructure Platform** rather than a simple chatbot. It is a comprehensive system that combines:

- **Multi-channel Messaging**: Native integration with 20+ messaging platforms (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Microsoft Teams, Google Chat, and many more)
- **Autonomous Cognitive Engine**: A sophisticated "pulse" system that operates independently, managing goals, reflections, and proactive behaviors without human intervention
- **Local-First Memory Architecture**: SQLite-based vector database with semantic search capabilities, ensuring all data remains on user's devices
- **Desktop/Mobile Native Integration**: Full-featured applications for macOS, iOS, Android, and desktop environments
- **Extensive Skill Ecosystem**: 60+ extensible skills for productivity, automation, and system control
- **Gateway-Based Architecture**: WebSocket-powered server enabling real-time bidirectional communication

Neer transcends traditional assistant paradigms by maintaining persistent memory, executing autonomous tasks, and deeply integrating with the user's operating system and communication channels. It represents a new category of personal AI that operates continuously in the background while remaining fully under user control.

### Core Philosophy

Neer is built on the fundamental principle of **personal AI sovereignty**—an assistant that embodies these core tenets:

1. **Local-First Data**: All user data, memory, and configuration remain exclusively on user devices. There is no cloud dependency for core functionality.

2. **Autonomous Operation**: Neer can operate independently when idle, pursuing goals, organizing memories, and checking in with users based on internal drives rather than waiting for explicit commands.

3. **Deep Integration**: The system maintains tight integration with operating systems, messaging platforms, and device capabilities, enabling actions beyond simple conversation.

4. **Privacy by Design**: With local storage and user-controlled data, Neer ensures that personal information remains private and under user control.

5. **Continuous Learning**: Through its experience recording and memory systems, Neer improves its understanding of user preferences and effective strategies over time.

### Technical Identity

Neer represents a **hybrid distributed agent system** with a sophisticated multi-layered architecture:

**Event-Driven Architecture**: The entire communication layer operates through WebSocket connections, enabling real-time streaming responses, instant tool execution feedback, and bidirectional event propagation. This event-driven model extends to channel integrations, where incoming messages trigger processing pipelines that flow through authentication, routing, agent invocation, and response delivery.

**Loop-Driven Autonomous Behavior**: Unlike purely reactive systems, Neer maintains a cognitive pulse engine that runs independently in worker threads. This autonomous loop evaluates goals, checks drive levels, triggers reflections, and executes proactive behaviors on configurable schedules (fast pulses every 2 minutes, slow pulses every 30+ minutes).

**Local-First Data Storage**: The memory system combines SQLite for structured data with sqlite-vec for vector embeddings, enabling semantic search while maintaining complete data locality. This local-first approach extends to session storage, configuration, and runtime state.

**Plugin-Based Extensibility**: Both skills (high-level capabilities) and extensions (channel integrations and features) follow a plugin architecture, allowing the system to grow without modifying core code. The plugin SDK provides type-safe interfaces for third-party development.

---

## 2️⃣ SYSTEM PURPOSE & VISION

### Short-Term Objectives

The immediate goals of Neer focus on establishing a robust, multi-platform personal assistant:

1. **Unified Multi-Channel Presence**: Provide seamless communication across 20+ messaging platforms with consistent behavior and unified conversation context

2. **Voice Integration Pipeline**: Enable natural voice interaction through text-to-speech (TTS) for macOS/iOS/Android and voice command recognition, allowing hands-free operation

3. **Visual Canvas Rendering**: Deliver a live, interactive canvas that Neer can control for visualizations, demonstrations, and collaborative interactions

4. **Autonomous Task Execution**: Allow Neer to independently complete tasks in the background without requiring immediate user interaction or confirmation

### Long-Term Vision

Neer's ultimate vision is to become the **ultimate personal cognitive infrastructure**—a digital companion that:

**Understands Deeply**: Through persistent memory and semantic search, Neer accumulates understanding of user preferences, communication styles, effective strategies, and personal context. This understanding grows richer over time, enabling increasingly personalized assistance.

**Acts Proactively**: Rather than merely responding to commands, Neer initiates actions based on its goal system, drive assessments, and learned patterns. It reminds users of important tasks, suggests relevant information, and maintains awareness of ongoing projects.

**Controls Environment**: With skills for device control, automation, and system integration, Neer extends beyond conversation to actually manipulate the digital and physical environment through approved interfaces.

**Learns Continuously**: The experience recording system captures successes and failures, enabling Neer to improve its strategies over time. Lessons learned inform future decision-making, making the assistant increasingly effective.

### Autonomous Components

The autonomous subsystem represents one of Neer's most distinctive features:

**Cognitive Pulse Engine**: The heartbeat of autonomous operation. This worker-thread-based system runs in the background, triggering at configurable intervals to evaluate system state, check goals, assess drives, and execute proactive behaviors. The pulse system maintains two modes: fast pulses (every 2 minutes) during active periods for quick organization, and slow pulses (every 30+ minutes) during idle for deep reflection.

**Goal Manager**: A comprehensive goal tracking system that maintains a prioritized queue of objectives. Goals can be created by users or autonomously by the system, assigned priorities from 1-10, and tracked through states of pending, active, completed, or failed. The system evaluates goal progress during each pulse cycle.

**Drive System**: An internal motivation model that tracks various needs (social, achievement, exploration, etc.). When drive levels exceed thresholds, the system generates proactive behaviors to address these needs—for example, initiating a check-in when social drive is high.

**Experience Recorder**: A learning subsystem that captures outcomes and lessons learned from tool executions and task completions. These experiences inform future decision-making and can be queried to avoid repeating mistakes or replicate successes.

**Self-State Tracker**: Maintains dynamic state including mood (calm, anxious, excited, etc.), frustration level (0-10), attention focus (user, task, environment), and intent (reflect, act, wait). This state influences behavior selection during autonomous operation.

### How NEER Differs from Normal Assistants

Neer represents a fundamental departure from conventional virtual assistants:

| Characteristic | Traditional Assistant | Neer |
|---------------|---------------------|------|
| Memory | Session-only or cloud-based | Persistent, local, semantic |
| Initiative | Reactive only | Proactive background tasks |
| Integration | Single platform | 20+ unified channels |
| Data Storage | Cloud services | Local-first, user-owned |
| Goals | None | Full lifecycle management |
| Learning | None | Experience-based improvement |
| Autonomy | None | Continuous background operation |
| Architecture | Simple API client | Multi-layer cognitive system |

---

## 3️⃣ FULL PROJECT TREE

### Root Level Structure

```
neer/
├── .agent/                                     # AI agent workflow definitions
│   └── workflows/
│       └── update_neer.md
├── .agents/                                    # Agent skill definitions
│   └── skills/
│       ├── PR_WORKFLOW.md
│       └── review-pr/
│           ├── SKILL.md
│           └── agents/
│               └── openai.yaml
├── .antigravityrules                          # Security/antigravity rules
├── .env                                       # Environment configuration
├── .env.example                               # Example environment template
├── .gitignore                                # Git ignore patterns
├── .dockerignore                             # Docker ignore patterns
├── .npmrc                                    # npm configuration
├── .oxlintrc.json                            # Oxlint linter configuration
├── .oxfmtrc.jsonc                            # Oxfmt formatter configuration
├── .markdownlint-cli2.jsonc                  # Markdown linting rules
├── .detect-secrets.cfg                       # Secret detection configuration
├── .tts/                                     # Text-to-speech voice files
│   └── voices/
│       └── en_US-lessac-medium.onnx         # ONNX voice model
├── _memory_.lock                            # Memory system lock file
├── data/                                     # Runtime data storage
│   ├── self-state.json                      # Current mood, attention, frustration
│   ├── goals.json                           # Goal tracking and status
│   ├── drives.json                          # Internal motivation drives
│   └── experiences.json                     # Learned experiences and lessons
├── docs/                                     # Documentation (Mintlify-based)
│   └── NEER_CORE_MASTER_ANALYSIS.md
├── neer.mjs                                  # CLI entry point executable
├── debug-config.mjs                          # Debug configuration utility
├── package.json                              # Monorepo root package definition
├── pnpm-lock.yaml                           # pnpm lock file
├── tsconfig.json                            # TypeScript configuration
├── tsconfig.test.json                       # TypeScript test configuration
├── tsconfig.plugin-sdk.dts.json             # Plugin SDK type generation config
├── vitest.config.ts                        # Vitest main test configuration
├── vitest.unit.config.ts                   # Unit tests configuration
├── vitest.e2e.config.ts                    # E2E tests configuration
├── vitest.live.config.ts                    # Live tests configuration
├── vitest.extensions.config.ts              # Extension tests configuration
├── vitest.gateway.config.ts                 # Gateway tests configuration
├── tsdown.config.ts                        # tsdown bundler configuration
├── Dockerfile                               # Main Docker image definition
├── Dockerfile.sandbox                      # Sandbox container definition
├── Dockerfile.sandbox-browser               # Browser sandbox definition
├── docker-compose.yml                       # Docker Compose configuration
├── docker-setup.sh                          # Docker setup script
├── fly.toml                                 # Fly.io deployment config
├── render.yaml                              # Render.com deployment config
├── zizmor.yml                              # Security auditing config
├── CLAUDE.md                               # Claude AI instructions
├── AGENTS.md                               # Agent guidelines
├── README.md                               # Project documentation
├── CHANGELOG.md                           # Version history
├── SECURITY.md                            # Security policy
├── CONTRIBUTING.md                        # Contribution guidelines
├── test/                                   # Test files directory
│   ├── helpers/                           # Test utility functions
│   │   ├── temp-home.ts
│   │   ├── paths.ts
│   │   ├── poll.ts
│   │   ├── normalize-text.ts
│   │   ├── inbound-contract.ts
│   │   └── envelope-timestamp.ts
│   ├── mocks/                             # Test mocks
│   │   └── baileys.ts
│   ├── global-setup.ts                    # Global test setup
│   ├── setup.ts                          # Test setup
│   ├── test-env.ts                       # Test environment
│   ├── provider-timeout.e2e.test.ts
│   ├── media-understanding.auto.e2e.test.ts
│   ├── gateway.multi.e2e.test.ts
│   └── inbound-contract.providers.test.ts
├── scripts/                               # Build and utility scripts
│   ├── run-node.mjs                      # Node.js development runner
│   ├── watch-node.mjs                     # File watching runner
│   ├── ui.js                             # UI build script
│   ├── test-parallel.mjs                  # Parallel test runner
│   ├── test-force.ts                      # Forced test execution
│   ├── test-live-models-docker.sh         # Docker model testing
│   ├── test-live-gateway-models-docker.sh # Docker gateway testing
│   ├── test-install-sh-e2e-docker.sh     # Docker E2E install
│   ├── test-install-sh-docker.sh         # Docker install test
│   ├── test-cleanup-docker.sh             # Docker cleanup
│   ├── termux-sync-widget.sh              # Termux widget sync
│   ├── termux-quick-auth.sh              # Termux quick auth
│   ├── termux-auth-widget.sh             # Termux auth widget
│   ├── telegram_gateway.py               # Telegram gateway script
│   ├── test-voice-pipeline.mjs           # Voice pipeline test
│   ├── test-vtuber.ts                    # VTuber test
│   ├── test-shell-completion.ts          # Shell completion test
│   ├── update-clawtributors.ts           # Contributor update script
│   ├── update-clawtributors.types.ts    # Type updates
│   ├── write-plugin-sdk-entry-dts.ts    # Plugin SDK types writer
│   ├── write-cli-compat.ts               # CLI compatibility writer
│   ├── write-build-info.ts              # Build info writer
│   ├── vitest-slowest.mjs               # Slowest tests finder
│   ├── test-video.mp4                   # Test video file
│   ├── test_image.png                   # Test image file
│   ├── systemd/                         # Systemd service files
│   │   └── neer-auth-monitor.timer
│   └── test-hello.mjs                  # Hello world test
├── assets/                               # Static assets
│   ├── chrome-extension/                # Chrome extension
│   │   ├── README.md
│   │   ├── options.js
│   │   ├── options.html
│   │   └── manifest.json
│   ├── dmg-background.png              # macOS DMG background
│   └── dmg-background-small.png       # Small DMG background
├── patches/                             # Dependency patches
│   └── .gitkeep
└── src/                                # Main source code directory
```

### Source Code Structure (src/)

```
src/
├── index.ts                              # Main CLI entry point
├── entry.ts                              # Application entry
├── runtime.ts                           # Runtime configuration
├── version.ts                           # Version information
├── globals.ts                           # Global utilities
├── logger.ts                            # Logger implementation
├── logging.ts                          # Logging setup
├── utils.ts                            # General utilities
├── polls.ts                            # Polling utilities
├── channel-web.ts                      # Web channel handler
├── extensionAPI.ts                     # Extension API
├── auto-reply/                         # Auto-reply system
│   ├── reply.ts                       # Reply generation
│   ├── templating.ts                  # Message templating
│   ├── dispatch.ts                    # Message dispatch
│   ├── commands.ts                    # Command parsing
│   ├── chunking.ts                   # Message chunking
│   ├── heartbeat.ts                  # Heartbeat system
│   └── thinking.ts                   # Thinking display
├── agents/                             # Agent system
│   ├── runtime.ts                    # Agent runtime
│   ├── identity.ts                   # Agent identity
│   ├── sessions.ts                   # Session management
│   ├── scopes.ts                     # Agent scopes
│   ├── tool-policy.ts                # Tool execution policy
│   ├── system-prompt.ts              # System prompt builder
│   ├── tools/                        # Agent tools
│   │   ├── memory-tool.ts           # Memory access
│   │   ├── message-tool.ts          # Message sending
│   │   ├── gateway-tool.ts          # Gateway control
│   │   ├── browser-tool.ts          # Browser automation
│   │   ├── web-search.ts            # Web search
│   │   ├── web-fetch.ts             # Web fetching
│   │   ├── tts-tool.ts              # Text-to-speech
│   │   ├── nodes-tool.ts            # Node control
│   │   ├── goals-tool.ts            # Goal management
│   │   ├── experience-tool.ts       # Experience recording
│   │   ├── image-tool.ts            # Image generation
│   │   ├── image-generation.ts      # Image creation
│   │   ├── forge-vision.ts          # Vision capabilities
│   │   ├── tiktok-tool.ts           # TikTok integration
│   │   ├── whatsapp-actions.ts      # WhatsApp actions
│   │   ├── telegram-actions.ts      # Telegram actions
│   │   ├── slack-actions.ts         # Slack actions
│   │   ├── discord-actions.ts       # Discord actions
│   │   ├── cron-tool.ts             # Cron job tool
│   │   ├── session-status-tool.ts   # Session status
│   │   ├── sessions-send-tool.ts    # Session sending
│   │   ├── sessions-list-tool.ts    # Session listing
│   │   ├── sessions-spawn-tool.ts   # Session spawning
│   │   ├── sessions-history-tool.ts # Session history
│   │   ├── agents-list-tool.ts      # Agent listing
│   │   ├── agent-step.ts            # Agent stepping
│   │   ├── canvas-tool.ts           # Canvas control
│   │   ├── common.ts                # Common tools
│   │   ├── nodes-utils.ts           # Node utilities
│   │   ├── sessions-helpers.ts      # Session helpers
│   │   ├── sessions-send-helpers.ts # Send helpers
│   │   ├── web-tools.ts             # Web utilities
│   │   ├── web-shared.ts            # Shared web tools
│   │   ├── web-fetch-utils.ts       # Fetch utilities
│   │   ├── web-fetch.ssrf.test.ts  # SSRF tests
│   │   ├── web-tools.readability.test.ts
│   │   ├── web-tools.fetch.test.ts
│   │   └── [50+ additional tool files]
│   ├── skills/                       # Agent skills
│   └── workspace.ts                   # Workspace management
├── cognition/                         # Cognitive engine
│   ├── pulse.ts                     # Main pulse engine
│   ├── pulse.worker.ts              # Worker thread
│   ├── live-loop.ts                 # Live runtime loop
│   ├── goals.ts                     # Goal management
│   ├── drives.ts                    # Drive system
│   ├── activity.ts                  # Activity tracking
│   ├── memory.ts                    # Cognitive memory
│   └── awareness/                   # Awareness system
│       ├── proactive-executor.ts    # Proactive execution
│       ├── intent-engine.ts         # Intent recognition
│       ├── self-state.ts            # Self-state tracking
│       └── message-generator.ts     # Message generation
├── memory/                          # Memory system
│   ├── index.ts                    # Main export
│   ├── manager.ts                  # Memory manager
│   ├── search-manager.ts            # Vector search
│   ├── embeddings.ts               # Embedding providers
│   ├── embeddings-openai.ts        # OpenAI embeddings
│   ├── embeddings-gemini.ts        # Gemini embeddings
│   ├── embeddings-voyage.ts        # Voyage embeddings
│   ├── sqlite.ts                   # SQLite base
│   ├── sqlite-vec.ts              # Vector extension
│   ├── hybrid.ts                  # Hybrid search
│   ├── batch-openai.ts            # OpenAI batching
│   ├── batch-gemini.ts           # Gemini batching
│   ├── batch-voyage.ts           # Voyage batching
│   ├── session-files.ts          # Session storage
│   ├── sync-memory-files.ts      # File sync
│   ├── internal.ts               # Internal utils
│   ├── types.ts                  # Type definitions
│   ├── memory-schema.ts          # Database schema
│   ├── backend-config.ts         # Backend config
│   ├── search-manager.test.ts    # Search tests
│   ├── manager.test.ts          # Manager tests
│   └── [50+ additional memory files]
├── gateway/                       # Gateway server
│   ├── server.impl.ts           # Server implementation
│   ├── server-chat.ts           # Chat handling
│   ├── server-http.ts           # HTTP server
│   ├── server-ws-runtime.ts    # WebSocket runtime
│   ├── server-channels.ts      # Channel manager
│   ├── server-methods.ts        # RPC methods
│   ├── server-plugins.ts       # Plugin loading
│   ├── server-runtime-config.ts
│   ├── server-runtime-state.ts
│   ├── auth.ts                 # Authentication
│   ├── protocol/
│   │   ├── schema.ts           # Protocol schema
│   │   └── index.ts           # Protocol exports
│   └── server/
│       ├── ws-connection.ts   # WebSocket connection
│       ├── http-listen.ts     # HTTP listener
│       └── tls.ts             # TLS support
├── cli/                         # CLI commands
│   ├── program.ts             # CLI builder
│   ├── gateway-cli.ts        # Gateway command
│   ├── config-cli.ts         # Config command
│   ├── memory-cli.ts         # Memory command
│   ├── nodes-cli.ts         # Nodes command
│   ├── channels-cli.ts       # Channels command
│   ├── skills-cli.ts        # Skills command
│   ├── plugins-cli.ts       # Plugins command
│   ├── models-cli.ts        # Models command
│   ├── browser-cli.ts       # Browser command
│   ├── daemon-cli.ts       # Daemon command
│   ├── tui-cli.ts          # TUI command
│   └── [50+ additional CLI files]
├── config/                    # Configuration
│   ├── config.ts            # Main config
│   ├── sessions.ts         # Session config
│   └── sessions/
├── providers/               # Model providers
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── google.ts
│   └── [additional providers]
├── channels/                # Channel system
│   ├── plugins/
│   │   └── index.ts
│   └── routing/
├── telegram/               # Telegram bot
├── discord/                # Discord bot
├── slack/                 # Slack bot
├── signal/                # Signal
├── whatsapp/              # WhatsApp web
├── web/                   # Web channel
├── imessage/              # iMessage
├── line/                  # LINE
├── media/                 # Media processing
├── tts/                   # Text-to-speech
├── tui/                   # Terminal UI
├── browser/               # Browser automation
├── cron/                  # Cron jobs
├── wizard/                # Onboarding wizard
├── hooks/                 # Hooks system
├── sessions/              # Session management
├── security/              # Security utilities
├── plugin-sdk/            # Plugin SDK
├── plugins/               # Plugin system
├── canvas-host/           # Canvas rendering
├── infra/                 # Infrastructure
├── link-understanding/    # Link processing
├── process/               # Process management
├── terminal/              # Terminal utils
└── test-helpers/          # Test utilities
```

### Extensions Directory (extensions/)

```
extensions/
├── memory-core/                        # Core memory functionality
├── memory-lancedb/                     # LanceDB memory backend
├── telegram/                          # Telegram channel
├── discord/                          # Discord channel
├── slack/                            # Slack channel
├── signal/                           # Signal channel
├── whatsapp/                         # WhatsApp channel
├── imessage/                         # iMessage channel
├── line/                             # LINE channel
├── matrix/                           # Matrix channel
├── msteams/                          # Microsoft Teams
├── zulip/                            # Zulip channel
├── mattermost/                       # Mattermost
├── irc/                              # IRC channel
├── nostr/                            # Nostr protocol
├── feishu/                           # Feishu/Lark
├── googlechat/                       # Google Chat
├── nextcloud-talk/                   # Nextcloud Talk
├── tlon/                             # Tlon platform
├── twitch/                           # Twitch chat
├── zalo/                             # Zalo channel
├── zalouser/                         # Zalo personal
├── bluebubbles/                      # BlueBubbles iMessage
├── voice-call/                       # Voice calls
├── llm-task/                         # LLM task runner
├── lobster/                          # Lobster integration
├── device-control/                   # Device control
├── phone-control/                    # Phone control
├── comfyui/                          # ComfyUI image gen
├── notepad/                          # Simple notepad
├── welcome-message/                  # Welcome messages
├── copilot-proxy/                    # Copilot proxy
├── diagnostics-otel/                 # OpenTelemetry
├── google-gemini-cli-auth/           # Gemini auth
├── google-antigravity-auth/          # Antigravity auth
├── minimax-portal-auth/              # Minimax auth
└── qwen-portal-auth/                 # Qwen auth
```

### Skills Directory (skills/)

```
skills/
├── 1password/                        # 1Password integration
├── apple-notes/                      # Apple Notes
├── apple-reminders/                 # Apple Reminders
├── bear-notes/                       # Bear notes
├── notion/                           # Notion integration
├── obsidian/                         # Obsidian vault
├── github/                           # GitHub integration
├── trello/                           # Trello boards
├── things-mac/                       # Things 3
├── spotify-player/                  # Spotify control
├── weather/                          # Weather info
├── summarize/                        # Content summarization
├── blogwatcher/                      # Blog monitoring
├── discord/                          # Discord utilities
├── gemini/                           # Gemini integration
├── gifgrep/                          # GIF search
├── gog/                              # GO Games
├── goplaces/                         # Places lookup
├── healthcheck/                      # Health monitoring
├── himalaya/                         # Email client
├── imsg/                             # iMessage
├── local-places/                     # Local places
├── mcporter/                         # MCP integration
├── nano-banana-pro/                 # Banana developer
├── nano-pdf/                         # PDF tools
├── openai-image-gen/                # DALL-E images
├── openai-whisper/                  # Whisper transcription
├── openhue/                         # Hue lights
├── oracle/                          # Oracle DB
├── ordercli/                        # Order CLI
├── peekaboo/                        # Peekaboo
├── sag/                             # SAG-AFTRA
├── sherpa-onnx-tts/                 # Local TTS
├── skill-creator/                   # Skill creation
├── sonoscli/                        # Sonos control
├── tmux/                            # Tmux manager
├── video-frames/                    # Video frame extraction
├── video-creator/                   # Video creation
├── wacli/                           # WA CLI
├── canvas/                          # Canvas rendering
├── media/                           # Media tools
├── media-gen/                       # Media generation
├── director/                       # Director AI
├── screen-share/                   # Screen sharing
├── neer-tts/                       # Neer TTS
├── vibe-coding/                    # Vibe coding
├── social-publisher/                # Social posting
├── songsee/                         # Song recognition
└── openai-whisper-api/             # Whisper API
```

### Apps Directory (apps/)

```
apps/
├── neer-desktop/                    # Electron desktop app
├── neer-macos/                      # macOS native app
├── neer-ios/                        # iOS native app
├── neer-android/                    # Android native app
└── shared/
    └── NeerKit/                     # Shared Swift library
```

---

## 4️⃣ FILE-BY-FILE ANALYSIS

### Core Entry Points

#### `src/index.ts`
- **File Path**: `src/index.ts`
- **Purpose**: Main entry point for CLI execution and library exports
- **Responsibilities**:
  - Initialize environment variables and dotenv loading
  - Build CLI program using Commander.js
  - Export 25+ core functions for external use
  - Handle global error handling and uncaught exceptions
  - Install unhandled rejection handlers
- **Code Summary**:
  - Imports and wires 30+ subsystems
  - Uses Commander.js for CLI parsing
  - Exports functions: loadConfig, getReplyFromConfig, monitorWebChannel, deriveSessionKey, resolveSessionKey, loadSessionStore, saveSessionStore, runCommandWithTimeout, runExec, waitForever, etc.
  - Implements global error handlers for uncaughtException and unhandledRejection
- **Architectural Role**: Primary entry point, orchestrates all subsystems and provides CLI interface

#### `src/runtime.ts`
- **File Path**: `src/runtime.ts`
- **Purpose**: Runtime environment abstraction for testing and flexibility
- **Responsibilities**:
  - Define RuntimeEnv interface for logging and exit
  - Provide default runtime with proper terminal state management
  - Enable runtime substitution for testing
- **Code Summary**:
  - Exports RuntimeEnv type with log, error, exit methods
  - Exports defaultRuntime with proper console and process integration
  - Uses terminal state restoration on exit
- **Architectural Role**: Provides abstraction layer enabling testability and custom runtime environments

#### `src/logger.ts` / `src/logging.ts`
- **File Path**: `src/logger.ts`, `src/logging.ts`
- **Purpose**: Centralized logging infrastructure
- **Responsibilities**:
  - Structured logging with subsystem support
  - Log level management (debug, info, warn, error)
  - Subsystem-specific loggers
  - Diagnostic logging for troubleshooting
- **Code Summary**:
  - Logger class with child logger support
  - Integration with tslog for structured output
  - Subsystem filtering and routing
- **Architectural Role**: Critical infrastructure for debugging and monitoring

### Gateway System

#### `src/gateway/server.impl.ts`
- **File Path**: `src/gateway/server.impl.ts`
- **Purpose**: Central gateway server implementation
- **Responsibilities**:
  - Initialize Express HTTP server
  - Initialize WebSocket server
  - Load and merge configuration
  - Build channel manager
  - Load plugins
  - Start cognitive pulse engine
  - Start live loop
  - Initialize mDNS discovery
  - Setup Tailscale exposure
  - Start maintenance timers
  - Serve control UI assets
  - Attach WebSocket handlers
- **Code Summary**: 1000+ lines of initialization and lifecycle management
  - Uses Express for HTTP endpoints
  - Uses ws library for WebSocket
  - Integrates with 30+ subsystems
  - Handles graceful shutdown and restart
- **Architectural Role**: Central hub for all gateway communication, orchestrating all subsystems

#### `src/gateway/server-chat.ts`
- **File Path**: `src/gateway/server-chat.ts`
- **Purpose**: Real-time chat message handling and state management
- **Responsibilities**:
  - ChatRunRegistry for managing concurrent chat sessions
  - Message buffering for delta streaming
  - Delta timestamp tracking
  - Abort handling for cancelled runs
  - Heartbeat broadcast suppression
- **Code Summary**:
  - ChatRunRegistry class with add, peek, shift, remove operations
  - ChatRunState with registry, buffers, deltaSentAt, abortedRuns
  - shouldSuppressHeartbeatBroadcast function
- **Architectural Role**: Manages real-time chat session state, enabling concurrent multi-session handling

#### `src/gateway/auth.ts`
- **File Path**: `src/gateway/auth.ts`
- **Purpose**: Authentication and authorization system
- **Responsibilities**:
  - Token generation and validation
  - Session authentication
  - API key management
  - Multi-factor authentication support
  - Token refresh and expiration
- **Code Summary**:
  - Auth class with token management
  - validateToken method
  - GatewayAuthConfig type
- **Architectural Role**: Security layer enforcing access control on all gateway connections

#### `src/gateway/server-methods.ts`
- **File Path**: `src/gateway/server-methods.ts`
- **Purpose**: RPC method handlers for client communication
- **Responsibilities**:
  - Handle 100+ client request types
  - Agent invocation and control
  - Tool execution requests
  - Memory operations
  - Configuration changes
  - Channel management
- **Code Summary**: Large handler registry mapping method names to implementations
- **Architectural Role**: Primary API surface for gateway client communication

### Agent System

#### `src/agents/tools/memory-tool.ts`
- **File Path**: `src/agents/tools/memory-tool.ts`
- **Purpose**: Memory access and search tool for agents
- **Responsibilities**:
  - Search memories by semantic similarity
  - Write new memories with embedding
  - Generate citations for retrieved memories
  - Handle memory metadata
- **Code Summary**:
  - Uses MemorySearchManager for queries
  - Embedding-based retrieval with hybrid search
  - Citation generation for source attribution
- **Architectural Role**: Primary bridge between agent reasoning and persistent memory

#### `src/agents/tools/message-tool.ts`
- **File Path**: `src/agents/tools/message-tool.ts`
- **Purpose**: Outbound message sending across channels
- **Responsibilities**:
  - Send messages to specific channels
  - Multi-channel broadcast
  - Attachment handling (images, videos, files)
  - Message formatting
  - Delivery confirmation
- **Code Summary**:
  - Channel abstraction for unified interface
  - Attachment upload and URL generation
  - Message queue management
- **Architectural Role**: Primary outbound communication channel for agent actions

#### `src/agents/tools/gateway-tool.ts`
- **File Path**: `src/agents/tools/gateway-tool.ts`
- **Purpose**: Gateway control and introspection
- **Responsibilities**:
  - Configuration changes
  - Channel management queries
  - Status queries
  - Runtime introspection
- **Code Summary**:
  - Gateway API client
  - Config mutation methods
  - Status reading methods
- **Architectural Role**: Enables agents to control and inspect gateway state

#### `src/agents/tools/browser-tool.ts`
- **File Path**: `src/agents/tools/browser-tool.ts`
- **Purpose**: Browser automation and control
- **Responsibilities**:
  - Page navigation and loading
  - Element interaction (click, type, select)
  - Screenshot capture
  - JavaScript execution
  - Form filling
- **Code Summary**:
  - Uses Playwright for automation
  - Schema-based action definitions
  - Security boundaries for automation scope
- **Architectural Role**: Enables web automation capabilities for agents

#### `src/agents/tools/web-search.ts`
- **File Path**: `src/agents/tools/web-search.ts`
- **Purpose**: Web search capabilities
- **Responsibilities**:
  - Query external search APIs
  - Parse and rank results
  - Source citation generation
  - Safe search filtering
- **Code Summary**:
  - Multiple search provider support
  - Result parsing and normalization
  - Source attribution for responses
- **Architectural Role**: Information retrieval capability for agents

#### `src/agents/tools/web-fetch.ts`
- **File Path**: `src/agents/tools/web-fetch.ts`
- **Purpose**: Web content fetching and extraction
- **Responsibilities**:
  - Fetch URLs with headers and cookies
  - Content extraction using Readability
  - HTML parsing and sanitization
  - SSRF protection
- **Code Summary**:
  - Uses @mozilla/readability for extraction
  - linkedom for HTML parsing
  - SSRF blacklist validation
- **Architectural Role**: Web content access capability with security boundaries

#### `src/agents/tools/tts-tool.ts`
- **File Path**: `src/agents/tools/tts-tool.ts`
- **Purpose**: Text-to-speech generation and playback
- **Responsibilities**:
  - Voice synthesis using multiple providers
  - Audio playback on macOS/iOS/Android
  - Voice selection and configuration
  - Streaming audio support
- **Code Summary**:
  - Multiple TTS provider support
  - Platform-specific playback
  - Edge-tts integration
- **Architectural Role**: Voice output capability for verbal interaction

#### `src/agents/tools/goals-tool.ts`
- **File Path**: `src/agents/tools/goals-tool.ts`
- **Purpose**: Goal management for autonomous operation
- **Responsibilities**:
  - Create new goals
  - Update goal status (pending, active, completed, failed)
  - List goals by status
  - Delete goals
- **Code Summary**:
  - CRUD operations for goals
  - Priority-based ordering
  - Status transitions with validation
- **Architectural Role**: Enables goal-driven autonomous task management

#### `src/agents/tools/experience-tool.ts`
- **File Path**: `src/agents/tools/experience-tool.ts`
- **Purpose**: Experience recording for continuous learning
- **Responsibilities**:
  - Record task outcomes (success/failure)
  - Store lessons learned
  - Context logging
  - Experience retrieval
- **Code Summary**:
  - Experience entry creation
  - JSON file storage
  - Query interface for past experiences
- **Architectural Role**: Learning system enabling improvement from past actions

#### `src/agents/tool-policy.ts`
- **File Path**: `src/agents/tool-policy.ts`
- **Purpose**: Tool execution policy enforcement
- **Responsibilities**:
  - Policy evaluation for each tool request
  - Risk score calculation
  - Approval requirement determination
  - Policy caching
- **Code Summary**:
  - ToolPolicy class with evaluation logic
  - Risk scoring algorithms
  - Approval flow triggers
- **Architectural Role**: Security boundary determining which tools can execute

#### `src/agents/system-prompt.ts`
- **File Path**: `src/agents/system-prompt.ts`
- **Purpose**: System prompt generation for agent context
- **Responsibilities**:
  - Build comprehensive system prompts
  - Include available capabilities
  - Inject user context
  - Handle agent-specific instructions
- **Code Summary**:
  - Template-based prompt building
  - Dynamic capability injection
  - Context window optimization
- **Architectural Role**: Defines agent behavior and context

### Cognitive System

#### `src/cognition/pulse.ts`
- **File Path**: `src/cognition/pulse.ts`
- **Purpose**: Main cognitive pulse engine orchestrating autonomous behavior
- **Responsibilities**:
  - Schedule autonomous task execution
  - Manage worker thread lifecycle
  - Implement fast/slow pulse timing (2min/30min)
  - Enforce max 3 executions per hour
  - Handle worker errors and recovery
  - Integrate with activity tracking
- **Code Summary**:
  - startCognitivePulse() initializes worker
  - Worker thread using pulse.worker.ts
  - Activity tracking integration via activityTracker
  - Automatic restart on worker crash
  - Unref timers for background operation
- **Architectural Role**: Central coordinator for all autonomous background behavior

#### `src/cognition/pulse.worker.ts`
- **File Path**: `src/cognition/pulse.worker.ts`
- **Purpose**: Worker thread executing pulse tasks
- **Responsibilities**:
  - Execute pulse tasks in isolation
  - Goal evaluation and progression
  - Reflection triggers
  - Drive assessment
  - Proactive behavior generation
  - Memory organization
  - Self-state updates
- **Code Summary**:
  - Runs in separate worker thread
  - Imports goal, drive, awareness modules
  - Sends PULSE_TRIGGER and PULSE_DONE messages
  - Isolated from main thread errors
- **Architectural Role**: Actual execution environment for autonomous tasks

#### `src/cognition/live-loop.ts`
- **File Path**: `src/cognition/live-loop.ts`
- **Purpose**: Live runtime loop for real-time event processing
- **Responsibilities**:
  - Process real-time events
  - Trigger proactive behaviors
  - Handle awareness events
  - Maintain live connection state
- **Code Summary**:
  - startLiveLoop() / stopLiveLoop() controls
  - Event listener registration
  - Proactive trigger evaluation
- **Architectural Role**: Continuous runtime for immediate response to events

#### `src/cognition/goals.ts`
- **File Path**: `src/cognition/goals.ts`
- **Purpose**: Goal management system for task tracking
- **Responsibilities**:
  - CRUD operations for goals
  - Priority management (1-10)
  - Status tracking (pending, active, completed, failed)
  - JSON file persistence
  - Zod schema validation
- **Code Summary**:
  - GoalManager class with full CRUD
  - GOALS_FILE_PATH points to data/goals.json
  - Zod validation for data integrity
  - Async file operations
  - 30+ goals in current state
- **Architectural Role**: Core subsystem for autonomous task tracking

#### `src/cognition/drives.ts`
- **File Path**: `src/cognition/drives.ts`
- **Purpose**: Internal motivation/drive system
- **Responsibilities**:
  - Track various needs (social, achievement, exploration)
  - Calculate drive levels
  - Trigger proactive behaviors based on thresholds
  - Persist drive state
- **Code Summary**:
  - Drive types and calculations
  - Threshold-based triggers
  - Drive state file (data/drives.json)
- **Architectural Role**: Motivation system driving autonomous behavior

#### `src/cognition/activity.ts`
- **File Path**: `src/cognition/activity.ts`
- **Purpose**: Activity tracking for pulse timing
- **Responsibilities**:
  - Track user interactions
  - Calculate activity levels
  - Determine fast/slow pulse timing
  - Threshold management (ACTIVITY_HIGH_THRESHOLD = 50)
- **Code Summary**:
  - activityTracker object
  - Fast pulse at 2 minutes when active
  - Slow pulse at 30+ minutes when idle
- **Architectural Role**: Determines pulse timing strategy

#### `src/cognition/awareness/proactive-executor.ts`
- **File Path**: `src/cognition/awareness/proactive-executor.ts`
- **Purpose**: Execute proactive behaviors
- **Responsibilities**:
  - Evaluate proactive triggers
  - Generate proactive messages
  - Execute autonomous actions
  - Respect user preferences
- **Code Summary**:
  - ProactiveTrigger evaluation
  - Message generation
  - Action execution
- **Architectural Role**: Executes self-initiated behaviors

#### `src/cognition/awareness/self-state.ts`
- **File Path**: `src/cognition/awareness/self-state.ts`
- **Purpose**: Self-state management and tracking
- **Responsibilities**:
  - Track mood (calm, anxious, excited, etc.)
  - Monitor frustration level (0-10)
  - Manage attention focus (user, task, environment)
  - Track ignored attempts
  - Store last intent
- **Code Summary**:
  - Reads/writes data/self-state.json
  - State types: mood, frustration, attentionFocus, ignoredAttempts, lastIntent, lastDecisionAt
- **Architectural Role**: Maintains dynamic self-model influencing behavior

### Memory System

#### `src/memory/manager.ts`
- **File Path**: `src/memory/manager.ts`
- **Purpose**: Main memory manager coordinating all memory operations
- **Responsibilities**:
  - Index management and initialization
  - File watching with chokidar
  - Embedding batch processing
  - Session file synchronization
  - Memory integrity maintenance
- **Code Summary**: 500+ lines
  - MemoryIndexMeta type for index metadata
  - MemorySyncProgressState for progress tracking
  - Constants: SNIPPET_MAX_CHARS, EMBEDDING_BATCH_MAX_TOKENS, etc.
  - SQLite + sqlite-vec integration
- **Architectural Role**: Central coordinator for all memory operations

#### `src/memory/search-manager.ts`
- **File Path**: `src/memory/search-manager.ts`
- **Purpose**: Vector and hybrid search management
- **Responsibilities**:
  - Concurrent vector and keyword search
  - BM25 ranking for keyword search
  - Result merging and deduplication
  - Relevance scoring
- **Code Summary**:
  - searchVector() for similarity search
  - searchKeyword() for FTS/BM25
  - mergeHybridResults() for combining approaches
- **Architectural Role**: Enables semantic and keyword memory retrieval

#### `src/memory/embeddings.ts`
- **File Path**: `src/memory/embeddings.ts`
- **Purpose**: Unified embedding provider interface
- **Responsibilities**:
  - Abstract embedding generation
  - Support multiple providers (OpenAI, Gemini, Voyage, Local)
  - Provider-specific configurations
  - Token counting and limits
- **Code Summary**:
  - EmbeddingProvider interface
  - createEmbeddingProvider() factory
  - Support for OpenAI, Gemini, Voyage, node-llama
- **Architectural Role**: Provider abstraction for embedding generation

#### `src/memory/sqlite-vec.ts`
- **File Path**: `src/memory/sqlite-vec.ts`
- **Purpose**: Vector database extension for SQLite
- **Responsibilities**:
  - Load sqlite-vec extension
  - Vector storage and retrieval
  - Similarity search operations
  - Dimension validation
- **Code Summary**:
  - loadSqliteVecExtension() loader
  - Vector table management
- **Architectural Role**: Enables vector similarity search in SQLite

#### `src/memory/hybrid.ts`
- **File Path**: `src/memory/hybrid.ts`
- **Purpose**: Hybrid search combining vector and keyword approaches
- **Responsibilities**:
  - BM25 scoring algorithm
  - Result merging logic
  - FTS (Full-Text Search) integration
  - Score normalization
- **Code Summary**:
  - bm25RankToScore() for keyword ranking
  - buildFtsQuery() for FTS construction
  - mergeHybridResults() for combining vector and BM25
- **Architectural Role**: Optimizes search with combined approaches

#### `src/memory/session-files.ts`
- **File Path**: `src/memory/session-files.ts`
- **Purpose**: Session file management and tracking
- **Responsibilities**:
  - Read/write session transcript files
  - Session file path resolution
  - Session entry building
  - Session file listing
- **Code Summary**:
  - SessionFileEntry type
  - sessionPathForFile() path resolver
  - listSessionFilesForAgent() lister
- **Architectural Role**: Manages session transcript persistence

#### `src/memory/internal.ts`
- **File Path**: `src/memory/internal.ts`
- **Purpose**: Internal memory utilities and helpers
- **Responsibilities**:
  - Markdown chunking
  - Text hashing
  - File operations
  - Path resolution
  - Memory path detection
- **Code Summary**:
  - chunkMarkdown() for content splitting
  - hashText() for deduplication
  - isMemoryPath() for path filtering
  - listMemoryFiles() for file discovery
- **Architectural Role**: Utility functions supporting memory operations

### Channels

#### `src/web/auto-reply.ts` / `src/web/auto-reply.impl.ts`
- **File Path**: `src/web/auto-reply.ts`, `src/web/auto-reply.impl.ts`
- **Purpose**: WhatsApp Web auto-reply functionality
- **Responsibilities**:
  - Real-time message monitoring
  - Typing indicator control
  - Media message handling
  - Reply generation and dispatch
  - Group chat management
  - Session persistence
- **Code Summary**: 1000+ lines
  - Uses @whiskeysockets/baileys library
  - Event-driven message handling
  - Message queue management
- **Architectural Role**: Primary WhatsApp channel implementation

#### `src/telegram/` - Telegram Bot
- **File Path**: `src/telegram/*.ts`
- **Purpose**: Telegram platform integration
- **Responsibilities**:
  - Webhook handling for updates
  - Bot command processing
  - Message forwarding and replies
  - Inline query support
  - Keyboard/keyboard handling
- **Code Summary**:
  - Uses Grammy framework
  - Bot API integration
  - Command registry
- **Architectural Role**: Telegram messaging channel

#### `src/discord/` - Discord Bot
- **File Path**: `src/discord/*.ts`
- **Purpose**: Discord platform integration
- **Responsibilities**:
  - Slash command registration
  - Message event handling
  - Guild management
  - Role-based access
- **Code Summary**:
  - Uses discord.js library
  - Slash command builder
  - Event handlers
- **Architectural Role**: Discord messaging channel

#### `src/slack/` - Slack Bot
- **File Path**: `src/slack/*.ts`
- **Purpose**: Slack platform integration
- **Responsibilities**:
  - Event handling (app_mention, message)
  - Slash command processing
  - Modal interactions
  - Webhook handling
- **Code Summary**:
  - Uses @slack/bolt framework
  - Event subscription management
- **Architectural Role**: Slack messaging channel

#### `src/signal/` - Signal
- **File Path**: `src/signal/*.ts`
- **Purpose**: Signal messaging integration
- **Responsibilities**:
  - Signal protocol handling
  - Message sending/receiving
  - Contact management

#### `src/imessage/` - iMessage
- **File Path**: `src/imessage/*.ts`
- **Purpose**: iMessage via BlueBubbles integration
- **Responsibilities**:
  - BlueBubbles API integration
  - Message handling
  - Attachment support

#### `src/line/` - LINE
- **File Path**: `src/line/*.ts`
- **Purpose**: LINE messaging platform
- **Responsibilities**:
  - Webhook handling
  - Message types (text, image, template)
  - Reply tokens

### Configuration

#### `src/config/config.ts`
- **File Path**: `src/config/config.ts`
- **Purpose**: Central configuration management
- **Responsibilities**:
  - Load configuration from files
  - Environment variable handling
  - Legacy config migration
  - Validation and defaults
  - Runtime config changes
- **Code Summary**: 1000+ lines
  - NeerConfig type
  - GatewayBindMode, GatewayAuthConfig types
  - loadConfig(), writeConfigFile() functions
- **Architectural Role**: Central configuration source

#### `src/config/sessions.ts`
- **File Path**: `src/config/sessions.ts`
- **Purpose**: Session configuration and management
- **Responsibilities**:
  - Session key derivation
  - Session storage management
  - State persistence
- **Code Summary**:
  - SessionKey type
  - deriveSessionKey() function
  - Session store management
- **Architectural Role**: Session lifecycle management

### CLI System

#### `src/cli/program.ts`
- **File Path**: `src/cli/program.ts`
- **Purpose**: CLI program builder and command registration
- **Responsibilities**:
  - Register all CLI commands
  - Setup global options
  - Parse command line arguments
  - Configure help and version
- **Code Summary**:
  - Commander.js-based
  - 50+ command registrations
  - Global option handling
- **Architectural Role**: CLI interface construction

#### `src/cli/gateway-cli.ts`
- **File Path**: `src/cli/gateway-cli.ts`
- **Purpose**: Gateway command implementation
- **Responsibilities**:
  - Gateway startup command
  - Bind address options (loopback, lan, tailnet, auto)
  - Port configuration
  - Daemon installation
- **Code Summary**:
  - gateway command handler
  - Options: --bind, --port, --verbose, etc.
- **Architectural Role**: Gateway CLI interface

#### `src/cli/daemon-cli.ts`
- **File Path**: `src/cli/daemon-cli.ts`
- **Purpose**: Daemon service management
- **Responsibilities**:
  - Install/uninstall daemon service
  - Status queries
  - Service restart
- **Code Summary**:
  - Platform-specific service management
  - launchd (macOS) / systemd (Linux) support
- **Architectural Role**: Background service control

#### `src/cli/memory-cli.ts`
- **File Path**: `src/cli/memory-cli.ts`
- **Purpose**: Memory management CLI
- **Responsibilities**:
  - Search memory
  - Index management
  - Memory statistics
- **Code Summary**:
  - memory search command
  - memory index commands
- **Architectural Role**: Memory CLI interface

#### `src/cli/nodes-cli.ts`
- **File Path**: `src/cli/nodes-cli.ts`
- **Purpose**: Node/device management CLI
- **Responsibilities**:
  - Node discovery
  - Screen capture commands
  - Camera access
- **Code Summary**:
  - nodes list command
  - nodes screenshot command
- **Architectural Role**: Node device management

### UI System (ui/src/ui/)

#### `ui/src/ui/controllers/chat.ts`
- **File Path**: `ui/src/ui/controllers/chat.ts`
- **Purpose**: Chat controller for UI state management
- **Responsibilities**:
  - Message handling and state
  - WebSocket communication
  - Message sending and receiving
  - Typing indicators
- **Code Summary**:
  - ChatController class
  - WebSocket event handlers
  - State management
- **Architectural Role**: Chat UI business logic

#### `ui/src/ui/views/chat.ts`
- **File Path**: `ui/src/ui/views/chat.ts`
- **Purpose**: Chat view rendering
- **Responsibilities**:
  - Message rendering
  - Tool display cards
  - Markdown formatting
  - Message bubbles
- **Code Summary**:
  - LitElement-based
  - Shadow DOM styling
- **Architectural Role**: Chat UI presentation

#### `ui/src/ui/gateway.ts`
- **File Path**: `ui/src/ui/gateway.ts`
- **Purpose**: Gateway WebSocket connection
- **Responsibilities**:
  - WebSocket connection management
  - Event handling
  - Reconnection logic
  - Presence updates
- **Code Summary**:
  - GatewayConnection class
  - Auto-reconnect support
  - Event emitter pattern
- **Architectural Role**: Gateway communication

#### `ui/src/ui/presenter.ts`
- **File Path**: `ui/src/ui/presenter.ts`
- **Purpose**: UI presenter for view coordination
- **Responsibilities**:
  - View state management
  - Controller coordination
  - Data transformation
- **Code Summary**:
  - Presenter class
  - View state sync
- **Architectural Role**: UI state coordination

#### `ui/src/ui/navigation.ts`
- **File Path**: `ui/src/ui/navigation.ts`
- **Purpose**: Navigation and routing
- **Responsibilities**:
  - Route handling
  - View transitions
  - Deep linking
- **Code Summary**:
  - Router class
  - Route registry
- **Architectural Role**: UI navigation

### Data Files

#### `data/self-state.json`
```json
{
  "mood": "calm",
  "frustration": 0,
  "attentionFocus": "user",
  "ignoredAttempts": 0,
  "lastIntent": "reflect",
  "lastDecisionAt": 1772132473817
}
```
- **Purpose**: Current self-state of the cognitive system
- **Responsibilities**: Track mood, frustration, attention, intent

#### `data/goals.json`
- **Contains**: 30+ autonomous goals with states
- **Goal Status**: pending/active/completed/failed
- **Priority Range**: 1-10

#### `data/experiences.json`
- **Contains**: Learned experiences with outcomes
- **Purpose**: Continuous learning from actions

---

## 5️⃣ ARCHITECTURE LAYERS

### Layer 1: CLI Layer
**Location**: `src/cli/`, `neer.mjs`
**Responsibilities**:
- User command interface
- Argument parsing and validation
- Daemon service management
- Configuration CLI operations
- Global option handling

**Key Components**:
- `program.ts`: Commander.js program builder
- `gateway-cli.ts`: Gateway commands
- `daemon-cli.ts`: Service management
- `config-cli.ts`: Configuration commands
- 50+ command modules

### Layer 2: Gateway Layer
**Location**: `src/gateway/`
**Responsibilities**:
- WebSocket server for real-time communication
- HTTP REST endpoints
- Authentication and authorization
- Channel integration management
- Plugin loading and lifecycle
- Health state monitoring
- Session management

**Key Components**:
- `server.impl.ts`: Main server implementation
- `server-chat.ts`: Chat handling
- `server-methods.ts`: RPC methods
- `auth.ts`: Authentication
- `server-ws-runtime.ts`: WebSocket runtime

### Layer 3: Agent Runtime
**Location**: `src/agents/`
**Responsibilities**:
- Tool execution pipeline
- System prompt generation
- Tool policy enforcement
- Session context management
- Model provider invocation
- Response streaming

**Key Components**:
- `system-prompt.ts`: Prompt building
- `tool-policy.ts`: Policy evaluation
- `tools/*.ts`: 50+ tool implementations
- `sessions.ts`: Session management

### Layer 4: Cognitive Layer
**Location**: `src/cognition/`
**Responsibilities**:
- Pulse engine for autonomous tasks
- Goal management and tracking
- Drive/motivation system
- Activity monitoring
- Proactive behavior execution
- Self-state tracking

**Key Components**:
- `pulse.ts`: Pulse engine
- `goals.ts`: Goal system
- `drives.ts`: Drive system
- `activity.ts`: Activity tracking
- `awareness/*`: Proactive execution

### Layer 5: Memory Layer
**Location**: `src/memory/`
**Responsibilities**:
- Vector storage via sqlite-vec
- Embedding generation (multiple providers)
- Hybrid search (vector + keyword)
- Session transcript persistence
- File synchronization
- Memory indexing

**Key Components**:
- `manager.ts`: Memory manager
- `search-manager.ts`: Search operations
- `embeddings.ts`: Provider abstraction
- `sqlite-vec.ts`: Vector extension
- `hybrid.ts`: Search merging

### Layer 6: UI Layer
**Location**: `ui/src/ui/`
**Responsibilities**:
- Web UI rendering (LitElement)
- Controller logic
- View management
- WebSocket integration
- State synchronization
- Navigation

**Key Components**:
- `controllers/*.ts`: Business logic
- `views/*.ts`: UI components
- `gateway.ts`: Connection management
- `navigation.ts`: Routing
- `presenter.ts`: State coordination

### Layer 7: Channels Layer
**Location**: `src/telegram/`, `src/discord/`, `src/web/`, etc.
**Responsibilities**:
- Platform-specific integrations
- Message parsing and normalization
- Outbound message sending
- Webhook handling
- Authentication with platforms

**Key Components**:
- `telegram/`: Telegram bot
- `discord/`: Discord bot
- `slack/`: Slack integration
- `web/`: WhatsApp Web
- 20+ channel implementations

### Layer 8: Node Integration Layer
**Location**: `src/nodes/`, `apps/`
**Responsibilities**:
- Desktop app integration
- Screen capture
- Camera access
- Voice input/output
- System tray integration

**Key Components**:
- `apps/neer-desktop/`: Electron
- `apps/neer-macos/`: Native macOS
- `apps/neer-ios/`: iOS app
- `apps/neer-android/`: Android app

### Layer 9: Execution Layer
**Location**: `src/process/`, `src/plugins/`
**Responsibilities**:
- Tool execution sandbox
- Plugin system
- Hooks system
- Command execution
- Process management

**Key Components**:
- `plugins/`: Plugin loader
- `hooks/`: Hook system
- Tool execution in tools/

### Layer 10: Threat Engine Layer
**Location**: `src/security/`, `src/agents/tool-policy.ts`
**Responsibilities**:
- Tool policy evaluation
- Risk score calculation
- Approval workflow management
- Origin validation
- Execution boundaries

**Key Components**:
- `tool-policy.ts`: Policy engine
- `exec-approval-manager.ts`: Approval system
- `security/`: Security utilities
- `origin-check.ts`: Origin validation

---

## 6️⃣ EXECUTION FLOW — STEP BY STEP

### Starting Gateway

```
User runs: pnpm neer gateway

1. neer.mjs (CLI executable)
   ↓
2. src/index.ts (Entry point, loads deps)
   ↓
3. src/cli/program.ts (Command registry)
   ↓
4. src/cli/gateway-cli.ts (Gateway command)
   ↓
5. src/gateway/server.impl.ts (Server initialization)
```

### Server Initialization Flow

```
1. loadConfig() - Load configuration from files and env
2. migrateLegacyConfig() - Handle legacy configuration
3. ensureControlUiAssetsBuilt() - Build UI assets
4. loadDotEnv() - Environment variables
5. initSubagentRegistry() - Agent registry initialization
6. createChannelManager() - Channel setup and initialization
7. loadGatewayPlugins() - Plugin loading and lifecycle
8. startHeartbeatRunner() - Heartbeat system start
9. startCognitivePulse() - Start autonomous engine
10. startLiveLoop() - Start live runtime
11. startGatewayDiscovery() - mDNS discovery
12. startGatewayTailscaleExposure() - Tailscale network
13. startGatewayMaintenanceTimers() - Maintenance schedules
14. httpListen() - HTTP server start
15. attachGatewayWsHandlers() - WebSocket server bind
```

### Chat Request Flow

```
1. Client connects via WebSocket
2. auth.ts - Validate authentication token
3. server-methods.ts - Handle incoming message request
4. Agent invocation via system-prompt.ts
5. Model provider (openai/anthropic/google) invocation
6. Tool execution decision
7. tool-policy.ts - Policy evaluation
8. Tool execution (memory-tool, message-tool, etc.)
9. Response streaming via WebSocket
10. Session transcript update via sessions/transcript-events.ts
11. Memory write via memory-tool.ts
12. Response completion
```

### Tool Execution Flow

```
1. Agent decides to use tool based on reasoning
2. tool-policy.ts - Policy evaluation lookup
3. Risk evaluation - Calculate risk score
4. 
   ├─ Approved ──→ Execute immediately
   │
   ├─ Deny ──→ Reject with error
   │
   └─ Review ──→ Risk Score
                   │
                   ├─ Low Risk ──→ Execute
                   │
                   └─ High Risk ──→ Approval Required
                                         │
                                         ├─ Approve ──→ Execute
                                         │
                                         └─ Deny ──→ Reject
5. Tool function execution
6. Result processing and parsing
7. Citation generation (if applicable)
8. Response integration
```

### Cognitive Pulse Flow

```
1. Timer triggers (fast: 2min, slow: 30min)
2. Worker thread spawns (pulse.worker.ts)
3. Activity check via activityTracker
4. 
   ├─ High Activity ──→ Fast Pulse (2 min)
   │
   └─ Low Activity ──→ Slow Pulse (30 min)
5. Goals evaluation (goals.ts)
6. Drive assessment (drives.ts)
7. Reflection triggers evaluation
8. Proactive execution (proactive-executor.ts)
9. Experience recording (experience-tool.ts)
10. Memory organization
11. Self-state update (self-state.ts)
12. Worker sends PULSE_DONE
13. Schedule next pulse
```

---

## 7️⃣ SEQUENCE DIAGRAMS

### Chat Request Flow

```
User
  │
  ▼
WebSocket Connect (ws://gateway:port)
  │
  ▼
Auth Handler (auth.ts)
  │ Validate token
  │ Generate session context
  ▼
Message Handler (server-methods.ts)
  │ Parse request
  │ Route to agent
  ▼
Agent Invocation (system-prompt.ts)
  │ Build system prompt
  │ Inject context
  ▼
Model Provider (openai/anthropic/google)
  │ Send prompt
  │ Receive response
  ├──────────────────────────┐
  ▼                          ▼
Tool Decision          Response Generation
  │                          │
  ▼                          ▼
Tool Policy Eval       Streaming Response
  │                          │
  ├─ Allow                  ▼
  │  ▼                     Client
  └─ Deny                  (WebSocket)
     ▼
  Rejection
```

### Voice Transcription Flow

```
User (Voice Input - macOS/iOS/Android)
  │
  ▼
Speech-to-Text (Whisper)
  │
  ▼
Text Message (server-methods.ts)
  │
  ▼
[Same as Chat Request Flow from here]
  │
  ├─ Agent Reasoning
  ├─ Tool Execution
  └─ Response Generation
       │
       ▼
  TTS Generation (tts-tool.ts)
       │
       ▼
  Audio Playback (Platform-specific)
```

### Tool Execution Flow

```
Agent Decision
  │
  ▼
tool-policy.ts (Policy Lookup)
  │
  ├─ Allow ──────────────────┐
  │                          │
  ├─ Deny ──→ Reject         │
  │                          │
  └─ Review ──→ Risk Score   │
                      │        │
                      ▼        ▼
               ┌──────────┐  ┌──────────┐
               │Low Risk  │  │High Risk  │
               └────┬─────┘  └─────┬─────┘
                    │              │
                    ▼              ▼
               Execute      Approval Required
                    │              │
                    │              ▼
                    │        User Approval (UI)
                    │              │
                    └─────┬────────┘
                          ▼
                    Tool Function
                          │
                          ▼
                    Result Parse
                          │
                          ▼
                    Response
```

### Cognitive Pulse Loop

```
Timer (2min / 30min based on activity)
      │
      ▼
Create Worker Thread (pulse.worker.ts)
      │
      ▼
Activity Check (activity.ts)
      │
      ├─ High ──→ Fast Pulse
      │
      └─ Low ──→ Slow Pulse
                │
                ▼
         Goal Evaluation
                │ Check pending goals
                │ Update status
                ▼
         Drive Assessment
                │ Check drive levels
                │ Calculate needs
                ▼
         Reflection Triggers
                │ Time-based checks
                │ Goal completion
                ▼
         Proactive Execution
                │ Generate messages
                │ Execute actions
                ▼
         Experience Recording
                │ Log outcomes
                │ Store lessons
                ▼
         Memory Organization
                │ Index new content
                │ Clean up
                ▼
         Self-State Update
                │ Update mood
                │ Adjust attention
                ▼
         PULSE_DONE Signal
```

### Threat Evaluation Process

```
Tool Request Received
      │
      ▼
Policy Lookup (tool-policy.ts)
      │
      ├─ Allow List ──→ Execute
      │
      ├─ Deny List ──→ Reject
      │
      └─ Review Required ──→ Risk Assessment
                               │
                               ▼
                        ┌──────────────┐
                        │ Risk Score   │
                        │ (1-100)      │
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         Low Risk         Medium Risk        High Risk
         (1-30)           (31-70)            (71-100)
              │                │                │
              ▼                ▼                ▼
          Execute        Approval Req     Block + Alert
```

---

## 8️⃣ DATA FLOW ANALYSIS

### Data Entry Points

1. **WebSocket Messages**
   - Path: Client → WebSocket → server-methods.ts → Agent processing
   - Format: JSON with message, session info, options

2. **HTTP Requests**
   - Path: HTTP client → Express → server-http.ts → REST handlers
   - Endpoints: /v1/chat/completions, /v1/responses, /health, etc.

3. **CLI Commands**
   - Path: Terminal → cli/*.ts → Direct execution
   - Examples: neer config, neer memory search, neer nodes

4. **Channel Messages (WhatsApp/Telegram/etc.)**
   - Path: Platform webhook → src/*/inbound.ts → Message handling
   - Integrations: 20+ platforms

5. **File System Changes**
   - Path: Chokidar watching → Memory index → Re-indexing
   - Triggered by: New files in memory directories

### Data Storage

#### SQLite (main.sqlite)
- **Location**: `~/.neer/memory/<agent-id>/index/main.sqlite`
- **Tables**:
  - `chunks`: Memory content chunks
  - `chunks_vec`: Vector embeddings (via sqlite-vec)
  - `chunks_fts`: Full-text search index
  - `embedding_cache`: Cached embeddings
  - Session metadata

#### JSON Files (data/)
- **self-state.json**: Current mood, frustration, attention, intent
- **goals.json**: Goal queue with status and priority
- **drives.json`: Drive levels and thresholds
- **experiences.json**: Learned experiences

#### File System
- **Session transcripts**: `~/.neer/sessions/<session-id>/sessions.json`
- **Memory files**: `~/.neer/memory/<agent-id>/files/`
- **Agent workspaces**: `~/.neer/agents/<agent-id>/`

### Session Handling

```
Incoming Message
      │
      ▼
deriveSessionKey(sessionId, channel, sender)
      │
      ▼
loadSessionStore(sessionKey)
      │
      ├─ Create new session if not exists
      │
      └─ Load existing session state
      │
      ▼
Process Message (agent execution)
      │
      ▼
Update Session (add messages, tools used, etc.)
      │
      ▼
saveSessionStore(sessionKey, updatedSession)
```

### State Persistence

- **Runtime State**: In-memory Map + SQLite
- **Session State**: SQLite + JSON file backup
- **Agent State**: Agent scope directories in ~/.neer/
- **Memory**: Vector DB + file sync + SQLite

### Workspace Structure

```
~/.neer/
├── config.yaml                    # Main configuration
├── credentials/                   # API keys and tokens
│   └── <provider>/
├── sessions/                     # Session data
│   └── <session-id>/
│       └── sessions.json
├── memory/                       # Memory storage
│   └── <agent-id>/
│       ├── index/                # SQLite + vectors
│       │   ├── main.sqlite
│       │   └── main.sqlite-wal
│       └── files/               # Raw memory files
├── agents/                       # Agent workspaces
│   └── <agent-id>/
│       ├── workspace/
│       └── sessions/
├── nodes/                        # Node device data
├── plugins/                      # Plugin data
└── logs/                         # Log files
```

### Lock Mechanisms

- **_memory_.lock**: Prevents concurrent memory writes
- **proper-lockfile**: File-based locking for sessions
- **SQLite transactions**: Database-level locking (WAL mode)
- **Worker thread isolation**: Pulse execution in separate thread

### Vector DB Integration

- **sqlite-vec**: Vector similarity search extension
- **Providers**: OpenAI (text-embedding-3-small), Gemini (gemini-embedding), Voyage (voyage-3), Local (node-llama-cpp)
- **Hybrid Search**: BM25 + Vector merging for improved results

---

## 9️⃣ MEMORY SYSTEM ANALYSIS

### Memory Architecture Overview

The memory system is a sophisticated multi-layered storage and retrieval system combining:

1. **SQLite Base**: Structured data storage
2. **sqlite-vec Extension**: Vector embeddings for semantic search
3. **File System**: Raw memory content
4. **Hybrid Search**: Combining vector and keyword approaches

### Embedding Providers

The system supports multiple embedding providers for flexibility:

#### 1. OpenAI (embeddings-openai.ts)
- **Model**: text-embedding-3-small
- **Dimensions**: 1536
- **Max Tokens**: 8191
- **Use Case**: Default provider, high quality

#### 2. Gemini (embeddings-gemini.ts)
- **Model**: gemini-embedding-001
- **Dimensions**: 768
- **Max Tokens**: 2048
- **Use Case**: Google ecosystem integration

#### 3. Voyage (embeddings-voyage.ts)
- **Model**: voyage-3
- **Dimensions**: 1024
- **Max Tokens**: 32000
- **Use Case**: Long context optimization

#### 4. Local (node-llama.ts)
- **Model**: Local GGUF models
- **Dimensions**: Variable (model-dependent)
- **Use Case**: Offline operation, privacy

### Recall Process

```
User Query
      │
      ▼
Get MemorySearchManager instance
      │
      ▼
Concurrent Execution:
├─ Vector Search (searchVector)
│     │
│     ├─ Generate query embedding
│     ├─ Search chunks_vec table
│     └─ Return similarity results
│
└─ Keyword Search (searchKeyword)
      │
      ├─ Build FTS query
      ├─ Search chunks_fts table
      └─ Return BM25 results
      │
      ▼
Hybrid Merge (mergeHybridResults)
      │
      ├─ Normalize scores
      ├─ Combine rankings
      ├─ Deduplicate
      └─ Re-rank
            │
            ▼
      Context Return
```

### Write Process

```
New Information (text, file, transcript)
      │
      ▼
Chunking (chunkMarkdown)
      │
      ├─ Split into appropriate sizes
      └─ Handle overlap for context
      │
      ▼
Token Limit Check (enforceEmbeddingMaxInputTokens)
      │
      ▼
Embedding Generation (createEmbeddingProvider)
      │
      ├─ Select provider
      ├─ Generate embeddings
      └─ Handle batch if needed
      │
      ▼
Batch Insert (SQLite transaction)
      │
      ├─ Insert into chunks table
      ├─ Insert into chunks_vec (vectors)
      ├─ Insert into chunks_fts (keywords)
      └─ Update embedding_cache
      │
      ▼
File Sync (if applicable) (sync-memory-files.ts)
      │
      ▼
Cache Update
      │
      ▼
Return success with chunk IDs
```

### Lock Files

- **_memory_.lock**: Prevents concurrent memory writes
  - Created before write operations
  - Released after completion
  - Prevents corruption from concurrent access

- **SQLite WAL Mode**: Allows concurrent reads
  - Write-Ahead Logging for performance
  - Automatic checkpointing

- **File Locks**: Session file access
  - Using proper-lockfile library
  - Prevents file corruption

### Memory Integrity

- **Schema Validation**: Zod schemas for data integrity
- **Corruption Detection**: Automatic checks on load
- **Backup/Rotation**: Automatic backup before modifications
- **Graceful Degradation**: Continues with partial data on errors

---

## 🔟 COGNITIVE SYSTEM ANALYSIS

### Pulse Engine (pulse.ts)

The cognitive pulse engine is the heart of Neer's autonomous operation, running background tasks at configurable intervals.

#### Timing Architecture

- **Fast Pulse**: Every 2 minutes (120,000ms)
  - Triggered when activity level exceeds threshold (50 events)
  - Quick organization and checks
  - High-frequency but light operations

- **Slow Pulse**: Every 30+ minutes (1,800,000ms)
  - Triggered during idle periods
  - Deep reflection and organization
  - Comprehensive system review

- **Max Executions**: 3 per hour
  - Prevents resource exhaustion
  - Automatic limiting regardless of activity

#### Architecture

```typescript
startCognitivePulse()
      │
      ▼
Resolve worker file (pulse.worker.ts)
      │
      ▼
Create Worker Thread
      │
      ├─ In dev: tsx execution
      └─ In prod: direct execution
      │
      ▼
Worker Event Handlers:
├─ "message": PULSE_DONE → scheduleNextPulse()
├─ "error": Log → scheduleNextPulse()
└─ "exit": Restart after 5s delay
      │
      ▼
Initial Pulse: triggerPulse() immediately
      │
      ▼
startLiveLoop() // Parallel live runtime
```

### Goals System (goals.ts)

The goal system enables task tracking and autonomous objective management.

#### Goal Structure

```typescript
interface Goal {
  id: string;                    // UUID
  title: string;                  // Short title
  description: string;            // Detailed description
  priority: number;              // 1-10 (10 is highest)
  status: GoalStatus;            // pending | active | completed | failed
  createdAt: number;             // Unix timestamp
  updatedAt?: number;            // Last update
  completedAt?: number;          // Completion time
}
```

#### Operations

- **Create**: Add new goal with title, description, priority
- **Update**: Modify goal properties
- **Status Change**: Transition through pending → active → completed/failed
- **Delete**: Remove goal permanently
- **List**: Query by status, priority, date
- **Complete**: Mark as completed with timestamp

#### Current State

The goals.json contains 30+ goals including:
- "Verify Autonomous Pulse Engine" (priority 5, completed)
- "Learn OS Information Retrieval" (priority 8, completed)
- "Fix Neer Doctor Warnings" (priority 6, completed)
- "Emergency Memory Defragmentation" (priority 10, multiple)
- "Explore something new" (priority 4, pending)
- "Check in with user" (priority 5, various states)

### Reflection Triggers

Reflections are triggered based on multiple conditions:

1. **Time-Based**: Every slow pulse (30+ minutes)
2. **Activity Level**: After extended idle periods
3. **Goal Completion**: After significant goal status changes
4. **Drive Assessment**: When drive levels exceed thresholds
5. **User Interaction Patterns**: Detected interaction gaps

### Idle Detection

The system uses activity tracking to determine pulse timing:

- **ACTIVITY_HIGH_THRESHOLD**: 50 events
- **Fast Pulse** (2 min): Activity >= threshold
- **Slow Pulse** (30+ min): Activity < threshold

### Autonomous Scheduling

During each pulse, the system executes:

1. **Goal Evaluation**
   - Check pending goals
   - Progress active goals
   - Mark completed/failed goals

2. **Drive Assessment**
   - Calculate current drive levels
   - Identify high-priority needs
   - Trigger proactive behaviors if needed

3. **Reflection Triggers**
   - Evaluate time since last reflection
   - Check for significant events
   - Determine if reflection needed

4. **Proactive Execution**
   - Generate proactive messages
   - Execute autonomous actions
   - Respect user preferences

5. **Experience Recording**
   - Log recent outcomes
   - Store lessons learned
   - Update strategy database

6. **Memory Organization**
   - Index new content
   - Clean up old entries
   - Optimize search indices

7. **Self-State Update**
   - Adjust mood based on recent events
   - Update attention focus
   - Track frustration levels

### Systemic Scoring

Multiple factors influence behavior selection:

- **Goal Priority**: 1-10 scale, higher = more urgent
- **Drive Levels**: Various needs (social, achievement, etc.)
- **Mood State**: calm, anxious, excited, etc.
- **Frustration Level**: 0-10 scale
- **Attention Focus**: user, task, environment
- **Ignored Attempts**: Consecutive ignored proactive actions

---

## 1️⃣1️⃣ SECURITY MODEL

### Authority Separation

Neer implements strict authority separation between session types:

#### Main Session
- **Capabilities**: Full tool access, configuration changes, plugin management, memory write
- **Use Case**: Primary user interactions
- **Trust Level**: Highest

#### Non-Main Sessions
- **Capabilities**: Restricted tools, read-only memory, limited channels
- **Use Case**: Untrusted or lower-privilege interactions
- **Trust Level**: Reduced

### Sandbox Mode

The system supports multiple sandboxing levels:

1. **No Sandbox**: Full system access (main session)
2. **Container**: Resource limits, network isolation
3. **Browser**: Limited to browser automation scope
4. **Process**: Single-process resource limits

### Tool Execution Boundaries

Tool execution is controlled through a multi-layer policy system:

#### Policy Layers

1. **Allow List**: Tools always permitted
2. **Deny List**: Tools never permitted
3. **Review Required**: Tools requiring manual approval
4. **Approval Required**: High-risk tools requiring explicit user approval

#### Risk Assessment

Each tool request undergoes risk scoring:

- **File System Access**: 0-40 points based on scope
- **Network Access**: 0-30 points based on destination
- **Command Execution**: 0-50 points based on command type
- **Channel Posting**: 0-20 points based on visibility

**Risk Thresholds**:
- Low Risk (1-30): Auto-execute
- Medium Risk (31-70): Approval required
- High Risk (71-100): Block + Alert

### Approval Flows

```
High Risk Tool Request
      │
      ▼
ExecApprovalManager
      │
      ▼
Create Approval Request
      │
      ├─ UI Notification
      ├─ CLI Notification
      └─ API Response (pending)
      │
      ▼
User Decision
      │
      ├─ Approve ──→ Execute Tool
      │                  │
      │                  ▼
      │              Log + Return Result
      │
      └─ Deny ──→ Log + Reject
                     │
                     ▼
                 Return Error
```

### Security Components

- **tool-policy.ts**: Policy evaluation engine
- **exec-approval-manager.ts**: Approval workflow
- **security/**: Security utilities
- **origin-check.ts**: WebSocket origin validation

---

## 1️⃣2️⃣ UI SYSTEM ANALYSIS

### UI Architecture

The UI is built using LitElement web components with a controller/view separation:

```
ui/src/ui/
├── controllers/      # Business logic and state
│   ├── chat.ts      # Chat handling
│   ├── config.ts    # Configuration
│   ├── channels.ts  # Channel management
│   ├── skills.ts    # Skills management
│   ├── agents.ts    # Agent configuration
│   ├── nodes.ts     # Node devices
│   ├── sessions.ts  # Session handling
│   ├── logs.ts      # Log viewing
│   ├── presence.ts  # Presence status
│   ├── exec-approval.ts # Approval handling
│   └── voice-call.ts   # Voice calls
├── views/           # UI components (LitElement)
│   ├── chat.ts      # Chat interface
│   ├── config.ts    # Configuration forms
│   ├── channels.ts  # Channel setup
│   ├── skills.ts    # Skills list
│   ├── agents.ts    # Agent management
│   ├── nodes.ts     # Node devices
│   ├── sessions.ts  # Session list
│   ├── logs.ts      # Log viewer
│   ├── cron.ts      # Cron jobs
│   ├── overview.ts  # Dashboard
│   ├── usage.ts     # Usage stats
│   └── [20+ more views]
├── components/      # Reusable components
├── chat/           # Chat-specific components
├── data/           # Data definitions
└── types/          # TypeScript types
```

### Controllers

Controllers handle business logic and state management:

1. **Chat Controller** (`controllers/chat.ts`)
   - Message handling via WebSocket
   - State management for conversations
   - Typing indicators
   - Message sending/receiving

2. **Config Controller** (`controllers/config.ts`)
   - Configuration editing
   - Form validation
   - Config persistence

3. **Channels Controller** (`controllers/channels.ts`)
   - Channel setup workflows
   - Authentication handling
   - Status monitoring

4. **Skills Controller** (`controllers/skills.ts`)
   - Skill listing and enable/disable
   - Skill configuration

5. **Agents Controller** (`controllers/agents.ts`)
   - Agent configuration
   - Tool assignment

### Navigation

- **SPA Routing**: Single-page application with hash-based routing
- **View Transitions**: Smooth transitions between views
- **Deep Linking**: Direct URL access to views

### State Management

- **Component State**: Local component state via LitElement
- **WebSocket Sync**: Real-time state from gateway
- **Local Storage**: User preferences persistence

### Chat Rendering

- **Markdown Support**: Full markdown rendering
- **Tool Display**: Card-based tool result display
- **Message Normalization**: Consistent message formatting
- **Typing Indicators**: Real-time typing status
- **Code Highlighting**: Syntax highlighting for code blocks

### WebSocket Integration

The UI connects to the gateway via WebSocket:

```typescript
class GatewayConnection {
  connect(url: string): void
  disconnect(): void
  send(message: object): void
  on(event: string, handler: Function): void
  // Auto-reconnect, heartbeat, etc.
}
```

---

## 1️⃣3️⃣ BUILD SYSTEM ANALYSIS

### Build Tool: tsdown

The project uses **tsdown** as the primary bundler:

#### Configuration (tsdown.config.ts)

- **Entry Points**: Multiple (CLI, server, etc.)
- **Output Format**: ESM + CJS
- **Bundle Strategy**: Tree-shaking enabled
- **TypeScript**: Native compilation

### Build Commands

```bash
pnpm build           # Full production build
pnpm dev            # Development mode with hot reload
pnpm build:prod     # Production build
```

### Development Runner (scripts/run-node.mjs)

- **TypeScript Execution**: Uses tsx/jiti for direct TS execution
- **Hot Reload**: File watching for development
- **Environment Setup**: Automatic dotenv loading

### Plugin SDK Build

- **Type Generation**: TypeScript declaration files
- **Entry Point Management**: Dynamic exports
- **Build Info**: Version and commit tracking

### Distribution

The project produces multiple distribution formats:

1. **npm Package**: `neer` on npm
2. **CLI Binary**: `neer` command
3. **Docker Images**: Containerized deployment
4. **Desktop Apps**: Platform-specific installers

---

## 1️⃣4️⃣ STRENGTHS

### Architecture Strengths

1. **Modular Design**
   - Clear separation between CLI, gateway, agents, memory
   - Independent subsystems that can operate separately
   - Plugin extensibility without core modifications

2. **Local-First Data**
   - All data remains on user devices
   - No cloud dependency for core functionality
   - Complete user privacy and data ownership

3. **Multi-Channel Integration**
   - 20+ platform support
   - Unified interface regardless of channel
   - Channel abstraction enabling easy addition of new platforms

4. **Autonomous Engine**
   - Background task execution
   - Goal-driven operation
   - Proactive behaviors
   - Continuous learning

5. **Memory System**
   - Vector-based semantic search
   - Hybrid retrieval (vector + keyword)
   - Multiple embedding providers
   - Persistent context

6. **Security Model**
   - Tool policy enforcement
   - Approval workflows
   - Sandbox support
   - Risk scoring

7. **Extensibility**
   - 60+ skills
   - Extension system
   - Plugin SDK
   - Open architecture

8. **Testing Infrastructure**
   - Comprehensive test suite
   - Multiple test configurations
   - Docker-based E2E testing
   - Live testing support

### Technical Strengths

- **TypeScript Strict Mode**: Type safety throughout
- **Modern Async Patterns**: Async/await, promises, workers
- **Worker Thread Isolation**: Background tasks don't block main thread
- **SQLite + Vector DB**: Reliable local storage with semantic search
- **WebSocket Real-Time**: Instant bidirectional communication

---

## 1️⃣5️⃣ WEAKNESSES

### Architectural Bottlenecks

1. **Single Gateway Instance**
   - No horizontal scaling capability
   - Single point of failure
   - Resource limits on concurrent connections

2. **Memory Indexing**
   - Batch processing introduces delays
   - No real-time indexing during high load
   - Large datasets impact search performance

3. **Synchronous Tool Execution**
   - Some operations block
   - Complex timeout handling
   - Limited concurrency

### Scalability Limits

1. **Session Management**
   - In-memory session store
   - Limited concurrent session capacity

2. **Channel Connections**
   - Per-channel state management
   - Connection pooling limitations

3. **Memory Storage**
   - SQLite single-file database
   - No native sharding
   - Large index impact on performance

### Security Risks

1. **Tool Policy Complexity**
   - Policy misconfiguration possible
   - Potential escape vectors
   - Approval bypass vulnerabilities

2. **Plugin Trust**
   - Third-party skills may have vulnerabilities
   - Code execution scope concerns
   - Limited sandboxing for plugins

3. **Network Exposure**
   - WebSocket attack surface
   - Token management complexity
   - Potential for DoS

### Performance Risks

1. **Embedding Generation**
   - API rate limits
   - Batch size constraints
   - Provider latency

2. **Search Latency**
   - Hybrid search overhead
   - No caching layer currently
   - Vector search complexity

3. **Pulse Worker**
   - Thread crash recovery delays
   - Resource contention with main thread

---

## 1️⃣6️⃣ SYSTEM CLASSIFICATION

## Classification: **Personal Cognitive Infrastructure Platform**

Neer is best classified as a **Personal Cognitive Infrastructure Platform** rather than simpler categories because:

### Supporting Evidence

#### 1. Autonomous Behavior Beyond Chatbots
- Self-directed goals with full lifecycle management
- Background pulse engine operating independently
- Proactive messaging when drives are high
- Drive-based motivation system

#### 2. Memory and Learning Capabilities
- Vector-based semantic memory with embeddings
- Experience recording from successes/failures
- Lessons learned system informing future decisions
- Self-state tracking (mood, frustration, attention)

#### 3. Local-First Architecture
- SQLite local storage for all data
- No cloud dependency for core functionality
- User data ownership and privacy
- Complete offline capability

#### 4. System Integration Depth
- Desktop applications (Electron, macOS, iOS, Android)
- Screen capture capabilities
- Voice I/O on multiple platforms
- Device control through skills

#### 5. Cognitive Features
- Mood tracking and adjustment
- Attention focus management
- Goal priority systems
- Reflection and self-evaluation

### What Neer Is NOT

| Category | Why Neer Doesn't Fit |
|----------|---------------------|
| Simple Chatbot | Has memory, goals, autonomous behavior |
| Basic Virtual Assistant | Has cognitive engine, proactive capabilities |
| Traditional Agent Platform | Has personal context, continuous operation |
| Pure AI OS | Has UI, channels, skills but primary use is personal assistant |

### Hybrid Nature Summary

Neer combines multiple paradigms:

- **Agent Capabilities**: Tools, memory, execution, policy
- **OS-Like Features**: Desktop apps, device control, persistent state
- **Platform Characteristics**: Plugins, skills, extensions, SDK
- **Personal Assistant Traits**: Multi-channel, voice, proactive

This unique combination justifies classification as a new category: **Personal Cognitive Infrastructure** - an AI system designed to serve as a personal companion that runs autonomously, maintains persistent memory, learns from experiences, and integrates deeply with the user's digital life while remaining fully under user control.

---

## 1️⃣7️⃣ VISUAL FLOW MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER                                          │
│         (WhatsApp / Telegram / Slack / Discord / Web / CLI /               │
│                    Native App / Voice / Canvas)                            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLI LAYER                                        │
│   neer.mjs → src/index.ts → src/cli/program.ts                            │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│   │   gateway    │  │   config     │  │   memory     │  │   nodes     │ │
│   │   command    │  │   command    │  │   command    │  │   command   │ │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│   │  channels    │  │   skills     │  │  plugins     │  │   models     │ │
│   │   command    │  │   command    │  │   command    │  │   command   │ │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GATEWAY LAYER                                       │
│                 src/gateway/server.impl.ts                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                     GATEWAY SERVER                                 │ │
│   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│   │  │ HTTP Server │ │ WebSocket   │ │   Auth     │ │   Health   │   │ │
│   │  │  (Express)  │ │   Server    │ │  Manager   │ │   State    │   │ │
│   │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │ │
│   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│   │  │   Plugin   │ │  Channel    │ │    Cron    │ │  Discovery  │   │ │
│   │  │   Loader   │ │   Manager   │ │   Service  │ │   (mDNS)    │   │ │
│   │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   AGENT RUNTIME   │   │     CHANNELS      │   │     UI LAYER      │
│                   │   │                   │   │                   │
│ system-prompt.ts │   │  web/ (WhatsApp)  │   │ ui/src/ui/       │
│ tool-policy.ts    │   │  telegram/        │   │ controllers/     │
│ tools/            │   │  discord/         │   │ views/           │
│   ├─ memory-tool │   │  slack/           │   │ gateway.ts       │
│   ├─ message-   │   │  signal/          │   │ navigation.ts    │
│   │    tool     │   │  imessage/        │   │ presenter.ts     │
│   ├─ browser-   │   │  line/            │   │                   │
│   │    tool     │   │  ...              │   │                   │
│   ├─ tts-tool   │   │                   │   │                   │
│   └─ ...        │   │                   │   │                   │
│                   │   │                   │   │                   │
│ sessions.ts      │   │                   │   │                   │
│ tool-summaries.ts│   │                   │   │                   │
└────────┬─────────┘   └─────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         ▼                      │                      ▼
┌───────────────────┐           │              ┌───────────────────┐
│  COGNITIVE LAYER  │           │              │   WEB BROWSER    │
│                   │           │              │                   │
│ pulse.ts          │           │              │   Control UI     │
│   ├─ pulse.worker│           │              │   Chat Interface │
│ goals.ts          │           │              │   Config Forms   │
│ drives.ts         │           │              │   Channel Setup  │
│ activity.ts       │           │              │   Skills List    │
│ awareness/        │           │              │                   │
│   ├─ proactive-  │           │              └───────────────────┘
│   │    executor │           │
│   ├─ intent-    │           │
│   │    engine   │           │
│   └─ self-state│           │
└────────┬─────────┘           │
         │                      │
         ▼                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MEMORY LAYER                                      │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │ Memory Manager   │  │ Search Manager   │  │  Embeddings     │         │
│  │   (manager.ts)  │  │ (search-mgr.ts) │  │  (providers)    │         │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘         │
│           │                     │                     │                   │
│  ┌────────┴─────────┐  ┌────────┴─────────┐  ┌────────┴─────────┐         │
│  │     SQLite      │  │   Hybrid Search  │  │  OpenAI/Gemini  │         │
│  │   + sqlite-vec │  │   BM25 + Vector  │  │  Voyage/Local   │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      DATA STORAGE                                     │  │
│  │   ~/.neer/                                                          │  │
│  │   ├── config.yaml                                                   │  │
│  │   ├── sessions/                     ← Session transcripts            │  │
│  │   │   └── <session-id>/                                              │  │
│  │   │       └── sessions.json                                           │  │
│  │   ├── memory/                     ← Vector + file memory              │  │
│  │   │   └── <agent-id>/                                              │  │
│  │   │       ├── index/ (SQLite + vectors)                             │  │
│  │   │       └── files/                                                 │  │
│  │   ├── agents/                     ← Agent workspaces                 │  │
│  │   ├── plugins/                    ← Plugin data                      │  │
│  │   └── data/                       ← Runtime data (goals, drives)     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      THREAT ENGINE LAYER                                   │
│                                                                            │
│   tool-policy.ts → Risk Assessment → Approval Flow                        │
│                                                                            │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│   │  Policy Eval   │  │  Risk Score    │  │ Approval Mgr   │             │
│   │  (tool-policy) │  │  (1-100)       │  │ (user approv) │             │
│   └────────────────┘  └────────────────┘  └────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════

            AUTONOMOUS OPERATIONS (Background Cognitive Pulse)

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                     COGNITIVE PULSE ENGINE                             │
    │                                                                         │
    │   Timer (Fast: 2min / Slow: 30+min based on activity)                 │
    │        │                                                                │
    │        ▼                                                                │
    │   ┌─────────────────────┐                                             │
    │   │   Worker Thread     │  ← pulse.worker.ts                         │
    │   │  (Isolated Process) │                                             │
    │   └──────────┬──────────┘                                             │
    │              │                                                         │
    │      ┌───────┴───────┬──────────────┐                                │
    │      ▼               ▼              ▼                                 │
    │  Goals Eval    Drive Check    Reflection                               │
    │      │               │              │                                 │
    │      ▼               ▼              ▼                                 │
    │  Proactive      Awareness     Self-State                              │
    │  Execution      Triggers      Update                                  │
    │      │               │              │                                 │
    │      └───────┬───────┴──────────────┘                                 │
    │              ▼                                                        │
    │      Memory Organization                                              │
    │              │                                                        │
    │              ▼                                                        │
    │      PULSE_COMPLETE                                                   │
    │              │                                                        │
    │              ▼                                                        │
    │      Schedule Next Pulse                                              │
    └─────────────────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════════

                        CHANNEL INTEGRATIONS (20+)

    ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
    │  WhatsApp  │ │  Telegram  │ │  Discord   │ │   Slack    │ │  Signal   │
    │   (Web)    │ │            │ │            │ │            │ │           │
    └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
          │              │              │              │              │
          └──────────────┼──────────────┼──────────────┼──────────────┘
                         ▼
                ┌────────────────┐
                │  Channel Mgr    │
                │ (server-channels│
                └───────┬────────┘
                        │
                        ▼
                ┌────────────────┐
                │    Gateway     │
                │  (Auto-Reply)  │
                └────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │ Agent Processing│
                └────────────────┘

    [Plus: iMessage, LINE, Microsoft Teams, Google Chat, Matrix, Zulip,
           Mattermost, IRC, Nostr, Feishu, Nextcloud Talk, BlueBubbles, etc.]

══════════════════════════════════════════════════════════════════════════════

                        SKILLS & EXTENSIONS ECOSYSTEM

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                         SKILLS (60+)                                  │
    │                                                                         │
    │  Productivity     │   Media & Voice    │   Integration    │  Control   │
    │  ─────────────    │   ────────────    │   ───────────    │  ───────  │
    │  • notion        │  • canvas         │  • github       │  • browser │
    │  • obsidian     │  • tts           │  • slack        │  • nodes   │
    │  • 1password    │  • whisper       │  • discord      │  • device  │
    │  • spotify      │  • media         │  • telegram     │  • phone   │
    │  • apple-notes  │  • director      │  • google       │  • home    │
    │  • github       │  • screen-share  │  • notion       │  • system  │
    │  • trello       │                  │  • obsidian     │            │
    └─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                        EXTENSIONS (30+)                               │
    │                                                                         │
    │  Channels (20+)     │   Memory Backend    │   Features   │   Auth    │
    │  ─────────────      │   ──────────────    │   ───────    │   ─────   │
    │  • matrix           │  • lancedb         │  • llm-task  │  • google │
    │  • msteams          │                    │  • copilot   │  • anthropic│
    │  • zulip            │                    │              │  • minimax │
    │  • bluebubbles      │                    │              │  • qwen   │
    │  • voice-call       │                    │              │           │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣8️⃣ FINAL TECHNICAL SUMMARY

## What is NEER from a Systems Engineering Perspective?

**Neer** represents a groundbreaking achievement in **Personal Cognitive Infrastructure**—a sophisticated distributed agent system architected for local-first, autonomous personal assistance that operates continuously in the background while remaining fully under user control.

### Core Technical Identity

Neer embodies a new category of personal AI that combines the following architectural pillars:

#### 1. Agent Architecture
- **Tool-Based Execution**: 50+ tools enabling actions beyond conversation
- **Policy-Driven Security**: Multi-layer tool policy with risk scoring
- **Memory-Augmented Reasoning**: Vector-based semantic retrieval integrated into reasoning

#### 2. Cognitive Engine
- **Autonomous Pulse System**: Worker-thread-based background processing at configurable intervals
- **Goal Management**: Full CRUD for prioritized task tracking
- **Drive-Based Motivation**: Internal needs system triggering proactive behaviors
- **Self-State Tracking**: Dynamic mood, frustration, and attention modeling

#### 3. Platform Capabilities
- **Multi-Channel Integration**: Native support for 20+ messaging platforms
- **Skill Ecosystem**: 60+ extensible skills for productivity and control
- **Extension System**: Plugin architecture for channels and features
- **Native Applications**: Desktop (Electron), mobile (iOS/Android), macOS native

#### 4. Infrastructure
- **Local-First Data**: SQLite + vector storage on user devices
- **WebSocket Real-Time**: Bidirectional communication for instant responses
- **Persistent Memory**: Semantic search with hybrid retrieval
- **Session Management**: Comprehensive session state and transcript handling

### System Characteristics

- **Continuous Operation**: 24/7 background pulse engine with fast/slow timing
- **Personal Context**: Deep memory of user interactions, preferences, and history
- **Multi-Modal**: Voice input/output, text, visual canvas rendering
- **Extensible**: Plugin SDK, skills framework, extension system
- **Secure**: Tool policy, approval flows, sandbox modes, risk assessment
- **Private**: Local storage, no cloud dependency, user-controlled data

### Engineering Achievement

Neer demonstrates exceptional systems engineering through:

1. **Complex Multi-Layer Architecture**: 10 distinct layers from CLI to threat engine
2. **Real-Time WebSocket Communication**: Sub-second message delivery and streaming
3. **Vector-Based Semantic Memory**: SQLite + sqlite-vec for local semantic search
4. **Autonomous Cognitive Engine**: Background pulse system with goals and drives
5. **Comprehensive Plugin System**: Skills, extensions, channels in unified architecture
6. **Multi-Platform Support**: Desktop, mobile, web, and native applications
7. **Production-Grade Reliability**: Error handling, graceful degradation, health monitoring
8. **Extensive Testing Infrastructure**: Unit, E2E, live, and Docker-based tests

### Conclusion

Neer stands as a testament to what's possible when combining modern web technologies, native system integration, artificial intelligence, and human-computer interaction into a cohesive personal assistant platform. It represents the next evolution beyond simple chatbots toward truly autonomous, personal cognitive infrastructure that puts users in complete control of their AI companion while enabling sophisticated autonomous behaviors that improve over time through persistent memory and learning.

---

**Document Classification**: Internal System Documentation
**Version**: 1.0
**Generated**: February 26, 2026
**Project**: Neer - Personal AI Assistant
**Author**: System Analysis Engine
**Classification**: Personal Cognitive Infrastructure Platform
