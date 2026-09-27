// 剧情引擎：narrate / choice / input / stamina / summary
const Engine = (() => {
  const G = {
    luck: 0,
    achievements: [],
    name: '游客',
    flags: {},
    counts: {},                                   // 选项点击计数器（如 嗑瓜子/点段子 各限 10 次）
    story: null,
    node: null,
    typing: null,
    hoverTimer: null,
    staminaRun: null,
  };

  const $ = id => document.getElementById(id);
  const ov = () => $('overlay');

  // ---------- HUD ----------
  function refreshHud() {
    $('hud-name').textContent = G.name;
    $('hud-luck').textContent = '幸运值 ' + G.luck;
    $('hud-ach').textContent = `成就 ${G.achievements.length}/${Object.keys(G.story.achievements).length}`;
  }

  // ---------- 成就 ----------
  function unlock(id) {
    if (!id || G.achievements.includes(id)) return;
    const name = G.story.achievements[id];
    if (!name) return;
    G.achievements.push(id);
    refreshHud();
    const t = $('toast');
    $('toast-name').textContent = name;
    t.classList.remove('hidden');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.add('hidden'), 2600);
    Audio8.fanfare();
    FX.shake();
  }

  // ---------- 幸运值飘字 ----------
  function floatLuck(n) {
    Audio8.luck(n);
    const f = $('float-luck');
    f.textContent = n > 0 ? `幸运值+${n}` : `幸运值${n}`;
    f.classList.toggle('bad', n < 0);
    f.style.transition = 'none';
    f.style.opacity = '1';
    f.style.top = '58%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      f.style.transition = 'all 1.2s ease-out';
      f.style.top = '48%';
      f.style.opacity = '0';
    }));
  }

  function applyEffects(e) {
    if (!e) return;
    if (e.luck) { G.luck += e.luck; floatLuck(e.luck); }
    if (e.achieve) unlock(e.achieve);
    if (e.flag) G.flags[e.flag] = true;
    if (e.count) G.counts[e.count] = (G.counts[e.count] || 0) + 1;
    refreshHud();
  }

  // ---------- 打字机 ----------
  function typewrite(el, text, done) {
    clearInterval(G.typing);
    let i = 0;
    el.innerHTML = '<span class="caret">▌</span>';
    G.typing = setInterval(() => {
      i++;
      Audio8.tick();
      el.innerHTML = text.slice(0, i) + (i < text.length ? '<span class="caret">▌</span>' : '');
      if (i >= text.length) { clearInterval(G.typing); G.typing = null; done && done(); }
    }, 45);
  }
  function skipTyping(el, text) {
    clearInterval(G.typing); G.typing = null;
    el.textContent = text;
  }

  // ---------- 节点跳转 ----------
  function goto(id) {
    const node = G.story.nodes[id];
    if (!node) { console.warn('missing node:', id); return; }
    G.node = node;
    clearTimeout(G.hoverTimer);
    if (id !== 'walk_run' && id !== 'walk_door') { stopStamina(); G.staminaRun = null; }
    ART.draw(node.bg || 'black');
    FX.setScene(node.bg || 'black');
    Audio8.setAmbience(node.amb || node.bg || 'black');            // amb 可单独指定环境音（画面仍用 bg），如「上菜后餐馆配乐结束」
    if (node.announce) Audio8.announce(node.announce);            // 剧情报站点名
    if (node.sfx) Audio8.sfx(node.sfx);                           // 剧情专属音效（如掉链子）
    ov().innerHTML = '';
    ov().classList.remove('center');
    renderers[node.type](node);
  }

  // ---------- 各类型渲染 ----------
  const renderers = {
    title(node) {
      ov().classList.add('center');
      const t = document.createElement('div');
      t.className = 'big-title'; t.textContent = node.text;
      ov().appendChild(t);
      const sub = document.createElement('div');
      sub.className = 'big-sub'; sub.textContent = '点击开始';
      ov().appendChild(sub);
      ov().onclick = () => goto(node.next);
    },

    narrate(node) {
      const text = typeof node.text === 'function' ? node.text(G) : node.text;
      const d = document.createElement('div');
      d.className = 'panel'; d.id = 'dialog';
      ov().appendChild(d);
      const hint = document.createElement('div');
      hint.className = 'big-sub'; hint.textContent = '▼ 点击继续';
      hint.style.display = 'none';
      ov().appendChild(hint);
      typewrite(d, text, () => { hint.style.display = ''; });
      ov().onclick = () => {
        if (G.typing) { skipTyping($('dialog'), text); hint.style.display = ''; return; }
        Audio8.advance();
        applyEffects(node.effects);
        goto(node.next);
      };
    },

    choice(node) {
      ov().onclick = null;
      const p = document.createElement('div');
      p.className = 'panel'; p.id = 'prompt'; p.textContent = node.prompt;
      ov().appendChild(p);
      if (node.warn) {
        const w = document.createElement('div');
        w.id = 'warn'; w.textContent = node.warn;
        ov().appendChild(w);
      }
      const box = document.createElement('div');
      box.id = 'choices';
      if (node.options.length <= 1 || node.oneCol) box.classList.add('one-col');
      node.options.forEach(opt => {
        if (opt.need && !G.flags[opt.need]) return;
        const b = document.createElement('button');
        b.className = 'choice-btn' + (opt.cls ? ' ' + opt.cls : '');
        b.textContent = opt.label;
        b.onclick = ev => {
          ev.stopPropagation();
          clearTimeout(G.hoverTimer);
          Audio8.click();
          if (opt.sfx) Audio8.sfx(opt.sfx);                     // 选项专属音效（如推门）
          applyEffects(opt.effects);
          goto(opt.next);
        };
        box.appendChild(b);
      });
      ov().appendChild(box);
      // 悬停 N 秒不选 → 成就（视频原梗：犹豫不决）；配 hover.next 时超时还会自动替你选
      if (node.hover) {
        ov().onmouseover = ov().onmousemove = () => {};
        G.hoverTimer = setTimeout(() => {
          unlock(node.hover.achieve);
          if (node.hover.next) goto(node.hover.next);
        }, node.hover.ms);
      }
    },

    input(node) {
      ov().onclick = null;
      const p = document.createElement('div');
      p.className = 'panel'; p.textContent = node.prompt;
      ov().appendChild(p);
      const row = document.createElement('div');
      row.id = 'inputrow';
      const inp = document.createElement('input');
      inp.placeholder = node.placeholder || '';
      inp.maxLength = 12;
      const btn = document.createElement('button');
      btn.className = 'choice-btn'; btn.textContent = '确定';
      const ok = () => {
        const v = inp.value.trim();
        Audio8.click();
        G.input = v;
        if (node.capture) {                       // 只收集关键词，不改昵称
          goto(node.next);
          return;
        }
        if (node.routes) {                        // 评价环节：按关键词路由，不覆盖昵称
          const hit = node.routes.find(r => r.empty ? !v : r.has.some(k => v.includes(k))) || node.fallback;
          applyEffects(hit.effects);
          goto(hit.next);
          return;
        }
        G.name = v || node.default || '游客';
        refreshHud();
        goto(node.next);
      };
      btn.onclick = ok;
      inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
      row.append(inp, btn);
      ov().appendChild(row);
      inp.focus();
    },

    random(node) {                                // 隐形节点：随机跳转一个分支
      const b = node.branches[Math.floor(Math.random() * node.branches.length)];
      applyEffects(b.effects);
      goto(b.next);
    },

    route(node) {                                 // 隐形节点：按幸运值/成就/flag 条件路由
      const t = node.rules.find(r => r.when(G)) || node.fallback;
      applyEffects(t.effects);
      goto(t.next);
    },

    qte(node) {                                   // 贯口捧哏：限时连点，接上话头
      ov().classList.add('center');
      ov().onclick = null;
      const box = document.createElement('div');
      box.id = 'stamina-box';
      const p = document.createElement('div');
      p.className = 'panel'; p.textContent = node.prompt;
      box.appendChild(p);
      const row = document.createElement('div');
      row.className = 'bar-row';
      const l = document.createElement('span');
      l.className = 'bar-label'; l.textContent = '话头';
      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = 'bar-fill'; fill.style.background = '#ffd76a';
      track.appendChild(fill);
      row.append(l, track);
      box.appendChild(row);
      const btn = document.createElement('button');
      btn.className = 'choice-btn'; btn.textContent = '接！「好嘞！」';
      box.appendChild(btn);
      ov().appendChild(box);
      let prog = 0, done = false;
      const dur = node.ms || 5200, t0 = performance.now();
      const iv = setInterval(() => {
        if (done) return;
        if (performance.now() - t0 > dur) { done = true; clearInterval(iv); goto(node.fail); }
      }, 80);
      btn.onpointerdown = () => {                   // 触屏也要点一下就立刻响应（mousedown 在手机上慢半拍）
        if (done) return;
        Audio8.click();
        prog += node.step || 9;
        fill.style.width = Math.min(100, prog) + '%';
        if (prog >= 100) { done = true; clearInterval(iv); goto(node.win); }
      };
    },

    scratch(node) {                               // 刮刮乐：拖动刮开银色涂层，刮过半自动揭晓
      ov().classList.add('center');
      ov().onclick = null;
      const p = document.createElement('div');
      p.className = 'panel'; p.textContent = node.prompt;
      ov().appendChild(p);
      const box = document.createElement('div');
      box.id = 'scratchbox';
      const back = document.createElement('canvas');
      const front = document.createElement('canvas');
      back.width = front.width = 192; back.height = front.height = 120;
      box.append(back, front);
      ov().appendChild(box);
      const g = back.getContext('2d');
      g.fillStyle = '#8f1212'; g.fillRect(0, 0, 192, 120);
      g.fillStyle = '#ffd76a'; g.fillRect(4, 4, 184, 112);
      g.fillStyle = '#8f1212'; g.fillRect(8, 8, 176, 104);
      g.textAlign = 'center'; g.font = 'bold 15px monospace';
      g.fillStyle = '#ffd76a'; g.fillText('哏都刮刮乐', 96, 28);
      g.fillStyle = '#e8e2d0'; g.font = 'bold 17px monospace';
      g.fillText('恭喜您中奖啦！', 96, 62);
      g.font = '12px monospace'; g.fillStyle = '#c9a227';
      g.fillText('—— 奖品以幸运值为准 ——', 96, 84);
      const f = front.getContext('2d', { willReadFrequently: true });
      f.fillStyle = '#b8bcc2'; f.fillRect(14, 38, 164, 70);
      for (let i = 0; i < 900; i++) {
        f.fillStyle = i % 3 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)';
        f.fillRect(14 + Math.random() * 164 | 0, 38 + Math.random() * 70 | 0, 2, 2);
      }
      let down = false, done = false, n = 0;
      const pos = e => {
        const r = front.getBoundingClientRect();
        return [(e.clientX - r.left) / r.width * 192, (e.clientY - r.top) / r.height * 120];
      };
      const reveal = () => {
        if (done) return;
        done = true;
        front.remove();
        Audio8.fanfare();
        const hint = document.createElement('div');
        hint.className = 'big-sub'; hint.textContent = '▼ 点击继续';
        ov().appendChild(hint);
        ov().onclick = () => { Audio8.advance(); goto(node.next); };
      };
      const erase = e => {
        if (done) return;
        const [x, y] = pos(e);
        f.save(); f.globalCompositeOperation = 'destination-out'; f.fillStyle = '#000';
        f.beginPath(); f.arc(x, y, 12, 0, 7); f.fill(); f.restore();
        if (++n % 6) return;
        const d = f.getImageData(14, 38, 164, 70).data;
        let clear = 0;
        for (let i = 3; i < d.length; i += 16) if (!d[i]) clear++;
        if (clear / (164 * 70 / 4) > 0.5) reveal();
      };
      front.addEventListener('pointerdown', e => { down = true; erase(e); });
      front.addEventListener('pointermove', e => { if (down) erase(e); });
      window.addEventListener('pointerup', () => { down = false; });
      const skip = document.createElement('button');
      skip.className = 'choice-btn'; skip.textContent = '懒得刮，直接撕开';
      skip.onclick = reveal;
      ov().appendChild(skip);
    },

    stamina(node) {
      ov().classList.add('center');
      ov().onclick = null;
      const box = document.createElement('div');
      box.id = 'stamina-box';
      const p = document.createElement('div');
      p.className = 'panel'; p.textContent = node.prompt;
      box.appendChild(p);

      const hint = document.createElement('div');
      hint.className = 'bar-hint';
      hint.textContent = '过半触发随机事件；体力归零＝瘫倒；硬走到底……有隐藏成就！';
      box.appendChild(hint);

      const mkBar = (label, midGoal) => {
        const row = document.createElement('div');
        row.className = 'bar-row';
        const l = document.createElement('span');
        l.className = 'bar-label'; l.textContent = label;
        const track = document.createElement('div');
        track.className = 'bar-track';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        const goal = document.createElement('div');
        goal.className = 'bar-goal';
        track.append(fill, goal);
        if (midGoal) {
          const mid = document.createElement('div');
          mid.className = 'bar-goal mid';
          track.appendChild(mid);
        }
        row.append(l, track);
        box.appendChild(row);
        return { track, fill };
      };
      const stBar = mkBar('体力');
      stBar.fill.classList.add('stamina');
      const pgBar = mkBar('进度', true);
      pgBar.fill.classList.add('progress');

      const btn = document.createElement('button');
      btn.className = 'choice-btn'; btn.textContent = '迈腿！';
      btn.onpointerdown = () => { if (G.staminaRun) { Audio8.footstep(); G.staminaRun.prog += 3.5; G.staminaRun.st = Math.min(100, G.staminaRun.st + 5); paint(); } };
      box.appendChild(btn);
      ov().appendChild(box);

      if (!G.staminaRun) G.staminaRun = { st: 100, prog: 0, eventFired: false };
      const paint = () => {
        const r = G.staminaRun;
        stBar.fill.style.width = Math.max(0, r.st) + '%';
        stBar.track.classList.toggle('hurt', r.st < 30);
        pgBar.fill.style.width = Math.min(100, r.prog) + '%';
      };
      paint();
      const tick = () => {
        const r = G.staminaRun;
        if (!r) return;
        r.st -= 1.3; r.prog += 0.25;
        paint();
        if (!r.eventFired && node.event && r.prog >= node.event.at) {
          r.eventFired = true;
          stopStamina();
          goto(node.event.next);
        } else if (r.eventFired && node.arrive && r.prog >= node.arrive.at) {
          stopStamina();
          G.staminaRun = null;
          goto(node.arrive.next);
        } else if (r.st <= 0) {
          stopStamina();
          goto(node.fail);
        }
      };
      G.staminaRun.timer = setInterval(tick, 120);
    },

    summary(node) {
      ov().classList.add('center');
      ov().onclick = null;
      const s = document.createElement('div');
      s.className = 'panel'; s.id = 'summary';
      const achNames = G.achievements.map(id => G.story.achievements[id]);
      s.innerHTML = `
        <h2>${node.title}</h2>
        <div class="stat">${node.text}</div>
        <div class="stat">幸运值：<b>${G.luck}</b> ｜ 成就：<b>${G.achievements.length}</b>/${Object.keys(G.story.achievements).length}</div>
        <div class="ach-list">${achNames.length ? '已解锁：' + achNames.join('、') : '一个成就都没拿到，你也挺厉害。'}</div>`;
      ov().appendChild(s);
      const box = document.createElement('div');
      box.id = 'choices'; box.classList.add('one-col');
      node.options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'choice-btn ' + (opt.cls || '');
        b.textContent = opt.label;
        b.onclick = () => {
          if (opt.restart) { location.reload(); return; }
          applyEffects(opt.effects);
          goto(opt.next);
        };
        box.appendChild(b);
      });
      ov().appendChild(box);
    },
  };

  function stopStamina() {
    if (G.staminaRun && G.staminaRun.timer) clearInterval(G.staminaRun.timer);
  }

  function start(story) {
    G.story = story;
    Audio8.arm();
    goto(story.start);
    refreshHud();
  }

  return { start, G, goto };
})();
