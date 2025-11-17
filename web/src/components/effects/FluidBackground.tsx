import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../store/theme";

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [147, 197, 253];
}

export function FluidBackground() {
  const { getTheme, themes } = useTheme();
  const theme = getTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const timeRef = useRef(0);
  const [renderingTheme, setRenderingTheme] = useState(theme.id);
  const [opacity, setOpacity] = useState(1);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (renderingTheme !== theme.id) {
      setOpacity(0);
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      fadeTimeoutRef.current = window.setTimeout(() => {
        setRenderingTheme(theme.id);
        requestAnimationFrame(() => {
          setOpacity(1);
        });
      }, 400);
      return () => {
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
        }
      };
    }
  }, [theme.id, renderingTheme]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let width = 0;
    let height = 0;

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const currentTheme = themes.find((t) => t.id === renderingTheme) || themes[0];

    const [c1r, c1g, c1b] = hexToRgb(currentTheme.preview.color1);
    const [c2r, c2g, c2b] = hexToRgb(currentTheme.preview.color2);
    const [c3r, c3g, c3b] = hexToRgb(currentTheme.preview.color3);

    const blobs = Array.from({ length: 8 }).map((_, i) => {
      const minHue = currentTheme.blobHue[0];
      const maxHue = currentTheme.blobHue[1];
      const hue = minHue + Math.random() * (maxHue - minHue);
      return {
        x: Math.random(),
        y: Math.random(),
        r: 0.12 + Math.random() * 0.18,
        vx: (Math.random() * 2 - 1) * (40 + Math.random() * 30),
        vy: (Math.random() * 2 - 1) * (40 + Math.random() * 30),
        hue: hue,
        baseHue: hue,
        phase: Math.random() * Math.PI * 2,
      };
    });

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.ceil(width * DPR);
      canvas.height = Math.ceil(height * DPR);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    const onMouse = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);

    let last = performance.now();
    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      timeRef.current += dt * 0.5;
      last = now;
      ctx.clearRect(0, 0, width, height);

      const baseGradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        0,
        width * 0.5,
        height * 0.4,
        Math.max(width, height) * 1.2
      );
      baseGradient.addColorStop(0, `rgba(${c1r}, ${c1g}, ${c1b}, 0.5)`);
      baseGradient.addColorStop(0.3, `rgba(${c2r}, ${c2g}, ${c2b}, 0.35)`);
      baseGradient.addColorStop(0.6, `rgba(${c3r}, ${c3g}, ${c3b}, 0.25)`);
      baseGradient.addColorStop(1, `rgba(${c3r}, ${c3g}, ${c3b}, 0.15)`);
      ctx.fillStyle = baseGradient;
      ctx.fillRect(0, 0, width, height);

      const frozenOverlay = ctx.createLinearGradient(0, 0, width, height);
      frozenOverlay.addColorStop(0, `rgba(${c1r}, ${c1g}, ${c1b}, 0.2)`);
      frozenOverlay.addColorStop(0.5, `rgba(${c2r}, ${c2g}, ${c2b}, 0.25)`);
      frozenOverlay.addColorStop(1, `rgba(${c1r}, ${c1g}, ${c1b}, 0.15)`);
      ctx.fillStyle = frozenOverlay;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        b.x += (b.vx * dt) / width;
        b.y += (b.vy * dt) / height;
        if (b.x < -0.15 || b.x > 1.15) b.vx *= -1;
        if (b.y < -0.15 || b.y > 1.15) b.vy *= -1;

        const hueShift = Math.sin(timeRef.current + b.phase) * 8;
        b.hue = b.baseHue + hueShift;

        const cx = b.x * width;
        const cy = b.y * height;
        const radius = Math.max(width, height) * b.r;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const lightness = 70 + Math.sin(timeRef.current * 0.8 + b.phase) * 8;
        const sat = currentTheme.blobSaturation;
        const c1 = `hsla(${b.hue}, ${sat}%, ${lightness}%, 0.18)`;
        const c2 = `hsla(${b.hue + 15}, ${sat - 5}%, ${lightness - 6}%, 0.12)`;
        const c3 = `hsla(${b.hue + 25}, ${sat - 10}%, ${lightness - 12}%, 0.06)`;
        grad.addColorStop(0, c1);
        grad.addColorStop(0.5, c2);
        grad.addColorStop(1, c3);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (mouse.current) {
        const { x, y } = mouse.current;
        const r1 = Math.max(280, Math.min(420, Math.max(width, height) * 0.25));
        const r2 = r1 * 1.4;
        const spotlight1 = ctx.createRadialGradient(x, y, 0, x, y, r1);
        spotlight1.addColorStop(0, `rgba(${c1r}, ${c1g}, ${c1b}, 0.06)`);
        spotlight1.addColorStop(0.6, `rgba(${c2r}, ${c2g}, ${c2b}, 0.04)`);
        spotlight1.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = spotlight1;
        ctx.beginPath();
        ctx.arc(x, y, r1, 0, Math.PI * 2);
        ctx.fill();

        const spotlight2 = ctx.createRadialGradient(x, y, 0, x, y, r2);
        spotlight2.addColorStop(0, `rgba(${c2r}, ${c2g}, ${c2b}, 0.03)`);
        spotlight2.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = spotlight2;
        ctx.beginPath();
        ctx.arc(x, y, r2, 0, Math.PI * 2);
        ctx.fill();
      }

      const shimmer = Math.sin(timeRef.current * 0.3) * 0.5 + 0.5;
      const shimmerGradient = ctx.createLinearGradient(
        width * shimmer - 200,
        0,
        width * shimmer + 200,
        height
      );
      shimmerGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      shimmerGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
      shimmerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = shimmerGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "source-over";
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [renderingTheme, themes]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed"
      style={{ 
        zIndex: 0,
        filter: 'blur(20px)',
        opacity: opacity * 0.85,
        willChange: 'transform, opacity',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        margin: 0,
        padding: 0,
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    />
  );
}


