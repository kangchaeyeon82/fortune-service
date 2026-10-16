// 검은 배경에 아주 작은 별을 흩뿌린다. 별 묶음 6개가 각자 다른 속도로 은은하게 깜빡임
// (별 하나하나를 요소로 만들지 않고 box-shadow로 그려서 가볍다)
(function () {
  const box = document.querySelector(".stars");
  if (!box) return;
  const W = 2000, H = 1400; // 화면보다 넓게 그려 두고 넘치는 부분은 잘림
  const count = Math.round(Math.min(window.innerWidth * window.innerHeight, W * H) / 9000); // 화면 크기에 맞춰 70~300개
  const groups = 6;
  for (let g = 0; g < groups; g++) {
    const dots = [];
    for (let i = 0; i < count / groups; i++) {
      const x = Math.round(Math.random() * W), y = Math.round(Math.random() * H);
      const big = Math.random() < 0.12; // 가끔 조금 큰 별
      const a = (0.35 + Math.random() * 0.55).toFixed(2);
      dots.push(`${x}px ${y}px 0 ${big ? "0.6px" : "0"} rgb(255 255 255 / ${a})`);
    }
    const el = document.createElement("i");
    el.style.boxShadow = dots.join(",");
    el.style.setProperty("--dur", `${3 + Math.random() * 5}s`);
    el.style.setProperty("--delay", `${-Math.random() * 6}s`);
    box.appendChild(el);
  }
})();
