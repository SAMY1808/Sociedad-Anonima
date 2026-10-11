#!/usr/bin/env python3
"""Genera data/mapa-es.js: la geometría del mapa de España (52 circunscripciones) a partir de Natural Earth (dominio público).

Uso:
  curl -o ne_admin1.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
  node tools/mapa/exportar_juego.js > juego.json        # ids de provincias, comunidades y municipios del juego
  python3 tools/mapa/construir_mapa.py ne_admin1.geojson juego.json data/mapa-es.js

Qué hace:
  1. Proyecta con una cónica conforme de Lambert (paralelos 36° y 44°, meridiano −3,5°). Las Canarias se proyectan aparte y se colocan en un recuadro.
  2. Parte los contornos en ARCOS compartidos (los bordes entre provincias vecinas comparten vértices en Natural Earth) y simplifica cada arco una sola vez
     (Douglas-Peucker), de modo que provincias vecinas encajan sin huecos ni solapes.
  3. Escribe los trazos de cada provincia y tres capas de bordes (exterior, entre comunidades, entre provincias de una misma comunidad), con coordenadas enteras en
     cuartos de kilómetro y movimientos relativos (datos compactos), los centroides, las cajas de cada provincia y comunidad, y las coordenadas de las 66 ciudades.
Sólo usa la biblioteca estándar de Python.
"""
import json, math, sys, collections

GEO, JUEGO, SALIDA = sys.argv[1], sys.argv[2], sys.argv[3]
R = 6371.0                    # km
E = 4                         # unidades por km (las coordenadas son enteros en cuartos de km)
TOL_KM = 0.32                 # tolerancia de simplificación
CANARIAS_ESCALA = 0.7

# ── Proyección cónica conforme de Lambert ──
PHI1, PHI2, PHI0, LAM0 = map(math.radians, (36.0, 44.0, 40.0, -3.5))
N = math.log(math.cos(PHI1) / math.cos(PHI2)) / math.log(math.tan(math.pi / 4 + PHI2 / 2) / math.tan(math.pi / 4 + PHI1 / 2))
F = math.cos(PHI1) * math.tan(math.pi / 4 + PHI1 / 2) ** N / N
RHO0 = F / math.tan(math.pi / 4 + PHI0 / 2) ** N

def proy(lon, lat):
    phi, lam = math.radians(lat), math.radians(lon)
    rho = F / math.tan(math.pi / 4 + phi / 2) ** N
    th = N * (lam - LAM0)
    return R * rho * math.sin(th), -(R * (RHO0 - rho * math.cos(th)))     # y hacia abajo (SVG)

# ── Datos de entrada ──
juego = json.load(open(JUEGO, encoding='utf-8'))
geo = json.load(open(GEO, encoding='utf-8'))
ISO = {'ES-C': 'ACO', 'ES-LU': 'LUG', 'ES-OR': 'OUR', 'ES-PO': 'PON', 'ES-O': 'AST', 'ES-S': 'CNT', 'ES-BI': 'BIZ', 'ES-SS': 'GIP', 'ES-VI': 'ALA', 'ES-NA': 'NAV', 'ES-LO': 'RIO',
       'ES-HU': 'HUE', 'ES-Z': 'ZAR', 'ES-TE': 'TER', 'ES-L': 'LLE', 'ES-GI': 'GIR', 'ES-B': 'BCN', 'ES-T': 'TAR', 'ES-LE': 'LEO', 'ES-P': 'PAL', 'ES-BU': 'BUR', 'ES-ZA': 'ZAM',
       'ES-VA': 'VLL', 'ES-SG': 'SEG', 'ES-SO': 'SOR', 'ES-AV': 'AVI', 'ES-SA': 'SAL', 'ES-M': 'MAD', 'ES-GU': 'GUA', 'ES-CU': 'CUE', 'ES-TO': 'TOL', 'ES-CR': 'CRE', 'ES-AB': 'ALB',
       'ES-CC': 'CAC', 'ES-BA': 'BAD', 'ES-CS': 'CAS', 'ES-V': 'VLC', 'ES-A': 'ALI', 'ES-MU': 'MUR', 'ES-H': 'HUV', 'ES-SE': 'SEV', 'ES-CO': 'COR', 'ES-J': 'JAE', 'ES-GR': 'GRA',
       'ES-AL': 'ALM', 'ES-MA': 'MAL', 'ES-CA': 'CAD', 'ES-PM': 'BAL', 'ES-GC': 'LPA', 'ES-TF': 'TFE', 'ES-CE': 'CEU', 'ES-ML': 'MEL'}
