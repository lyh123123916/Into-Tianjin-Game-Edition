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

// 竖屏触屏自动启用竖屏布局；横屏切回时恢复横版比例
const isTouchCoarse = window.matchMedia('(pointer: coarse)').matches;
if (isTouchCoarse) {
  const applyPortrait = () => {
    document.body.classList.toggle('force-portrait', window.matchMedia('(orientation: portrait)').matches);
  };
  applyPortrait();
  window.matchMedia('(orientation: portrait)').addEventListener('change', applyPortrait);
}

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'm' && document.activeElement.tagName !== 'INPUT') toggleMute();
});
