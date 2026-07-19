// =============================================================
// CONFETTI — colorful paper pieces bursting from the center
// (used for the "Game complete" celebration).
// Pure JS + Web Animations API, no libraries.
// =============================================================

const COLORS = ["#e8412e", "#2244e0", "#f5a623", "#8e24aa"];

export function confettiBurst(container, { count = 110 } = {}) {
  const W = container.clientWidth || 800;
  const H = container.clientHeight || 450;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "aw-confetti";
    p.style.background = COLORS[i % COLORS.length];

    // start near the center, slightly above the middle
    const startX = W / 2 + (Math.random() - 0.5) * W * 0.25;
    const startY = H * 0.38 + (Math.random() - 0.5) * H * 0.2;
    p.style.left = `${startX}px`;
    p.style.top = `${startY}px`;
    container.append(p);

    // explode outwards, then fall down and fade
    const dx = (Math.random() - 0.5) * W * 0.95;
    const dy = (Math.random() - 0.65) * H * 0.8;
    const fall = H * 0.5 + Math.random() * H * 0.45;
    const rot = (Math.random() - 0.5) * 720;
    const dur = 1600 + Math.random() * 900;

    p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 0 },
        { transform: `translate(${dx * 0.7}px, ${dy}px) rotate(${rot * 0.5}deg)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx}px, ${dy + fall}px) rotate(${rot}deg)`, opacity: 0.9, offset: 0.85 },
        { transform: `translate(${dx * 1.05}px, ${dy + fall + 60}px) rotate(${rot * 1.1}deg)`, opacity: 0 }
      ],
      { duration: dur, easing: "cubic-bezier(.15,.55,.45,1)", fill: "forwards" }
    );
    setTimeout(() => p.remove(), dur + 120);
  }
}
