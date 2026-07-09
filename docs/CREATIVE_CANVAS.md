# Creative Canvas — Product Specification

**TPB Creative Reactor · the structured creative operating layer**
Engineered For Performance.

This document defines the Creative Canvas: what it is, how it behaves, its node
system, its per-mode adaptations, and how it connects the Campaign Reactor to
the Studio. The first implementation ships in
`components/creative-canvas/CreativeCanvas.tsx` +
`lib/creative-canvas/graph.ts` + `/api/canvas/regenerate`; sections marked
**(planned)** describe the designed next increments.

---

## 1. The role of Creative Canvas in the product

TPB's core flow is a three-stage production line:

| Stage | Surface | Job | Output |
|---|---|---|---|
| 1 | **Campaign Reactor** | Strategic concept generation — retrieval, reasoning, scoring | Scored, evidence-cited concepts with ad packages |
| 2 | **Creative Canvas** | Structured creative **direction** — shape, branch, sequence, regenerate | A directed, approved creative structure |
| 3 | **Studio** | Production **finishing** — one real Meta ad unit, pre-test, publish | A launch-ready ad pushed to Meta |

The Canvas exists because there is a real gap between "the agent drafted five
good concepts" and "this exact ad is ready to spend money on." The Reactor is
autonomous — you watch it. The Studio is singular — one ad, one preview, one
push button. The middle is where a creative director actually works: choosing
between hooks, tightening a scene order, spinning a controlled alternate,
locking what's proven, and killing what's weak — **without re-briefing and
without losing the strategy**. That is the Canvas.

It is explicitly NOT:

- a whiteboard (nothing starts blank),
- a generic node editor (nodes are typed ad-anatomy, not free boxes),
- a second Studio (it directs; it does not finish or publish).

---

## 2. The landing experience

The user never lands on an empty surface.

**Arriving with a run** (the normal path — via the *Launch in Creative Canvas*
button on a montage run, or the Reactor/Canvas/Studio toggle):

1. **Top strategy bar** — pinned, always visible:
   campaign name · output-mode badge (`Montage / Scene Flow`, `Static Image`,
   …) · **Re-brief** · **Send to Studio**.
2. **Strategy chip row** — the strategic read that produced this structure:
   Angle · Awareness · **Sophistication** · Audience · Offer. These are not
   decoration; every regeneration request carries them as hard constraints.
3. **The pre-built structure** — one **lane per concept** (max 4), each lane a
   left-to-right message spine. The viewport opens on the first lane's opening
   (hook → message → proof → first scene) at readable zoom, not a wall of tiny
   cards.
4. **Direction Deck** (right panel, nothing selected) — a five-line teach:
   Edit / Regenerate / Branch / Render / Send to Studio.

**Arriving without a run**: a single guided empty state — what the Canvas is,
three capability cards (Pre-structured · Branch · Regenerate), and one CTA:
*Open the campaign brief*. No dead tools, no disabled chrome.

**(planned)** The strategy bar also carries the Strategic Intelligence Panel's
confidence band + rationale popover from `/api/campaign-reactor/intelligence`.

---

## 3. The node system

Nodes are the anatomy of an ad, not generic boxes. Every node carries:
`kind · title · text · sub (supporting line) · score · locked · approved ·
lane · branchIdx`.

| Node | Accent | Purpose | Key content | Actions | Required |
|---|---|---|---|---|---|
| **Hook** | emerald | The scroll-stopper; first line before the fold | one line, ≤125 chars | edit · regenerate · branch · lock · approve | ✔ |
| **Message** | cyan | The argument (titled *Script / VO* in video/montage modes) | 2–4 short paragraphs | edit · regenerate · branch · lock · approve | ✔ |
| **Proof** | blue | What grounds the concept — retrieved Vault evidence | basis citation | view · lock (locked **by default** — evidence is not creative material) | auto |
| **Visual Direction** | violet | What the creative shows (non-montage lanes) | frame-by-frame beats | edit · regenerate · branch · render still · animate | ✔ (visual lanes) |
| **Scene** | violet | One beat of a montage | direction + caption/VO line | edit · regenerate · add-scene-after · remove · render still · animate | montage mode |
| **CTA** | amber | The ask — headline + Meta button type | ≤40-char headline | edit · regenerate · branch · lock · approve | ✔ |
| **Output** | pink | The assembled ad unit for the lane | type, rubric score | send to Studio | ✔ |

**Connections** are a fixed spine, never free-wired:
`hook → message → proof → (scenes… | visual) → cta → output`.
Branch alternates hang off the same upstream/downstream pair with dashed
edges. The user can drag nodes to arrange, but cannot create arbitrary edges —
that constraint is what keeps the canvas classy instead of a spiderweb.

**(planned)** Audience/Offer/Mechanism as first-class nodes. Today they are
strategy-bar chips by design: they are *constraints on every node*, not links
in one lane's chain. They graduate to nodes only when per-lane audience/offer
swaps ship (§5).

---

## 4. Behavior per output mode

The mode is derived from the brief's deliverables (`canvasMode()`); the badge
in the strategy bar names it.

