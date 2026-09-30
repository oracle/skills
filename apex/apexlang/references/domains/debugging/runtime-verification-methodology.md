# Runtime Verification Methodology

## Overview

`apex validate -input` and `apex import -input` confirm a generated app **compiles and imports**. A separate verification pass is needed to confirm it **works when exercised** — that a real submit persists correct data, that error paths render as errors, and that navigation and UI state are right. `references/domains/debugging/runtime-ui-verification.md` already covers navigation, current-state, and layout verification; this file adds **data-write and submit-path verification** plus the agent-workflow discipline that keeps a "verified" claim honest.

Most items below are **agent verification methodology**, not APEX product behavior. Where a claim is environment-observed rather than vendor-documented, it is labeled as such.

## Validate/import success is not runtime success

Treat a green `apex validate` / `apex import` as **necessary, not sufficient**. The defects in `references/domains/debugging/runtime-error-catalog.md` all pass validation and import, then fail on first interaction. Before declaring a page that submits data or writes rows "done," verify the runtime behavior explicitly.

## No fake greens

A programmatic success is not proof the real user path works:

- Setting an item value in code (for example a JavaScript `setValue`) or issuing a direct DML statement can succeed while never exercising the rendered input path — event handlers, dynamic actions, validations, item-state propagation — that a real click or keystroke triggers.
- A programmatic green therefore proves only that the **storage/write mechanism** works. Stale-editor and event-wiring defects live specifically in the untested UI path.
- Require at least one **physical browser interaction** (a real edit in the actually-rendered page) before claiming the interactive path works.

## Two proof tiers: mechanism vs end-to-end

Track these separately and never conflate them:

- **Mechanism proof** — the plumbing works: a value flows through the intended wiring (for example, a UI widget populates a hidden submittable field that then posts). This does **not** prove the full submit-and-persist cycle wrote correct data.
- **End-to-end proof** — the persisted result is confirmed: a disposable fixture is set up in the exact editable state, driven through the **real submit flow**, and the resulting database write is checked independently.

Label work as "verified at mechanism level" or "verified end-to-end" — an unqualified "verified" hides the gap between them.

## Reproduce in both layers

Confirm any claimed write or fix in **both**:

1. the **data layer** — the row exists and the value persisted, checked directly against the database; and
2. the **live UI** — the same effect is observed in the running app through a browser.

A DB-only check does not prove the UI produces or consumes the state correctly; a UI-only check does not prove the correct data landed. Each side hides defects invisible to the other. Never treat an on-screen success message as proof of a write — confirm the actual row change (a stale `success_msg` parameter can also replay a prior banner (observed); see `runtime-error-catalog.md`, entry 5).

## Re-verify the critic

Static review — and multi-agent review sweeps in particular — produce **false positives at a non-trivial rate** (observed on the order of one in seven findings in the source practice; treat the exact rate as environment-dependent, not a constant). An apparent defect is frequently already correct in the running system, a data-truth artifact (a genuinely empty result), or deliberate legacy behavior.

- Adversarially **re-verify every finding against the live app and the database** before acting on it. Treat a review's output as a hypothesis list, not ground truth.
- A common false-positive source is reading a **static or component definition** (a template, a hand-authored variant, a component's declared attribute) instead of the **deployed runtime state**. Verify against what is actually deployed and running.

## Self-audit ledger

Close a non-trivial run with an explicit step-by-step self-audit rather than an unqualified "looks good":

- Enumerate **every** planned step and classify it **DONE-EXACTLY / DEVIATED / SKIPPED**, each with a reason and an impact.
- End with an explicit verified-versus-issues verdict.
- "No gaps" is legal **only** if every planned step was done exactly as specified. Any deviation or skip is disclosed individually, never folded into an all-clear.

This turns "the app is built" into an itemized, checkable claim — did every planned region, item, button, and behavior actually get built and verified — that pairs naturally with the generation plan the workflow already freezes.

## Session health before blaming the artifact

*Environment-observed, not vendor-documented. Applies to agents driving APEX/SQLcl through a long-lived, reused scripting session (for example an MCP or CLI bridge); a fresh-process-per-call setup may not reproduce these.*

A reused database or tooling session can enter a bad state after a failed import or a long-running call, so that **subsequent** calls fail for a reason unrelated to the artifact under test. An agent that retries or "fixes" the artifact then chases a phantom defect. Before attributing repeated failures to generated code:

- Confirm the **session is healthy** — reproduce the failure in a freshly established session or connection.
- Recovery differs by failure mode and can be **opposite**: some bad states clear only with a full **disconnect + reconnect** (a plain retry or lightweight reconnect does not); others survive reconnect entirely and require **restarting the session process**. Do not assume one recovery fits both.
- On long non-interactive stretches, **keep interactive sessions alive** or re-establish them before continuing, so an idle-timeout expiry is not misread as an application defect.

The recurring error number in the source practice was `ORA-20987`, but — as noted in `runtime-error-catalog.md`, entry 2 — that number is overloaded, so do not treat it as a reliable "bad session" signature; use the failing call and its context.

## Response shape

For a runtime verification pass, report: the page or flow tested, the user action driven, the observed UI result, the independent DB check, the mechanism-versus-end-to-end status, and the smallest re-check to run after any fix.

## Sources

- Oracle APEX API Reference — APEX_ERROR.ADD_ERROR (documented error-display path referenced above): https://docs.oracle.com/en/database/oracle/apex/24.2/aeapi/ADD_ERROR-Procedure-Signature-1.html
- Companion runtime references in this domain: `references/domains/debugging/runtime-ui-verification.md` (navigation and UI state) and `references/domains/debugging/runtime-error-catalog.md` (specific runtime error signatures and prevention).

*The verification practices in this file (no fake greens, mechanism-versus-end-to-end proof tiers, dual-layer reproduction, re-verifying review findings, the self-audit ledger, and session-health checks) are agent-workflow guidance derived from operational practice, not Oracle product documentation. The false-positive rate and session-recovery behaviors are environment-observed and should be treated as directional, not as vendor-specified constants.*
