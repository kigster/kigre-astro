# PARKED DRAFT — future standalone post (NOT a blog post yet)

> Status: **parked / WIP**. This is raw material pulled OUT of the Pydantic/eval-frameworks
> post on 2026-06-21. It is intended to become its **own** standalone post later. It lives in
> `notes/drafts/` on purpose so the Astro content collection does NOT pick it up. Do not move
> it into `src/content/blog/` until it's a real post with proper frontmatter.

## Working title ideas
- "Matching Paint Colors with Math: LAB, Delta-E (CIEDE2000), and a Tiny Vector Search"
- "Delta-E for Programmers: Perceptual Color Distance Without the Hand-Waving"

## The angle
Nearest-paint-color search is **deterministic perceptual math**, not AI. RGB distance lies;
CIELAB + CIEDE2000 (ΔE00) tracks how different two colors actually *look*. Build a tiny vector
index of named paints (LAB vectors) and do nearest-neighbor by ΔE00. Honest framing: this needs
no LLM at all — which is exactly why it makes such a clean **objective eval** (real ground truth,
a real number). If/when AI shows up, it's only the fuzzy front end (natural language → a typed
query); the matching itself is a sort.

This was originally the worked example for the objective-evals post; we pulled it so the Pydantic
post can use a different example, and so this color material can breathe as its own piece.

## Runnable code (verified working, Python 3.14)
- `notes/drafts/paint/color_core.py` — sRGB→linear→XYZ(D65)→CIELAB, full CIEDE2000, the toy
  paint catalog, and `nearest()`. **CIEDE2000 self-test passes the Sharma et al. reference pair
  to 4 decimals: returns 2.0425 for (50, 2.6772, −79.7751) vs (50, 0, −82.7485).**
- `notes/drafts/paint/eval_objective.py` — the objective eval over a constructed golden set
  (source color → expected paint + ΔE bound), plus an injected "agent regression" run.

Run:
```bash
cd notes/drafts/paint && python3 color_core.py      # self-test + catalog nearest table
cd notes/drafts/paint && python3 eval_objective.py  # objective eval, both runs
```

## Real outputs captured (genuine runs, no LLM needed)

Catalog nearest table (exact catalog colors → themselves at ΔE 0; runners-up shown):
```
Dusty Sage    #9CA488  -> Dusty Sage 0.0,  Mossy Stone 10.75, Buttercream 19.79
Quiet Harbor  #6E8CA0  -> Quiet Harbor 0.0, Faded Denim 8.36,  Mossy Stone 23.81
src #9EA68A   -> Dusty Sage 0.61, Mossy Stone 11.35, Buttercream 19.26
```

LAB triples: source `#9EA68A` = LAB (66.8, −7.9, 13.6); Dusty Sage `#9CA488` = LAB (66.1, −7.9, 13.6) — ΔE 0.61, a match nobody would quibble with.

Objective eval — correct pipeline (REAL):
```
  OK  #C66B4E -> Terracotta Pot   dE=0.0
  OK  #3C4043 -> Charcoal Slate   dE=0.0
  OK  #9EA68A -> Dusty Sage       dE=0.61
  OK  #98A084 -> Dusty Sage       dE=1.23
  OK  #6A88A4 -> Quiet Harbor     dE=3.58
  OK  #D9AB96 -> Blush Clay       dE=0.89
  OK  #7A8466 -> Mossy Stone      dE=1.61
  OK  #5E7A98 -> Faded Denim      dE=1.05
  accuracy 100.0% (8/8)  ->  PASS
```

Objective eval — after an injected agent regression (warmth shifted the wrong way; b* −= 6.0).
The teaching point: the three failures all return the CORRECT name but exceed the ΔE bound — a
label-only check would have reported a false 8/8 PASS.
```
  XX  #C66B4E -> Terracotta Pot   dE=3.35     <- want Terracotta Pot <= 2.0 dE
  XX  #3C4043 -> Charcoal Slate   dE=4.83     <- want Charcoal Slate <= 2.0 dE
  OK  #9EA68A -> Dusty Sage       dE=4.17
  OK  #98A084 -> Dusty Sage       dE=4.25
  XX  #6A88A4 -> Quiet Harbor     dE=5.77     <- want Quiet Harbor <= 5.0 dE
  OK  #D9AB96 -> Blush Clay       dE=4.23
  OK  #7A8466 -> Mossy Stone      dE=4.88
  OK  #5E7A98 -> Faded Denim      dE=2.97
  accuracy 62.5% (5/8)  ->  FAIL
```

## Hero image
Paint-themed Gruvbox-dark SVG already built and relocated to its paint home:
`public/assets/images/posts/color-matching/eval-color-match.svg`
(swatches use real catalog hex + real ΔE numbers). Reuse or re-skin when this becomes a post.

## Toy paint catalog (real hex, INVENTED names — not real fan-deck SKUs; say so in the post)
Dusty Sage #9CA488 · Warm Linen #EDE6D6 · Quiet Harbor #6E8CA0 · Terracotta Pot #C66B4E ·
Charcoal Slate #3C4043 · Buttercream #F3E5B5 · Mossy Stone #7E8466 · Faded Denim #5B7895 ·
Blush Clay #D8A893 · Forest Floor #4A5A43

## Reference
Sharma, Wu & Dalal — "The CIEDE2000 Color-Difference Formula: Implementation Notes,
Supplementary Test Data, and Mathematical Observations" —
http://www2.ece.rochester.edu/~gsharma/ciede2000/ (reference impl + the test pairs used above).

## Threads to pick up when this becomes its own post
- The honest "this needs no LLM" framing is the spine; AI (if any) is only NL → typed query.
- ΔE00 rules of thumb: ~1.0 ≈ smallest visible; ~2.3 JND; <5 close commercial match.
- Could expand the catalog to a real fan deck and show scaling the vector search.
- Cross-link to BOTH evals posts (objective-eval angle) once they're live.
