import { useEffect, useRef } from "react";

/**
 * Renders public/models/journey.glb with plain WebGL (no three.js needed: the model is small and the
 * scene is one material). The page moves the named nodes from `progress` (0–1, driven by scroll):
 * the three touches orbit the sale, then converge into it.
 *
 * Supports glTF 2.0 binary with non-indexed or indexed float32 POSITION/NORMAL, which is what
 * scripts/make-journey-glb.py writes. Replace the model with any .glb of the same node names.
 */

interface MeshGL {
  name: string;
  position: WebGLBuffer;
  normal: WebGLBuffer;
  count: number;
  index: { buffer: WebGLBuffer; count: number; type: number } | null;
}

type Mat4 = Float32Array;

// ── glb parsing ─────────────────────────────────────────────────────────────

interface GltfJson {
  nodes: { name?: string; mesh?: number }[];
  meshes: { name?: string; primitives: { attributes: Record<string, number>; indices?: number }[] }[];
  accessors: { bufferView: number; byteOffset?: number; componentType: number; count: number; type: string }[];
  bufferViews: { byteOffset?: number; byteLength: number }[];
}

function parseGlb(buf: ArrayBuffer): { json: GltfJson; bin: ArrayBuffer } {
  const view = new DataView(buf);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("not a .glb file");
  let offset = 12;
  let json: GltfJson | null = null;
  let bin: ArrayBuffer | null = null;
  while (offset < buf.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const chunk = buf.slice(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(chunk));
    else if (type === 0x004e4942) bin = chunk;
    offset += 8 + length;
  }
  if (!json || !bin) throw new Error(".glb is missing its JSON or binary chunk");
  return { json, bin };
}

function accessorData(json: GltfJson, bin: ArrayBuffer, index: number) {
  const acc = json.accessors[index];
  const bv = json.bufferViews[acc.bufferView];
  const start = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const comps = acc.type === "VEC3" ? 3 : acc.type === "VEC2" ? 2 : 1;
  if (acc.componentType === 5126) return new Float32Array(bin, start, acc.count * comps);
  if (acc.componentType === 5123) return new Uint16Array(bin, start, acc.count);
  if (acc.componentType === 5125) return new Uint32Array(bin, start, acc.count);
  throw new Error(`unsupported component type ${acc.componentType}`);
}

// ── tiny matrix helpers (column-major) ──────────────────────────────────────

const ident = (): Mat4 => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  const o = new Float32Array(16);
  o[0] = f / aspect; o[5] = f; o[10] = (far + near) / (near - far); o[11] = -1; o[14] = (2 * far * near) / (near - far);
  return o;
}
function compose(t: [number, number, number], rx: number, ry: number, rz: number, s: number): Mat4 {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  const Rx = new Float32Array([1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1]);
  const Ry = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]);
  const Rz = new Float32Array([cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  const m = mul(mul(Ry, Rx), Rz);
  for (let i = 0; i < 12; i++) m[i] *= s;
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2];
  return m;
}

// ── shaders: greyscale facets with a key light and a rim, on black ──────────

