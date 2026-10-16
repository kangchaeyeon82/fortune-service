// 배경과 첫 화면의 빛 효과. 레퍼런스 사진(docs/references/screenshots)의 분위기를 코드로 옮긴 것
// - 작은 별: 1px 점들이 묶음마다 다른 속도로 깜빡임
// - 십자 별빛: 크고 작은 4갈래·8갈래 빛이 천천히 나타났다 사라짐 (일부는 무지갯빛)
// - 빛 망울(보케): 흐릿하게 번진 큰 빛 점 몇 개
// - 반짝이 가루: 마법진에서 피어올라 위로 떠오름 (canvas)
// '동작 줄이기'를 켠 사람에게는 움직이지 않는 한 장면만 그린다.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);

  // ---------- 작은 별 ----------
  const sky = document.querySelector(".stars");
  if (sky) {
    // 화면 크기만큼만 그린다 (크게 그리면 묶음마다 큰 그래픽 메모리를 차지해 느려짐)
    const W = Math.min(innerWidth, 2000), H = Math.min(innerHeight, 1400);
    const count = Math.round((W * H) / 8000);
    for (let g = 0; g < 3; g++) {
      const dots = [];
      for (let i = 0; i < count / 3; i++) {
        const big = Math.random() < 0.12;
        dots.push(`${Math.round(rand(0, W))}px ${Math.round(rand(0, H))}px 0 ${big ? "0.6px" : "0"} rgb(255 255 255 / ${rand(0.3, 0.9).toFixed(2)})`);
      }
      const el = document.createElement("i");
      el.className = "dots";
      el.style.boxShadow = dots.join(",");
      el.style.setProperty("--dur", `${rand(3, 8).toFixed(1)}s`);
      el.style.setProperty("--delay", `${-rand(0, 6).toFixed(1)}s`);
      sky.appendChild(el);
    }

    // ---------- 십자 별빛 ----------
    const n = innerWidth < 600 ? 7 : 12;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      const size = Math.random() < 0.25 ? rand(46, 78) : rand(14, 34);
      s.className = "sparkle" + (size > 40 ? " eight" : "") + (Math.random() < 0.35 ? " prism" : "");
      s.style.cssText = `left:${rand(3, 97).toFixed(1)}%;top:${rand(3, 95).toFixed(1)}%;--s:${size.toFixed(0)}px;` +
        `--dur:${rand(5, 11).toFixed(1)}s;--delay:${-rand(0, 10).toFixed(1)}s`;
      sky.appendChild(s);
    }

    // ---------- 리본을 따라 흩뿌린 반짝이 ----------
    // 리본 SVG(viewBox 1000, 화면의 -5%~105%에 늘려 그림) 위의 점을 화면 %로 바꿔 반짝이를 놓는다
    const path = sky.querySelector(".ribbon-lav path");
    if (path) {
      const len = path.getTotalLength();
      const m = innerWidth < 600 ? 22 : 40;
      for (let i = 0; i < m; i++) {
        const pt = path.getPointAtLength(rand(0.08, 0.92) * len);
        const g = document.createElement("i");
        g.className = "glitter";
        const x = -5 + 0.11 * (pt.x + rand(-35, 35)), y = -5 + 0.11 * (pt.y + rand(-35, 35));
        g.style.cssText = `left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--dur:${rand(1.5, 4).toFixed(1)}s;--delay:${-rand(0, 4).toFixed(1)}s;` +
          `transform:scale(${rand(0.4, 1.1).toFixed(2)})`;
        sky.appendChild(g);
      }
    }

    // ---------- 빛 망울 ----------
    for (let i = 0; i < 6; i++) {
      const b = document.createElement("i");
      b.className = "bokeh";
      b.style.cssText = `left:${rand(0, 100).toFixed(1)}%;top:${rand(0, 100).toFixed(1)}%;--s:${rand(40, 130).toFixed(0)}px;` +
        `--dur:${rand(14, 26).toFixed(0)}s;--delay:${-rand(0, 20).toFixed(0)}s`;
      sky.appendChild(b);
    }
  }

  // ---------- 반짝이 가루 (마법진에서 피어오름) ----------
  document.querySelectorAll("canvas.motes").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let w = 0, h = 0, parts = [];
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // 마법진(바닥의 타원) 안에서 태어나 위로 떠오른다
    const spawn = (anyAge) => {
      const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random());
      const life = rand(3.5, 7);
      return {
        x: w / 2 + Math.cos(a) * r * w * 0.36,
        y: h * 0.86 + Math.sin(a) * r * h * 0.09,
        vy: rand(14, 42), sway: rand(0.4, 1.4), phase: rand(0, 6.3),
        size: Math.random() < 0.12 ? rand(1.6, 2.4) : rand(0.6, 1.4),
        flare: Math.random() < 0.12,
        age: anyAge ? rand(0, life) : 0, life,
      };
    };
    resize();
    addEventListener("resize", resize);
    const N = innerWidth < 600 ? 60 : 95;
    parts = Array.from({ length: N }, () => spawn(true));

    const draw = (p) => {
      const t = p.age / p.life;
      const fade = Math.min(1, t * 5) * (1 - t) * (0.55 + 0.45 * Math.sin(p.age * 6 + p.phase)); // 반짝이며 사라짐
      if (fade <= 0) return;
      const x = p.x + Math.sin(p.age * p.sway + p.phase) * 6, y = p.y - p.vy * p.age;
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      if (p.flare) { // 가끔 십자 빛
        ctx.globalAlpha = fade * 0.7;
        ctx.fillRect(x - 6, y - 0.35, 12, 0.7);
        ctx.fillRect(x - 0.35, y - 6, 0.7, 12);
      }
    };
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      // 화면에 안 보이면(결과 화면·다른 탭) 그리지 않고 0.5초마다 다시 보이는지만 확인
      if (canvas.offsetParent === null || document.hidden) return setTimeout(() => { last = performance.now(); requestAnimationFrame(frame); }, 500);
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p, i) => {
        p.age += dt;
        if (p.age > p.life) parts[i] = p = spawn(false);
        draw(p);
      });
      requestAnimationFrame(frame);
    };
    if (reduce) { parts.forEach(draw); } else requestAnimationFrame(frame);
  });
})();