CANARIAS = {'LPA', 'TFE'}
# Ciudades: (lon, lat), con las coordenadas del centro urbano
CIUDADES = {
  'm_aco': (-8.411, 43.362), 'm_lug': (-7.556, 43.012), 'm_our': (-7.864, 42.336), 'm_pon': (-8.644, 42.431), 'm_vig': (-8.722, 42.240), 'm_ovi': (-5.845, 43.361), 'm_gij': (-5.661, 43.545),
  'm_snt': (-3.805, 43.462), 'm_bil': (-2.935, 43.263), 'm_ssb': (-1.981, 43.318), 'm_vit': (-2.672, 42.847), 'm_pam': (-1.643, 42.812), 'm_log': (-2.445, 42.466), 'm_hue': (-0.408, 42.140),
  'm_zar': (-0.889, 41.649), 'm_ter': (-1.107, 40.345), 'm_lle': (0.627, 41.617), 'm_gir': (2.825, 41.979), 'm_bcn': (2.173, 41.385), 'm_tar': (1.245, 41.119), 'm_hos': (2.100, 41.360),
  'm_bad': (2.247, 41.450), 'm_ter2': (2.009, 41.563), 'm_sab': (2.109, 41.543), 'm_leo': (-5.567, 42.599), 'm_pal': (-4.529, 42.010), 'm_bur': (-3.700, 42.343), 'm_zam': (-5.744, 41.503),
  'm_vll': (-4.724, 41.652), 'm_seg': (-4.118, 40.948), 'm_sor': (-2.466, 41.764), 'm_avi': (-4.700, 40.656), 'm_sal': (-5.664, 40.970), 'm_mad': (-3.703, 40.417), 'm_mos': (-3.865, 40.322),
  'm_alc': (-3.364, 40.482), 'm_fue': (-3.800, 40.284), 'm_leg': (-3.763, 40.328), 'm_get': (-3.732, 40.308), 'm_gua': (-3.166, 40.633), 'm_cue': (-2.134, 40.070), 'm_tol': (-4.024, 39.862),
  'm_cre': (-3.929, 38.986), 'm_alb': (-1.858, 38.995), 'm_cac': (-6.372, 39.476), 'm_bda': (-6.971, 38.879), 'm_cas': (-0.037, 39.986), 'm_vlc': (-0.376, 39.470), 'm_ali': (-0.481, 38.346),
  'm_elc': (-0.701, 38.265), 'm_mur': (-1.130, 37.992), 'm_car': (-0.986, 37.606), 'm_huv': (-6.949, 37.261), 'm_sev': (-5.984, 37.389), 'm_cor': (-4.779, 37.889), 'm_jae': (-3.790, 37.779),
  'm_gra': (-3.603, 37.177), 'm_alm': (-2.464, 36.834), 'm_mal': (-4.421, 36.721), 'm_cad': (-6.289, 36.527), 'm_jer': (-6.137, 36.686), 'm_pal2': (2.650, 39.570), 'm_lpa': (-15.413, 28.124),
  'm_tfe': (-16.254, 28.469), 'm_ceu': (-5.320, 35.889), 'm_mel': (-2.938, 35.292)}
assert set(CIUDADES) == set(juego['muni']), 'las ciudades no coinciden con las del juego'

feats = {}
for f in geo['features']:
    p = f['properties']
    if p.get('iso_a2') != 'ES': continue
    pid = ISO[p['iso_3166_2']]
    g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    rings = []
    for poly in polys:
        for r in poly:
            pts = [(x, y) for x, y in r]
            if pts[0] == pts[-1]: pts = pts[:-1]
            if len(pts) >= 3: rings.append(pts)
    feats[pid] = rings
assert set(feats) == set(juego['prov']), 'las provincias no coinciden con las del juego'

key = lambda lon, lat: (round(lon * 1e5), round(lat * 1e5))
# ── Arcos compartidos ──
edge_owners = collections.defaultdict(set)
for pid, rings in feats.items():
    for r in rings:
        n = len(r)
        for i in range(n):
            a, b = key(*r[i]), key(*r[(i + 1) % n])
            edge_owners[(a, b) if a <= b else (b, a)].add(pid)

def xy(lon, lat): return proy(lon, lat)

def rdp(pts, eps):
    if len(pts) < 3: return pts[:]
    keep = [False] * len(pts); keep[0] = keep[-1] = True; pila = [(0, len(pts) - 1)]
    while pila:
        s, e = pila.pop(); x1, y1 = pts[s]; x2, y2 = pts[e]; dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy); mx, mi = -1, -1
        for i in range(s + 1, e):
            x0, y0 = pts[i]
            d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / L if L else math.hypot(x0 - x1, y0 - y1)
            if d > mx: mx, mi = d, i
        if mx > eps: keep[mi] = True; pila.append((s, mi)); pila.append((mi, e))
    return [p for p, k in zip(pts, keep) if k]

