"use client";

import React, { useEffect, useRef } from "react";

interface AivaRobot3DProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function AivaRobot3D({
  className = "",
  width = 460,
  height = 360,
}: AivaRobot3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetMouseX = Math.max(-1, Math.min(1, nx));
      targetMouseY = Math.max(-1, Math.min(1, ny));
    };

    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.025;
      // Smooth interpolation toward target mouse position
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.52;
      const cy = height * 0.55;
      const floatY = Math.sin(time) * 6;

      // 1. Concentric Pedestal Rings (Base Glow)
      const pedestalY = cy + 90;
      
      // Ambient shadow under pedestal
      const shadowGrad = ctx.createRadialGradient(cx, pedestalY + 30, 10, cx, pedestalY + 30, 120);
      shadowGrad.addColorStop(0, "rgba(80, 110, 200, 0.35)");
      shadowGrad.addColorStop(0.5, "rgba(100, 130, 230, 0.15)");
      shadowGrad.addColorStop(1, "rgba(220, 235, 255, 0)");
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, pedestalY + 30, 130, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer glowing ring
      ctx.save();
      ctx.strokeStyle = "rgba(147, 197, 253, 0.6)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(59, 130, 246, 0.7)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(cx, pedestalY + 22, 118, 30, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pedestal lower cylinder
      const cylGrad = ctx.createLinearGradient(cx - 90, pedestalY, cx + 90, pedestalY + 25);
      cylGrad.addColorStop(0, "#8ba7dc");
      cylGrad.addColorStop(0.3, "#cbdcf8");
      cylGrad.addColorStop(0.7, "#9cbbf0");
      cylGrad.addColorStop(1, "#6c8ecc");
      ctx.fillStyle = cylGrad;
      ctx.beginPath();
      ctx.ellipse(cx, pedestalY + 14, 96, 24, 0, 0, Math.PI);
      ctx.ellipse(cx, pedestalY, 96, 24, 0, Math.PI, 0, true);
      ctx.fill();

      // Pedestal Top Surface (Metallic Glass disc)
      const discGrad = ctx.createRadialGradient(cx - 20, pedestalY - 8, 5, cx, pedestalY, 96);
      discGrad.addColorStop(0, "#ffffff");
      discGrad.addColorStop(0.4, "#dbe7fc");
      discGrad.addColorStop(0.85, "#a8c5f6");
      discGrad.addColorStop(1, "#7ba3eb");
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(cx, pedestalY, 96, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Cyan Neon Ring on Pedestal Top
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(cx, pedestalY - 2, 74, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Cute AIVA Robot Body & Head
      const botX = cx + mouseX * 8;
      const botY = cy - 20 + floatY;

      // Soft robot ambient shadow on pedestal
      ctx.fillStyle = "rgba(70, 95, 170, 0.25)";
      ctx.beginPath();
      ctx.ellipse(cx, pedestalY - 1, 48, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Robot Body (White egg/capsule with blue rim)
      const bodyY = botY + 45;
      const bodyGrad = ctx.createLinearGradient(botX - 30, bodyY - 25, botX + 30, bodyY + 35);
      bodyGrad.addColorStop(0, "#ffffff");
      bodyGrad.addColorStop(0.7, "#e1ecfc");
      bodyGrad.addColorStop(1, "#a8c6f4");

      ctx.save();
      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = "rgba(100, 140, 220, 0.3)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(botX, bodyY, 32, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chest Badge - Glowing "A" Symbol
      ctx.shadowColor = "#6366f1";
      ctx.shadowBlur = 10;
      const chestGrad = ctx.createLinearGradient(botX - 10, bodyY - 8, botX + 10, bodyY + 10);
      chestGrad.addColorStop(0, "#00f0ff");
      chestGrad.addColorStop(0.5, "#3b82f6");
      chestGrad.addColorStop(1, "#8b5cf6");
      ctx.fillStyle = chestGrad;
      ctx.beginPath();
      ctx.moveTo(botX, bodyY - 8);
      ctx.lineTo(botX + 8, bodyY + 8);
      ctx.lineTo(botX + 3, bodyY + 8);
      ctx.lineTo(botX + 1, bodyY + 3);
      ctx.lineTo(botX - 1, bodyY + 3);
      ctx.lineTo(botX - 3, bodyY + 8);
      ctx.lineTo(botX - 8, bodyY + 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Robot Hands (Floating white spheres)
      const handL_X = botX - 44 + Math.sin(time * 1.2) * 2;
      const handL_Y = bodyY - 2 + Math.cos(time * 1.2) * 3;
      const handR_X = botX + 44 - Math.sin(time * 1.2) * 2;
      const handR_Y = bodyY + 5 - Math.cos(time * 1.2) * 3;

      const drawHand = (hx: number, hy: number, palmUp = false) => {
        ctx.save();
        const hGrad = ctx.createRadialGradient(hx - 2, hy - 2, 2, hx, hy, 12);
        hGrad.addColorStop(0, "#ffffff");
        hGrad.addColorStop(0.7, "#dbe7fb");
        hGrad.addColorStop(1, "#8bb2ef");
        ctx.fillStyle = hGrad;
        ctx.shadowColor = "rgba(70, 110, 200, 0.25)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(hx, hy, 10, 0, Math.PI * 2);
        ctx.fill();

        // Fingertip cyan glow
        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(hx + (palmUp ? 2 : -2), hy + (palmUp ? -6 : 6), 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawHand(handL_X, handL_Y, true);
      drawHand(handR_X, handR_Y, false);

      // 3. Robot Head (Big Cute Rounded Helmet)
      const headX = botX + mouseX * 6;
      const headY = botY - 8 + mouseY * 4;

      // Ear Pods (Left & Right)
      const drawEarPod = (ex: number, ey: number, isRight = false) => {
        ctx.save();
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.ellipse(ex, ey, 7, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer white ring
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(ex + (isRight ? -2 : 2), ey, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Blue Core
        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(ex + (isRight ? -3 : 3), ey, 3, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawEarPod(headX - 44, headY);
      drawEarPod(headX + 44, headY, true);

      // Helmet Base (White Glossy Sphere)
      ctx.save();
      const helmetGrad = ctx.createRadialGradient(
        headX - 16,
        headY - 18,
        8,
        headX,
        headY,
        50
      );
      helmetGrad.addColorStop(0, "#ffffff");
      helmetGrad.addColorStop(0.65, "#f0f5ff");
      helmetGrad.addColorStop(0.9, "#d2e3fc");
      helmetGrad.addColorStop(1, "#98bdf5");

      ctx.fillStyle = helmetGrad;
      ctx.shadowColor = "rgba(70, 110, 200, 0.3)";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.ellipse(headX, headY, 44, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight on top of helmet
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.ellipse(headX - 14, headY - 22, 16, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Visor Screen (Dark Curved OLED Screen)
      ctx.save();
      const visorX = headX + mouseX * 5;
      const visorY = headY + 3 + mouseY * 3;
      const visorGrad = ctx.createLinearGradient(visorX, visorY - 18, visorX, visorY + 18);
      visorGrad.addColorStop(0, "#090d16");
      visorGrad.addColorStop(0.7, "#0f172a");
      visorGrad.addColorStop(1, "#1e293b");

      ctx.fillStyle = visorGrad;
      ctx.beginPath();
      ctx.ellipse(visorX, visorY, 32, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass reflection on visor edge
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(visorX, visorY - 3, 30, 19, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Happy Glowing Cyan Eyes (^ ^ curved eyes)
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 14;

      const eyeSpread = 12;
      // Left Eye
      ctx.beginPath();
      ctx.arc(visorX - eyeSpread, visorY + 2, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Right Eye
      ctx.beginPath();
      ctx.arc(visorX + eyeSpread, visorY + 2, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Cute blush dots under eyes
      ctx.fillStyle = "rgba(244, 114, 182, 0.7)";
      ctx.shadowColor = "rgba(244, 114, 182, 0.8)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(visorX - eyeSpread - 3, visorY + 10, 3, 0, Math.PI * 2);
      ctx.arc(visorX + eyeSpread + 3, visorY + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Floating 3D Telegram Glass Icon
      const tgX = cx - 110 + Math.cos(time * 0.9) * 8;
      const tgY = cy - 40 + Math.sin(time * 0.9) * 10;

      ctx.save();
      // Frosted Glass Rounded Square for Telegram
      const tgGrad = ctx.createLinearGradient(tgX - 25, tgY - 25, tgX + 25, tgY + 25);
      tgGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      tgGrad.addColorStop(0.5, "rgba(147, 197, 253, 0.6)");
      tgGrad.addColorStop(1, "rgba(59, 130, 246, 0.7)");

      ctx.fillStyle = tgGrad;
      ctx.shadowColor = "rgba(59, 130, 246, 0.4)";
      ctx.shadowBlur = 24;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2;

      const tgSize = 46;
      const r = 14;
      ctx.beginPath();
      ctx.roundRect(tgX - tgSize / 2, tgY - tgSize / 2, tgSize, tgSize, r);
      ctx.fill();
      ctx.stroke();

      // Crisp White Telegram Paper Plane
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      // Paper plane path
      ctx.moveTo(tgX - 11, tgY + 1);
      ctx.lineTo(tgX + 12, tgY - 9);
      ctx.lineTo(tgX + 5, tgY + 11);
      ctx.lineTo(tgX + 1, tgY + 4);
      ctx.lineTo(tgX - 5, tgY + 7);
      ctx.closePath();
      ctx.fill();

      // Fold shade
      ctx.fillStyle = "#c7d2fe";
      ctx.beginPath();
      ctx.moveTo(tgX + 1, tgY + 4);
      ctx.lineTo(tgX + 12, tgY - 9);
      ctx.lineTo(tgX + 5, tgY + 11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 5. Floating Glassy Orbs (Small pearl-like iridescent spheres)
      const drawOrb = (ox: number, oy: number, oRadius: number, oGradColor: string) => {
        ctx.save();
        const oGrad = ctx.createRadialGradient(ox - oRadius * 0.3, oy - oRadius * 0.3, 1, ox, oy, oRadius);
        oGrad.addColorStop(0, "#ffffff");
        oGrad.addColorStop(0.5, oGradColor);
        oGrad.addColorStop(1, "#3b82f6");
        ctx.fillStyle = oGrad;
        ctx.shadowColor = "rgba(100, 140, 240, 0.35)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ox, oy, oRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawOrb(cx - 85, cy + 50 + Math.sin(time * 1.5) * 6, 7, "#c4b5fd");
      drawOrb(cx + 95, cy - 65 + Math.cos(time * 1.3) * 5, 6, "#93c5fd");
      drawOrb(cx + 120, cy + 15 + Math.sin(time * 1.1) * 7, 8, "#d8b4fe");

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [width, height]);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="w-full h-auto max-w-full drop-shadow-lg"
      />
    </div>
  );
}
