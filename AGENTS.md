# Butter Engineering Guide

All repository artifacts must be written in English.

## Behavioral constitution

1. Minecraft Beta 1.7.3 is the visual and input oracle for the Minecraft
   renderer. Host-canvas tests do not replace that oracle.
2. `.butter` templates and Java backing classes are a fail-closed contract.
   Missing actions, wrong types, unknown utilities, duplicate semantic IDs,
   and mismatched props are compile errors.
3. Butter owns UI semantics. Worldline may consume the semantic tree; it
   does not own Butter widget metadata.
4. Players must not need the Worldline laboratory to run a Butter GUI.
5. Never commit or distribute the official Minecraft JAR, original assets,
   or decompiled Minecraft sources.

## Engineering constitution

1. Each product source file must remain at or below 200 code lines.
2. Each harness source file must remain at or below 300 code lines.
3. Each smoke source file must remain at or below 150 code lines.
4. Each adapter source file must remain at or below 150 code lines.
5. There is no total line budget. Tests are unlimited. Product behavior may
   not be moved into tests, generated files, or harness code to evade a
   per-file ceiling.
6. Modules follow the dependency order declared in `harness.properties`.
   A module may depend only on modules listed there; cycles are forbidden
   and the harness compiles modules separately to enforce this.
7. Prefer the smallest complete implementation. Add an abstraction only
   when it creates a real boundary.
8. Missing tools, missing tests, illegal dependencies, and unresolved
   checks fail closed.

## Canonical verification

Run from the repository root:

```text
java tools/harness/Verify.java
```

This gate owns per-file source ceilings, module dependency order,
compilation with warnings as errors, and the complete test suite.
Product modules compile to Java 8 bytecode.

Minecraft-linked adapter compilation requires a mapped b1.7.3 client and:

```text
java tools/harness/Verify.java --runtime
```

Host-canvas tests do not replace that compile, and that compile does not
replace an official-JAR pixel oracle.

<!-- csm:instructions:start -->
## Codebase Semantic Memory

This repository uses CSM. Run `csm context --task "<goal>" --path <path>` before changing code and `csm check --task "<goal>" --base HEAD` before finishing. Durable tool state lives under `.csm/`; use `csm sync` to install the versions pinned by CSM. The standalone tools remain authoritative for their own records and must be invoked through `csm nya|rtw|wtw|nwc ...` in this repository.
<!-- csm:instructions:end -->