arcos = {}                       # canon -> {'pts': [(x,y) km] simplificados, 'own': frozenset}
anillos = collections.defaultdict(list)    # pid -> [ [(canon, invertido)] ]
def registrar(pid, ring_idx, ks, coords, own):
    canon_f, canon_r = tuple(ks), tuple(reversed(ks))
    if canon_f <= canon_r: canon, inv = canon_f, False
    else: canon, inv = canon_r, True
    if canon not in arcos:
        pts = coords if not inv else list(reversed(coords))
        arcos[canon] = {'pts': pts, 'own': own}
    return (canon, inv)

for pid, rings in feats.items():
    for ri, r in enumerate(rings):
        n = len(r); ks = [key(*p) for p in r]; co = [xy(*p) for p in r]
        own = []
        for i in range(n):
            a, b = ks[i], ks[(i + 1) % n]
            own.append(frozenset(edge_owners[(a, b) if a <= b else (b, a)]))
        cortes = [i for i in range(n) if own[i] != own[i - 1]]
        lista = []
        if not cortes:
            # anillo cerrado con un único dueño: se parte en dos arcos por vértices elegidos de forma determinista (independiente del inicio y del sentido)
            i0 = min(range(n), key=lambda i: ks[i]); i1 = max(range(n), key=lambda i: (math.hypot(co[i][0] - co[i0][0], co[i][1] - co[i0][1]), ks[i]))
            for a, b in ((i0, i1), (i1, i0)):
                idx = [a]; j = a
                while j != b: j = (j + 1) % n; idx.append(j)
                lista.append(registrar(pid, ri, [ks[j] for j in idx], [co[j] for j in idx], own[a]))
        else:
            for ci, s in enumerate(cortes):
                e = cortes[(ci + 1) % len(cortes)]; idx = [s]; j = s
                while True:
                    j = (j + 1) % n; idx.append(j)
                    if j == e: break
                lista.append(registrar(pid, ri, [ks[j] for j in idx], [co[j] for j in idx], own[s]))
        anillos[pid].append(lista)

# ── Simplificación (una vez por arco) ──
for a in arcos.values(): a['pts'] = rdp(a['pts'], TOL_KM)

# ── Colocación de las Canarias en un recuadro ──
def pts_de(pid):
    out = []
    for lista in anillos[pid]:
        for canon, inv in lista:
            p = arcos[canon]['pts']; out += (list(reversed(p)) if inv else p)
    return out
peninsula = [p for pid in feats if pid not in CANARIAS for p in pts_de(pid)]
x0, x1 = min(p[0] for p in peninsula), max(p[0] for p in peninsula); y0, y1 = min(p[1] for p in peninsula), max(p[1] for p in peninsula)
can = [p for pid in CANARIAS for p in pts_de(pid)]
cx0, cx1 = min(p[0] for p in can), max(p[0] for p in can); cy0, cy1 = min(p[1] for p in can), max(p[1] for p in can)
dest_x, dest_y = x0 + 20, y1 + 40                      # esquina superior izquierda del recuadro (km), bajo la península
def mover(p): return ((p[0] - cx0) * CANARIAS_ESCALA + dest_x, (p[1] - cy0) * CANARIAS_ESCALA + dest_y)
for canon, a in arcos.items():
    if a['own'] <= CANARIAS: a['pts'] = [mover(p) for p in a['pts']]
ancho_can, alto_can = (cx1 - cx0) * CANARIAS_ESCALA, (cy1 - cy0) * CANARIAS_ESCALA
ciudades = {}
for cid, (lon, lat) in CIUDADES.items():
    p = xy(lon, lat)
    if cid in ('m_lpa', 'm_tfe'): p = mover(p)
    ciudades[cid] = p
MARG = 16
inset = (dest_x - 10, dest_y - 10, ancho_can + 20, alto_can + 20)
X0, Y0 = x0 - MARG, y0 - MARG; X1, Y1 = max(x1, inset[0] + inset[2]) + MARG, max(y1, inset[1] + inset[3]) + MARG

