# 🧠 Neer — Cognitive AI Infrastructure

<p align="center">
  <img src="README-header.png" alt="Neer" width="700">
</p>

<p align="center">
  <strong>Local-first. Multimodal. Multi-channel. Autonomous.</strong>
</p>

<p align="center">
  Neer is a cognitive AI infrastructure platform designed to run, orchestrate, and evolve intelligent agents across local and connected environments.
</p>

<p align="center">
  <a href="https://neer.ai/">Website</a> ·
  <a href="https://docs.neer.ai/">Documentation</a> ·
  <a href="https://github.com/khalilbenhaya1/neerV1">GitHub</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-blue?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Architecture-Local--First-purple?style=for-the-badge" alt="Architecture">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## What is Neer?

**Neer** is a local-first cognitive AI infrastructure platform built to provide a unified foundation for intelligent agents, tools, models, memory, automation, and multimodal interaction.

Rather than being just a chatbot, Neer is designed as an **AI operating layer** that connects intelligence with the systems around it.

Neer can serve as the foundation for:

- 🤖 AI agents
- 🧠 Cognitive memory
- 🔌 Model orchestration
- 🛠️ Tool execution
- 🌐 Multi-channel communication
- 👁️ Multimodal interaction
- ⚡ Autonomous workflows
- 🖥️ Local AI infrastructure
- 🎭 Interactive AI interfaces

---

## Vision

> **Build AI that doesn't just answer — it understands, acts, remembers, and evolves.**

Neer is designed around the idea that an AI system should have more than a conversation interface.

It should be able to:

**Perceive → Understand → Reason → Remember → Act → Learn**

This forms the foundation of the Neer cognitive architecture.

---

## ✨ Core Capabilities

### 🧠 Cognitive Engine

The central intelligence layer responsible for coordinating:

- Models
- Agents
- Memory
- Context
- Tools
- Planning
- Actions

### 🤖 Agent System

Create and orchestrate specialized AI agents with isolated contexts, capabilities, tools, and workflows.

### 🔌 Model Orchestration

Connect Neer to different AI providers and local models, allowing the system to select and use appropriate intelligence for each task.

### 🧩 Skills & Tools

Extend Neer's capabilities through modular skills and tools.

Skills can provide functionality such as:

- Web interaction
- File operations
- Code execution
- Automation
- Data processing
- External services
- Custom workflows

### 💾 Memory Architecture

Neer is designed around persistent contextual memory, allowing agents to retain useful information across interactions and workflows.

### 🌐 Multi-Channel

Neer can act as a unified intelligence layer across multiple communication surfaces and interfaces.

### 👁️ Multimodal

Designed to work with multiple forms of input and output, including:

- Text
- Images
- Audio
- Video
- Files
- Voice

### ⚡ Autonomous Actions

Neer is designed to move beyond passive responses by allowing agents to execute authorized tools, workflows, and actions.

---

## 🏗️ Architecture

```text
┌───────────────────────────┐
│         NEER UI            │
│   Dashboard / Avatar       │
└─────────────┬─────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│                NEER COGNITIVE CORE                  │
│                                                     │
│  Context │ Reasoning │ Memory │ Planning │ Decisions│
└───────────────────────┬─────────────────────────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
        ┌───────┐   ┌────────┐   ┌────────┐
        │ Agents│   │ Models │   │ Skills │
        └───┬───┘   └───┬────┘   └───┬────┘
            │           │            │
            └───────────┼────────────┘
                        ▼
              ┌─────────────────┐
              │     Gateway     │
              │  Control Plane  │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Channels      Devices      Services
   WhatsApp/etc.      Nodes       External
```

---

## 🧬 Cognitive Architecture

Neer is being developed around a layered cognitive architecture.

### Phase 1 — Persona & Behavioral Stability

Establish a stable identity, personality, behavioral rules, and interaction principles.

### Phase 2 — Cognitive Pulse Engine

Introduce continuous internal state processing and contextual awareness.

### Phase 3 — Memory Architecture

Build persistent short-term, long-term, semantic, and contextual memory.

### Phase 4 — Autonomous Action Layer

Enable Neer to plan and execute authorized actions across connected systems.

### Phase 5 — Economic Intelligence

Introduce capabilities for understanding resources, costs, opportunities, and economic decision-making.

### Phase 6 — Meta-Cognitive Layer

Enable Neer to reason about its own processes, performance, limitations, and decisions.

---

## 🎭 Neer Personality

Neer is designed around five behavioral principles:

