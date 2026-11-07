// Boom Arena rewards: post-match loot crates (cosmetics only), a free weekly season pass, and a shareable
// end-of-match card. Everything is saved in localStorage so it works offline and inside a desktop wrapper.
// All cosmetics here are original and procedural (CSS gradients + emoji), no outside assets.
(function () {
  const ls = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const RARITY = [
    { id: 'common', name: 'Common', col: '#b8c2cc', w: 52 }, { id: 'uncommon', name: 'Uncommon', col: '#5dd97a', w: 27 },
    { id: 'rare', name: 'Rare', col: '#3da8ff', w: 13 }, { id: 'epic', name: 'Epic', col: '#b46bff', w: 6 }, { id: 'legendary', name: 'Legendary', col: '#ffb02e', w: 2 }];
  const ADJ = ['Neon', 'Ash', 'Volt', 'Frost', 'Ember', 'Ghost', 'Riot', 'Static', 'Nova', 'Venom', 'Cobalt', 'Solar', 'Rust', 'Abyss', 'Prism', 'Thunder'];
  const NOUN = { card: ['Skyline', 'Drop Zone', 'Gulag Gate', 'Storm Wall', 'Night Raid', 'Last Circle', 'Harbor', 'Overpass'],
    emblem: ['Skull', 'Wolf', 'Crown', 'Viper', 'Hawk', 'Bolt', 'Flame', 'Comet'], charm: ['Dice', 'Grenade Pin', 'Dog Tag', 'Bullet', 'Lucky Coin', 'Cactus', 'Rubber Duck', 'Mini Crate'] };
  const EMO = { Skull: '💀', Wolf: '🐺', Crown: '👑', Viper: '🐍', Hawk: '🦅', Bolt: '⚡', Flame: '🔥', Comet: '☄️', Dice: '🎲', 'Grenade Pin': '📍', 'Dog Tag': '🏷️', Bullet: '🔸', 'Lucky Coin': '🪙', Cactus: '🌵', 'Rubber Duck': '🦆', 'Mini Crate': '📦' };
  const TYPES = { card: 'Calling Card', emblem: 'Emblem', charm: 'Weapon Charm' };
  const hue = s => [...s].reduce((h, c) => (h*31 + c.charCodeAt(0)) % 360, 7);
  function makeItem(rar, rnd = Math.random) {
    const type = ['card', 'emblem', 'charm'][Math.floor(rnd()*3)], adj = ADJ[Math.floor(rnd()*ADJ.length)], noun = NOUN[type][Math.floor(rnd()*NOUN[type].length)];
    const name = `${adj} ${noun}`;
    return { id: `${type}:${name}:${rar}`, type, name, rar, emo: EMO[noun] || '★', h: hue(name) };
  }
  const R = id => RARITY.find(r => r.id === id) || RARITY[0];
  const swatch = it => { const h = it.h, ri = RARITY.findIndex(r => r.id === it.rar);
    return ri >= 3 ? `linear-gradient(135deg,hsl(${h},90%,55%),hsl(${(h + 70) % 360},90%,40%) 55%,hsl(${(h + 140) % 360},95%,60%))` : `linear-gradient(135deg,hsl(${h},${40 + ri*15}%,45%),hsl(${(h + 40) % 360},${30 + ri*15}%,22%))`; };
  function rollRarity(luck) {   // luck 0..1 from match performance nudges the odds up a little
    let t = 0; const ws = RARITY.map((r, i) => r.w*(1 + luck*i*.6)); const tot = ws.reduce((a, b) => a + b); let x = Math.random()*tot;
    for (let i = 0; i < ws.length; i++) { t += ws[i]; if (x < t) return RARITY[i].id; } return 'common';
  }
  const inv = () => ls.get('boomInv', { items: {}, equip: {} });
  function grant(it) { const v = inv(), dup = !!v.items[it.id]; v.items[it.id] = (v.items[it.id] || 0) + 1; if (!v.equip[it.type] || RARITY.findIndex(r => r.id === it.rar) >= 3) v.equip[it.type] = it.id; ls.set('boomInv', v); return dup; }
  // ---------------- free weekly season pass ----------------
  const SP_PER_TIER = 2500, SP_TIERS = 25;
  const wk = () => typeof weekKey === 'function' ? weekKey() : 'W';
  function season() { let s = ls.get('boomSeason', null); if (!s || s.wk !== wk()) { s = { wk: wk(), sp: 0, claimed: 0 }; ls.set('boomSeason', s); } return s; }
  const tierReward = t => t % 5 === 0 ? (t === SP_TIERS ? 'legendary' : t >= 15 ? 'epic' : 'rare') : t % 2 === 0 ? 'uncommon' : 'common';
  function spAdd(n) {
    const s = season(); s.sp = Math.min(SP_PER_TIER*SP_TIERS, s.sp + Math.round(n)); const tier = Math.floor(s.sp/SP_PER_TIER), got = [];
    while (s.claimed < tier) { s.claimed++; const it = makeItem(tierReward(s.claimed)); grant(it); got.push([s.claimed, it]); }
    ls.set('boomSeason', s);
    for (const [t, it] of got) setTimeout(() => window.toast && toast(`SEASON PASS TIER ${t}`, `${R(it.rar).name} ${TYPES[it.type]} · ${it.name}`), 1200);
    return got;
  }
  function seasonHTML() {
    const s = season(), tier = Math.floor(s.sp/SP_PER_TIER), into = s.sp % SP_PER_TIER, maxed = tier >= SP_TIERS;
    const d = new Date(), next = new Date(d); next.setHours(0, 0, 0, 0); next.setDate(next.getDate() + 7 - (d.getDay() + 6) % 7); const days = Math.ceil((next - d)/864e5);
    let pips = ''; for (let t = 1; t <= SP_TIERS; t++) pips += `<i class="${t <= tier ? 'on' : ''}" style="--c:${R(tierReward(t)).col}" title="Tier ${t}: ${R(tierReward(t)).name}"></i>`;
    return `<div class="spass"><div class="dch-h">WEEKLY SEASON PASS <small>free · tier ${tier}/${SP_TIERS} · ends in ${days}d</small></div><div class="sp-pips">${pips}</div>` +
      `<div class="xpbar"><b style="width:${maxed ? 100 : Math.round(into/SP_PER_TIER*100)}%"></b></div><small>${maxed ? 'Pass complete!' : `${into.toLocaleString()} / ${SP_PER_TIER.toLocaleString()} to tier ${tier + 1} (${R(tierReward(tier + 1)).name})`}</small></div>`;
  }
  // ---------------- loot crate reveal ----------------
  function beep(f, d, v, t) { try { window.tone && tone(f, d, v, t); } catch (e) {} }
  function crateReveal(luck, onDone, force) {
    const rar = force || rollRarity(luck), it = makeItem(rar), r = R(rar), ri = RARITY.indexOf(r), dup = grant(it);
    const el = document.createElement('div'); el.id = 'crate'; el.className = 'r-' + rar;
    el.innerHTML = `<div class="cr-box" style="--c:${r.col}"><div class="cr-lid"></div><div class="cr-body">BOOM<br><small>SUPPLY CRATE</small></div></div>
      <div class="cr-item" style="--c:${r.col}"><div class="cr-sw" style="background:${swatch(it)}">${it.type === 'card' ? '' : it.emo}</div><em>${r.name.toUpperCase()} ${TYPES[it.type].toUpperCase()}</em><b>${it.name}</b><small>${dup ? 'Duplicate · +500 season XP' : 'New! Equipped in your locker'}</small></div>
      <div class="cr-hint">Click to open</div>`;
    document.body.appendChild(el);
    let stage = 0;
    const open = () => {
      if (stage === 0) {
        stage = 1; el.classList.add('shake'); el.querySelector('.cr-hint').textContent = '';
        const legend = rar === 'legendary', epic = ri >= 3, wait = legend ? 2200 : epic ? 1300 : 750;
        if (epic) el.classList.add('hype');
        for (let i = 0; i < wait/110; i++) setTimeout(() => beep(300 + i*(legend ? 45 : 90), .06, .05 + (epic ? i*.003 : 0), 'square'), i*110);
        if (legend) { el.classList.add('slowmo'); setTimeout(() => { const fl = document.createElement('div'); fl.className = 'cr-flash'; el.appendChild(fl); }, wait - 120);
          setTimeout(() => { const t = document.createElement('div'); t.className = 'cr-legend'; t.textContent = 'LEGENDARY!'; el.appendChild(t); [196, 262, 330, 392, 523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, .5, .07, 'sawtooth'), 200 + i*140)); }, wait + 300); }
        setTimeout(() => {
          el.classList.add('open'); stage = 2; el.querySelector('.cr-hint').textContent = 'Click to continue';
          [523, 659, 784, 1046, 1318].slice(0, 2 + ri).forEach((f, i) => setTimeout(() => beep(f, .25, .07, 'triangle'), i*90));
          for (let i = 0; i < 14 + ri*10; i++) { const p = document.createElement('i'); p.className = 'cr-spark'; p.style.setProperty('--a', Math.random()*360 + 'deg'); p.style.setProperty('--d', (120 + Math.random()*220*(1 + ri*.3)) + 'px'); p.style.background = r.col; el.appendChild(p); }
          if (dup) spAdd(500);
        }, wait);
      } else if (stage === 2) { el.remove(); onDone && onDone(it); }
    };
    el.onclick = open;
    return it;
  }
  // ---------------- shareable end-of-match card ----------------
  function shareCard(d) {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 630; const g = c.getContext('2d');
    const v = inv(), card = v.equip.card && v.items[v.equip.card] ? v.equip.card.split(':') : null, h = card ? hue(card[1]) : 210;
    const bg = g.createLinearGradient(0, 0, 1200, 630); bg.addColorStop(0, `hsl(${h},55%,18%)`); bg.addColorStop(1, `hsl(${(h + 60) % 360},60%,8%)`); g.fillStyle = bg; g.fillRect(0, 0, 1200, 630);
    g.globalAlpha = .08; g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) g.fillRect(i*34 - 200, 0, 12, 630); g.globalAlpha = 1;
    g.fillStyle = d.res === 'win' ? '#ffd23a' : '#ff5a4a'; g.font = '800 92px Rajdhani, Arial, sans-serif'; g.fillText(d.res === 'win' ? 'VICTORY' : d.res === 'draw' ? 'DRAW' : 'DEFEAT', 60, 130);
    g.fillStyle = '#fff'; g.font = '600 34px Rajdhani, Arial, sans-serif'; g.fillText(`${d.mode} · ${d.map}`, 64, 180);
    const tiles = [['KILLS', d.kills], ['K/D', d.kd], ['ACCURACY', d.acc + '%'], ['HEADSHOTS', d.heads], ['BEST STREAK', d.best], ['XP', '+' + d.xp]];
    tiles.forEach(([k, val], i) => { const x = 64 + (i % 3)*360, y = 250 + Math.floor(i/3)*150; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y, 330, 125);
      g.fillStyle = '#fff'; g.font = '800 64px Rajdhani, Arial, sans-serif'; g.fillText(String(val), x + 22, y + 72); g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '700 24px Rajdhani, Arial, sans-serif'; g.fillText(k, x + 24, y + 108); });
    g.fillStyle = '#fff'; g.font = '800 40px Rajdhani, Arial, sans-serif'; g.textAlign = 'right'; g.fillText('BOOM ARENA', 1140, 90);
    g.font = '600 26px Rajdhani, Arial, sans-serif'; g.fillText(`Level ${d.level} · 🔥 ${d.streakDays}-day streak`, 1140, 130); g.textAlign = 'left';
    return c;
  }
  function downloadCard(d) { const c = shareCard(d); const a = document.createElement('a'); a.download = 'boom-arena-match.png'; a.href = c.toDataURL('image/png'); a.click(); return c; }
  // ---------------- locker: view and equip what you've earned ----------------
  function fromId(id) { if (!id) return null; const [type, name, rar] = id.split(':'); const noun = NOUN[type] ? NOUN[type].find(n => name.endsWith(n)) : null; return { id, type, name, rar, emo: EMO[noun] || '★', h: hue(name) }; }
  const equipped = type => { const v = inv(); return v.equip[type] && v.items[v.equip[type]] ? fromId(v.equip[type]) : null; };
  function equip(id) { const v = inv(); if (!v.items[id]) return false; v.equip[id.split(':')[0]] = id; ls.set('boomInv', v); return true; }
  const BOT_EMO = ['💀', '🐺', '🦅', '⚡', '🔥', '🐍', '👑', '☄️', '', '', ''];
  function emblemFor(f) {   // your equipped emblem; bots get a stable one from their name
    if (!f) return '';
    if (f.isPlayer) { const e = equipped('emblem'); return e ? `<span class="emb" style="--c:${R(e.rar).col}">${e.emo}</span>` : ''; }
    const e = BOT_EMO[hue(f.name || '') % BOT_EMO.length]; return e ? `<span class="emb">${e}</span>` : '';
  }
  const cardBg = () => { const c = equipped('card'); return c ? swatch(c) : ''; };
  function openLocker() {
    let el = document.getElementById('locker'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'locker';
    const draw = () => {
      const v = inv(), ids = Object.keys(v.items);
      const sec = type => {
        const list = ids.filter(id => id.startsWith(type + ':')).map(fromId).sort((a, b) => RARITY.findIndex(r => r.id === b.rar) - RARITY.findIndex(r => r.id === a.rar));
        return `<h3>${TYPES[type].toUpperCase()}S <small>${list.length}</small></h3><div class="lk-grid">` + (list.length ? list.map(it => `<button class="lk-it ${v.equip[type] === it.id ? 'eq' : ''}" data-id="${it.id}" style="--c:${R(it.rar).col}">
          <i style="background:${swatch(it)}">${type === 'card' ? '' : it.emo}</i><b>${it.name}</b><small>${R(it.rar).name}${v.items[it.id] > 1 ? ' ×' + v.items[it.id] : ''}${v.equip[type] === it.id ? ' · EQUIPPED' : ''}</small></button>`).join('') : '<p>Open crates after matches and climb the season pass to earn these.</p>') + '</div>';
      };
      el.innerHTML = `<div class="lk-box"><div class="lk-h">LOCKER<button class="lk-x">✕</button></div>${sec('card')}${sec('emblem')}${sec('charm')}</div>`;
      el.querySelectorAll('.lk-it').forEach(b => b.onclick = e => { e.stopPropagation(); equip(b.dataset.id); draw(); });
      el.querySelector('.lk-x').onclick = () => el.remove();
    };
    el.onclick = e => { if (e.target === el) el.remove(); };
    draw(); document.body.appendChild(el); return el;
  }
  Object.assign(window, { BoomRewards: { fromId, equipped, equip, emblemFor, cardBg, openLocker, RARITY, makeItem, rollRarity, grant, inv, season, seasonHTML, spAdd, crateReveal, shareCard, downloadCard, swatch, TYPES, R }, spAdd });
})();
