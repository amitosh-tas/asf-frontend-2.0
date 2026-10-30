import { useEffect, useRef } from "react";

/**
 * Flowing plasma background (same props as React Bits' "Plasma", written with plain WebGL so it needs
 * no `ogl` dependency). Renders one colour with varying transparency, so it suits black-on-white and
 * white-on-black sections. Pauses off screen; with prefers-reduced-motion it draws one still frame.
 */
export interface PlasmaProps {
  /** the plasma colour (hex) */
  color?: string;
  speed?: number;
  direction?: "forward" | "reverse" | "pingpong";
  /** larger = bigger, calmer shapes */
  scale?: number;
  opacity?: number;
  /** the flow bends toward the pointer */
  mouseInteractive?: boolean;
  className?: string;
}

const VS = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

// Domain-warped sine plasma. Output alpha only; the colour is a uniform.
const FS = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uScale; uniform vec2 uMouse; uniform float uMouseOn;
uniform vec3 uColor; uniform float uOpacity;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  uv /= uScale;
  vec2 m = (uMouse - 0.5 * uRes) / min(uRes.x, uRes.y) / uScale;
  uv += uMouseOn * 0.18 * (m - uv) * exp(-2.0 * length(m - uv));
  float t = uTime * 0.35;
  vec2 p = uv * 2.2;
  for (int i = 1; i < 6; i++) {
    float fi = float(i);
    p += vec2(0.55 / fi * sin(fi * p.y + t + 0.3 * fi), 0.45 / fi * cos(fi * p.x - t * 0.8 + 0.6 * fi));
  }
  float v = 0.5 + 0.5 * sin(p.x * 1.3 + p.y * 1.1 + t);
  float bands = smoothstep(0.35, 1.0, v) * (0.75 + 0.25 * sin(p.y * 3.0 - t));
  float a = clamp(bands, 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(uColor * a, a);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function Plasma({ color = "#ffffff", speed = 1, direction = "forward", scale = 1, opacity = 1, mouseInteractive = true, className = "" }: PlasmaProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("[landing] plasma shader did not link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uTime = u("uTime"), uScale = u("uScale"), uMouse = u("uMouse"), uMouseOn = u("uMouseOn");
    gl.uniform3fv(u("uColor"), hexToRgb(color));
    gl.uniform1f(u("uOpacity"), opacity);
    gl.uniform1f(uScale, scale);
    gl.uniform1f(uMouseOn, mouseInteractive && !still ? 1 : 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const mouse = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const dpr = canvas.width / Math.max(1, r.width);
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (r.bottom - e.clientY) * dpr;
    };
    if (mouseInteractive && !still) window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    let raf = 0;
    const start = performance.now();
    const frame = () => {
      raf = still ? 0 : requestAnimationFrame(frame);
      if (!visible && !still) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // a soft background needs no retina detail
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        if (!mouse.x && !mouse.y) Object.assign(mouse, { x: w * 0.7, y: h * 0.5 });
      }
      gl.viewport(0, 0, w, h);
      const secs = ((performance.now() - start) / 1000) * speed;
      const t = direction === "reverse" ? -secs : direction === "pingpong" ? 10 * Math.sin(secs / 10) : secs;
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, still ? 4 : t + 4);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // still: one frame once laid out
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none block h-full w-full ${className}`} />;
}
