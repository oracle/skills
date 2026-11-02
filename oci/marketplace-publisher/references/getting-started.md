# Getting started with Marketplace Publisher skills

These skills help a publisher work on their own Oracle Marketplace account. The assistant uses your authorized OCI Console or OCI CLI access to inspect resources and carry out the changes you request. The standalone skills do not require a Marketplace Publisher MCP server. Downloading Markdown from Marketplace does not sign you in or grant OCI permissions.

## What to expect from the assistant

Start with your goal in plain language, for example: “I am a new publisher. Help me get ready and create a draft for my consulting offer,” or “Help me update the description on my existing listing; keep it as a draft.” You can provide a listing name or Console link instead of an OCID. The assistant should find the target in your authorized account and clarify ambiguous matches.

The assistant explains the next step, asks for the next missing decision, and performs the authorized actions its tools support. It reuses your answers between onboarding, access review, listing selection, and revision work. You do not need to prepare a complete API payload or understand every prerequisite before starting.

When you must act yourself, the assistant gives the exact page or command, what to enter or select, and the result to look for. Complete password/MFA entry and agreement acceptance yourself. Return only the relevant status or error, never credentials. The assistant checks the result and resumes the same task. If an administrator or Oracle must act, it records the blocker, owner, and how to resume; it does not promise automatic approval or monitoring.

Before resource changes, review the exact proposed content and target. Saving a draft, submitting it for Oracle review, and publishing publicly or privately are separate decisions. You can stop at any stage. The assistant finishes with what was actually verified, the resource link or IDs, and the next action if anything remains.

## Load the skills

Use the **Source on GitHub** link in the Marketplace description to inspect the repository revision and its license. Install the whole `oci/marketplace-publisher` directory, including the focused skill folders and this `references` folder, from that same revision. Preserve its relative paths and the repository's [UPL notice](../LICENSE.txt). A reference PDF is for reading; it is not an installable skill.

