const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const motionToggle = document.getElementById('motion-toggle');
const hero = document.querySelector('.hero');
const heroBackground = document.querySelector('.hero-bg');
const readingProgress = document.getElementById('reading-progress');
document.querySelectorAll('.partnership-card, .revenue-grid article, .distribution-rule, .self-investment-rule, .incentive-data, .agreement-list article, .contact-card').forEach(card => card.classList.add('tilt-card', 'motion-surface'));
const tiltCards = [...document.querySelectorAll('.tilt-card')];
const motionControls = [...document.querySelectorAll('button, a[href]:not(.brand):not(.skip)')];
motionControls.forEach(control => control.classList.add('motion-control'));
document.querySelectorAll('h2, h3, .hero-description, .section-aside, .principles-title, .card-kicker, .revenue-label, .revenue-caption, .agreement-description, .incentive-intro > p, .rule-lead, .rule-note, .contact-label, .contact-section > div:first-child > p, .investment-heading > p, .managed-value').forEach(element => element.classList.add('motion-copy'));
const pressTimers = new Map();
let motionEnabled = !reducedMotion.matches;
let panelAnimations = [];
let scrollFrame;
let reelController;
let heroVisible = !hero;

function resetTilt(card) {
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
  card.style.setProperty('--mx', '50%');
  card.style.setProperty('--my', '50%');
}
function clearPress(control) {
  clearTimeout(pressTimers.get(control));
  pressTimers.delete(control);
  control.classList.remove('is-pressed');
}
function resetControl(control) {
  clearPress(control);
  resetTilt(control);
  control.querySelectorAll('.button-ripple').forEach(element => element.remove());
}
function pressControl(control) {
  clearPress(control);
  control.classList.add('is-pressed');
  pressTimers.set(control, setTimeout(() => clearPress(control), 220));
}
function updateScroll() {
  scrollFrame = null;
  const distance = root.scrollHeight - root.clientHeight;
  if (readingProgress) readingProgress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
  heroBackground?.style.setProperty('--hero-shift', `${motionEnabled ? Math.min(scrollY * 0.15, 100) : 0}px`);
}
function requestScrollUpdate() {
  if (!document.hidden && scrollFrame == null) scrollFrame = requestAnimationFrame(updateScroll);
}
function setMotion(enabled) {
  motionEnabled = enabled;
  root.dataset.motion = enabled ? 'on' : 'off';
  motionToggle?.setAttribute('aria-pressed', String(enabled));
  motionToggle?.setAttribute('aria-label', enabled ? '关闭动效' : '开启动效');
  const label = motionToggle?.querySelector('[data-motion-label]');
  if (label) label.textContent = enabled ? '开' : '关';
  if (!enabled) {
    panelAnimations.forEach(animation => animation.cancel());
    panelAnimations = [];
    tiltCards.forEach(resetTilt);
    motionControls.forEach(resetControl);
    document.querySelectorAll('.will-reveal, main > section').forEach(element => element.classList.add('in-view'));
    revealObserver.disconnect();
    document.querySelectorAll('.button-ripple').forEach(element => element.remove());
  }
  updateScroll();
  reelController?.sync();
}
motionToggle?.addEventListener('click', () => setMotion(!motionEnabled));
reducedMotion.addEventListener('change', event => setMotion(!event.matches));
window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate);
window.addEventListener('load', requestScrollUpdate);
document.addEventListener('visibilitychange', () => {
  root.classList.toggle('is-hidden', document.hidden);
  if (document.hidden) {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
    tiltCards.forEach(resetTilt);
    motionControls.forEach(resetControl);
  } else requestScrollUpdate();
  reelController?.sync();
});
window.addEventListener('blur', () => {
  tiltCards.forEach(resetTilt);
  motionControls.forEach(resetControl);
});

