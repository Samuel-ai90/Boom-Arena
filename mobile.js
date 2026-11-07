// Boom Arena touch controls (phones/tablets, iOS Safari): left virtual stick moves, dragging anywhere on the right
// looks, on-screen buttons for fire/ADS/reload/jump/crouch-slide/swap/grenade, optional auto-fire when the
// crosshair is on an enemy, rotate-to-landscape prompt, safe-area insets, and iOS audio unlock on first tap.
// Loaded after the game script and uses its globals (TOUCHPAD, onAction, yaw, pitch, running ...).
(function () {
  if (!TOUCHPAD.on) return;
  document.documentElement.classList.add('touch');
  const css = document.createElement('style');
  css.textContent = `
  html.touch,html.touch body{overscroll-behavior:none;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  html.touch #hud{padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);box-sizing:border-box}
  html.touch #keys{display:none!important}
  html.touch #mapwrap{transform:scale(.72);transform-origin:top left}
  html.touch #wp{right:auto;left:50%;bottom:calc(env(safe-area-inset-bottom) + 2px);transform:translateX(-50%) scale(.62);transform-origin:bottom center}
  html.touch #hp{left:50%;bottom:auto;top:calc(env(safe-area-inset-top) + 62px);transform:translateX(-50%) scale(.6);transform-origin:top center}
  html.touch #streaks{right:auto;bottom:auto;left:calc(env(safe-area-inset-left) + 10px);top:calc(env(safe-area-inset-top) + 172px);transform:scale(.8);transform-origin:top left;align-items:flex-start}
  html.touch #overlay,html.touch #lobby{padding:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));box-sizing:border-box;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y}
  html.touch #overlay *,html.touch #lobby *{touch-action:pan-y}
  html.touch button{min-height:40px}
  html.touch #lobby{background:#0b1020!important}
  html.touch #play{position:fixed!important;z-index:60;right:calc(env(safe-area-inset-right) + 14px);bottom:calc(env(safe-area-inset-bottom) + 12px);min-width:150px;min-height:54px;font-size:20px;box-shadow:0 6px 24px rgba(0,0,0,.5)}
  @media (max-height:500px){html.touch #overlay h1{font-size:30px!important;margin:4px 0!important} html.touch #overlay{justify-content:flex-start!important}}
  #tui{position:fixed;inset:0;z-index:50;display:none;pointer-events:none}
  #tui.on{display:block}
  #tui .tb{position:absolute;pointer-events:auto;border-radius:50%;background:rgba(20,26,40,.42);border:2px solid rgba(255,255,255,.35);color:#fff;font:700 12px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.05;touch-action:none}
  #tui .tb.dn{background:rgba(255,190,60,.55);border-color:#ffd27a}
  #tui .tb.lit{border-color:#7cf;color:#7cf}
  #tStick{position:absolute;width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.3);background:rgba(20,26,40,.25);display:none}
  #tKnob{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.45)}
  #tHint{position:absolute;left:calc(env(safe-area-inset-left) + 30px);bottom:calc(env(safe-area-inset-bottom) + 30px);width:110px;height:110px;border-radius:50%;border:2px dashed rgba(255,255,255,.22)}
  #rotate{position:fixed;inset:0;z-index:99999;display:none;background:#0a0e1d;color:#fff;font:600 18px system-ui,sans-serif;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:30px}
  #rotate .ph{width:46px;height:80px;border:3px solid #fff;border-radius:9px;margin-bottom:22px;animation:rot 1.8s ease-in-out infinite}
  @keyframes rot{0%,20%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}
  @media (orientation:portrait){#rotate{display:flex}}`;
  document.head.appendChild(css);

  const R = 'env(safe-area-inset-right)', B = 'env(safe-area-inset-bottom)', T = 'env(safe-area-inset-top)';
  // [action, label, size, right, bottom]  (positions measured from the bottom-right corner, inside the safe area)
  const BTN = [
    ['fire', 'FIRE', 84, 24, 70], ['ads', 'ADS', 60, 128, 34], ['jump', 'JUMP', 58, 24, 172],
    ['crouch', 'SLIDE', 54, 112, 120], ['reload', 'R', 46, 196, 30], ['swap', 'SWAP', 50, 96, 200],
    ['grenade', 'NADE', 46, 170, 176], ['fire', 'FIRE', 54, -1, -1],
  ];
  const ui = document.createElement('div'); ui.id = 'tui';
  ui.innerHTML = `<div id="tHint"></div><div id="tStick"><div id="tKnob"></div></div>` +
    BTN.map((b, i) => b[3] < 0
      ? `<div class="tb" data-a="fire" style="width:${b[2]}px;height:${b[2]}px;left:calc(env(safe-area-inset-left) + 160px);bottom:calc(${B} + 150px)">FIRE</div>`
      : `<div class="tb" data-a="${b[0]}" style="width:${b[2]}px;height:${b[2]}px;right:calc(${R} + ${b[3]}px);bottom:calc(${B} + ${b[4]}px)">${b[1]}</div>`).join('') +
    `<div class="tb" id="tPause" style="width:42px;height:42px;border-radius:10px;right:calc(${R} + 14px);top:calc(${T} + 10px)">II</div>` +
    `<div class="tb" id="tAuto" style="width:52px;height:34px;border-radius:10px;right:calc(${R} + 66px);top:calc(${T} + 14px);font-size:10px">AUTO<br>FIRE</div>`;
  document.body.appendChild(ui);
  const rot = document.createElement('div'); rot.id = 'rotate';
  rot.innerHTML = `<div class="ph"></div>Rotate your phone to landscape<br><small style="opacity:.6;margin-top:8px">Tip: Share → Add to Home Screen for full screen</small>`;
  document.body.appendChild(rot);

  let auto = localStorage.getItem('boomAutoFire') !== '0';
  const autoBtn = document.getElementById('tAuto');
  const paintAuto = () => autoBtn.classList.toggle('lit', auto);
  paintAuto();

  // iOS audio unlock: Web Audio stays suspended until a user gesture resumes it
  const unlock = () => {
    try { audio(); if (AC && AC.state !== 'running') AC.resume(); const b = AC.createBuffer(1, 1, 22050), s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0); } catch (e) {}
    if (AC && AC.state === 'running') { removeEventListener('touchend', unlock, true); removeEventListener('click', unlock, true); }
  };
  addEventListener('touchend', unlock, true); addEventListener('click', unlock, true);
  // try to lock landscape where supported (Android in fullscreen; iOS ignores this, hence the rotate prompt)
  document.addEventListener('fullscreenchange', () => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} });

  const stick = document.getElementById('tStick'), knob = document.getElementById('tKnob');
  const T_ = new Map();   // touch id -> { kind, x, y, ox, oy, el, a }
  const press = (a, down) => { TOUCHPAD.held[a] = down; onAction(a, down, false); };
  const RAD = 55;
  function start(e) {
    if (!running) return;
    for (const t of e.changedTouches) {
      const el = t.target.closest && t.target.closest('.tb');
      if (el && el.id === 'tPause') { pause(); continue; }
      if (el && el.id === 'tAuto') { auto = !auto; localStorage.setItem('boomAutoFire', auto ? '1' : '0'); paintAuto(); if (!auto && autoFiring) { autoFiring = false; press('fire', false); } continue; }
      if (!el && !BR.on && MODE !== 'gun') {   // tap a ready killstreak in the list to call it in
        const rows = [...document.querySelectorAll('#streaks > div')];
        const i = rows.findIndex(d => { const r = d.getBoundingClientRect(); return t.clientX >= r.left - 6 && t.clientX <= r.right + 6 && t.clientY >= r.top - 4 && t.clientY <= r.bottom + 4; });
        if (i >= 0 && STREAKS[i]) { onAction(STREAKS[i].bind, true, false); continue; }
      }
      if (el) { el.classList.add('dn'); const a = el.dataset.a; press(a, true); T_.set(t.identifier, { kind: 'btn', el, a, x: t.clientX, y: t.clientY }); continue; }
      if (t.clientX < innerWidth * .42) {
        if ([...T_.values()].some(v => v.kind === 'stick')) continue;
        stick.style.display = 'block'; stick.style.left = (t.clientX - 60) + 'px'; stick.style.top = (t.clientY - 60) + 'px';
        knob.style.transform = '';
        T_.set(t.identifier, { kind: 'stick', ox: t.clientX, oy: t.clientY });
      } else T_.set(t.identifier, { kind: 'look', x: t.clientX, y: t.clientY });
    }
    e.preventDefault();
  }
  function look(dx, dy) {
    const k = .0052 * lookScale(), dp = -dy*k*(S.invertY ? -1 : 1);
    if (dp < 0 && recoverP > 0) recoverP = Math.max(0, recoverP + dp);
    yaw -= dx*k; pitch = clamp(pitch + dp, -1.5, 1.5);
  }
  function move(e) {
    for (const t of e.changedTouches) {
      const v = T_.get(t.identifier); if (!v) continue;
      if (v.kind === 'stick') {
        let dx = t.clientX - v.ox, dy = t.clientY - v.oy; const d = Math.hypot(dx, dy);
        if (d > RAD) { dx *= RAD/d; dy *= RAD/d; }
        knob.style.transform = `translate(${dx}px,${dy}px)`;
        const m = Math.min(1, d / RAD) < .12 ? 0 : 1;
        TOUCHPAD.lx = m * dx / RAD; TOUCHPAD.ly = m * dy / RAD;
        TOUCHPAD.held.sprint = d > RAD * .95 && dy < -RAD * .7;   // push the stick all the way forward to sprint
      } else if (running) { look(t.clientX - v.x, t.clientY - v.y); v.x = t.clientX; v.y = t.clientY; }   // buttons drag-look too
    }
    e.preventDefault();
  }
  function end(e) {
    for (const t of e.changedTouches) {
      const v = T_.get(t.identifier); if (!v) continue;
      T_.delete(t.identifier);
      if (v.kind === 'stick') { TOUCHPAD.lx = TOUCHPAD.ly = 0; TOUCHPAD.held.sprint = false; stick.style.display = 'none'; }
      else if (v.kind === 'btn') { v.el.classList.remove('dn'); press(v.a, false); }
    }
    e.preventDefault();
  }
  ui.addEventListener('touchstart', start, { passive: false });
  for (const tgt of [ui, document]) {
    tgt.addEventListener('touchmove', e => { if (T_.size) move(e); }, { passive: false });
    tgt.addEventListener('touchend', e => { if (T_.size) end(e); }, { passive: false });
    tgt.addEventListener('touchcancel', e => { if (T_.size) end(e); }, { passive: false });
  }
  // The touch layer only catches input while a match is live; menus get normal taps.
  ui.style.pointerEvents = 'none';
  const zone = document.createElement('div');
  zone.style.cssText = 'position:absolute;inset:0;pointer-events:auto;touch-action:none';
  ui.insertBefore(zone, ui.firstChild);

  // Auto-fire: hold the trigger while the crosshair is over a visible enemy
  let autoFiring = false;
  const v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
  function onTarget() {
    if (!player.alive) return false;
    for (const f of fighters) {
      if (f === player || !f.alive || !enemies(player, f)) continue;
      for (const h of [1.35, 1.0, 1.65]) {
        v3.set(f.pos.x, f.pos.y + h, f.pos.z);
        const dist = v3.distanceTo(camera.position); if (dist > (WEAPONS[weapon].range || 80)) break;
        v4.copy(v3).project(camera);
        if (v4.z > 1) break;
        const r = Math.max(.012, .5 / dist) * (1 + (1 - adsK) * .4);   // roughly the body width on screen
        if (Math.abs(v4.x) < r * camera.aspect ** -1 * 1.8 && Math.abs(v4.y) < r * 1.6 && clearLine(camera.position, v3)) return true;
      }
    }
    return false;
  }
  function tick() {
    requestAnimationFrame(tick);
    ui.classList.toggle('on', running);
    if (!running) {
      if (T_.size) { for (const [id, v] of T_) if (v.kind === 'btn') { v.el.classList.remove('dn'); TOUCHPAD.held[v.a] = false; } T_.clear(); }
      TOUCHPAD.lx = TOUCHPAD.ly = 0; TOUCHPAD.held.sprint = false; stick.style.display = 'none'; autoFiring = false;
      return;
    }
    if (auto && !(BR.on && BR.ui)) {
      const want = onTarget();
      if (want && !autoFiring && !TOUCHPAD.held.fire) { autoFiring = true; onAction('fire', true, false); }
      else if (!want && autoFiring) { autoFiring = false; if (!TOUCHPAD.held.fire) onAction('fire', false, false); }
    }
  }
  tick();
  window.BoomTouch = { onTarget, get auto() { return auto; }, ui };
})();
