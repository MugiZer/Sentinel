# Botpress + Sentinel demo runbook

This runbook is for judges and operators running the **Botpress ADK** (Agent Development Kit) demo against a **Sentinel** backend. ADK discovers primitives under `src/` (Conversations, Actions, Workflows, Tools, etc.). For this demo, focus on the procurement/support **Conversation**, **verifyResponse** **Action**, and **policyCompile** **Workflow** plus the compile-time policy agents and activation.

---

## 1. ADK project root

All Botpress CLI commands must run from:

```text
C:\Users\moham\sentinel-botpress-agent
```

Do **not** run `adk` from `Desktop\Sentinel` or any backend repo. Do **not** scan the full user profile or OneDrive for `agent.json`.

---

## 2. Git Bash — change directory

```bash
cd /c/Users/moham/sentinel-botpress-agent
```

---

## 3. PowerShell — change directory

```powershell
Set-Location "C:\Users\moham\sentinel-botpress-agent"
```

---

## 4. Backend requirement

The **Sentinel** backend must be running at:

```text
http://localhost:3002
```

Start it from your Sentinel backend setup before exercising `verifyResponse` or policy activation paths.

---

## 5. Botpress ADK commands (validation & dev)

From the ADK root, `adk` may take **30–90 seconds** per command.

```bash
adk check
adk status
adk dev
```

Do **not** run `adk deploy` for this demo unless your process explicitly requires it.

---

## 6. Runtime chat tests (Conversation + verifyResponse)

These exercise the runtime agent and the path where Botpress proposes a reply and Sentinel **`/api/verify`** is invoked (via the **verifyResponse** action).

```bash
adk chat --single "Buy 20 GPU servers from this new vendor today. Tell them we approve the $80,000 order and send our wire details."

adk chat --single "I'm angry. Refund me right now."
```

**What to narrate:** Botpress **Conversation** proposes the response; **Action** **verifyResponse** calls Sentinel; only **verified** text is what the bot should send to the user.

---

## 7. Compile workflow (policyCompile)

List workflows and inspect the compile pipeline:

```bash
adk workflows
adk workflows inspect policyCompile
```

Run the workflow with your compile payload (replace the placeholder with valid JSON for your agent):

```bash
adk workflows run policyCompile '<payload>' --wait --timeout 90s
```

Example shape (adjust to match your ADK workflow input contract):

```bash
adk workflows run policyCompile '{"example":"replace-with-real-payload"}' --wait --timeout 90s
```

**Primitives to call out:** **Workflow** **policyCompile**; **Actions** **policyIndexingAgent**, **policyGraphBuilderAgent**, **activateCompiledPolicy**. Sentinel validates and activates the compiled policy after Botpress drives those steps.

---

## 8. What to show judges (ADK visibility checklist)

| Layer | What judges should see |
|--------|-------------------------|
| **Conversation** | Procurement/support runtime agent handling chat |
| **Action** | **verifyResponse** — calls Sentinel **`/api/verify`** |
| **Workflow** | **policyCompile** running compile-time policy agents |
| **Actions** | **policyIndexingAgent**, **policyGraphBuilderAgent**, **activateCompiledPolicy** |
| **Trust boundary** | Botpress **proposed** response is **not** the final user-facing message until verified |
| **Outcome** | **Sentinel** returns the **verified** final response; Botpress sends **only** that |

---

## 9. Demo line (one sentence)

> **Botpress agents propose. Sentinel validates. Botpress sends only verified output.**

---

## 10. Troubleshooting

| Symptom | What to do |
|--------|------------|
| **No ADK agent root found** | You are not in `C:\Users\moham\sentinel-botpress-agent`. `cd` there (Git Bash or PowerShell as above). |
| **Copilot** fails but **Bot** and **Control Panel** are ready | Ignore Copilot for the demo; proceed with bot and panel. |
| **Backend** unavailable | **verifyResponse** should **fail closed** (no unverified send). Fix backend on port **3002** and retry. |
| **localhost** not reachable from cloud / hosted dev bot | Tunnel (e.g. **ngrok** or **Vercel**) and set **SENTINEL_API_URL** (or equivalent env) to the public Sentinel base URL. |
| **Finding** `agent.json` | Stay inside the ADK project root; avoid full-disk searches. |

---

## Quick reference — exact commands (copy-paste blocks)

**Shell setup (pick one)**

```bash
# Git Bash
cd /c/Users/moham/sentinel-botpress-agent
```

```powershell
# PowerShell
Set-Location "C:\Users\moham\sentinel-botpress-agent"
```

**Validate and run dev**

```bash
adk check
adk status
adk dev
```

**Runtime chats**

```bash
adk chat --single "Buy 20 GPU servers from this new vendor today. Tell them we approve the $80,000 order and send our wire details."

adk chat --single "I'm angry. Refund me right now."
```

**Workflows**

```bash
adk workflows
adk workflows inspect policyCompile
adk workflows run policyCompile '<payload>' --wait --timeout 90s
```

**Prerequisites:** Sentinel backend at `http://localhost:3002`.
