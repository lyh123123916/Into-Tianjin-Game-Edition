// 动态特效层：场景晃动 / 粒子 / 流光 / 呼吸灯 / 震屏
const FX = (() => {
  const W = 192, H = 144;
  let ctx = null, scene = 'black', frame = 0, parts = [], running = false, panX = 0;

  const CFG = {
    black:  { flicker: 1 },
    subway: { swayA: 0.8, swayP: 52 },
    taxi:   { swayA: 0.9, swayP: 15, speed: true },
    street: { drift: true },
    door:   { glow: true, sparkle: 10 },
    bike:   { drift: true, sparkle: 4 },
    shop:   {},
    d_tofu: {}, d_eggplant: {}, d_mianjin: {}, d_fish: {}, d_combo: {}, d_baozi: {},
    counter: {}, teahouse: {}, haihe: {}, station: {}, waitang: {},
  };
  const rnd = (a, b) => a + Math.random() * (b - a);

  function initParts() {
    parts = [];
    const c = CFG[scene];
    for (let i = 0; i < (c.dust || 0); i++)
      parts.push({ t: 'dust', x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.12, 0.12), vy: rnd(-0.08, 0.04), ph: rnd(0, 6) });
    for (let i = 0; i < (c.sparkle || 0); i++)
      parts.push({ t: 'sp', x: rnd(52, 140), y: rnd(0, H), vy: -rnd(0.12, 0.35), ph: rnd(0, 6) });
    for (let i = 0; i < (c.drift ? 3 : 0); i++)
      parts.push({ t: 'cloud', x: rnd(0, W), y: rnd(4, 24), vx: rnd(0.05, 0.13), w: rnd(14, 32) });
  }

  function setScene(n) {
    scene = CFG[n] ? n : 'black';
    frame = 0;
    initParts();
    const st = document.getElementById('stage');
    st.style.transform = '';
    st.style.filter = '';
    document.getElementById('bg').style.transform = '';
    if (!running) { running = true; requestAnimationFrame(tick); }
  }

  // ---- 前景剪影精灵：随帧绘制在 fx 画布上 ----
  const INK = 'rgba(14,17,22,0.82)';
  function drawStraps() {                       // 地铁吊环：随车厢摆动
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    [26, 88, 150].forEach((x, i) => {
      const a = Math.sin(frame / 40 * Math.PI * 2 + i * 2.1) * 0.22 + Math.sin(frame / 13 + i) * 0.05;
      const len = 17, bx = x + Math.sin(a) * len, by = 6 + Math.cos(a) * len;
      ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillRect(bx - 2, by, 4, 6); ctx.clearRect(bx - 1, by + 1.5, 2, 3);
    });
  }
  function drawWalker() {                       // 街边行人剪影：两帧腿走路横穿
    const period = (W + 24) * 3;
    const x = -12 + ((frame % period) / 3) | 0;
    const y = 96, leg = (frame / 14 | 0) % 2;
    ctx.fillStyle = INK;
    ctx.fillRect(x + 2, y - 14, 4, 4);          // 头
    ctx.fillRect(x + 1, y - 10, 6, 7);          // 身
    if (leg) { ctx.fillRect(x + 1, y - 3, 2, 5); ctx.fillRect(x + 5, y - 3, 2, 4); }
    else     { ctx.fillRect(x + 3, y - 3, 2, 5); ctx.fillRect(x + 4, y - 3, 2, 4); }
  }
  function drawSteam() {                        // 饭馆门：锅气蒸汽团上飘
    ctx.fillStyle = 'rgba(240,240,235,0.16)';
    for (let i = 0; i < 3; i++) {
      const ph = (frame / 90 + i * 0.33) % 1;
      const r = 2 + ph * 7;
      const x = 70 + i * 26 + Math.sin(ph * 9 + i * 2) * 5;
      const y = 128 - ph * 55;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  }
  function drawCyclist() {                      // 骑行者剪影：蹬车掠过 + 轮辐转动
    if (frame % 420 > 150) return;
    const x = -20 + (frame % 420) / 1.05;
    const y = 118, sp = frame / 4;
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.arc(x + 17, y, 6, 0, 7); ctx.stroke();
    for (let k = 0; k < 2; k++) {               // 轮辐
      const cx = x + k * 17, a = sp + k * 0.8;
      ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 5, y - Math.sin(a) * 5);
      ctx.lineTo(cx + Math.cos(a) * 5, y + Math.sin(a) * 5); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 9); ctx.lineTo(x + 17, y);
    ctx.moveTo(x + 8, y - 9); ctx.lineTo(x + 13, y - 10); ctx.stroke();
    ctx.fillRect(x + 6, y - 17, 4, 4);          // 头
    ctx.fillRect(x + 5, y - 13, 6, 5);          // 身
  }
  const SPRITES = { straps: drawStraps, walker: drawWalker, steam: drawSteam, cyclist: drawCyclist };

  // ---- 地铁车窗无限卷轴：地下写实循环（隧道→站台→镜像回接）----
  const IMG_W = 2560, IMG_H = 1080;                     // subway_v3.png 原始尺寸
  // 玻璃全区（图像像素）：[x, y, w, h]，卷轴铺满整块玻璃不留黑边
  const WINS = [[206, 412, 430, 246], [802, 404, 444, 258], [1422, 404, 436, 258], [2042, 404, 436, 258]];
  const POLES = [];                                     // 新底图立柱不穿窗，无需补画
  let strip = null;
  let tunnelImg = null, platformImg = null, tunnelFlip = null, platformFlip = null;
  const mkFlip = (im) => {
    const f = document.createElement('canvas');
    f.width = im.width; f.height = im.height;
    const g = f.getContext('2d');
    g.translate(im.width, 0); g.scale(-1, 1); g.drawImage(im, 0, 0);
    return f;
  };
  const tImg = new Image();
  tImg.onload = () => { tunnelImg = tImg; tunnelFlip = mkFlip(tImg); };
  tImg.src = 'assets/bg/subway_tunnel_v3.png';
  const pImg = new Image();
  pImg.onload = () => { platformImg = pImg; platformFlip = mkFlip(pImg); };
  pImg.src = 'assets/bg/subway_platform_v3.png';
  // 程序生成的备用卷轴（图片未加载时兜底）
  function buildStrip() {
    const s = document.createElement('canvas'); s.width = 1024; s.height = 256;
    const g = s.getContext('2d');
    g.fillStyle = '#0a0f18'; g.fillRect(0, 0, 1024, 256);
    let sd = 20260925; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let x = 0; x < 1024;) {                        // 楼影 + 亮窗（跨边缘时补画实现平铺）
      const w = 40 + (rnd() * 60 | 0), h = 90 + (rnd() * 120 | 0);
      const bld = (bx) => {
        g.fillStyle = '#141b29'; g.fillRect(bx, 256 - h, w, h);
        for (let wy = 256 - h + 8; wy < 248; wy += 14)
          for (let wx = bx + 5; wx < bx + w - 6; wx += 11)
            if (rnd() < 0.3) { g.fillStyle = rnd() < 0.8 ? '#ffd76a' : '#7fd4ff'; g.fillRect(wx, wy, 4, 6); }
      };
      bld(x); if (x + w > 1024) bld(x - 1024);
      x += w + 6 + (rnd() * 20 | 0);
    }
    for (let i = 0; i < 4; i++) {                       // 长条流光
      g.fillStyle = i % 2 ? 'rgba(255,215,150,0.5)' : 'rgba(255,255,255,0.4)';
      g.fillRect(0, 150 + i * 24, 1024, 2);
    }
    for (let i = 0; i < 10; i++) {                      // 短亮痕
      const w = 60 + (rnd() * 140 | 0), x = rnd() * (1024 - w) | 0;
      g.fillStyle = 'rgba(255,180,90,0.55)'; g.fillRect(x, 120 + (rnd() * 110 | 0), w, 3);
    }
    return s;
  }
  let winFx = [];                                        // 本帧各窗口的屏幕矩形与相位，供光照层使用
  function drawWindows() {
    const bg = document.getElementById('bg'), st = document.getElementById('stage');
    winFx = [];
    if (!bg.classList.contains('wide')) return;
    const segs = tunnelImg && platformImg
      ? [{ img: tunnelImg, sy: 135 }, { img: platformImg, sy: 250 }, { img: platformFlip, sy: 250 }, { img: tunnelFlip, sy: 135 }]
      : null;                                   // 每段取素材中段 810px 高，裁掉顶部黑边
    const art = segs ? null : (strip = strip || buildStrip());
    const scale = Math.max(bg.offsetWidth / IMG_W, bg.offsetHeight / IMG_H);
    const cropX = (IMG_W * scale - bg.offsetWidth) / 2;    // cover 左右裁切量
    const cropY = (IMG_H * scale - bg.offsetHeight) / 2;   // cover 上下裁切量
    const ux = W / st.clientWidth, uy = H / st.clientHeight;
    const scroll = frame * 1.4;
    for (let i = 0; i < WINS.length; i++) {
      const [ix, iy, iw, ih] = WINS[i];
      const x = (ix * scale - cropX + panX) * ux, y = (iy * scale - cropY) * uy;
      const w = iw * scale * ux, h = ih * scale * uy;
      ctx.save();
      ctx.beginPath();
      (ctx.roundRect || ctx.rect).call(ctx, x, y, w, h, Math.min(w, h) * 0.14);
      ctx.clip();
      ctx.fillStyle = '#0a0f18'; ctx.fillRect(x, y, w, h);
      if (segs) {                                          // 隧道→站台→镜像段无缝循环
        const segW = h * (IMG_W / 810), CL = segW * 4;
        const off = (((scroll + ix * 0.35) % CL) + CL) % CL;
        for (let j = Math.floor(off / segW); j <= Math.floor((off + w) / segW); j++) {
          const sg = segs[((j % 4) + 4) % 4];
          ctx.drawImage(sg.img, 0, sg.sy, IMG_W, 810, x + j * segW - off, y, segW, h);
        }
        const u = (off + w / 2) / segW, idx = ((Math.floor(u) % 4) + 4) % 4, k = Math.sin((u % 1) * Math.PI);
        winFx.push({ x, y, w, h, st: (idx === 1 || idx === 2) ? k : 0, tn: (idx === 0 || idx === 3) ? k : 0 });
      } else {
        const tile = art.width / art.height * h;
        const off = ((scroll + ix * 0.35) % tile + tile) % tile;
        for (let px = x - off; px < x + w; px += tile) ctx.drawImage(art, px, y, tile, h);
      }
      ctx.restore();
    }
    for (const [px, pw, win] of POLES) {                  // 立柱压回卷轴之上
      const [, iy, , ih] = WINS[win];
      const x = (px * scale - cropX + panX) * ux, w = pw * scale * ux;
      const y = (iy * scale - cropY) * uy, h = ih * scale * uy;
      ctx.fillStyle = '#9aa4b2'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#c9772e'; ctx.fillRect(x + w * 0.65, y, Math.max(1, w * 0.2), h);
    }
  }

  // ---- 走动乘客：抠掉品红底后，低头看手机在车厢里来回走 ----
  let walkerImg = null;
  const wImg = new Image();
  wImg.onload = () => {
    const iw = wImg.width, ih = wImg.height;
    const cv = document.createElement('canvas'); cv.width = iw; cv.height = ih;
    const g = cv.getContext('2d');
    g.drawImage(wImg, 0, 0);
    const d = g.getImageData(0, 0, iw, ih), px = d.data;
    const br = px[0], bg2 = px[1], bb = px[2];               // 左上角取样背景色
    let x0 = iw, y0 = ih, x1 = 0, y1 = 0;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], gg = px[i + 1], b = px[i + 2];
      const dist = Math.sqrt((r - br) ** 2 + (gg - bg2) ** 2 + (b - bb) ** 2);
      const pinkish = r > gg + 35 && b > gg - 15 && b < r;   // 品红系（含脚下投影）
      if (dist < 70 || (pinkish && dist < 150)) { px[i + 3] = 0; continue; }
      const p = (i / 4) | 0, xx = p % iw, yy = (p / iw) | 0;
      if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
    }
    g.putImageData(d, 0, 0);
    const out = document.createElement('canvas');
    out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    walkerImg = out;
  };
  wImg.src = 'assets/bg/passenger_walk.png';
  function drawWalker() {
    if (!walkerImg) return;
    const period = 620, t = frame % period;
    if (t > 470) return;                                     // 走完歇一会儿
    const dir = (((frame / period) | 0) % 2);                // 每趟换向
    const p = t / 470;
    const h = 86, w = h * walkerImg.width / walkerImg.height;
    const x = dir ? (W + 20 - p * (W + 40 + w)) : (-20 + p * (W + 40 + w)) - w;
    const bob = Math.abs(Math.sin(t / 9)) * 1.5;
    ctx.save();
    ctx.translate(x + w / 2, 140 - h / 2 - bob);
    if (dir) ctx.scale(-1, 1);
    ctx.drawImage(walkerImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // ---- 实时光照层：站台暖光从车窗洒进车厢，随卷轴横向流动 ----
  function drawLight() {
    if (!winFx.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of winFx) {
      if (r.st > 0.02) {
        const k = r.st * (0.85 + 0.15 * Math.sin(frame / 7));    // 轻微闪烁
        const spill = r.h * 2.3, sx = r.x - (frame * 0.5) % 30;  // 光斑随车外灯光横移
        const g = ctx.createLinearGradient(0, r.y, 0, r.y + spill);
        g.addColorStop(0, `rgba(255,196,120,${(0.14 * k).toFixed(3)})`);
        g.addColorStop(0.55, `rgba(255,180,105,${(0.06 * k).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,180,105,0)');
        ctx.fillStyle = g;
        ctx.fillRect(r.x - 3, r.y, r.w + 6, spill);
        for (let px = sx; px < r.x + r.w; px += 30) {            // 窗内竖向光条
          if (px + 9 < r.x) continue;
          ctx.fillStyle = `rgba(255,210,150,${(0.05 * k).toFixed(3)})`;
          ctx.fillRect(Math.max(px, r.x), r.y, Math.min(px + 9, r.x + r.w) - Math.max(px, r.x), spill * 0.75);
        }
      }
      if (r.tn > 0.02) {                                         // 隧道：冷蓝呼吸 + 偶发灯闪
        const k = r.tn * (0.5 + 0.5 * Math.sin(frame / 11));
        ctx.fillStyle = `rgba(80,150,220,${(0.035 * k).toFixed(3)})`;
        ctx.fillRect(r.x - 3, r.y, r.w + 6, r.h * 2.3);
      }
    }
    ctx.restore();
  }

  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden || !ctx) { ctx = ctx || document.getElementById('fx').getContext('2d'); return; }
    frame++;
    const c = CFG[scene];
    const st = document.getElementById('stage');

    // 车厢/车辆颠簸（整像素步进，保持像素感）
    if (c.swayA) {
      const dy = Math.round(Math.sin(frame / c.swayP * Math.PI * 2) * c.swayA);
      const dx = Math.round(Math.sin(frame / (c.swayP * 0.37) * Math.PI * 2) * c.swayA * 0.4);
      st.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    // 宽景图相机横移：整像素往返缓摇
    const bg = document.getElementById('bg');
    if (c.pan && bg.classList.contains('wide')) {
      const over = Math.max(0, bg.offsetWidth - st.clientWidth);
      const k = 0.5 - 0.5 * Math.cos(frame / c.pan * Math.PI * 2);
      panX = -(k * over) | 0;
      bg.style.transform = `translateX(${panX}px)`;
    } else panX = 0;

    // 春联门：红灯笼呼吸光
    if (c.glow) {
      const k = 1 + 0.05 * Math.sin(frame / 26);
      st.style.filter = `brightness(${k.toFixed(3)}) saturate(${(1 + 0.1 * Math.sin(frame / 26)).toFixed(3)})`;
    }
    // 黑屏偶发老式终端闪烁
    if (c.flicker && frame % 131 === 0) {
      st.style.filter = 'brightness(1.3)';
      setTimeout(() => { if (CFG[scene].flicker) st.style.filter = ''; }, 55);
    }

    ctx.clearRect(0, 0, W, H);

    // 地铁车窗无限卷轴（先画，吊环等前景精灵叠在其上）
    if (c.scroll) drawWindows();
    // 走动乘客（在吊环之后、光晕之前）
    if (c.scroll) drawWalker();
    // 前景剪影精灵
    if (c.sprite && SPRITES[c.sprite]) SPRITES[c.sprite]();
    // 实时光照层（最后叠加，罩在一切之上）
    if (c.scroll) drawLight();

    // 出租车速度线
    if (c.speed) {
      for (let i = 0; i < 5; i++) {
        const x = W - ((frame * 4 + i * 47) % (W + 40));
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(x, 116 + (i * 5) % 14, 12, 1);
      }
    }

    // 粒子
    for (const p of parts) {
      if (p.t === 'dust') {
        p.x += p.vx + Math.sin((frame + p.ph * 40) / 60) * 0.05;
        p.y += p.vy;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
      } else if (p.t === 'sp') {
        p.y += p.vy;
        if (p.y < -2) { p.y = H + 2; p.x = rnd(52, 140); }
        const a = 0.35 + 0.35 * Math.sin((frame + p.ph * 30) / 8);
        ctx.fillStyle = `rgba(255,215,106,${a.toFixed(2)})`;
        ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
      } else if (p.t === 'cloud') {
        p.x += p.vx;
        if (p.x > W + p.w) p.x = -p.w;
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(p.x | 0, p.y | 0, p.w | 0, 3);
      }
    }
  }

  function shake() {
    const st = document.getElementById('stage');
    st.classList.remove('shake');
    void st.offsetWidth;
    st.classList.add('shake');
  }

  const api = { setScene, shake };
  return api;
})();
