// 章节合并：新章追加 CHAPTERn 并在此拼进总剧本
const STORY = {
  start: CHAPTER1.start,
  achievements: { ...CHAPTER1.achievements, ...CHAPTER2.achievements, ...CHAPTER3.achievements },
  nodes: { ...CHAPTER1.nodes, ...CHAPTER2.nodes, ...CHAPTER3.nodes },
};
Engine.start(STORY);

const muteBtn = document.getElementById('mute-btn');
const toggleMute = () => {
  const m = Audio8.toggleMute();
  muteBtn.classList.toggle('muted', m);
};
muteBtn.onclick = e => { e.stopPropagation(); toggleMute(); };

// 「坚持竖屏玩」按钮：用户主动选择后才启用竖屏布局 + 自动跟随横竖屏切换
document.getElementById('rt-skip').onclick = () => {
  document.body.classList.add('force-portrait');
};

// 横竖屏检测：用 resize + 宽高比判断（兼容微信/X5 等不触发 orientation 事件的 WebView）
const rotateTip = document.getElementById('rotate-tip');
let userChosePortrait = false;

const updateLayout = () => {
  const isPortrait = window.innerHeight > window.innerWidth;

  // 遮罩层：竖屏且用户没选过「坚持竖屏玩」时显示
  if (isPortrait && !userChosePortrait) {
    rotateTip.style.display = 'flex';
  } else {
    rotateTip.style.display = 'none';
  }

  // 竖屏布局：仅在用户主动选择后 + 当前是竖屏时启用
  if (userChosePortrait && isPortrait) {
    document.body.classList.add('force-portrait');
  } else {
    document.body.classList.remove('force-portrait');
  }
};

document.getElementById('rt-skip').onclick = () => {
  userChosePortrait = true;
  updateLayout();
};

updateLayout();
window.addEventListener('resize', updateLayout);
// 部分设备旋转时不触发 resize，补一个 orientationchange 兜底
window.addEventListener('orientationchange', () => setTimeout(updateLayout, 100));

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'm' && document.activeElement.tagName !== 'INPUT') toggleMute();
});
