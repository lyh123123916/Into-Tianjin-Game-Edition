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
  // 之后横屏切回时自动移除 force-portrait，再竖屏时自动加回
  window.matchMedia('(orientation: portrait)').addEventListener('change', e => {
    document.body.classList.toggle('force-portrait', e.matches);
  });
};

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'm' && document.activeElement.tagName !== 'INPUT') toggleMute();
});
