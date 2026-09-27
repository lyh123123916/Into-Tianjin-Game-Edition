// 8-bit 芯片音效 + 程序化 BGM（WebAudio 合成，无外部文件）
const Audio8 = (() => {
  let ac = null, master = null, muted = false, bgmOn = false;
  let bgmTimer = null, step = 0;

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.55;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return true;
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ensure() || muted) return;
    const t = when || ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // ---------- 音效 ----------
  let lastTick = 0;
  function tick() {                     // 打字机逐字音
    const now = performance.now();
    if (now - lastTick < 55) return;
    lastTick = now;
    tone(mtof(83 + (Math.random() < 0.12 ? 12 : 0)), 0.025, 'square', 0.028);
  }
  function click() { tone(660, 0.07, 'square', 0.09, 0, 440); }
  function advance() { tone(520, 0.04, 'triangle', 0.05); }
  function luck(n) {
    if (!ensure() || muted) return;
    if (n > 0) [76, 81, 83, 88].forEach((m, i) => tone(mtof(m), 0.09, 'square', 0.06, ac.currentTime + i * 0.06));
    else [81, 76, 69].forEach((m, i) => tone(mtof(m), 0.1, 'sawtooth', 0.05, ac.currentTime + i * 0.08));
  }
  function fanfare() {                  // 成就号角
    if (!ensure()) return;
    const t = ac.currentTime;
    [[72, 0], [76, 0.09], [79, 0.18], [84, 0.27], [84, 0.45], [83, 0.57], [84, 0.69]]
      .forEach(([m, d]) => tone(mtof(m), d < 0.4 ? 0.1 : 0.22, 'square', 0.08, t + d));
    tone(mtof(48), 0.9, 'triangle', 0.06, t);
  }
  function coin() {
    if (!ensure() || muted) return;
    tone(988, 0.06, 'square', 0.08); tone(1319, 0.35, 'square', 0.08, ac.currentTime + 0.06);
  }

  // ---------- 场景声景：声音跟随画面，切场景即换声层 ----------
  let ambNodes = [], ambTimers = [], ambScene = null, ambGen = 0;

  function noiseBuffer(brown) {
    const n = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    const dl = d[n - 1] - d[0];                        // 抹平循环接缝：首尾值对齐，消除每 2 秒一次的"咚/咔"
    for (let i = 0; i < n; i++) d[i] -= dl * i / n;
    return buf;
  }
  function layerNoise({ brown = false, filter = ['lowpass', 300, 0.7], gain = 0.02, am = null }) {
    const src = ac.createBufferSource(); src.buffer = noiseBuffer(brown); src.loop = true;
    const f = ac.createBiquadFilter(); f.type = filter[0]; f.frequency.value = filter[1]; f.Q.value = filter[2] || 0.7;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, ac.currentTime);            // 渐入进场，避免开局撞噪音墙
    g.gain.linearRampToValueAtTime(gain, ac.currentTime + 1.4);
    src.connect(f); f.connect(g); g.connect(master); src.start();
    if (am) {
      const lfo = ac.createOscillator(); lfo.frequency.value = am.freq;
      const lg = ac.createGain(); lg.gain.value = am.depth;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      ambNodes.push(lfo);
    }
    ambNodes.push(src);
  }
  function layerOsc({ wave = 'sawtooth', freq = 70, vib = null, filter = ['lowpass', 200, 0.7], gain = 0.03 }) {
    const o = ac.createOscillator(); o.type = wave; o.frequency.value = freq;
    const f = ac.createBiquadFilter(); f.type = filter[0]; f.frequency.value = filter[1]; f.Q.value = filter[2] || 0.7;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, ac.currentTime);            // 渐入进场
    g.gain.linearRampToValueAtTime(gain, ac.currentTime + 1.4);
    o.connect(f); f.connect(g); g.connect(master); o.start();
    if (vib) {
      const lfo = ac.createOscillator(); lfo.frequency.value = vib.freq;
      const lg = ac.createGain(); lg.gain.value = vib.depth;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start();
      ambNodes.push(lfo);
    }
    ambNodes.push(o);
  }
  // 真实录音铺底：解码一次缓存后循环播放，切场景随 ambNodes 停；gen 防止解码回来场景已换
  const wavCache = {};
  function layerWav(url, gain, lpFreq) {
    const gen = ambGen;
    if (!wavCache[url]) {
      wavCache[url] = fetch(url).then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).catch(() => null);
    }
    wavCache[url].then(buf => {
      if (!buf || gen !== ambGen || !ensure()) return;
      const s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.6);
      if (lpFreq) {
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lpFreq;
        s.connect(f); f.connect(g);
      } else {
        s.connect(g);
      }
      g.connect(master); s.start();
      ambNodes.push(s);
    });
  }
  // 一次性真实录音音效（如上菜镗）：解码缓存，之后每次秒放；不挂 ambNodes，切场景不打断
  // sceneBound=true 时长音效（如中奖曲）挂进 ambNodes，换场景即掐断，不拖进下一幕
  function hitWav(url, vol, sceneBound) {
    if (!ensure()) return;
    if (!wavCache[url]) {
      wavCache[url] = fetch(url).then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).catch(() => null);
    }
    wavCache[url].then(buf => {
      if (!buf || !ensure()) return;
      const s = ac.createBufferSource(); s.buffer = buf;
      const g = ac.createGain(); g.gain.value = vol;
      s.connect(g); g.connect(master); s.start();
      if (sceneBound) ambNodes.push(s);
    });
  }
  function burst(freq, dur, vol, type = 'bandpass', when) {
    const t0 = when || ac.currentTime;
    const n = Math.floor(ac.sampleRate * dur);
    const b = ac.createBuffer(1, n, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ac.createBufferSource(); s.buffer = b;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  function every(fn, min, max, first) {
    const go = () => { if (ambScene === null) return; fn(); ambTimers.push(setTimeout(go, min + Math.random() * (max - min))); };
    ambTimers.push(setTimeout(go, (first === undefined ? min + Math.random() * (max - min) : first)));
  }

  // 剧情报站：叮咚＋系统中文语音，无中文语音的设备自动只剩叮咚
  if (window.speechSynthesis) speechSynthesis.getVoices();                          // Chrome 需先摸一次才触发 voiceschanged 加载语音表
  function announce(name) {
    if (!ensure()) return;
    doorChime();
    const synth = window.speechSynthesis;
    if (!synth || muted) return;
    const zh = synth.getVoices().find(v => /^(zh|cmn)/i.test(v.lang));
    if (!zh) return;
    ambTimers.push(setTimeout(() => {
      if (muted) return;
      const u = new SpeechSynthesisUtterance(name + '到了。');
      u.voice = zh; u.lang = zh.lang; u.volume = 0.5; u.rate = 0.9;
      synth.speak(u);
    }, 700));
  }
  const doorChime  = () => { tone(988, 0.18, 'sine', 0.018); tone(740, 0.3, 'sine', 0.018, ac.currentTime + 0.2); }; // 地铁到站提示音
  const blinker    = () => tone(1250, 0.02, 'square', 0.008);                        // 转向灯哒哒
  const hornHonk   = () => { tone(420, 0.28, 'square', 0.012); tone(520, 0.28, 'square', 0.01); }; // 远处按喇叭
  function carWhoosh() {                                                             // 真实掠车：5 秒「嗡————刷————」由远及近再远去
    const t = ac.currentTime, dur = 5, peak = t + dur * 0.55;
    const pan = ac.createStereoPanner();
    const dir = Math.random() < 0.5 ? 1 : -1;
    pan.pan.setValueAtTime(-0.85 * dir, t);
    pan.pan.linearRampToValueAtTime(0.85 * dir, t + dur);
    pan.connect(master);
    const env = (g, v) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, peak);        // 靠近时渐强
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur); // 远去时慢慢收
    };
    const src = ac.createBufferSource(); src.buffer = noiseBuffer(false); src.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.6;
    f.frequency.setValueAtTime(220, t);
    f.frequency.linearRampToValueAtTime(850, peak);          // 擦身瞬间最亮
    f.frequency.exponentialRampToValueAtTime(130, t + dur);  // 多普勒：远去闷下去
    const g = ac.createGain(); env(g, 0.04);
    src.connect(f); f.connect(g); g.connect(pan);
    const sub = ac.createBufferSource(); sub.buffer = noiseBuffer(true); sub.loop = true;
    const sf = ac.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 130;
    const sg = ac.createGain(); env(sg, 0.05);               // 车身低频的「嗡」垫底
    sub.connect(sf); sf.connect(sg); sg.connect(pan);
    src.start(t); src.stop(t + dur + 0.05);
    sub.start(t); sub.stop(t + dur + 0.05);
  }
  function roadThump() {                                          // 轮胎压过路面接缝/井盖的「咚噔」：短促低频＋车架轻微一响
    const t = ac.currentTime;
    tone(70, 0.12, 'sine', 0.04, t, 42);                          // 低频闷弹
    burst(900, 0.04, 0.012, 'bandpass', t + 0.015);               // 车架跟着「噔」一下
  }
  function chainDrop() {                                          // 掉链子：金属链节散着磕车架/地面，两三下轻响
    const t = ac.currentTime;
    for (let i = 0; i < 3; i++) {
      const dt = t + i * (0.07 + Math.random() * 0.05);
      burst(2200 + Math.random() * 900, 0.03, 0.02, 'bandpass', dt);
      tone(300 + Math.random() * 80, 0.06, 'triangle', 0.012, dt);
    }
  }
  const SFX = { chain: chainDrop };
  function doorPush() {                                         // 推门：合页 stick-slip「嘎吱」起步＋门板晃定闷「咚」＋木纹摩擦
    const t = ac.currentTime;
    for (let i = 0; i < 5; i++) {                               // 嘎吱：一串音高爬升的锯齿短音，模拟干涩合页一顿一顿
      const dt = t + 0.05 + i * 0.085;
      tone(205 + i * 36 + Math.random() * 12, 0.09, 'sawtooth', 0.011, dt, 215 + i * 36);
    }
    burst(750, 0.05, 0.018, 'bandpass', t + 0.06);              // 手掌碰门板的一拍
    tone(85, 0.28, 'sine', 0.055, t + 0.55, 52);                // 门板回弹「咚」
    burst(420, 0.09, 0.014, 'lowpass', t + 0.57);               // 木质闷响的毛边
  }
  SFX.pushdoor = doorPush;
  SFX.serve = () => hitWav('assets/sfx_serve.mp3', 1.0);        // 上菜：真实录音（用户提供，0.6 秒一记）
  SFX.bikebell = () => hitWav('assets/sfx_bikebell.mp3', 0.9);  // 自行车铃：真实录音（用户提供，2.6 秒带余音）
  SFX.win = () => hitWav('assets/sfx_win.mp3', 0.85, true);     // 中奖庆祝曲：真实录音（用户提供，8.8 秒），进茶馆换景即掐断
  SFX.guazi = () => hitWav('assets/sfx_guazi.mp3', 1.0);        // 嗑瓜子：真实录音截取 5.4 秒三声「啪」（用户提供，点「嗑瓜子」时响）
  const gavelKnock = () => { tone(320, 0.1, 'square', 0.028); tone(190, 0.22, 'sine', 0.02, ac.currentTime + 0.03); }; // 惊堂木
  function applause() {                                                              // 稀稀拉拉鼓掌
    for (let i = 0; i < 14; i++) setTimeout(() => burst(1600 + Math.random() * 1400, 0.03, 0.018), i * 45 + Math.random() * 30);
  }

  const SCENES = {
    black:  { layers() {}, events() {} },                                             // 黑屏＝安静
    subway: { layers() {
        layerNoise({ brown: true, filter: ['lowpass', 190, 0.8], gain: 0.055, am: { freq: 0.13, depth: 0.02 } });   // 车厢轰鸣主体
        layerOsc({ freq: 46, filter: ['lowpass', 110, 0.9], gain: 0.03, vib: { freq: 0.21, depth: 2.5 } });         // 次低频隆隆
      }, events() {} },
    taxi:   { layers() {
        layerOsc({ freq: 75, vib: { freq: 7, depth: 2.5 }, filter: ['lowpass', 220, 0.9], gain: 0.04 });  // 发动机
        layerNoise({ filter: ['highpass', 900, 0.5], gain: 0.005 });                                      // 胎噪
      }, events() { every(carWhoosh, 7000, 15000); every(blinker, 900, 1100); every(hornHonk, 18000, 35000); } },
    street: { layers() {                                                            // 步行/街道：真实街道录音循环（用户提供，84 秒，已剪头尾淡变；录音自带过车声，合成掠过撤下）
        layerWav('assets/amb_street.mp3', 0.32);
      }, events() {} },
    door:   { layers() {                                          // 饭馆门口：真实厨房录音循环（用户提供，53 秒），低通＋低增益模拟隔着手帘听炒菜
        layerWav('assets/amb_door.mp3', 0.30, 3800);
      }, events() {} },
    shop:   { layers() {                                          // 堂内：真实餐馆环境录音循环（用户提供，已剪掉开头2秒淡入，193秒）
        layerWav('assets/amb_shop.mp3', 0.45);
      }, events() {} },
    bike:   { layers() {
        layerNoise({ brown: true, filter: ['lowpass', 260, 0.7], gain: 0.02 });                       // 轮胎压柏油路的低隆（不用高频沙沙层）
      }, events() { every(roadThump, 3000, 7000); every(hornHonk, 25000, 45000); } },   // 车铃换成真实录音，进场景响一次（SFX.bikebell）
    teahouse: { layers() {                                                    // 嗡声噪层被否「是噪音」，堂音清空
      }, events() { every(gavelKnock, 12000, 22000); every(applause, 20000, 40000); } },
  };
  // 饭馆包间/菜品特写/结账柜台共用堂内热闹声；门口 door 保持安静；结局场景各归其位
  SCENES.counter = SCENES.black;   // 结账柜台（第三章）餐馆配乐已在上菜结束，此处静音，待用户补新配乐
  ['d_tofu', 'd_eggplant', 'd_mianjin', 'd_fish', 'd_combo', 'd_baozi'].forEach(k => { SCENES[k] = SCENES.black; });   // 菜品特写：餐馆环境音停，只留真实上菜音效
  // E3 结局「留在天津」：散场后的安静夜晚，不再响茶馆的惊堂木/鼓掌，切黑屏同款静默
  SCENES.waitang = SCENES.black;
  SCENES.haihe = { layers() {                                                 // 河边：水声类棕噪反而贴切
      layerNoise({ brown: true, filter: ['lowpass', 300, 0.7], gain: 0.022 });
      layerNoise({ filter: ['bandpass', 650, 0.6], gain: 0.008, am: { freq: 0.07, depth: 0.006 } });
    }, events() { every(carWhoosh, 12000, 22000); } };
  // 高铁站：候车大厅 own 声音＝空旷低鸣＋远处街道垫底＋每 18~30 秒一记发车叮咚（不再复用街道环境音）
  SCENES.station = { layers() {
        layerNoise({ brown: true, filter: ['lowpass', 240, 0.8], gain: 0.03 });   // 大空间混响的低频嗡嗡
        layerWav('assets/amb_street.mp3', 0.12, 1200);                            // 远处车流，低通压成「隔着大厅玻璃」
      }, events() { every(doorChime, 18000, 30000, 6000); } };

  function stopAmb() {
    ambGen++;
    ambTimers.forEach(clearTimeout); ambTimers = [];
    ambNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    ambNodes = [];
    if (window.speechSynthesis) speechSynthesis.cancel();       // 语音报站不走 WebAudio，切场景需单独掐断
  }
  function setAmbience(name) {
    const key = SCENES[name] ? name : 'black';
    if (ambScene === key) return;
    stopAmb();
    ambScene = key;
    if (!ensure()) return;                       // 未解锁音频时只记场景，首次手势后由 arm 重建
    SCENES[key].layers();
    SCENES[key].events();
  }
  function rebuildAmbience() {
    if (ambScene) { const s = ambScene; ambScene = null; setAmbience(s); }
  }
  let footL = false;
  function footstep() {                                                        // 脚步：鞋底擦地"嚓"＋落地闷"咚"，左右脚交替音高微差
    footL = !footL;
    const p = footL ? 1 : 1.15;
    burst(1500 * p * (0.9 + Math.random() * 0.2), 0.045, 0.02, 'bandpass');
    setTimeout(() => burst(140 * p * (0.9 + Math.random() * 0.2), 0.06, 0.045, 'lowpass'), 25);
  }
  function setMuted(v) {
    muted = v;
    if (master) master.gain.value = v ? 0 : 0.55;
    if (v && window.speechSynthesis) speechSynthesis.cancel();  // 静音也要掐断正在念的报站
  }
  function toggleMute() { setMuted(!muted); return muted; }

  // 首次交互解锁音频（浏览器自动播放策略）
  function arm() {
    const go = () => { ensure(); rebuildAmbience(); document.removeEventListener('pointerdown', go); document.removeEventListener('keydown', go); };
    document.addEventListener('pointerdown', go);
    document.addEventListener('keydown', go);
  }

  return { tick, click, advance, luck, fanfare, coin, footstep, announce, setAmbience, toggleMute, arm, ensure, isMuted: () => muted,
    sfx: name => { const f = SFX[name]; if (f && ensure() && !muted) f(); } };
})();
