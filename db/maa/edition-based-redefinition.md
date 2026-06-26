# Edition-Based Redefinition

Use this file for zero or near-zero downtime application upgrades that involve database object changes. EBR is an application/database deployment technique, not a DR substitute.

## When EBR Fits

- The application requires database schema changes while existing users continue running.
- Changes involve editionable objects such as PL/SQL, views, synonyms, and related application-facing database APIs.
- The team can route old and new application code to different editions during rollout.
- The deployment can be broken into phases: prepare, expose compatibility layer, run old and new code, cut over, and clean up.

## Core Concepts

- An edition provides a private namespace for editioned objects.
- Editioning views decouple application-facing table shape from physical table changes.
- Crossedition triggers can keep old and new representations synchronized during online rollout.
- Sessions run in an edition; application services or connection configuration can control which edition new sessions use.
- Cleanup is a separate step after confidence is established.

## MAA Guidance

- Use EBR for application upgrade downtime, not infrastructure failure.
- Combine EBR with RAC services and connection draining for controlled rollout.
- Combine EBR with Data Guard only after considering redo/apply impact and operational sequencing.
- Test rollback/fallback explicitly. EBR can make fallback easier, but only if the deployment plan preserves compatibility.
- Keep external side effects, batch jobs, and non-editioned objects in the plan.

## Common Mistakes

- Treating EBR as a switch that makes any schema change online without design.
- Forgetting that tables are not editioned in the same way as PL/SQL and views.
- Skipping editioning views and exposing physical table changes directly to the application.
- Not planning cleanup of old editions and compatibility objects.
- Rolling out application servers without controlling which edition their sessions use.

## Sources

- EBR overview: https://www.oracle.com/database/technologies/high-availability/ebr.html
- EBR documentation: https://docs.oracle.com/en/database/oracle/oracle-database/26/adfns/editions.html
- EBR technical deep dive: https://www.oracle.com/a/tech/docs/ebr-technical-deep-dive-overview.pdf
- EBR FAQ: https://www.oracle.com/a/tech/docs/ebr-faq.pdf
- EBR MAA blog: https://blogs.oracle.com/maa/edition-based-redefinition-a-solution-for-zero-downtime-application-upgrades