**A. Static Image** — lanes are compact: hook → message → proof → visual → CTA
→ output. The visual node renders a still at the brief's chosen ratio via the
chosen image model. Scene machinery never appears.

**B. Short-Form Video** — the message node is retitled **Script / VO**; the
visual node holds the frame-by-frame production brief. Render = still first
(cheap look-check), then animate (image-to-video on the pinned video model).

**C. Montage / Multi-Scene** — the signature mode. The orchestrator is
instructed (montage block in the reactor route) to write production briefs as
ordered, specifically-labelled scene sequences (4–6 scenes: hook scene →
tension/proof → payoff → CTA scene). Each frame becomes a **Scene node** on
the spine. Users reorder by shaping (add-scene-after, remove — the spine
heals), rewrite a single scene, regenerate a single scene, and render/animate
scene by scene. This is where OpenMontage-style behavior lives natively.

**D. Multi-Variation Pack** — the orchestrator anchors ONE core concept and
produces variants that change exactly one lever each (hook, proof, or visual
construction), naming the changed lever in each concept's basis. On the
canvas, each variant is a lane — visually parallel, so the "one lever
changed" discipline is scannable.

**E. Recommend Best Format** — the reactor picks the single best-fit format
and says why; the canvas shows that one direction as the primary lane with the
recommendation named on the output node. It never presents four hedged
directions side by side — a recommendation is a decision.

---

## 5. Branching & variation logic

Branching is **controlled variation**, not canvas sprawl:

- **Branch a node** → a dashed *Alt n* card stacked directly under the
  original, wired to the same upstream and downstream nodes. The lane still
  reads left-to-right; alternates read top-to-bottom under their slot.
- **Approve** an alternate → it becomes the lane's *active take* for that kind
  (siblings auto-unapprove). The active take is what composes into the output
  and what travels to the Studio.
- **Alternate hooks** = branch the hook node (the most common act in the room).
- **Swap offers / change audience level (planned)** = lane-level strategy
  override: duplicate the lane with a new offer/audience chip; every node in
  the new lane regenerates against the changed constraint while locked nodes
  hold. (Global changes are a Re-brief, not a branch.)
- **Alternate scene flows** = add/remove/rewrite scenes on the spine; for a
  competing sequence, branch the first scene and approve per-slot winners.
- **Spin a winner into variations** = mark the winning lane's nodes locked,
  then branch one node at a time — the one-lever-changed discipline the
  variation pack enforces at generation time, enforced by hand here.

No free-form edge creation, no unbounded fan-out: alternates stack in place,
which is the deliberate anti-spiderweb decision.

---

## 6. Regeneration — precise, never random

Regeneration is per-node and strategy-coherent (`POST /api/canvas/regenerate`):

- The request carries: node kind + title, current text, the **strategy
  snapshot** (angle, awareness, sophistication, audience, offer, offer name),
  the lane's **kept context** (locked + approved + primary neighbours), and an
  optional one-line **user steer** ("harder on identity, no numbers").
- The system prompt is the TPB copy chief: brand voice rules, compliance
  hard-nos, "produce a genuinely different take, not a paraphrase," and
  "do not contradict the kept parts."
- Locked nodes cannot regenerate. Proof nodes never regenerate (evidence is
  retrieved, not written).
- Zero-key mode serves curated TPB alternates so the loop always works.

Coherence is preserved structurally: strategy travels with every request, kept
parts are constraints, and one node is the only thing that changes. That is
what makes regenerate a scalpel instead of a slot machine.

---

## 7. The strategic intelligence layer

Strategy must be present without shouting:

- **Always visible**: the chip row (angle · awareness · sophistication ·
  audience · offer) — one quiet line under the header.
- **On selection**: the detail panel shows the node's hint (what this element
  must do), the lane's rubric score, and the proof node carries the Vault
  citation.
- **Inside every action**: regeneration and rendering inject the strategy —
  the intelligence layer does its strongest work invisibly.
- **(planned)**: mechanism + likely-objection chips sourced from the
  Strategic Intelligence read; NEURO predicted-response on the output node.

---

## 8. UX hierarchy

- **Visible by default**: strategy bar, chip row, the node structure, the
  Direction Deck. Nothing else.
- **One click away** (select a node): the editor, steer input, action grid,
  production controls, evidence.
- **Deliberately absent**: minimaps, toolbars of shapes, free-edge handles,
  layer panels — anything that smells like Miro. The canvas has exactly one
  gesture vocabulary: pan/zoom, select, drag a card.
- **Cognitive-load ceiling**: max 4 lanes; alternates stack under their slot;
  node bodies clamp to 4 lines (full text lives in the panel); the viewport
  opens on one lane's opening, not the whole graph.

---

## 9. Key user actions

