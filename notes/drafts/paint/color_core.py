import math

def _srgb_to_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_to_lab(hexstr):
    hexstr = hexstr.lstrip('#')
    r, g, b = (int(hexstr[i:i+2], 16) for i in (0, 2, 4))
    r, g, b = _srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b)
    # linear sRGB -> XYZ (D65)
    X = 0.4124564*r + 0.3575761*g + 0.1804375*b
    Y = 0.2126729*r + 0.7151522*g + 0.0721750*b
    Z = 0.0193339*r + 0.1191920*g + 0.9503041*b
    # XYZ -> LAB (D65 white)
    Xn, Yn, Zn = 0.95047, 1.0, 1.08883
    def f(t):
        d = 6.0/29.0
        return t ** (1.0/3.0) if t > d**3 else t/(3*d*d) + 4.0/29.0
    fx, fy, fz = f(X/Xn), f(Y/Yn), f(Z/Zn)
    return (116*fy - 16, 500*(fx - fy), 200*(fy - fz))

def ciede2000(lab1, lab2):
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    kL = kC = kH = 1.0
    C1 = math.hypot(a1, b1); C2 = math.hypot(a2, b2)
    Cbar = (C1 + C2) / 2.0
    G = 0.5 * (1 - math.sqrt(Cbar**7 / (Cbar**7 + 25.0**7)))
    a1p = (1 + G) * a1; a2p = (1 + G) * a2
    C1p = math.hypot(a1p, b1); C2p = math.hypot(a2p, b2)
    def hp(b, ap):
        if ap == 0 and b == 0:
            return 0.0
        h = math.degrees(math.atan2(b, ap))
        return h + 360 if h < 0 else h
    h1p = hp(b1, a1p); h2p = hp(b2, a2p)
    dLp = L2 - L1
    dCp = C2p - C1p
    if C1p * C2p == 0:
        dhp = 0.0
    else:
        diff = h2p - h1p
        if diff > 180: diff -= 360
        elif diff < -180: diff += 360
        dhp = diff
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2.0))
    Lbar = (L1 + L2) / 2.0
    Cbarp = (C1p + C2p) / 2.0
    if C1p * C2p == 0:
        hbarp = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hbarp = (h1p + h2p) / 2.0
    elif (h1p + h2p) < 360:
        hbarp = (h1p + h2p + 360) / 2.0
    else:
        hbarp = (h1p + h2p - 360) / 2.0
    T = (1 - 0.17*math.cos(math.radians(hbarp - 30))
           + 0.24*math.cos(math.radians(2*hbarp))
           + 0.32*math.cos(math.radians(3*hbarp + 6))
           - 0.20*math.cos(math.radians(4*hbarp - 63)))
    dtheta = 30 * math.exp(-(((hbarp - 275) / 25.0) ** 2))
    RC = 2 * math.sqrt(Cbarp**7 / (Cbarp**7 + 25.0**7))
    SL = 1 + (0.015 * (Lbar - 50)**2) / math.sqrt(20 + (Lbar - 50)**2)
    SC = 1 + 0.045 * Cbarp
    SH = 1 + 0.015 * Cbarp * T
    RT = -math.sin(math.radians(2 * dtheta)) * RC
    return math.sqrt((dLp/(kL*SL))**2 + (dCp/(kC*SC))**2 + (dHp/(kH*SH))**2
                     + RT * (dCp/(kC*SC)) * (dHp/(kH*SH)))

PAINTS = {
    "Dusty Sage":     "#9CA488",
    "Warm Linen":     "#EDE6D6",
    "Quiet Harbor":   "#6E8CA0",
    "Terracotta Pot": "#C66B4E",
    "Charcoal Slate": "#3C4043",
    "Buttercream":    "#F3E5B5",
    "Mossy Stone":    "#7E8466",
    "Faded Denim":    "#5B7895",
    "Blush Clay":     "#D8A893",
    "Forest Floor":   "#4A5A43",
}
_LAB = {name: hex_to_lab(h) for name, h in PAINTS.items()}

def nearest(hexstr, k=3):
    target = hex_to_lab(hexstr)
    scored = sorted(((ciede2000(target, lab), name) for name, lab in _LAB.items()))
    return [(name, round(d, 2)) for d, name in scored[:k]]

# CIEDE2000 self-test against a Sharma et al. reference pair
if __name__ == "__main__":
    # reference: Lab (50,2.6772,-79.7751) vs (50,0,-82.7485) -> dE 2.0425
    ref = ciede2000((50.0, 2.6772, -79.7751), (50.0, 0.0, -82.7485))
    print(f"CIEDE2000 self-test (expect ~2.0425): {ref:.4f}")
    print()
    for name, h in PAINTS.items():
        print(f"{name:16s} {h}  ->  {nearest(h, 3)}")
    print()
    # explore some perturbed / between sources
    for src in ["#9EA68A", "#98A084", "#6A88A4", "#D9AB96", "#808080", "#7A8466", "#5E7A98"]:
        print(f"src {src} -> {nearest(src, 3)}")
