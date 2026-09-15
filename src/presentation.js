const slides = [...document.querySelectorAll('.slide')];
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  if (event.target.closest('button, input, select, textarea, [contenteditable]')) return;
  const nearest = slides.reduce((best, slide, index) => Math.abs(slide.getBoundingClientRect().top - 70) < best.distance ? { index, distance: Math.abs(slide.getBoundingClientRect().top - 70) } : best, { index: 0, distance: Infinity }).index;
  const index = Math.max(0, Math.min(slides.length - 1, nearest + (event.key === 'ArrowRight' ? 1 : -1)));
  event.preventDefault();
  location.hash = slides[index].id;
});
