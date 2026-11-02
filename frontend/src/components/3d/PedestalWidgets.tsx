"use client";

import React, { useEffect, useRef } from "react";

/**
 * 3D Toggle Switch on a glowing circular metallic pedestal (Chatbot Control)
 */
export function TogglePedestalCanvas({ size = 160 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size * 0.65;

      // Base Pedestal Shadow
      ctx.fillStyle = "rgba(100, 130, 220, 0.2)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 60, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal Cylinder
      const cylGrad = ctx.createLinearGradient(cx - 50, cy, cx + 50, cy + 18);
      cylGrad.addColorStop(0, "#a0bce8");
      cylGrad.addColorStop(0.5, "#dce7fc");
      cylGrad.addColorStop(1, "#8baee0");
      ctx.fillStyle = cylGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 50, 14, 0, 0, Math.PI);
      ctx.ellipse(cx, cy, 50, 14, 0, Math.PI, 0, true);
      ctx.fill();

      // Pedestal Top Disc
      const discGrad = ctx.createRadialGradient(cx - 15, cy - 5, 2, cx, cy, 50);
      discGrad.addColorStop(0, "#ffffff");
      discGrad.addColorStop(0.6, "#d5e4fa");
      discGrad.addColorStop(1, "#94b8ee");
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 50, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Cyan Glow Ring
      ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 1, 38, 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3D Rounded Pill Capsule Toggle (Purple / Blue)
      const toggleY = cy - 22 + Math.sin(t) * 2;
      const toggleW = 54;
      const toggleH = 26;

      ctx.save();
      const togGrad = ctx.createLinearGradient(cx - 27, toggleY - 13, cx + 27, toggleY + 13);
      togGrad.addColorStop(0, "#6366f1");
      togGrad.addColorStop(1, "#8b5cf6");
      ctx.fillStyle = togGrad;
      ctx.shadowColor = "rgba(99, 102, 241, 0.45)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(cx - toggleW / 2, toggleY - toggleH / 2, toggleW, toggleH, 13);
      ctx.fill();

      // Toggle Active Knob (Shiny White Knob on the Right)
      const knobX = cx + 13;
      const knobY = toggleY;
      const knobR = 10;

      const knobGrad = ctx.createRadialGradient(knobX - 3, knobY - 3, 1, knobX, knobY, knobR);
      knobGrad.addColorStop(0, "#ffffff");
      knobGrad.addColorStop(0.8, "#f1f5f9");
      knobGrad.addColorStop(1, "#cbd5e1");
      ctx.fillStyle = knobGrad;
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return <canvas ref={canvasRef} style={{ width: `${size}px`, height: `${size}px` }} className="max-w-full h-auto mx-auto" />;
}

/**
 * 3D Shiny Colorful Bar Chart on a circular pedestal (Analytics)
 */
export function AnalyticsBarsPedestalCanvas({ size = 160 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size * 0.68;

      // Base Pedestal Shadow
      ctx.fillStyle = "rgba(100, 130, 220, 0.2)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 60, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal Cylinder & Disc
      const cylGrad = ctx.createLinearGradient(cx - 50, cy, cx + 50, cy + 18);
      cylGrad.addColorStop(0, "#a0bce8");
      cylGrad.addColorStop(0.5, "#dce7fc");
      cylGrad.addColorStop(1, "#8baee0");
      ctx.fillStyle = cylGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 50, 14, 0, 0, Math.PI);
      ctx.ellipse(cx, cy, 50, 14, 0, Math.PI, 0, true);
      ctx.fill();

      const discGrad = ctx.createRadialGradient(cx - 15, cy - 5, 2, cx, cy, 50);
      discGrad.addColorStop(0, "#ffffff");
      discGrad.addColorStop(0.6, "#d5e4fa");
      discGrad.addColorStop(1, "#94b8ee");
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 50, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3 Shiny 3D Cylindrical Bars
      const bars = [
        { x: cx - 22, h: 32 + Math.sin(t) * 3, c1: "#00f0ff", c2: "#0284c7" },
        { x: cx - 2, h: 46 + Math.sin(t + 1) * 3, c1: "#3b82f6", c2: "#1d4ed8" },
        { x: cx + 18, h: 38 + Math.sin(t + 2) * 3, c1: "#c084fc", c2: "#7e22ce" },
      ];

      bars.forEach((b) => {
        const barY = cy - 4 - b.h;
        const bw = 14;

        ctx.save();
        ctx.shadowColor = b.c1;
        ctx.shadowBlur = 8;

        // Bar side
        const bGrad = ctx.createLinearGradient(b.x - bw / 2, barY, b.x + bw / 2, cy - 4);
        bGrad.addColorStop(0, b.c1);
        bGrad.addColorStop(1, b.c2);
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.roundRect(b.x - bw / 2, barY, bw, b.h, 4);
        ctx.fill();

        // Shiny Top Cap
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(b.x, barY + 2, bw / 2 - 1, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return <canvas ref={canvasRef} style={{ width: `${size}px`, height: `${size}px` }} className="max-w-full h-auto mx-auto" />;
}

/**
 * 3D Blue Glossy Gear on a circular pedestal (Settings)
 */
export function SettingsGearPedestalCanvas({ size = 160 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size * 0.68;

      // Base Pedestal Shadow
      ctx.fillStyle = "rgba(100, 130, 220, 0.2)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 60, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal
      const cylGrad = ctx.createLinearGradient(cx - 50, cy, cx + 50, cy + 18);
      cylGrad.addColorStop(0, "#a0bce8");
      cylGrad.addColorStop(0.5, "#dce7fc");
      cylGrad.addColorStop(1, "#8baee0");
      ctx.fillStyle = cylGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 50, 14, 0, 0, Math.PI);
      ctx.ellipse(cx, cy, 50, 14, 0, Math.PI, 0, true);
      ctx.fill();

      const discGrad = ctx.createRadialGradient(cx - 15, cy - 5, 2, cx, cy, 50);
      discGrad.addColorStop(0, "#ffffff");
      discGrad.addColorStop(0.6, "#d5e4fa");
      discGrad.addColorStop(1, "#94b8ee");
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 50, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rotating 3D Blue Gear
      const gearY = cy - 24 + Math.sin(t * 1.5) * 3;
      const gearR = 22;
      const teeth = 8;

      ctx.save();
      ctx.translate(cx, gearY);
      ctx.rotate(t * 0.8);

      ctx.shadowColor = "rgba(59, 130, 246, 0.4)";
      ctx.shadowBlur = 12;

      const gGrad = ctx.createLinearGradient(-gearR, -gearR, gearR, gearR);
      gGrad.addColorStop(0, "#60a5fa");
      gGrad.addColorStop(0.5, "#3b82f6");
      gGrad.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = gGrad;

      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a1 = (i * 2 * Math.PI) / teeth;
        const a2 = a1 + Math.PI / teeth;
        const rOuter = gearR + 5;
        const rInner = gearR - 2;

        ctx.lineTo(Math.cos(a1) * rOuter, Math.sin(a1) * rOuter);
        ctx.lineTo(Math.cos(a2) * rInner, Math.sin(a2) * rInner);
      }
      ctx.closePath();
      ctx.fill();

      // Center hole
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return <canvas ref={canvasRef} style={{ width: `${size}px`, height: `${size}px` }} className="max-w-full h-auto mx-auto" />;
}
