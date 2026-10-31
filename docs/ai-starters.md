# Build with AI using Lamplight

Guidance checked 31 October 2026. Availability depends on your account and environment. Extract the browser starter and make its core folder, principles.md and component reference available. File access varies by tool; ask it to identify unreadable or missing files. The Lamplight beta has not been published to npm; use downloaded files. Use local tarballs in a local coding project, or the extracted core CSS and documents. Only consider a public registry route after publication, version and availability are verified.

Replace the bracketed text before use. The common starter suits a coding agent with access to your local project. Check what the agent actually finds and review its output before use.

## Common coding agent

```text
Build [brief] for [audience] to help with [task]. Inspect the supplied Lamplight documentation and actual exports first. Use the downloaded local core tarball and, if needed, the React adapter tarball in a suitable local project, or the extracted core CSS folder. The Lamplight beta has not been published to npm; use downloaded files. Ask for any missing or unreadable files or unclear exports rather than inventing them.

Use actual Lamplight tokens and components. Choose Night or Day and a Study, Ledger or Folio surface suited to the brief; these are independent choices. Provide keyboard access, visible focus, states in words and reduced motion. Avoid coloured top or left bars on rounded panels. Keep fonts and living light opt-in. Produce a local preview and files for review; do not deploy.
```

## Claude and Claude Design

With access to the code project, use the common starter. Claude Code documents `/design-sync` for a code-based design system and `/design` for design work. Attach or import available code assets and verify what was imported; a Lamplight import is untested. [Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design) and [design system tutorial](https://academy.claude.com/tutorials/create-a-design-system-with-claude).

```text
Create [brief] for [audience] to help with [task]. I will provide the Lamplight code assets and documentation available to this workspace. Inspect them and tell me which tokens and components were actually imported; ask for missing or unreadable files rather than inventing exports. Lamplight-specific import into Claude Design has not been tested.

Use actual Lamplight tokens and components. Choose Night or Day and a Study, Ledger or Folio surface suited to the brief; these are independent choices. Include keyboard access, visible focus, states in words and reduced motion. Avoid coloured top or left bars on rounded panels. Keep fonts and living light opt-in. Prepare a preview and files for review without deploying.
```

## ChatGPT Sites and Codex

For Codex in a local project, use the common starter and project guidance where useful. For Sites, start in ChatGPT Work with a website request, provide available files and save a version for review. [Sites](https://learn.chatgpt.com/docs/sites/creating-a-site), [Codex project guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

```text
Build a website for [brief], serving [audience] with [task]. Use the attached Lamplight source files, CSS and documentation where available. Inspect the actual exports and ask for missing or unreadable files rather than inventing components. The Lamplight beta has not been published to npm; use downloaded files and do not assume an npm runtime.

Use actual tokens and components. Choose Night or Day and a Study, Ledger or Folio surface suited to the brief; these are independent choices. Include keyboard access, visible focus, states in words and reduced motion. Avoid coloured top or left bars on rounded panels. Keep fonts and living light opt-in. Save a version and provide its preview and files for review without deploying.
```

## Gemini

Choose Canvas in Gemini for a file-based draft, or Build mode in AI Studio for an app project. Provide accessible source files and review the generated code locally. Build mode documents a React default and Node/npm environment, but that does not establish hosted installation of a local tarball. Canvas supports files and code viewing or copying. [Build mode](https://ai.google.dev/gemini-api/docs/aistudio-build-mode), [Canvas](https://support.google.com/gemini/answer/16047321).

```text
Create [brief] for [audience] to help with [task]. Use the supplied accessible Lamplight source files, CSS and documentation. Inspect actual exports and ask for missing or unreadable files rather than inventing components. Do not assume hosted installation of local beta tarballs or CDN access.

Use actual tokens and components. Choose Night or Day and a Study, Ledger or Folio surface suited to the brief; these are independent choices. Include keyboard access, visible focus, states in words and reduced motion. Avoid coloured top or left bars on rounded panels. Keep fonts and living light opt-in. Return code and files suitable for a local preview and review without deploying.
```
