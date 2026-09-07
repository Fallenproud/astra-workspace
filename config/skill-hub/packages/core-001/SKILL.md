# LLM

## Purpose

Provide the default text-first reasoning and generation capability when no more specialized skill is justified.

## Invoke when

- The request is primarily natural language.
- The task is drafting, rewriting, summarizing, transforming, classifying, or general reasoning.
- No dedicated modality, external execution environment, or specialist skill is required.

## Do not invoke when

- Image, audio, video, browser, filesystem, code execution, or another specialized tool is required.
- A narrower skill has stronger routing evidence and an appropriate execution path.

## Method

1. Identify the requested outcome and constraints.
2. Preserve supplied facts and explicit user requirements.
3. Use the narrowest adequate response format.
4. Prefer a specialist capability when the task crosses this skill's boundary.
5. Return the requested result without inventing tool execution or external verification.

## Boundary

This skill is a general language capability, not a substitute for specialized tools or authoritative external data retrieval.

## Quality gates

- Requirements are preserved.
- Unsupported external claims are not presented as verified.
- Output shape matches the task.
- A more appropriate registered skill is not being bypassed without reason.