['.partnership-grid', '.revenue-grid', '.distribution-rules', '.agreement-list', '.contact-section'].forEach(selector => {
  const group = document.querySelector(selector);
  if (!group) return;
  group.removeAttribute('data-reveal');
  [...group.children].forEach((element, index) => {
    element.setAttribute('data-reveal', '');
    element.style.setProperty('--reveal-delay', `${Math.min(index * 100, 240)}ms`);
  });
});
document.querySelectorAll('.section-heading').forEach(heading => {
  heading.removeAttribute('data-reveal');
  [...heading.children].forEach((element, index) => {
    element.setAttribute('data-reveal', '');
    element.style.setProperty('--reveal-delay', `${Math.min(index * 100, 240)}ms`);
  });
});
const agreementLayout = document.querySelector('.agreement-layout');
agreementLayout?.removeAttribute('data-reveal');
agreementLayout?.firstElementChild?.setAttribute('data-reveal', '');
document.querySelectorAll('.incentive-tabs, .principles, .site-footer').forEach(element => element.setAttribute('data-reveal', ''));
document.querySelectorAll('.incentive-panel:not([hidden]) > .incentive-intro, .incentive-panel:not([hidden]) > .incentive-data').forEach((element, index) => {
  element.setAttribute('data-reveal', '');
  element.style.setProperty('--reveal-delay', `${index * 100}ms`);
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in-view');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.08 });
document.querySelectorAll('[data-reveal]').forEach(element => {
  element.classList.add('will-reveal');
  if (!motionEnabled) element.classList.add('in-view');
  else revealObserver.observe(element);
});
document.querySelectorAll('main > section').forEach(section => {
  if (!motionEnabled) section.classList.add('in-view');
  else revealObserver.observe(section);
});
if (hero) new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  hero.classList.toggle('is-outside', !entry.isIntersecting);
  reelController?.sync();
}).observe(hero);

const posterReel = document.querySelector('.poster-reel');
if (posterReel) {
  const toggle = document.getElementById('reel-toggle');
  const columns = [...posterReel.querySelectorAll('.reel-column')].map(column => ({
    track: column.querySelector('.reel-track'),
    set: column.querySelector('.reel-set'),
    direction: Number(column.dataset.direction) || 1,
    speed: Number(column.dataset.speed) || 1,
    offset: Number(column.dataset.offset) || 0,
    height: 0
  }));
  let phase = 0;
  let autoRequested = toggle?.getAttribute('aria-pressed') !== 'false';
  let frameId = null;
  let lastTime = null;
  let pointer = null;

  function isRunning() {
    return autoRequested && motionEnabled && !document.hidden && heroVisible &&
      !pointer?.dragging && columns.some(column => column.height > 0);
  }
  function renderReel() {
    columns.forEach(column => {
      if (!column.height) return;
      const position = column.offset * column.height + phase * column.direction * column.speed;
      const wrapped = ((position % column.height) + column.height) % column.height;
      column.track.style.transform = `translate3d(0, ${-wrapped}px, 0)`;
    });
  }
  function updateToggle() {
    if (!toggle) return;
    const playing = isRunning();
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', !motionEnabled ? '动效已关闭，自动巡映暂停' : autoRequested ? '暂停自动巡映' : '继续自动巡映');
    toggle.disabled = !motionEnabled;
    toggle.classList.toggle('is-paused', !playing);
    const label = toggle.querySelector('[data-reel-label]');
    if (label) label.textContent = playing ? '自动巡映' : '暂停巡映';
  }
  function tick(time) {
    frameId = null;
    if (!isRunning()) {
      lastTime = null;
      updateToggle();
      return;
    }
    if (lastTime !== null) phase += Math.min((time - lastTime) / 1000, 0.05) * 22;
    lastTime = time;
    renderReel();
    frameId = requestAnimationFrame(tick);
  }
  function sync() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastTime = null;
    updateToggle();
    if (isRunning()) frameId = requestAnimationFrame(tick);
  }
  function measure(entries = []) {
    columns.forEach(column => {
      const size = entries.find(entry => entry.target === column.set)?.borderBoxSize?.[0];
      column.height = size?.blockSize || column.set.offsetHeight;
    });
    renderReel();
    sync();
  }
  function togglePlayback() {
    if (!motionEnabled) return;
    autoRequested = !autoRequested;
    sync();
  }
  function finishDrag() {
    if (!pointer) return;
    const pointerId = pointer.id;
    pointer = null;
    posterReel.classList.remove('is-dragging');
    if (posterReel.hasPointerCapture(pointerId)) posterReel.releasePointerCapture(pointerId);
    sync();
  }
  posterReel.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a, input, select, textarea')) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, phase, dragging: event.pointerType !== 'touch' };
    if (pointer.dragging) {
      event.preventDefault();
      posterReel.focus({ preventScroll: true });
      posterReel.setPointerCapture(event.pointerId);
      posterReel.classList.add('is-dragging');
      sync();
    }
  });
  posterReel.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.dragging) {
      if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
        pointer = null;
        return;
      }
      if (Math.abs(dx) <= 8 || Math.abs(dx) <= Math.abs(dy)) return;
      pointer.dragging = true;
      posterReel.setPointerCapture(event.pointerId);
      posterReel.classList.add('is-dragging');
      sync();
    }
    event.preventDefault();
    phase = pointer.phase + dx * 1.2;
    renderReel();
  }, { passive: false });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(event => posterReel.addEventListener(event, finishDrag));
  posterReel.addEventListener('dragstart', event => event.preventDefault());
  window.addEventListener('blur', finishDrag);
  posterReel.addEventListener('keydown', event => {
    if (event.target !== posterReel) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      phase += event.key === 'ArrowRight' ? 80 : -80;
      renderReel();
    } else if (event.code === 'Space') {
      event.preventDefault();
      togglePlayback();
    }
  });
  toggle?.addEventListener('click', togglePlayback);
  const resizeObserver = new ResizeObserver(measure);
  columns.forEach(column => resizeObserver.observe(column.set));
  reelController = { sync };
  measure();
}

