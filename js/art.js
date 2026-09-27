// 像素场景：192x144 低分辨率绘制，CSS 放大 + pixelated
const ART = (() => {
  const W = 192, H = 144;
  let ctx;

  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const dots = (x, y, w, h, c, n, seed) => {
    let s = seed || 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    ctx.fillStyle = c;
    for (let i = 0; i < n; i++)
      ctx.fillRect(x + Math.floor(rnd() * w), y + Math.floor(rnd() * h), 1, 1);
  };
  // 春联上的"字"：黄色短横纹
  const coupletText = (x, y, h) => { for (let i = y + 3; i < y + h - 3; i += 5) R(x + 2, i, 4, 2, '#ffd76a'); };

  const scenes = {
    black() { R(0, 0, W, H, '#000'); },

    subway() {
      R(0, 0, W, H, '#1b1e2b');                       // 车厢底色
      R(0, 0, W, 14, '#2a2f45');                      // 顶棚
      R(0, 128, W, 16, '#232838');                    // 地板
      for (let wx = 8; wx < W; wx += 60) {            // 三扇窗：夜城灯火
        R(wx, 22, 48, 34, '#0d1117');
        R(wx, 22, 48, 34, 'rgba(0,0,0,0)');
        ctx.strokeStyle = '#39415e'; ctx.strokeRect(wx + 0.5, 22.5, 47, 33);
        dots(wx + 2, 38, 44, 16, '#ffd76a', 26, wx);
        dots(wx + 2, 38, 44, 16, '#7fd4ff', 8, wx + 3);
        R(wx + 2, 30, 44, 3, '#182029');              // 远处楼影
        dots(wx + 2, 24, 44, 6, '#334', 6, wx + 9);
      }
      for (let px = 30; px < W; px += 60) R(px, 14, 3, 60, '#8a93a6');  // 立杆
      R(0, 14, W, 3, '#8a93a6');                                        // 横杆
      R(0, 78, W, 22, '#3a4157');                                       // 座椅靠背
      R(0, 100, W, 8, '#333a4e');
      // 天津大爷（右侧）：鸭舌帽 + 灰夹克
      R(128, 66, 14, 10, '#d9b38c');      // 头
      R(126, 62, 18, 5, '#3a3f4a');       // 帽
      R(124, 66, 4, 2, '#3a3f4a');        // 帽檐
      R(126, 76, 18, 26, '#4a5568');      // 身体
      R(126, 102, 7, 24, '#2d3340');      // 腿
      R(137, 102, 7, 24, '#2d3340');
      R(121, 80, 5, 14, '#4a5568');       // 挥动的手
      R(118, 76, 5, 5, '#d9b38c');
      // "话匣子"气泡点
      dots(108, 52, 16, 8, '#cfd6e6', 10, 42);
    },

    taxi() {
      // 后座视角：前挡风 + 黄色内饰
      R(0, 0, W, H, '#8a6d1a');
      R(14, 10, 164, 74, '#101418');                 // 挡风玻璃夜景
      R(14, 62, 164, 22, '#1c2126');                 // 远处路面
      for (let i = 0; i < 5; i++) R(80 + i * 0, 0, 0, 0, '#000');
      for (let d = 0; d < 4; d++) R(90, 66 + d * 5, 12 - d * 2, 2, '#ffd76a'); // 中线（透视）
      dots(16, 14, 160, 30, '#ffd76a', 30, 5);       // 城市灯火
      dots(16, 14, 160, 30, '#ff6a6a', 10, 11);
      R(14, 10, 164, 74, 'rgba(0,0,0,0)');
      ctx.strokeStyle = '#5a4708';
      R(0, 84, W, 12, '#c9a227');                    // 仪表台
      R(0, 96, W, 48, '#a98418');                    // 下半内饰
      R(118, 86, 30, 18, '#16181c');                 // 计价器
      R(121, 89, 24, 5, '#0f2f16');
      R(122, 90, 3, 3, '#58d68d'); R(127, 90, 3, 3, '#58d68d'); R(132, 90, 3, 3, '#58d68d'); // 数字
      R(121, 97, 24, 4, '#3a3f4a');
      // 司机剪影（左前）
      R(30, 40, 22, 18, '#22262e');
      R(34, 30, 14, 12, '#2b2f38');
      R(33, 26, 16, 5, '#111');
      // 方向盘
      ctx.strokeStyle = '#22262e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(41, 62, 9, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
      // 后视镜
      R(86, 12, 20, 7, '#22262e');
    },

    street() {
      R(0, 0, W, H, '#9fc3e8');                      // 天
      dots(0, 0, W, 40, '#fff', 24, 3);              // 云
      // 楼群
      const b = [[0, 40, 30, '#7c8899'], [26, 28, 26, '#66707f'], [50, 46, 34, '#8a97a8'],
                 [82, 32, 28, '#707c8c'], [108, 44, 30, '#7c8899'], [136, 30, 26, '#66707f'], [160, 42, 32, '#8a97a8']];
      b.forEach(([x, y, w, c], i) => {
        R(x, y, w, 96 - y, c);
        dots(x + 3, y + 4, w - 6, 96 - y - 8, '#ffd76a', 10, i * 13 + 1); // 窗户灯
      });
      R(0, 96, W, 14, '#b8bcc2');                    // 人行道
      R(0, 110, W, 34, '#5a5e66');                   // 马路
      for (let i = 4; i < W; i += 28) R(i, 125, 16, 3, '#e8e8e8');
      // 远处红色餐馆门
      R(150, 78, 14, 18, '#8f1212'); R(153, 81, 8, 12, '#c94f4f');
      // 行人小人
      R(40, 84, 6, 12, '#333'); R(41, 80, 4, 4, '#d9b38c');
      R(70, 84, 6, 12, '#444'); R(71, 80, 4, 4, '#d9b38c');
    },

    door() {
      // 视频同款：石墙 + 木门 + 红春联 + 福字
      R(0, 0, W, H, '#cfc9bd');
      for (let y = 0; y < H; y += 12)
        for (let x = (y / 12) % 2 ? 0 : -16; x < W; x += 32)
          ctx.strokeStyle = '#b3ada1', ctx.strokeRect(x + 0.5, y + 0.5, 32, 12);
      R(46, 14, 100, 130, '#5a4708');                // 门框
      R(50, 18, 92, 126, '#6b3f21');                 // 木门
      R(95, 18, 2, 126, '#3e2412');                  // 中缝
      // 玻璃窗 + 红色窗花
      R(58, 26, 30, 44, '#e8e2d0'); R(104, 26, 30, 44, '#e8e2d0');
      dots(60, 28, 26, 40, '#c0392b', 34, 21); dots(106, 28, 26, 40, '#c0392b', 34, 22);
      // 门闩
      R(88, 84, 16, 3, '#2b2b2b');
      // 福字斗方
      R(62, 100, 20, 20, '#c0392b'); R(110, 100, 20, 20, '#c0392b');
      dots(66, 104, 12, 12, '#ffd76a', 16, 31); dots(114, 104, 12, 12, '#ffd76a', 16, 32);
      // 春联
      R(28, 20, 9, 108, '#c0392b'); coupletText(28, 20, 108);
      R(155, 20, 9, 108, '#c0392b'); coupletText(155, 20, 108);
      R(50, 6, 92, 10, '#c0392b');                   // 横批
      for (let i = 0; i < 4; i++) R(62 + i * 20, 9, 8, 4, '#ffd76a');
      // 台阶
      R(40, 138, 112, 6, '#a8a294');
    },

    bike() {
      R(0, 0, W, 90, '#9fc3e8');
      dots(0, 6, W, 26, '#fff', 20, 9);
      R(0, 90, W, 54, '#8d939c');                    // 停车区
      R(0, 130, W, 14, '#5a5e66');
      // 三辆蓝白共享单车
      const bike = (x, broken) => {
        ctx.strokeStyle = '#1f618d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, 116, 9, 0, 7); ctx.arc(x + 26, 116, 9, 0, 7); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, 116); ctx.lineTo(x + 10, 98); ctx.lineTo(x + 26, 116);
        ctx.moveTo(x + 10, 98); ctx.lineTo(x + 20, 98); ctx.lineTo(x + 26, 116);
        ctx.stroke();
        R(x + 16, 92, 3, 8, '#1f618d'); R(x + 12, 90, 12, 3, '#e74c3c'); // 车座/把
        ctx.lineWidth = 1;
        if (broken) {                                 // 掉链子：链条垂地
          ctx.strokeStyle = '#222';
          ctx.beginPath(); ctx.moveTo(x + 8, 118); ctx.lineTo(x + 14, 128); ctx.lineTo(x + 20, 118); ctx.stroke();
          R(x + 12, 128, 6, 2, '#222');
        }
      };
      bike(20, false); bike(70, true); bike(120, false);
      R(160, 30, 26, 60, '#7c8899');                 // 远处楼
      // 餐馆红门一角
      R(172, 60, 12, 30, '#8f1212'); R(175, 64, 6, 22, '#c94f4f');
    },
  };

  // ---- 高清像素场景图优先，程序化色块兜底 ----
  const IMG_NAMES = ['subway', 'taxi', 'street', 'door', 'bike',
                     'shop', 'd_tofu', 'd_eggplant', 'd_mianjin', 'd_fish', 'd_combo', 'd_baozi',
                     'counter', 'teahouse', 'haihe', 'station', 'waitang'];
  const IMG = {};
  IMG_NAMES.forEach(n => {
    const im = new Image();
    im.src = 'assets/bg/' + n + '.png';
    im.onload = () => { IMG[n] = im; if (current === n) draw(n); };
    im.onerror = () => {};
  });
  // 宽景全景图机制保留但停用：应用户要求全场景回到静态底图
  const IMGW = {};

  // ---- 多帧关键帧循环（观感不佳已停用，机制保留）----
  const SEQ_FILES = {};
  const SEQ_IMG = {};
  Object.values(SEQ_FILES).flat().forEach(n => {
    const im = new Image();
    im.src = 'assets/bg/' + n + '.png';
    im.onload = () => { SEQ_IMG[n] = im; };
  });
  let seqTimer = null;
  function stopSeq() { if (seqTimer) { clearInterval(seqTimer); seqTimer = null; } }
  function startSeq(name) {
    const frames = SEQ_FILES[name];
    let i = 0;
    const imgEl = document.getElementById('bg');
    seqTimer = setInterval(() => {
      if (document.hidden) return;                       // 后台页不烧帧
      i = (i + 1) % frames.length;
      const im = SEQ_IMG[frames[i]];
      if (!im || !im.complete) return;
      imgEl.classList.remove('show');                    // 淡出→换帧→淡入
      setTimeout(() => {
        if (!seqTimer) return;
        imgEl.src = im.src;
        imgEl.classList.add('show');
      }, 380);
    }, 3200);
  }

  let current = 'black';

  function draw(name) {
    current = name;
    stopSeq();
    const imgEl = document.getElementById('bg');
    const img = IMGW[name] || IMG[name];
    if (img) {
      if (!ctx) ctx = document.getElementById('scene').getContext('2d');
      imgEl.src = img.src;
      imgEl.classList.toggle('wide', !!IMGW[name]);
      imgEl.classList.add('show');
      if (SEQ_FILES[name]) startSeq(name);
      return;
    }
    imgEl.classList.remove('show', 'wide');
    if (!ctx) ctx = document.getElementById('scene').getContext('2d');
    (scenes[name] || scenes.black)();
  }

  return { draw };
})();
