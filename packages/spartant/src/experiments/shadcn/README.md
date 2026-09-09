# shadcn adoption experiment

Evidence for HAUX-65. The workflow these proved is in
[`../../components/ADOPTING-SHADCN.md`](../../components/ADOPTING-SHADCN.md).

**Not released components.** Neither is exported from the package entry point,
asserted by test. The released Badge (HAUX-45) and Switch (HAUX-48) were built
as owned source, and the HAUX-69 audit compared the whole first slice against
its shadcn equivalents; each audited component now keeps its own `upstream/`
snapshot beside its source. These files remain evidence, not maintained code.

| File | What it is |
| --- | --- |
| `Badge.tsx` | The simple adaptation |
| `Switch.tsx` | The behaviour-heavy adaptation |
| `upstream/*.tsx.txt` | Upstream source exactly as fetched. Evidence, never imported |
| `upstream/provenance.json` | Source URL, style, date, declared dependencies, sha256 |
| `adaptation.test.tsx` | Behaviour, plus assertions that the adaptation stayed adapted |

## Why the tests assert against upstream too

Several tests assert both that upstream has a defect and that the adaptation
does not. That looks redundant until someone refactors: an assertion that only
checks the adaptation passes trivially if the code is deleted, whereas one that
also pins the upstream text fails loudly if the premise stops being true.

It also means these tests document the diff, which is what the manual
before-and-after comparison needs.

## Checking upstream

```bash
pnpm check:upstream
```

Reports whether either component has changed since it was adapted. It never
writes, and it is deliberately outside `pnpm validate`: it needs the network,
and a check that fails because a third party shipped a release is an
interruption rather than a signal.