# ── Salida ──
ent = lambda p: (round((p[0] - X0) * E), round((p[1] - Y0) * E))
def trazo(puntos, cerrar):
    q = [ent(p) for p in puntos]; ded = [q[0]]
    for a in q[1:]:
        if a != ded[-1]: ded.append(a)
    if len(ded) < 2: return ''
    s = 'M%d %d' % ded[0]; prev = ded[0]; mov = []
    for a in ded[1:]: mov.append((a[0] - prev[0], a[1] - prev[1])); prev = a
    t = 'l'
    for i, (dx, dy) in enumerate(mov):
        for v in (dx, dy):
            sv = str(v)
            t += (' ' if (t[-1].isdigit() and not sv.startswith('-')) else '') + sv
    return s + t + ('z' if cerrar else '')

prov_path, bb, cen = {}, {}, {}
def poligono_area_centroide(q):
    a = cx = cy = 0.0
    for i in range(len(q)):
        x1_, y1_ = q[i]; x2_, y2_ = q[(i + 1) % len(q)]; w = x1_ * y2_ - x2_ * y1_; a += w; cx += (x1_ + x2_) * w; cy += (y1_ + y2_) * w
    a *= 0.5
    return (a, cx / (6 * a), cy / (6 * a)) if abs(a) > 1e-9 else (0, q[0][0], q[0][1])
for pid, listas in anillos.items():
    trozos = []; mejor = (0, None); xs, ys = [], []
    for lista in listas:
        seq = []
        for canon, inv in lista:
            p = arcos[canon]['pts']; p = list(reversed(p)) if inv else p
            seq += p if not seq else p[1:]
        if seq and seq[0] == seq[-1]: seq = seq[:-1]
        trozos.append(trazo(seq, True)); q = [ent(p) for p in seq]
        xs += [v[0] for v in q]; ys += [v[1] for v in q]
        ar, cxx, cyy = poligono_area_centroide(q)
        if abs(ar) > mejor[0]: mejor = (abs(ar), (cxx, cyy))
    prov_path[pid] = ''.join(trozos); bb[pid] = [min(xs), min(ys), max(xs), max(ys)]; cen[pid] = [round(mejor[1][0]), round(mejor[1][1])]
ccaa_de = {pid: juego['prov'][pid]['c'] for pid in juego['prov']}
cc_bb, cc_cen, cc_prov = {}, {}, collections.defaultdict(list)
for pid, c in ccaa_de.items(): cc_prov[c].append(pid)
for c, ps in cc_prov.items():
    cc_bb[c] = [min(bb[p][0] for p in ps), min(bb[p][1] for p in ps), max(bb[p][2] for p in ps), max(bb[p][3] for p in ps)]
    tot = sum((bb[p][2] - bb[p][0]) * (bb[p][3] - bb[p][1]) for p in ps)
    cc_cen[c] = [round(sum(cen[p][0] * (bb[p][2] - bb[p][0]) * (bb[p][3] - bb[p][1]) for p in ps) / tot), round(sum(cen[p][1] * (bb[p][2] - bb[p][0]) * (bb[p][3] - bb[p][1]) for p in ps) / tot)]
bordes = {'ext': [], 'ccaa': [], 'prov': []}
for canon, a in arcos.items():
    own = a['own']
    if len(own) == 1: k = 'ext'
    else:
        cs = {ccaa_de[p] for p in own}
        k = 'ccaa' if len(cs) > 1 else 'prov'
    t = trazo(a['pts'], False)
    if t: bordes[k].append(t)
mapa = {
    'e': E, 'vb': [0, 0, round((X1 - X0) * E), round((Y1 - Y0) * E)],
    'prov': prov_path, 'bb': bb, 'cen': cen, 'ccaa': dict(cc_prov), 'ccBb': cc_bb, 'ccCen': cc_cen,
    'bExt': ''.join(bordes['ext']), 'bCcaa': ''.join(bordes['ccaa']), 'bProv': ''.join(bordes['prov']),
    'ciu': {c: list(ent(p)) for c, p in ciudades.items()},
    'inset': [round((inset[0] - X0) * E), round((inset[1] - Y0) * E), round(inset[2] * E), round(inset[3] * E)]
}
js = ('/* Geometría del mapa de España (generada por tools/mapa/construir_mapa.py a partir de Natural Earth, dominio público). No editar a mano. */\n'
      'window.ESP = window.ESP || {}; ESP.DATA = ESP.DATA || {};\nESP.DATA.mapaEs = ' + json.dumps(mapa, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(SALIDA, 'w', encoding='utf-8').write(js)
nv = sum(len(a['pts']) for a in arcos.values())
print('arcos', len(arcos), 'vértices simplificados', nv, 'bytes', len(js), 'vb', mapa['vb'], 'inset', mapa['inset'])