const VS = `
attribute vec3 aPos; attribute vec3 aNor;
uniform mat4 uProj, uView, uModel;
varying vec3 vNor; varying vec3 vView;
void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vNor = mat3(uView) * mat3(uModel) * aNor; // view-space normal (rotation + uniform scale only)
  vec4 eye = uView * world;
  vView = -eye.xyz;
  gl_Position = uProj * eye;
}`;
const FS = `
precision mediump float;
varying vec3 vNor; varying vec3 vView;
uniform float uBright;
void main() {
  vec3 n = normalize(vNor);
  vec3 v = normalize(vView);
  vec3 l = normalize(vec3(0.5, 0.8, 0.6));
  float diff = max(dot(n, l), 0.0);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.5);
  float spec = pow(max(dot(reflect(-l, n), v), 0.0), 24.0);
  float g = (0.06 + 0.72 * diff + 0.35 * rim + 0.5 * spec) * uBright;
  gl_FragColor = vec4(vec3(g), 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
}

// ── poses ───────────────────────────────────────────────────────────────────

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const TOUCHES = ["touch_meta", "touch_google", "touch_email"];
const RING_TILT = 1.2;
const RING_R = 2.4;

/** Where each node sits at scroll progress p (0–1) and time t (seconds). */
function pose(name: string, p: number, t: number, still: boolean): Mat4 | null {
  const spin = still ? 0 : t * 0.25;
  const merge = ease(clamp01((p - 0.45) / 0.4)); // touches fly into the sale between 45% and 85%
  if (name === "sale") {
    const s = 0.85 + 0.35 * merge;
    return compose([0, 0, 0], 0.25 + p * 0.6, spin + p * Math.PI * 1.5, 0, s);
  }
  if (name === "orbit") {
    if (merge >= 1) return null;
    return compose([0, 0, 0], RING_TILT, 0, 0, RING_R * (1 - merge) + 0.001);
  }
  const i = TOUCHES.indexOf(name);
  if (i < 0) return null;
  // each touch appears in turn (0–15%, 15–30%, 30–45%), orbits, then converges
  const appear = ease(clamp01((p - i * 0.15) / 0.15));
  if (appear <= 0 || merge >= 1) return null;
  const angle = (i / 3) * Math.PI * 2 + spin * 1.6 + p * 2.2;
  const r = RING_R * (1 - merge);
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  // on the ring's tilted plane (same rotation as the "orbit" node)
  return compose([x, -Math.sin(RING_TILT) * z, Math.cos(RING_TILT) * z], t * 1.3 + i, t * 0.9 + i, 0, appear * (1 - 0.6 * merge));
}

export interface GlbSceneProps {
  src: string;
  /** 0–1 scroll progress through the section */
  progress: number;
  /** freeze the idle spin (prefers-reduced-motion) */
  still?: boolean;
  className?: string;
  label: string;
  /**
   * Called every frame with each node's on-screen position (CSS px, relative to the canvas) so HTML
   * labels and 2D effects can follow the 3D scene. `visible` is false while a node is hidden.
   */
  onFrame?: (points: ScreenPoint[], size: { width: number; height: number }) => void;
}

export interface ScreenPoint {
  name: string;
  x: number;
  y: number;
  /** projected size of one scene unit in px (for scaling effects with distance) */
  unit: number;
  visible: boolean;
}

/** Projects a model matrix's origin to canvas CSS pixels. */
function project(proj: Mat4, view: Mat4, model: Mat4, w: number, h: number) {
  const m = mul(proj, mul(view, model));
  const cw = m[15];
  const x = m[12] / cw;
  const y = m[13] / cw;
  // one unit to the right, for scale
  const m2 = mul(proj, mul(view, mul(model, compose([1, 0, 0], 0, 0, 0, 1))));
  const unit = Math.abs(m2[12] / m2[15] - x) * (w / 2);
  return { x: ((x + 1) / 2) * w, y: ((1 - y) / 2) * h, unit };
}

export default function GlbScene({ src, progress, still = false, className = "", label, onFrame }: GlbSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const pointer = useRef({ x: 0, y: 0 });
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) return; // no WebGL: the section's text still works on its own
    let raf = 0;
    let disposed = false;
    let meshes: MeshGL[] = [];
    let visible = true;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("[landing] 3D shader did not link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    const loc = {
      pos: gl.getAttribLocation(prog, "aPos"),
      nor: gl.getAttribLocation(prog, "aNor"),
      proj: gl.getUniformLocation(prog, "uProj"),
      view: gl.getUniformLocation(prog, "uView"),
      model: gl.getUniformLocation(prog, "uModel"),
      bright: gl.getUniformLocation(prog, "uBright"),
    };
    const uintIndices = gl.getExtension("OES_element_index_uint");

    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`model ${src} returned HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (disposed) return;
        const { json, bin } = parseGlb(buf);
        meshes = json.nodes.flatMap((node) => {
          if (node.mesh === undefined) return [];
          const prim = json.meshes[node.mesh].primitives[0];
          const upload = (data: ArrayBufferView, target: number) => {
            const b = gl.createBuffer()!;
            gl.bindBuffer(target, b);
            gl.bufferData(target, data, gl.STATIC_DRAW);
            return b;
          };
          const pos = accessorData(json, bin, prim.attributes.POSITION) as Float32Array;
          const nor = accessorData(json, bin, prim.attributes.NORMAL) as Float32Array;
          let index: MeshGL["index"] = null;
          if (prim.indices !== undefined) {
            const idx = accessorData(json, bin, prim.indices);
            if (idx instanceof Uint32Array && !uintIndices) return [];
            index = { buffer: upload(idx, gl.ELEMENT_ARRAY_BUFFER), count: idx.length, type: idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
          }
          return [{ name: node.name ?? json.meshes[node.mesh].name ?? "", position: upload(pos, gl.ARRAY_BUFFER), normal: upload(nor, gl.ARRAY_BUFFER), count: pos.length / 3, index }];
        });
      })
      .catch((err) => console.warn("[landing] 3D model not shown:", err?.message ?? err));

    const start = performance.now();
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      if (!meshes.length || !w || !h) return;
      const t = still ? 0 : (performance.now() - start) / 1000;
      const p = progressRef.current;
      const projM = perspective(0.62, w / h, 0.1, 100);
      gl.uniformMatrix4fv(loc.proj, false, projM);
      // camera: slight parallax from the pointer
      const view = mul(compose([0, 0, -9.4], pointer.current.y * 0.12, pointer.current.x * 0.18, 0, 1), ident());
      gl.uniformMatrix4fv(loc.view, false, view);
      if (onFrameRef.current) {
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        const points: ScreenPoint[] = ["sale", ...TOUCHES].map((name) => {
          const model = pose(name, p, t, still);
          if (!model) return { name, x: 0, y: 0, unit: 0, visible: false };
          return { name, ...project(projM, view, model, cssW, cssH), visible: true };
        });
        onFrameRef.current(points, { width: cssW, height: cssH });
      }
      for (const m of meshes) {
        const model = pose(m.name, p, t, still);
        if (!model) continue;
        gl.uniformMatrix4fv(loc.model, false, model);
        gl.uniform1f(loc.bright, m.name === "orbit" ? 0.55 : 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.position);
        gl.enableVertexAttribArray(loc.pos);
        gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.normal);
        gl.enableVertexAttribArray(loc.nor);
        gl.vertexAttribPointer(loc.nor, 3, gl.FLOAT, false, 0, 0);
        if (m.index) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.index.buffer);
          gl.drawElements(gl.TRIANGLES, m.index.count, m.index.type, 0);
        } else gl.drawArrays(gl.TRIANGLES, 0, m.count);
      }
    };
    raf = requestAnimationFrame(draw);

    // stop drawing while off screen
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      if (still) return;
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [src, still]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className={className} />;
}
