<!-- Canonical requirements extracted verbatim from the user-supplied v1.2 source. Not a claim that every future capability is implemented. -->

# 24 — Canonical App Shell

The fundamental product shell is:

```text
┌───────────────────────────────────────────────────────┐
│ TOP RUNTIME BAR                                       │
├─────────────┬──────────────────────────┬──────────────┤
│             │                          │              │
│ LEFT NAV    │     MAIN WORKSPACE       │  INSPECTOR   │
│             │                          │              │
│             │                          │              │
│             │                          │              │
│             │     TASK COMPOSER        │              │
│             │                          │              │
└─────────────┴──────────────────────────┴──────────────┘
```

These are the five core layout primitives:

1. Runtime Bar
2. Navigation
3. Main Workspace
4. Composer
5. Inspector

---



# 25 — Runtime Bar Canonical

Contains globally relevant execution state:

**Environment**

→ Development / Staging / Production

**Provider**

→ OpenAI / future providers

**Model**

→ Astra / other models

**Reasoning**

→ runtime reasoning setting

**Status**

→ where appropriate

**User**

→ account / organization

Never overload this area.

---



# 26 — Home Canonical

The Home screen is the **entry point into work**.

Primary statement:

**Turn ideas into real work.**

Primary actions:

* Create a new project
* Run a workflow
* Connect an integration
* Explore skills

Primary composer:

**Describe what you want Astra to do...**

Supporting actions:

* Add files
* Add context
* Web search
* Templates
* Advanced
* Model selection
* Run task

---