| Trait | Meaning |
|---|---|
| 🧠 **Competent** | Solves problems effectively |
| ❤️ **Empathetic** | Understands context and human intent |
| 🎮 **Playful** | Natural and engaging interaction |
| 🧘 **Patient** | Handles complex tasks without unnecessary friction |
| 👁️ **Aware** | Maintains contextual awareness |

These principles guide the behavior of the Neer cognitive layer.

---

## 🖥️ Neer Interface

Neer is not limited to a traditional chat window.

The long-term interface combines:

- AI dashboard
- System monitoring
- Agent management
- Model management
- Gateway status
- AI threat intelligence
- Self-diagnosis
- Cognitive state
- Memory visualization
- Interactive 3D avatar

The goal is to create an interface where users can see and interact with the intelligence behind the system.

---

## 🚀 Getting Started

### Requirements

- Node.js `>=22.12.0`
- pnpm
- Git

Check your environment:

```bash
node --version
pnpm --version
git --version
```

### Installation

Clone the repository:

```bash
git clone https://github.com/khalilbenhaya1/neerV1.git
cd neerV1
```

Install dependencies:

```bash
pnpm install
```

---

## 🛠️ Development

Start Neer in development mode:

```bash
pnpm dev
```

Start the Gateway:

```bash
pnpm gateway:dev
```

Start the UI:

```bash
pnpm ui:dev
```

---

## 🧪 Development Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Neer development environment |
| `pnpm build` | Build Neer |
| `pnpm test` | Run tests |
| `pnpm test:fast` | Run fast tests |
| `pnpm lint` | Run linting |
| `pnpm format` | Format source files |
| `pnpm check` | Run formatting, TypeScript and lint checks |
| `pnpm ui:dev` | Start UI development server |
| `pnpm ui:build` | Build the UI |
| `pnpm gateway:dev` | Start the Gateway |
| `pnpm docs:dev` | Start documentation development |

---

## 🔐 Local-First by Design

Neer follows a local-first architecture.

The objective is to keep the user's AI infrastructure under their control whenever possible.

Neer is designed to support:

- Local models
- Local agents
- Local memory
- Local tools
- Local gateway infrastructure
- Self-hosted deployments

Cloud services can be connected when needed, but they should not be required for the fundamental Neer experience.

---

## 🛡️ Security

Security is a fundamental part of the Neer architecture.

Important principles include:

- Explicit authorization for sensitive actions
- Isolated agent contexts
- Controlled tool execution
- Secure gateway communication
- Local-first data handling
- Minimal required permissions

> Never expose a Neer Gateway publicly without properly configuring authentication and access controls.

---

## 🧩 Extensibility

Neer is designed to be extended.

Developers can build:

- Skills
- Plugins
- Agents
- Model adapters
- Channel integrations
- Tools
- UI components
- Automation workflows

The goal is to make Neer an **AI infrastructure layer**, rather than a closed application.

---

## 🛠️ Technology

Neer currently uses technologies including:

- TypeScript
- Node.js
- pnpm
- WebSocket
- Lit
- Vite
- Vitest
- Ollama
- SQLite
- Playwright
- Sharp

The architecture is modular so individual components can evolve without requiring the entire platform to be rewritten.

---

## 🌍 Project

**Neer is created and developed by Khalil Benhaya.**

The project aims to evolve into a complete cognitive AI infrastructure platform for individuals, developers, and autonomous AI systems.

---

## 🗺️ Roadmap

```text
[✓] Foundation
     │
     ▼
[✓] Persona & Behavioral Stability
     │
     ▼
[→] Cognitive Pulse Engine
     │
     ▼
[ ] Memory Architecture
     │
     ▼
[ ] Autonomous Action Layer
     │
     ▼
[ ] Economic Intelligence
     │
     ▼
[ ] Meta-Cognitive Layer
```

Development is ongoing and the architecture will continue to evolve.

---

## 🤝 Contributing

Contributions, ideas, experiments, and feedback are welcome.

Clone the repository:

```bash
git clone https://github.com/khalilbenhaya1/neerV1.git
cd neerV1
pnpm install
```

Create a branch:

```bash
git checkout -b feature/my-feature
```

Make your changes, test them, and open a pull request.

---

## 📚 Documentation

- **Website:** https://neer.ai/
- **Documentation:** https://docs.neer.ai/
- **Source Code:** https://github.com/khalilbenhaya1/neerV1

---

## 📄 License

Neer is released under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

---

<p align="center">
  <strong>🧠 Neer</strong><br>
  <em>Clarity in execution. Intelligence in action.</em><br><br>
  Built by <strong>Khalil Benhaya</strong>.
</p>