tiltCards.forEach(card => {
  const tilt = card.matches('.contact-card') ? 0 : card.matches('.partnership-card') ? 5 : 2;
  card.addEventListener('pointermove', event => {
    if (!motionEnabled || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = card.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
    card.style.setProperty('--rx', `${(0.5 - y) * tilt * 2}deg`);
    card.style.setProperty('--ry', `${(x - 0.5) * tilt * 2}deg`);
    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
  });
  ['pointerleave', 'pointercancel', 'focusout'].forEach(event => card.addEventListener(event, () => resetTilt(card)));
});
motionControls.forEach(button => {
  button.addEventListener('pointermove', event => {
    if (!motionEnabled || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = button.getBoundingClientRect();
    button.style.setProperty('--mx', `${(event.clientX - bounds.left) / bounds.width * 100}%`);
    button.style.setProperty('--my', `${(event.clientY - bounds.top) / bounds.height * 100}%`);
  });
  button.addEventListener('pointerdown', event => {
    if (!motionEnabled || event.button !== 0) return;
    pressControl(button);
    if (!button.matches('.button')) return;
    const bounds = button.getBoundingClientRect();
    const diameter = Math.max(bounds.width, bounds.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'button-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.cssText = `left:${event.clientX - bounds.left - diameter / 2}px;top:${event.clientY - bounds.top - diameter / 2}px;width:${diameter}px;height:${diameter}px`;
    button.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    setTimeout(() => ripple.remove(), 900);
  });
  button.addEventListener('keydown', event => {
    if (!motionEnabled || event.repeat || !['Enter', ' '].includes(event.key)) return;
    resetTilt(button);
    pressControl(button);
  });
  ['pointerleave', 'pointercancel', 'blur'].forEach(event => button.addEventListener(event, () => resetControl(button)));
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  if (tab.getAttribute('aria-selected') === 'true') return;
  panelAnimations.forEach(animation => animation.cancel());
  panelAnimations = [];
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  const panel = document.getElementById(tab.getAttribute('aria-controls'));
  document.querySelectorAll('.incentive-panel [data-reveal]').forEach(element => {
    revealObserver.unobserve(element);
    element.removeAttribute('data-reveal');
    element.classList.remove('will-reveal');
    element.classList.add('in-view');
    element.style.removeProperty('--reveal-delay');
  });
  if (motionEnabled) panelAnimations = [...panel.querySelectorAll('.incentive-intro, .incentive-data')].map((element, index) => element.animate([
    { opacity: 0, transform: 'translateY(18px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 450, delay: index * 80, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }));
  requestScrollUpdate();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const nextIndex = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
    if (nextIndex == null) return;
    event.preventDefault();
    selectTab(tabs[nextIndex]);
    tabs[nextIndex].focus();
  });
});


const contactDialog = document.getElementById('contact-dialog');
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => contactDialog.showModal()));
document.querySelectorAll('[data-close-dialog], .dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
const toast = document.querySelector('.toast');
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  (document.activeElement?.closest('dialog[open]') || document.querySelector('dialog[open]') || document.body).append(toast);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3200);
}
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('czkbrs666');
    showToast('微信号已复制：czkbrs666');
  } catch {
    if (!contactDialog.open) contactDialog.showModal();
    const field = document.getElementById('wechat-id');
    field.focus();
    field.select();
    showToast('请长按或按 Ctrl / ⌘ + C 复制微信号');
  }
}));
setMotion(motionEnabled);
