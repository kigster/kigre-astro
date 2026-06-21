from color_core import hex_to_lab, ciede2000, nearest, _LAB

GOLDEN = [
    {"src": "#C66B4E", "expect": "Terracotta Pot", "max_de": 2.0},
    {"src": "#3C4043", "expect": "Charcoal Slate", "max_de": 2.0},
    {"src": "#9EA68A", "expect": "Dusty Sage",     "max_de": 5.0},
    {"src": "#98A084", "expect": "Dusty Sage",     "max_de": 5.0},
    {"src": "#6A88A4", "expect": "Quiet Harbor",   "max_de": 5.0},
    {"src": "#D9AB96", "expect": "Blush Clay",     "max_de": 5.0},
    {"src": "#7A8466", "expect": "Mossy Stone",    "max_de": 5.0},
    {"src": "#5E7A98", "expect": "Faded Denim",    "max_de": 5.0},
]
PASS_THRESHOLD = 0.90

def search_top1(hexstr):
    return nearest(hexstr, 1)[0]

def run(task, title):
    print(f"--- {title} ---")
    correct = 0
    for c in GOLDEN:
        name, de = task(c["src"])
        hit = (name == c["expect"]) and (de <= c["max_de"])
        correct += hit
        mark = "OK " if hit else "XX "
        note = "" if hit else f"   <- want {c['expect']} <= {c['max_de']} dE"
        print(f"  {mark} {c['src']} -> {name:16s} dE={de:<6}{note}")
    acc = correct / len(GOLDEN)
    print(f"  accuracy {acc*100:.1f}% ({correct}/{len(GOLDEN)})  ->  "
          f"{'PASS' if acc >= PASS_THRESHOLD else 'FAIL'}\n")

run(search_top1, "correct pipeline")

def buggy(hexstr):                    # agent applied 'warmer' in the wrong direction
    lab = list(hex_to_lab(hexstr)); lab[2] -= 6.0
    de, name = sorted((ciede2000(tuple(lab), v), k) for k, v in _LAB.items())[0]
    return name, round(de, 2)

run(buggy, "after an agent regression (warmth shifted the wrong way)")
