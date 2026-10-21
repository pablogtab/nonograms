# Domain docs

## Layout

This is a single-context project:

- `GLOSSARY.md` at the repository root.
- Architecture decision records under `docs/adr/`.

## Before exploring

Read the glossary and any ADRs relevant to the area being changed.

If those files do not exist, proceed silently. Do not flag their absence
or suggest creating them upfront. The domain-modeling skill creates
them lazily when terms or decisions are resolved.

## Vocabulary

Use domain terms as defined in `GLOSSARY.md`, including in ticket titles,
proposals, hypotheses and test names. Avoid synonyms explicitly excluded
by the glossary.

If a needed concept is missing, reconsider whether it belongs to the
project's vocabulary; note genuine gaps for domain-modeling.

## ADR conflicts

Explicitly surface any proposal that contradicts an existing ADR,
identify the ADR, and explain why it should be reconsidered.
