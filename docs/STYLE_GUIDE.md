# Docs Style Guide

Keep the docs consistent and easy to navigate. Follow these conventions for all markdown files.

## Frontmatter

Add YAML frontmatter at the top:

---
# title: Short, clear title (H1 below should match)
# owner: Team or person (e.g., docs, backend, frontend)
# status: draft | in-progress | stable | deprecated
# lastUpdated: 2025-10-22
# related:
#   - RELATIVE_LINK_1.md
#   - RELATIVE_LINK_2.md
---

Update `lastUpdated` when you make substantive changes.

## Structure
- Start with an `# H1 Title`
- Optional: a 2–3 line summary describing scope and audience
- Use `##` for top sections, `###` for subsections
- Prefer concise bullet points over long paragraphs
- Put key links under a short "See also" section near the top

## Checklists
- Use GitHub-style checklists: `- [ ]` and `- [x]`
- For long living checklists, consider mirroring items into GitHub Issues and reference their numbers

## Cross-linking
- Link to the central index: `DOCS_INDEX.md`
- Link related docs using relative paths
- Avoid duplicate content; link instead

## Language
- Keep one language per file. Bangla docs use `(Bangla)` in the title or live under `docs/bn/`
- Prefer active voice and short sentences

## Code and Commands
- Use fenced code blocks with language tags
- Keep commands one per line; optional comments with `#`

## File names
- UPPER_SNAKE_CASE for status/spec/checklist docs (e.g., FEATURE_STATUS.md)
- kebab-case for guides when comfortable (optional) — keep consistent within a folder

## Images
- Store images under `docs/assets/`
- Use descriptive filenames and alt text

## Maintenance
- On major updates, add a brief "Changelog" section at bottom
- If a doc is replaced, add a note at top with a link to the new doc
