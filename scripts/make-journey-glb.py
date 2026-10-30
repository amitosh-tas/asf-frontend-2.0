"""Builds public/models/journey.glb: the landing page's 3D scene (glTF 2.0 binary).

Nodes (named, animated by the page): "sale" (faceted crystal), "touch_meta", "touch_google",
"touch_email" (small crystals), "orbit" (thin ring). Flat-shaded, white material.
Usage: python3 scripts/make-journey-glb.py public/models/journey.glb
"""
import json, struct, sys
import numpy as np

def icosahedron():
    t = (1 + 5 ** 0.5) / 2
    v = np.array([[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
                  [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]], dtype=float)
    f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
         [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]]
    return v / np.linalg.norm(v[0]), f

def subdivide(v, f, jitter=0.0, seed=1):
    rng = np.random.default_rng(seed)
    verts = [tuple(x) for x in v]
    cache = {}
    def mid(a, b):
        key = tuple(sorted((a, b)))
        if key not in cache:
            m = (np.array(verts[a]) + np.array(verts[b])) / 2
            verts.append(tuple(m / np.linalg.norm(m)))
            cache[key] = len(verts) - 1
        return cache[key]
    nf = []
    for a, b, c in f:
        ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
        nf += [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]
    out = np.array(verts)
    if jitter:
        out = out * (1 + rng.uniform(-jitter, jitter, (len(out), 1)))  # faceted, slightly irregular crystal
    return out, nf

def octahedron():
    v = np.array([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], dtype=float)
    f = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]
    return v, f

def torus(R=1.0, r=0.012, seg=160, sides=8):
    v, f = [], []
    for i in range(seg):
        a = 2 * np.pi * i / seg
        for j in range(sides):
            b = 2 * np.pi * j / sides
            v.append([(R + r * np.cos(b)) * np.cos(a), r * np.sin(b), (R + r * np.cos(b)) * np.sin(a)])
    for i in range(seg):
        for j in range(sides):
            a, b = i * sides + j, ((i + 1) % seg) * sides + j
            c, d = ((i + 1) % seg) * sides + (j + 1) % sides, i * sides + (j + 1) % sides
            f += [[a, b, c], [a, c, d]]
    return np.array(v), f

def flat(v, f, scale=1.0, stretch=(1, 1, 1)):
    """Non-indexed triangles with per-face normals (faceted look)."""
    v = v * scale * np.array(stretch)
    pos, nor = [], []
    for a, b, c in f:
        p = v[[a, b, c]]
        n = np.cross(p[1] - p[0], p[2] - p[0])
        if np.dot(n, p.mean(axis=0)) < 0:  # keep outward winding
            p = p[[0, 2, 1]]; n = -n
        n = n / (np.linalg.norm(n) or 1)
        pos += list(p); nor += [n, n, n]
    return np.array(pos, np.float32), np.array(nor, np.float32)

def smooth(v, f):
    pos, nor = [], []
    for tri in f:
        for k in tri:
            pos.append(v[k])
            ring = np.array([v[k][0], 0, v[k][2]]); ring /= np.linalg.norm(ring)
            nn = v[k] - ring * 1.0; nn /= np.linalg.norm(nn) or 1
            nor.append(nn)
    return np.array(pos, np.float32), np.array(nor, np.float32)

meshes = {}
iv, ifc = icosahedron()
sv, sf = subdivide(iv, ifc, jitter=0.06)
meshes["sale"] = flat(sv, sf, scale=1.0, stretch=(1, 1.18, 1))
ov, of = octahedron()
meshes["touch_meta"] = flat(ov, of, 0.22, (1, 1.5, 1))
meshes["touch_google"] = flat(iv, ifc, 0.2)
meshes["touch_email"] = flat(ov, of, 0.2, (1.4, 0.9, 1))
tv, tf = torus()
meshes["orbit"] = smooth(tv, tf)

bin_parts, buffer_views, accessors, gl_meshes, nodes = [], [], [], [], []
offset = 0
for i, (name, (pos, nor)) in enumerate(meshes.items()):
    acc_ids = []
    for arr, kind in ((pos, "POSITION"), (nor, "NORMAL")):
        data = arr.tobytes()
        buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(data), "target": 34962})
        acc = {"bufferView": len(buffer_views) - 1, "componentType": 5126, "count": len(arr), "type": "VEC3"}
        if kind == "POSITION":
            acc["min"] = arr.min(axis=0).tolist(); acc["max"] = arr.max(axis=0).tolist()
        accessors.append(acc); acc_ids.append(len(accessors) - 1)
        bin_parts.append(data); offset += len(data)
    gl_meshes.append({"name": name, "primitives": [{"attributes": {"POSITION": acc_ids[0], "NORMAL": acc_ids[1]}, "material": 0}]})
    nodes.append({"name": name, "mesh": i})

binary = b"".join(bin_parts)
binary += b"\0" * ((4 - len(binary) % 4) % 4)
gltf = {
    "asset": {"version": "2.0", "generator": "make-journey-glb.py"},
    "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": gl_meshes,
    "materials": [{"name": "white", "pbrMetallicRoughness": {"baseColorFactor": [1, 1, 1, 1], "metallicFactor": 0, "roughnessFactor": 0.6}}],
    "accessors": accessors, "bufferViews": buffer_views, "buffers": [{"byteLength": len(binary)}],
}
js = json.dumps(gltf, separators=(",", ":")).encode()
js += b" " * ((4 - len(js) % 4) % 4)
out = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binary))
out += struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(binary), 0x004E4942) + binary
open(sys.argv[1] if len(sys.argv) > 1 else "journey.glb", "wb").write(out)
print("wrote", len(out), "bytes,", sum(len(p) for p, _ in meshes.values()) // 3, "triangles")