| Action | Where | What it does |
|---|---|---|
| Edit | detail panel textarea | Direct rewrite; user words always win |
| Regenerate | panel | One node, strategy-coherent, optional steer |
| Branch | panel | Controlled alternate under the original |
| Approve | panel | Marks the active take for its slot |
| Lock / Unlock | panel | Freezes a node against regeneration; feeds "kept context" |
| Add scene after / Remove | panel (scenes, alts) | Shapes the montage spine; the spine self-heals |
| Render still / Animate | node + panel | Scene/visual → still → clip on the pinned models |
| Send to Studio | header + panel | Composes the lane's active takes into a Meta ad package and opens the Studio seeded with it |
| Re-brief | header | Back to the campaign wizard |
| Compare / Clone / Convert format | **(planned)** | Bottom compare tray; lane duplication; static↔video↔montage conversion |

---

## 10. Connection to the Studio

"Send to Studio" is a **composition**, not a link: the lane's active hook +
message become the primary text, the active CTA headline becomes the headline,
and the source concept's ad package supplies the button type and description.
The result seeds the existing Studio editor (`AdStudio`) exactly like
"Configure in Studio" does — live Meta feed preview, fold discipline,
compliance validation, NEURO pre-test, *Push Creative to Meta*.

Montage handoff: scenes rendered/animated on the canvas surface their media on
the concept cards; **(planned)** a montage assembly step (clip ordering +
export) sits between canvas approval and Studio publish.

Division of labor stays clean: the Canvas decides *what the ad is*; the Studio
makes it *shippable*.

---

## 11. Post-generation iteration

- **Refine a fresh concept**: edit/regenerate/branch in place — the default.
- **Iterate a winner**: fire a new run with the winner as reference (Ad
  Library → Clone & Iterate already exists), or lock the winning lane and
  branch one lever at a time.
- **Controlled A/B**: the "Iterate one thing" isolation test lives in the
  brief's Ignition step (where it belongs — it configures a *run*); the
  canvas's branch+approve is its hands-on counterpart on an existing run.
- **Convert formats (planned)**: static lane → video lane (visual direction
  expands to script + scenes); video → montage (script splits into scenes);
  winner → variation pack (lane duplicated N times, one lever unlocked each).

---

## 12. Screen structure

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚙ CREATIVE CANVAS   Campaign name   [MODE]        Re-brief  SEND →  │  strategy bar
│  Angle · Awareness · Sophistication · Audience · Offer               │  chip row
├──────────────────────────────────────────────────────┬───────────────┤
│                                                      │  Direction    │
│   lane 0:  HOOK → MESSAGE → PROOF → S1 → S2 → … → ⚡ │  Deck /       │
│   lane 1:  HOOK → MESSAGE → PROOF → …                │  Node editor  │
│              └ Alt 1 (dashed)                        │  (right rail) │
│   pan/zoom canvas · criss-cross ember grid           │               │
│   [+ – ⤢] controls, bottom-left                      │               │
└──────────────────────────────────────────────────────┴───────────────┘
```

The background is the same faded criss-cross engineering grid as the campaign
brief panel (`.canvas-shell::before` mirrors `.launch-panel::before`), so
brief → canvas reads as one continuous system.

---

## 13. Empty state & first use

First entry with no run: one headline ("The Creative Canvas"), one paragraph
("Where strategy becomes creative structure…"), three capability cards, one
CTA into the brief. First entry with a run: the Direction Deck *is* the
onboarding — it lists the five verbs in the order a user needs them. No tours,
no tooltips-on-everything, no intimidation.

---

## 14. Automated vs. manual

**The system does automatically**: build the whole first structure from the
run; derive the mode from the brief; write scene sequences (montage block);
pin the strategy to every regeneration; lock proof nodes; recommend render
models + dimensions upstream in the brief; heal the spine when scenes are
removed; compose the ad package on handoff.

**The user controls, always**: the words (edit beats everything); which take
is active (approve); what is frozen (lock); scene order and count; when to
spend on renders; when a lane is done (send to Studio). The system proposes,
the human directs — the canvas never auto-overwrites a user edit
(regeneration only runs on request, and never on locked nodes).

---

## 15. Product-level recommendations

1. **The differentiator is the spine.** Every competitor canvas (Weave-style
   node tools, Figma boards) is free-form; TPB's is *ad anatomy with
   strategy-coherent regeneration*. Protect that: resist free-edge wiring
   forever.
2. **Make sophistication do real work.** Stage 3–5 markets punish generic
   claims — the sophistication directive changing hooks/mechanism emphasis in
   regeneration is a genuinely defensible feature. Surface it (a "why this
   hook fits Stage 5" note) once outcome data supports it.
3. **Montage is the signature mode.** Scene-level render→animate→assemble on
   one surface, pre-structured by strategy, is the thing nobody else has.
   Prioritize the assembly/export increment over new node types.
4. **Simplify ruthlessly**: keep max lanes at 4; keep alternates capped (3 per
   slot is plenty); never add a toolbar.
5. **Hide the machinery**: model names, request IDs, and provider states stay
   in the panel's fine print. The canvas speaks creative, not infrastructure.
6. **Make the handoff the habit loop**: canvas → Studio → push → Meta ingest →
   ORACLE outcome → next run retrieves the winner. Every surface should show
   its neighbor (the canvas shows "Send to Studio"; the Studio should show
   "Back to Canvas" **(planned)**), so the production line is felt, not
   documented.