In Codex, ask `$skill-installer` to install the Marketplace Publisher directory from that GitHub URL. Verify that the router and focused skills are available: `marketplace-publisher`, `publisher-onboarding`, `publisher-iam`, `publisher-listing-types`, `lead-generation-listing`, and `listing-revision-publish`. Codex detects installed skills automatically; if a skill is missing, refresh or restart Codex and verify its installation before relying on it. See [OpenAI's skill guidance](https://learn.chatgpt.com/docs/build-skills).

For a one-session trial, give the assistant the specific `SKILL.md` and ask it to read the full instructions. This does not install the bundle. Referenced companion skills and this guide may need to be supplied separately. The standalone skills can use their linked Oracle documentation when a companion is unavailable; they must report missing evidence rather than invent a readiness result.

## Choose how the assistant will work

| Path | What you need | How access is established |
| --- | --- | --- |
| In-app browser | A Codex environment with browser/computer tools and an OCI account authorized for the requested Publisher operation | Sign in to the production OCI Console, then verify the tenancy, region, user, publisher, and target resource |
| OCI CLI | Local terminal access, an installed OCI CLI with `marketplace-publisher` commands, and an explicitly selected OCI profile | Authenticate or validate that profile, then read the actual Publisher resource |
| Optional Publisher MCP | A separately installed, configured server that exposes the required tools | Verify its configured connection context and perform an authorized Publisher read; a browser login does not authenticate it |

Use your own tenancy and authorized OCI user. Existing publishers do not need to register again merely to inspect or revise a listing. Full onboarding and commercial checks apply when required for creation, submission, or publication. General listing-type advice needs no login.

The normal customer path uses production OCI. A staging Marketplace page is a demonstration distribution, not a production service endpoint or evidence of which tenancy a CLI profile uses. For an explicitly authorized sandbox test, establish the sandbox tenancy and service environment separately. Resolve any account or environment mismatch before changing resources.

## Sign in through the in-app browser

Open [OCI Console](https://cloud.oracle.com/) and select the tenancy, identity domain or identity provider used by your publisher organization. Complete password and MFA entry yourself. The assistant can guide navigation and continue after sign-in.

Verify the signed-in tenancy and user, select **US East (Ashburn)**, then open **Marketplace → Publisher**. Confirm the Publisher Profile and intended listing/compartment. Public Marketplace browsing and an Oracle website login do not by themselves establish access to private Publisher resources. See [Oracle's Console sign-in guidance](https://docs.oracle.com/en-us/iaas/Content/GSG/Tasks/signingin.htm).

## Sign in through OCI CLI

Choose a dedicated profile name and complete the browser sign-in opened by:

```sh
oci session authenticate --region us-ashburn-1 --profile-name <publisher-profile>
oci session validate --profile <publisher-profile> --auth security_token
```

Use the profile's actual tenancy OCID, not its display name, to check the target. Inspect configuration metadata locally without sharing tokens, private keys, or the whole configuration file. A successful session validation establishes token validity; it does not prove permission to read or edit a particular listing.

For an existing listing, the assistant can verify its publisher and compartment and inspect its revisions with these read-only commands:

```sh
oci marketplace-publisher listing get \
  --listing-id <listing-ocid> \
  --profile <publisher-profile> --auth security_token --region us-ashburn-1

oci marketplace-publisher listing-revision-collection list-listing-revisions \
  --listing-id <listing-ocid> --compartment-id <compartment-ocid> --all \
  --profile <publisher-profile> --auth security_token --region us-ashburn-1
```

Keep that profile, region, and authentication mode on subsequent commands. If you already use an authorized API-key profile, retain its mode instead of replacing its credentials with a session. See [Oracle's session authentication guide](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/clitoken.htm) and [Marketplace Publisher CLI reference](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/marketplace-publisher.html).

A 401 requires repairing authentication for the selected account. A 403 or `NotAuthorizedOrNotFound` can reflect access or target problems; ask the tenancy administrator to verify the principal, group membership, resource scope, and [Publisher IAM policy](https://docs.oracle.com/en-us/iaas/Content/Marketplace/publisher-iam-policy.htm). Do not create another user, grant broad access, or switch to an operator account as an automatic recovery step.

## Start with a real request

Replace placeholders with your account information. These prompts start with inspection; the assistant performs a write only within the change you authorize.

**Revise an existing listing**

```text
Use $listing-revision-publish through the in-app browser.
Tenancy: <tenancy name and OCID>. Publisher: <publisher OCID>.
Compartment: <compartment OCID>. Listing: <listing OCID>.
Inspect the revisions and show the proposed headline change to:
"<new headline>". Use an eligible existing draft, or ask to clone
the chosen source when needed. Keep the result as a draft.
```

For CLI execution, replace the first line with `Use $listing-revision-publish through OCI CLI profile <publisher-profile>.`

**Prepare a lead-generation draft**

```text
Use $lead-generation-listing to prepare a draft for <offering>.
Tenancy: <tenancy OCID>. Publisher: <publisher OCID>.
Compartment: <compartment OCID>. Use <browser or CLI profile>.
Get App should <redirect to URL or capture a lead and show message>.
Gather missing details and show the exact content before creation.
```

**Choose a listing type**

```text
Use $publisher-listing-types. Customers receive <software/service/AI agent>
and should <deploy in OCI/activate a subscription/visit our site/contact us>.
Help me choose the right listing and package type before creating anything.
```

For onboarding use `$publisher-onboarding` and state whether you are a new partner or an existing publisher. For a permission issue use `$publisher-iam` and supply the operation, target resource, compartment, selected profile/user, and redacted error. Do not supply credentials.

## What the assistant should return

For a change, expect the exact target and proposed values, any required approval, the actual listing and revision OCIDs, and a fresh observation of saved values and status. A clone or publication request can be asynchronous. An acknowledgment is not completion; uncertain outcomes must be reconciled before retrying.

The Console can open a separate submission dialog after saving and can preselect automatic public publication. Inspect that switch and turn it off unless you explicitly authorized auto-publication. For a draft-only request, close the submission dialog after verifying the saved draft.

Submission readiness is reported as **confirmed**, **pending**, or **unknown** with evidence. Required unresolved checks block submission except that the Lead Generation flow reports OPN/OCMA status as advisory and continues an authorized submission attempt; an actual service rejection still stops that operation. Submission is distinct from Oracle approval. Publication after approval is a separate requested action unless you explicitly selected supported auto-publication. Private publication requires the exact customer tenancy allowlist. See Oracle's [clone](https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/clone-listing.htm), [publishing](https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/publish-listing.htm), and [listing guidelines](https://docs.oracle.com/en-us/iaas/Content/Marketplace/pub-guidelines.htm).

## Support and source

Use [Oracle Support](https://support.oracle.com/) for Oracle Marketplace service support. Use [oracle/skills issues](https://github.com/oracle/skills/issues) for the skill instructions, following the repository's contribution and security reporting guidance. GitHub source links show the instructions; they do not open a seller support case. The source revision linked by a staging listing is a demonstration revision until accepted and released upstream; do not assume a fork branch is an Oracle-certified release.

## Create a Lead Generation listing from supplied material

Try: “Use $lead-generation-listing. Review this PDF, suggest improvements, and help turn it into a Lead Generation listing. Use my publisher account and save both the listing and revision as a draft.” Replace the last sentence with “Submit it for Oracle review after I approve the proposed content” when that is your goal. The assistant maps source material into fields, asks about missing decisions, and verifies both resources. Extracting content does not authorize attaching the complete PDF publicly.

The Lead Generation skill reports OPN/OCMA issues as warnings and continues the requested preparation, creation, or submission attempt; Oracle can still block an operation. It does not mark those checks passed or accept agreements for you. If `listing-count` is exceeded, choose whether to review existing listings for possible deletion or request a limit increase. Neither choice authorizes automatic deletion or guarantees immediate capacity.

For an unspecified creation endpoint, the Lead Generation skill defaults to creating and verifying a draft. Save can open a separate submission prompt; close it to leave the draft unsubmitted. Give tenancy name, username, identity domain when needed, and intended compartment as separate fields. For a test, ask for a clearly labeled sample bundle to review together. The assistant waits for loaded account data, preserves content through quota errors, and reopens the saved revision to compare approved values before reporting completion.
