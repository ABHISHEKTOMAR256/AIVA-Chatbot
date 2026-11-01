"use client";

import React, { useEffect, useRef } from "react";

interface NeuralOrbProps {
  size?: number;
  className?: string;
  particleCount?: number;
}

export default function NeuralOrb({
  size = 280,
  className = "",
  particleCount = 120,
}: NeuralOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angleX = 0;
    let angleY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Initialize 3D points on a Fibonacci sphere
    interface Point3D {
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;
    }

    const points: Point3D[] = [];
    const sphereRadius = size * 0.36;

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);

      const isCyan = i % 3 !== 0;
      points.push({
        x,
        y,
        z,
        radius: isCyan ? 1.8 : 2.4,
        color: isCyan ? "#00f0ff" : "#a855f7",
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 0.002;
      mouseY = (y / rect.height) * 0.002;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Core pulsating glow
      const cx = size / 2;
      const cy = size / 2;
      const pulse = Math.sin(Date.now() * 0.0025) * 8;
      const glowGrad = ctx.createRadialGradient(
        cx,
        cy,
        4,
        cx,
        cy,
        sphereRadius * 0.9 + pulse
      );
      glowGrad.addColorStop(0, "rgba(0, 240, 255, 0.25)");
      glowGrad.addColorStop(0.5, "rgba(139, 92, 246, 0.12)");
      glowGrad.addColorStop(1, "rgba(3, 7, 18, 0)");

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius * 0.9 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Rotation angles with gentle mouse sway
      angleY += 0.006 + mouseX;
      angleX += 0.003 + mouseY;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Project points
      const projected = points.map((p) => {
        // Rotate around Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate around X
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Perspective factor
        const fov = 350;
        const scale = fov / (fov + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;
        const alpha = Math.max(0.15, Math.min(1, (z2 + sphereRadius) / (2 * sphereRadius)));

        return {
          px,
          py,
          z2,
          scale,
          alpha,
          color: p.color,
          radius: p.radius * scale,
        };
      });

      // Sort by depth for correct blending
      projected.sort((a, b) => a.z2 - b.z2);

      // Draw connecting filaments between close points
      const maxDist = size * 0.16;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const filamentAlpha = (1 - dist / maxDist) * 0.18 * projected[i].alpha;
            ctx.strokeStyle = `rgba(0, 240, 255, ${filamentAlpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      for (const p of projected) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * p.scale;

        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(0.8, p.radius), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [size, particleCount]);

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
    </div>
  );
}
