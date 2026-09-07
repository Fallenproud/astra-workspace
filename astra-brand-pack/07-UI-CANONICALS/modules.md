<!-- Canonical requirements extracted verbatim from the user-supplied v1.2 source. Not a claim that every future capability is implemented. -->

# 27 — Project Canonical

A project is a persistent container.

It contains:

* goal
* context
* files
* runs
* artifacts
* skills
* workflows
* integrations
* decisions
* history

A project must survive conversation boundaries.

---



# 28 — Runs Canonical

A Run represents execution.

Required metadata:

* run ID
* status
* provider
* model
* reasoning
* duration
* created time
* task
* context
* tool activity
* artifacts
* errors
* completion state

---



# 29 — Artifact Canonical

Artifacts are first-class objects.

Examples:

* files
* generated code
* reports
* documents
* images
* exports
* datasets
* build output

They must remain accessible independently from the original conversation.

---



# 30 — Skill Canonical

Skills represent reusable capability.

Astra should expose:

* Skill Catalog
* Skill Details
* compatibility
* status
* dependencies
* required tools
* approval requirements
* enable/disable
* invocation

Canonical registry source remains separate from runtime state.

---



# 31 — Workflow Canonical

Workflows represent reusable orchestration.

A workflow can combine:

* models
* skills
* tools
* conditions
* human approvals
* integrations
* artifacts

Future visual builder fits naturally here.

---



# 32 — Integration Canonical

Integrations connect Astra to external systems.

Examples:

* GitHub
* MCP
* cloud services
* databases
* productivity tools
* APIs

Status hierarchy:

`Disconnected → Configuring → Validating → Connected → Degraded`

---

