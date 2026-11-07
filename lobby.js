// Boom Arena lobby: the single front screen, hub style. Your squad of four stands in a sunset port arena (staged art of
// the two operators, RANGER and VIPER; the live 3D models with ?lobby3d). Around them: top tabs (PLAY, LOADOUT,
// OPERATORS, BATTLE PASS, STORE), the mode / map banner, today's challenges, the PLAY button, your squad, match settings,
// shortcut cards and squad chat. The other tabs are full screens built on the game's own loadout / operator / settings
// controls (moved in by id, so the game keeps driving them) plus the free season pass and the cosmetic armory.
// Offline matches start from here (online keeps its own flow); Escape in a match comes back here, paused.
// Uses the game's globals (MODES, MAP_INFO, S, OPS, daily, weekly, BoomRewards, ...).
(function () {
  const $ = id => document.getElementById(id);
  const BUILD = (window.BOOM_BUILD && !/^__/.test(window.BOOM_BUILD)) ? window.BOOM_BUILD : 'dev';
  const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const U = n => `calc(var(--u)*${n})`;

  // ---------------- art, squad, icons ----------------
  // staged operator art: aspect (w/h) and where the head sits across the cutout (for the name plates)
  const ART = {
    ranger: { src: 'lobby/op-ranger.webp', face: 'lobby/op-ranger-face.webp', ar: .381, hx: .517 },
    viper: { src: 'lobby/op-viper.webp', face: 'lobby/op-viper-face.webp', ar: .36, hx: .532 },
    rangerFrost: { src: 'lobby/op-ranger-frost.webp', face: 'lobby/op-ranger-frost-face.webp', ar: .421, hx: .419 },
    viperWood: { src: 'lobby/op-viper-wood.webp', face: 'lobby/op-viper-wood-face.webp', ar: .583, hx: .493 },
  };
  // where each squad member stands on screen: feet x / y and height, as fractions of the viewport
  const SLOTS_WIDE = [{ x: .475, y: .80, h: .56 }, { x: .335, y: .735, h: .45 }, { x: .595, y: .725, h: .44 }, { x: .69, y: .705, h: .33 }];
  // short screens (phones in landscape): the squad panel is hidden, so the squad stands lower and a bit wider
  const SLOTS_SHORT = [{ x: .5, y: .86, h: .6 }, { x: .375, y: .8, h: .48 }, { x: .625, y: .79, h: .47 }, { x: .73, y: .77, h: .36 }];
  const isShort = () => innerHeight <= 600;
  let SLOTS = isShort() ? SLOTS_SHORT : SLOTS_WIDE;
  const SLOT_COL = ['#ef8a2c', '#9fb2c0', '#c4ad88', '#93aa86'];
  const opArt = op => op === 'axiom' ? 'viper' : 'ranger';
  const heroArt = () => opArt(typeof myOp !== 'undefined' ? myOp : 'vanguard');
  const opName = () => (typeof OPS !== 'undefined' && OPS[myOp] ? OPS[myOp].name : 'RANGER');
  const has3D = () => typeof OPS !== 'undefined' && !!(OPS.vanguard && OPS.vanguard.scene);
  function mates() {
    const viperHero = heroArt() === 'viper';
    return [
      { name: 'VOLT', op: 'vanguard', skin: 'w_frost', gun: 'lmg', art: 'rangerFrost', face: -.15 },
      { name: 'SERAPH', op: viperHero ? 'vanguard' : 'axiom', skin: viperHero ? 'w_urban' : 'a_stealth', gun: 'smg', art: viperHero ? 'ranger' : 'viper', face: .2 },
      { name: 'TIDE', op: 'axiom', skin: 'woodland', gun: 'dmr', art: 'viperWood', face: .35 },
    ];
  }
  const dayHash = s => [...(s + new Date().toDateString())].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const mateLv = name => 20 + dayHash(name) % 80;

  const I = {
    gear: '<path d="M12 2.6l1.7 2.2 2.7-.7.5 2.8 2.6.9-.9 2.6 1.9 2.1-2.2 1.7.7 2.7-2.8.5-.9 2.6-2.6-.9-2.1 1.9-1.7-2.2-2.7.7-.5-2.8-2.6-.9.9-2.6L2.6 12l2.2-1.7-.7-2.7 2.8-.5.9-2.6 2.6.9z"/><circle cx="12" cy="12" r="3.3"/>',
    users: '<circle cx="9" cy="8" r="3.3"/><path d="M2.8 20c0-3.4 2.8-6.1 6.2-6.1s6.2 2.7 6.2 6.1"/><circle cx="17.2" cy="8.8" r="2.6"/><path d="M16.2 14c2.8.3 5 2.6 5 5.6"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.2 2"/>',
    chev: '<path d="M9.5 6l6 6-6 6"/>',
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7.5"/>',
    crown: '<path fill="currentColor" stroke="none" d="M2.5 7.5l5 4.2L12 4.5l4.5 7.2 5-4.2-2.2 11H4.7z"/>',
    speaker: '<path fill="currentColor" stroke="none" d="M3.5 9.2h3.8L12.5 5v14l-5.2-4.2H3.5z"/><path d="M15.6 9a4.4 4.4 0 010 6M18.3 6.6a8 8 0 010 10.8"/>',
    mute: '<path fill="currentColor" stroke="none" d="M3.5 9.2h3.8L12.5 5v14l-5.2-4.2H3.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.6 11.2a6.4 6.4 0 0012.8 0M12 17.6V21"/>',
    headset: '<path d="M4.2 14.5V12a7.8 7.8 0 0115.6 0v2.5"/><rect x="3" y="13.2" width="4.2" height="6.8" rx="1.6"/><rect x="16.8" y="13.2" width="4.2" height="6.8" rx="1.6"/>',
    chat: '<path d="M4 4.8h16v11.4H9.4L4 20.2z"/><path d="M8 9.2h8M8 12.2h5"/>',
    net: '<circle cx="12" cy="5" r="2.1"/><circle cx="5" cy="18.5" r="2.1"/><circle cx="19" cy="18.5" r="2.1"/><path d="M12 7.1v4.4M12 11.5l-5.6 5.3M12 11.5l5.6 5.3"/>',
    pin: '<path d="M12 21.2s-6.6-6.2-6.6-11.1a6.6 6.6 0 0113.2 0c0 4.9-6.6 11.1-6.6 11.1z"/><circle cx="12" cy="10" r="2.4"/>',
    play: '<path fill="currentColor" stroke="none" d="M6.5 3.6l14 8.4-14 8.4z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.3 10.5V7.8a3.7 3.7 0 017.4 0v2.7"/>',
    exit: '<path d="M12 3.5v8"/><path d="M6.8 6.6a7.6 7.6 0 1010.4 0"/>',
    gun: '<path d="M2.5 9.5h13l1-1.6h3v3.2h-2.3l-.6 1.4h-3.4l-1.2 2.6v3.4H8.6l.6-3.5-1.3-1.9H2.5z"/>',
    helm: '<path d="M4 15.5a8 8 0 0116 0v1.5H4z"/><path d="M12 7.5v4M8.5 17v3h7v-3"/>',
    pass: '<path d="M12 2.8l7.4 3v6c0 4.6-3.1 7.9-7.4 9.6-4.3-1.7-7.4-5-7.4-9.6v-6z"/><path fill="currentColor" stroke="none" d="M7.6 9.5l2.3 1.9L12 7.8l2.1 3.6 2.3-1.9-1 5H8.6z"/>',
    store: '<path d="M4 8.5h16l-1.3 11.5H5.3z"/><path d="M8.6 8.5V7a3.4 3.4 0 016.8 0v1.5"/>',
    crate: '<path d="M3.5 8.2L12 4l8.5 4.2v8.6L12 21l-8.5-4.2z"/><path d="M3.5 8.2L12 12.4l8.5-4.2M12 12.4V21"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    // match types
    ffa: '<circle cx="12" cy="12" r="7"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
    tdm: '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M12 2.2c-5 0-8.6 3.6-8.6 8.2 0 2.6 1.1 4.6 2.9 5.9v2.9c0 .8.6 1.4 1.4 1.4h1.2v-2.2h1.5v2.2h3.2v-2.2h1.5v2.2h1.2c.8 0 1.4-.6 1.4-1.4v-2.9c1.8-1.3 2.9-3.3 2.9-5.9 0-4.6-3.6-8.2-8.6-8.2zM8.6 14.3a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6zm6.8 0a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6zM12 17l-1.3-2.3h2.6z"/>',
    kc: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="5"/><circle cx="12" cy="7" r="1.2"/><path d="M9.3 12h5.4M9.3 15h3.6"/>',
    dom: '<path d="M5.5 21V3.5M5.5 4h11.5l-2.4 4.2L17 12.4H5.5"/>',
    wz: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 2.4"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    gungame: '<path d="M7.5 21v-9.5L9.5 5l2 6.5V21zM13.5 21v-8l1.7-5 1.7 5v8z"/>',
  };
  const ico = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const modeIco = m => ({ ffa: 'ffa', tdm: 'tdm', kc: 'kc', dom: 'dom', wz: 'wz', gun: 'gungame' })[m] || 'tdm';
  const LOGO = `<svg class="lb-mark" viewBox="0 0 48 40" aria-hidden="true"><path fill="currentColor" d="M2 8l10.5 9.2L24 2l11.5 15.2L46 8l-4.6 25H6.6z"/><path fill="#0b0c0d" d="M15 27.5l3.4-6.2 5.6 3.6 5.6-3.6 3.4 6.2z"/><rect x="7.4" y="34.6" width="33.2" height="4" rx="1" fill="currentColor"/></svg>`;
  const COIN = `<svg class="lb-coin" viewBox="0 0 120 90" aria-hidden="true">
    <ellipse cx="34" cy="74" rx="22" ry="7" fill="#4d3a1d"/><ellipse cx="34" cy="70" rx="22" ry="7" fill="#8e6c35"/><ellipse cx="88" cy="76" rx="20" ry="6.5" fill="#4d3a1d"/><ellipse cx="88" cy="72" rx="20" ry="6.5" fill="#8e6c35"/>
    <circle cx="61" cy="42" r="31" fill="#4d3a1d"/><circle cx="61" cy="40" r="31" fill="#9c773a"/><circle cx="61" cy="40" r="24" fill="none" stroke="#6e5226" stroke-width="2"/>
    <path fill="#5f4720" d="M45 34l6.4 5.4L61 26l9.6 13.4L77 34l-3 17H48z"/><path d="M38 27a28 28 0 0120-13" stroke="#e3c88e" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  const PASS_ART = `<svg class="lb-passart" viewBox="0 0 120 90" aria-hidden="true"><path fill="rgba(255,255,255,.05)" stroke="#d8d5ce" stroke-width="2.6" stroke-linejoin="round" d="M26 28l13 11 21-26 21 26 13-11-6 34H32z"/>
    <path fill="#d8d5ce" opacity=".18" d="M44 52l6-9 10 6 10-6 6 9z"/><rect x="31" y="68" width="58" height="4" fill="#ef8a2c"/></svg>`;

  // ---------------- styles ----------------
  const css = document.createElement('style');
  const F = (w, s = 'normal') => `@font-face{font-family:'Boom Condensed';font-style:${s};font-weight:${w};font-display:swap;src:url(fonts/barlow-condensed-${w}${s === 'italic' ? 'i' : ''}.woff2) format('woff2')}`;
  const LOCK_URL = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#e8e6e1' stroke-width='2' stroke-linecap='round'>${I.lock}</svg>`)}")`;
  css.textContent = [F(600), F(700), F(800), F(800, 'italic'), F(900, 'italic')].join('\n') + `
  #lobby{--u:max(.66px,min(.0625vw,.1111vh));--acc:#ef8a2c;--acc2:#f5a35a;--accd:rgba(239,138,44,.12);--tx:#e8e6e1;--tx2:#c9c7c1;--mut:#9a9b97;--dim:#676966;
    --p:rgba(13,14,15,.8);--p2:rgba(255,255,255,.03);--ln:rgba(255,255,255,.07);--ln2:rgba(255,255,255,.13);--ok:#92bd6c;--r:${U(3)};
    position:fixed;inset:0;z-index:8000;display:none;color:var(--tx);font-family:'Boom Condensed','Barlow Condensed','Rajdhani',system-ui,sans-serif;background:#0b0c0d;opacity:0;transition:opacity .45s;
    overflow:hidden;user-select:none;-webkit-user-select:none;-webkit-font-smoothing:antialiased}
  #lobby.vis{opacity:1}
  #lobby .ic{width:1em;height:1em;flex:none;display:block}
  #lobby button{font-family:inherit;color:inherit;filter:none;letter-spacing:inherit}
  #lobby button:disabled{cursor:default}
  #lobby .lb-bg{position:absolute;inset:0;background:#0d0c0c url(lobby/arena-bg.jpg) center 42%/cover no-repeat;filter:saturate(.68) contrast(1.06) brightness(.74);animation:lbDrift 60s ease-in-out infinite alternate;transform-origin:50% 60%}
  @keyframes lbDrift{from{transform:scale(1.035) translateX(-.4%)}to{transform:scale(1.0) translateX(.4%)}}
  @media (max-aspect-ratio:16/10){#lobby .lb-bg{background-position:96% 42%}}
  #lobby .lb-vig{position:absolute;inset:0;pointer-events:none;background:
    linear-gradient(90deg,rgba(8,9,10,.86) 0%,rgba(8,9,10,.45) 24%,rgba(8,9,10,.05) 40%,rgba(8,9,10,.05) 64%,rgba(8,9,10,.45) 79%,rgba(8,9,10,.84) 100%),
    linear-gradient(180deg,rgba(8,9,10,.6) 0%,transparent 17%,transparent 66%,rgba(8,9,10,.85) 100%)}
  #lbCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
  #lobby .lb-stage{position:absolute;inset:0;pointer-events:none;z-index:0}
  #lobby .lb-fig{position:absolute;transform:translate(-50%,-97%) scale(.97);transform-origin:50% 100%;opacity:0;transition:opacity .6s,transform .6s cubic-bezier(.2,.8,.2,1)}
  #lobby .lb-fig.in{opacity:1;transform:translate(-50%,-100%)}
  #lobby .lb-fig .body{height:100%;width:auto;display:block;position:relative;z-index:1;transform-origin:50% 100%;animation:lbBreathe 4.2s ease-in-out infinite;
    filter:drop-shadow(0 0 ${U(1)} rgba(255,196,150,.2)) brightness(.93) contrast(1.05) saturate(.86)}
  #lobby .lb-fig .wash{position:absolute;inset:0;z-index:2;pointer-events:none;mix-blend-mode:soft-light;background:linear-gradient(105deg,rgba(255,170,110,.5),rgba(255,150,90,0) 45%,rgba(40,60,90,.35) 100%);
    -webkit-mask:var(--img) center/100% 100% no-repeat;mask:var(--img) center/100% 100% no-repeat;animation:lbBreathe 4.2s ease-in-out infinite;transform-origin:50% 100%}
  #lobby .lb-fig .refl{position:absolute;left:0;top:100%;height:100%;width:auto;transform:scaleY(-1);transform-origin:50% 0;opacity:.13;filter:blur(${U(2)}) brightness(.6) saturate(.7);
    -webkit-mask-image:linear-gradient(to top,rgba(0,0,0,.9),transparent 26%);mask-image:linear-gradient(to top,rgba(0,0,0,.9),transparent 26%)}
  #lobby .lb-fig::after{content:'';position:absolute;left:6%;right:6%;bottom:-3%;height:7%;z-index:0;background:radial-gradient(closest-side,rgba(0,0,0,.72),transparent);filter:blur(${U(3)})}
  #lobby .lb-fig.hero .body{animation-duration:4.8s}
  @keyframes lbBreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.004,1.008)}}

  #lobby .lb-ui{position:absolute;inset:0;pointer-events:none}
  #lobby .lb-ui > *{pointer-events:auto}
  #lobby .lb-top{position:absolute;left:0;right:0;top:0;height:${U(60)};display:flex;align-items:stretch;gap:${U(28)};padding:0 ${U(24)};box-sizing:border-box;z-index:4;
    background:rgba(9,10,11,.88);border-bottom:1px solid rgba(255,255,255,.06);box-shadow:0 1px 0 rgba(0,0,0,.6)}
  #lobby .lb-logo{display:flex;align-items:center;gap:${U(10)};font-weight:900;font-style:italic;font-size:${U(28)};letter-spacing:.01em;white-space:nowrap;text-transform:uppercase;line-height:1}
  #lobby .lb-logo .lb-mark{width:${U(34)};height:${U(29)}}
  #lobby .lb-mark{color:var(--acc)}
  #lobby .lb-logo b{color:var(--acc);font-weight:900}
  #lobby .lb-tabs{display:flex;align-items:stretch;gap:${U(2)};flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:${U(18)}}
  #lobby .lb-tabs::-webkit-scrollbar{display:none}
  #lobby .lb-tabs button{position:relative;background:none;border:0;border-radius:0;color:var(--mut);font-weight:700;font-size:${U(17)};letter-spacing:.1em;padding:0 ${U(18)};cursor:pointer;white-space:nowrap;transition:color .15s}
  #lobby .lb-tabs button::after{content:'';position:absolute;left:${U(14)};right:${U(14)};bottom:0;height:${U(2)};background:var(--acc);transform:scaleX(0);transition:transform .2s}
  #lobby .lb-tabs button:hover{color:var(--tx)}
  #lobby .lb-tabs button.on{color:var(--tx)}
  #lobby .lb-tabs button.on::after{transform:none}
  #lobby .lb-tr{display:flex;align-items:center;gap:${U(12)};font-size:${U(20)}}
  #lobby .lb-ib{background:none;border:0;border-radius:var(--r);padding:${U(6)};cursor:pointer;color:var(--mut);display:flex;align-items:center;transition:color .15s,background .15s}
  #lobby .lb-ib:hover{color:var(--tx);background:rgba(255,255,255,.06)}
  #lobby .lb-cnt{display:flex;align-items:center;gap:${U(7)};font-size:${U(16)};font-weight:700;letter-spacing:.06em;color:var(--tx2)}
  #lobby .lb-cnt .ic{color:var(--mut)}
  #lobby .lb-me{width:${U(38)};height:${U(38)};padding:0;border-radius:var(--r);border:1px solid var(--ln2);background:#1a1b1c center top/cover no-repeat;cursor:pointer;transition:border-color .15s}
  #lobby .lb-me:hover{border-color:var(--acc)}

  #lobby .lb-left{position:absolute;left:${U(26)};top:${U(82)};bottom:${U(18)};width:${U(400)};display:flex;flex-direction:column;pointer-events:none}
  #lobby .lb-left > *{pointer-events:auto}
  #lobby .lb-modeb{display:flex;align-items:center;gap:${U(16)};cursor:pointer;animation:lbIn .5s both .05s}
  #lobby .lb-emb{width:${U(64)};height:${U(64)};flex:none;border-radius:var(--r);display:flex;align-items:center;justify-content:center;font-size:${U(38)};color:var(--tx);position:relative;
    background:rgba(13,14,15,.85);border:1px solid var(--ln2);box-shadow:0 0 0 1px rgba(0,0,0,.5);transition:border-color .15s}
  #lobby .lb-emb::after{content:'';position:absolute;left:-1px;right:-1px;bottom:-1px;height:${U(2)};background:var(--acc)}
  #lobby .lb-modeb:hover .lb-emb{border-color:rgba(255,255,255,.28)}
  #lobby .lb-mt{min-width:0}
  #lobby .lb-mt b{display:block;font-size:${U(46)};font-weight:800;line-height:.95;text-transform:uppercase;letter-spacing:.01em;white-space:nowrap;text-shadow:0 ${U(2)} ${U(12)} rgba(0,0,0,.5)}
  #lobby .lb-mt small{display:block;margin-top:${U(6)};font-size:${U(17)};font-weight:600;color:var(--tx2);text-shadow:0 1px ${U(4)} rgba(0,0,0,.8)}
  #lobby .lb-map{margin-top:${U(16)};width:${U(290)};height:${U(68)};display:flex;align-items:stretch;border-radius:var(--r);overflow:hidden;cursor:pointer;border:1px solid var(--ln);background:var(--p);
    box-shadow:0 0 0 1px rgba(0,0,0,.45);transition:border-color .15s,background .15s;animation:lbIn .5s both .1s;text-align:left;padding:0}
  #lobby .lb-map:hover{border-color:rgba(255,255,255,.22);background:rgba(22,23,24,.85)}
  #lobby .lb-map .th{width:${U(108)};flex:none;background:url(lobby/arena-bg.jpg) 70% 62%/400% auto no-repeat;position:relative;filter:saturate(.7) brightness(.85)}
  #lobby .lb-map .tx{display:flex;align-items:center;gap:${U(10)};padding:0 ${U(14)}}
  #lobby .lb-map .tx .ic{font-size:${U(20)};color:var(--acc)}
  #lobby .lb-map b{display:block;font-size:${U(22)};font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1}
  #lobby .lb-map small{display:block;font-size:${U(13)};font-weight:700;color:var(--mut);letter-spacing:.12em;margin-top:${U(4)}}
  #lobby .lb-sp{flex:1;min-height:${U(12)}}

  #lobby .lb-pn{position:relative;background:var(--p);border:1px solid var(--ln);border-radius:var(--r);box-shadow:0 0 0 1px rgba(0,0,0,.45),0 ${U(10)} ${U(28)} rgba(0,0,0,.3);
    backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
  #lobby .lb-ph{display:flex;align-items:center;justify-content:space-between;gap:${U(10)};padding:${U(11)} ${U(16)};border-bottom:1px solid var(--ln);background:rgba(255,255,255,.02);
    font-size:${U(16)};font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  #lobby .lb-ph .t{display:flex;align-items:center;gap:${U(9)}}
  #lobby .lb-ph .t::before{content:'';width:${U(3)};height:${U(13)};background:var(--acc);flex:none}
  #lobby .lb-ph .t .ic{font-size:${U(18)};color:var(--mut)}
  #lobby .lb-ph .r{display:flex;align-items:center;gap:${U(6)};font-size:${U(14)};font-weight:600;letter-spacing:.04em;color:var(--mut);text-transform:none}
  #lobby .lb-ph .r .ic{font-size:${U(15)}}
  #lobby .lb-daily{animation:lbIn .5s both .16s;cursor:pointer;transition:border-color .15s}
  #lobby .lb-daily:hover{border-color:rgba(255,255,255,.18)}
  #lobby .lb-ch{display:flex;align-items:center;gap:${U(14)};padding:${U(11)} ${U(16)};border-bottom:1px solid rgba(255,255,255,.045)}
  #lobby .lb-ch:last-child{border-bottom:0}
  #lobby .lb-xp{width:${U(36)};height:${U(40)};flex:none;position:relative;display:flex;align-items:center;justify-content:center;font-size:${U(13)};font-weight:800;letter-spacing:.02em;color:var(--tx2)}
  #lobby .lb-xp svg{position:absolute;inset:0;width:100%;height:100%}
  #lobby .lb-xp span{position:relative}
  #lobby .lb-ch .tx{flex:1;min-width:0}
  #lobby .lb-ch .t{display:flex;justify-content:space-between;gap:${U(8)};font-size:${U(16)};font-weight:600;line-height:1.1}
  #lobby .lb-ch .t span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #lobby .lb-ch .t em{font-style:normal;color:var(--mut);font-weight:600;font-size:${U(14)}}
  #lobby .lb-bar{height:${U(3)};margin-top:${U(8)};background:rgba(255,255,255,.09);overflow:hidden}
  #lobby .lb-bar i{display:block;height:100%;background:#cfccc4;transition:width .8s}
  #lobby .done .lb-bar i,#lobby .lb-bar.acc i{background:var(--acc)}
  #lobby .lb-ch .xpv{width:${U(80)};flex:none;text-align:right;font-size:${U(16)};font-weight:700;color:var(--tx);white-space:nowrap}
  #lobby .lb-ch.done .xpv{color:var(--acc)}
  #lobby .lb-ch.done .t span{color:var(--mut)}

  #lobby .lb-fill{display:flex;align-items:center;gap:${U(10)};margin:${U(12)} 0 ${U(10)};padding:${U(7)} ${U(12)} ${U(7)} ${U(14)};background:var(--p);border:1px solid var(--ln);border-radius:var(--r);
    box-shadow:0 0 0 1px rgba(0,0,0,.45);font-size:${U(15)};font-weight:700;letter-spacing:.12em;animation:lbIn .5s both .22s}
  #lobby .lb-fill > .ic{font-size:${U(18)};color:var(--mut)}
  #lobby .lb-fill .sw{margin-left:auto;background:none;border:0;cursor:pointer;font-size:${U(15)};font-weight:800;letter-spacing:.1em;padding:${U(2)} ${U(6)};border-radius:var(--r)}
  #lobby .lb-fill .sw.on{color:var(--acc)} #lobby .lb-fill .sw:not(.on){color:var(--mut)}
  #lobby .lb-fill .sw:hover{background:rgba(255,255,255,.06)}
  #lobby .lb-fill .lb-ib{font-size:${U(17)};padding:${U(3)}}
  #lobby .lb-net{margin-top:${U(-4)};animation-delay:.25s}
  #lobby .lb-net .st{flex:1;min-width:0;text-align:left;background:none;border:0;padding:${U(2)} ${U(4)};cursor:pointer;color:var(--mut);font-size:${U(13)};font-weight:700;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #lobby .lb-net .st:hover{color:var(--tx)}
  #lobby .lb-net .st b{color:#3fe08a} #lobby .lb-net .st em{font-style:normal;color:var(--tx)}
  #lobby .lb-net .sw{margin-left:0}
  #lobby .lb-inv{display:none;align-items:center;gap:${U(5)};background:var(--accd);border:1px solid rgba(239,138,44,.55);color:var(--tx);border-radius:var(--r);cursor:pointer;font-size:${U(12)};font-weight:800;letter-spacing:.1em;padding:${U(3)} ${U(9)}}
  #lobby .lb-inv:hover{background:rgba(239,138,44,.32)}
  #lobby.online .lb-inv{display:flex}
  #lobby.online .lb-fill:not(.lb-net) .sqf,#lobby.online #lbFill{display:none}
  #lobby .lb-fill .onl{display:none;flex:1;font-size:${U(13)};font-weight:700;letter-spacing:.08em;color:var(--mut)}
  #lobby.online .lb-fill .onl{display:block}
  #lobby.netin .lb-leave{display:block}
  #lobby .lb-onl label{display:block;margin:${U(14)} 0 ${U(6)};font-size:${U(13)};font-weight:800;letter-spacing:.12em;color:var(--mut)}
  #lobby .lb-onl .row{display:flex;gap:${U(8)};align-items:center}
  #lobby .lb-onl input{flex:1;min-width:0;background:rgba(255,255,255,.04);border:1px solid var(--ln2);border-radius:var(--r);color:var(--tx);padding:${U(9)} ${U(11)};font:inherit;font-size:${U(15)}}
  #lobby .lb-onl input.code{flex:none;width:${U(150)};text-transform:uppercase;letter-spacing:.3em;font-weight:800}
  #lobby .lb-onl button.b{flex:none;background:rgba(255,255,255,.06);border:1px solid var(--ln2);border-radius:var(--r);color:var(--tx);cursor:pointer;padding:${U(9)} ${U(16)};font-size:${U(14)};font-weight:800;letter-spacing:.1em}
  #lobby .lb-onl button.b.acc{background:var(--acc);border-color:var(--acc);color:#121110}
  #lobby .lb-onl button.b:hover{filter:brightness(1.15)}
  #lobby .lb-onl .big{font-size:${U(44)};font-weight:900;letter-spacing:.28em;color:var(--tx);line-height:1}
  #lobby .lb-onl p{margin:${U(8)} 0 0;font-size:${U(14)};color:var(--mut);line-height:1.45}
  #lobby .lb-onl p b{color:var(--tx2)}
  #lobby .lb-leave{display:none;background:rgba(200,70,60,.12);border:1px solid rgba(220,90,80,.45);color:#e7a49e;border-radius:var(--r);cursor:pointer;font-size:${U(13)};font-weight:800;letter-spacing:.1em;padding:${U(3)} ${U(10)}}
  #lobby .lb-leave:hover{background:rgba(200,70,60,.22)}
  #lobby.paused .lb-leave{display:block}
  #lobby .lb-play{position:relative;display:block;width:${U(400)};height:${U(118)};margin:0;padding:0;border:0;border-radius:0;background:none;cursor:pointer;color:#121110;text-align:left;animation:lbIn .5s both .28s;
    filter:drop-shadow(0 ${U(8)} ${U(18)} rgba(0,0,0,.5));transition:transform .12s,filter .15s}
  #lobby .lb-play:hover{filter:drop-shadow(0 ${U(8)} ${U(18)} rgba(0,0,0,.5)) brightness(1.07)}
  #lobby .lb-play:active{transform:scale(.99)}
  #lobby .lb-play svg.brush{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
  #lobby .lb-play .pt{position:absolute;left:${U(34)};top:${U(8)};display:flex;align-items:center;gap:${U(16)};font-size:${U(84)};font-weight:900;font-style:italic;line-height:1;letter-spacing:.01em}
  #lobby .lb-play .pt .ic{font-size:${U(46)}}
  #lobby .lb-play small{position:absolute;left:${U(40)};right:${U(30)};bottom:${U(15)};font-size:${U(16)};font-weight:800;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgba(18,17,16,.82)}
  #lobby .lb-chat{position:relative;display:flex;align-items:center;gap:${U(10)};margin-top:${U(12)};width:${U(320)};padding:${U(7)} ${U(12)};background:var(--p);border:1px solid var(--ln);border-radius:var(--r);
    box-shadow:0 0 0 1px rgba(0,0,0,.45);font-size:${U(18)};color:var(--mut);animation:lbIn .5s both .32s}
  #lobby .lb-chat input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--tx);font:inherit;font-size:${U(15)};font-weight:600;letter-spacing:.03em}
  #lobby .lb-chat input::placeholder{color:var(--mut)}
  #lobby .lb-chat:focus-within{border-color:rgba(255,255,255,.25)}
  #lobby .lb-chatlog{position:absolute;left:0;bottom:calc(100% + ${U(8)});width:${U(400)};display:flex;flex-direction:column;gap:${U(3)};pointer-events:none}
  #lobby .lb-chatlog div{font-size:${U(15)};font-weight:600;color:var(--tx);text-shadow:0 1px 2px #000;background:linear-gradient(90deg,rgba(0,0,0,.6),transparent);padding:${U(2)} ${U(8)};transition:opacity .6s}
  #lobby .lb-chatlog b{margin-right:${U(6)}}

  #lobby .lb-right{position:absolute;right:${U(24)};top:${U(82)};width:${U(340)};display:flex;flex-direction:column;gap:${U(16)}}
  #lobby .lb-squad{animation:lbIn .5s both .1s}
  #lobby .lb-sq{display:flex;align-items:center;gap:${U(12)};padding:${U(8)} ${U(14)} ${U(8)} ${U(12)};border-bottom:1px solid rgba(255,255,255,.045);position:relative;transition:opacity .4s}
  #lobby .lb-sq:last-child{border-bottom:0}
  #lobby .lb-sq::before{content:'';position:absolute;left:0;top:${U(8)};bottom:${U(8)};width:${U(2)};background:var(--c)}
  #lobby .lb-sq .av{width:${U(40)};height:${U(40)};flex:none;border-radius:var(--r);background:#1a1b1c center/cover no-repeat;border:1px solid var(--ln2)}
  #lobby .lb-sq .nm{flex:1;min-width:0}
  #lobby .lb-sq .nm b{display:flex;align-items:center;gap:${U(6)};font-size:${U(17)};font-weight:700;letter-spacing:.04em;white-space:nowrap;overflow:hidden}
  #lobby .lb-sq .nm b .ic{color:var(--acc);font-size:${U(15)}}
  #lobby .lb-sq .nm small{display:flex;align-items:center;gap:${U(6)};font-size:${U(13)};font-weight:600;letter-spacing:.04em;color:var(--ok)}
  #lobby .lb-sq .nm small i{width:${U(6)};height:${U(6)};border-radius:50%;background:currentColor}
  #lobby .lb-sq .hs{font-size:${U(17)};color:var(--dim)}
  #lobby .lb-sq.wait .nm small{color:var(--mut)} #lobby .lb-sq.wait .nm small i{animation:lbpulse 1s infinite}
  #lobby .lb-sq.open{opacity:.55} #lobby .lb-sq.open .av{display:flex;align-items:center;justify-content:center;font-size:${U(20)};color:var(--mut);background:rgba(255,255,255,.03)}
  #lobby .lb-sets{animation:lbIn .5s both .16s}
  #lobby .lb-row{display:flex;align-items:center;width:100%;gap:${U(8)};padding:${U(10)} ${U(14)} ${U(10)} ${U(16)};background:none;border:0;border-radius:0;border-bottom:1px solid rgba(255,255,255,.045);cursor:pointer;text-align:left;transition:background .12s}
  #lobby .lb-row:last-child{border-bottom:0}
  #lobby .lb-row:hover{background:rgba(255,255,255,.04)}
  #lobby .lb-row span{flex:1;font-size:${U(13)};font-weight:700;letter-spacing:.12em;color:var(--mut);text-transform:uppercase}
  #lobby .lb-row b{font-size:${U(16)};font-weight:600;letter-spacing:.03em;color:var(--tx)}
  #lobby .lb-row b.on{color:var(--acc)}
  #lobby .lb-row .ic{font-size:${U(15)};color:var(--dim)}
  #lobby .lb-row:hover .ic{color:var(--tx2)}
  #lobby .lb-row.locked{cursor:default} #lobby .lb-row.locked:hover{background:none} #lobby .lb-row.locked b{color:var(--mut)}

  #lobby .lb-dock{position:absolute;left:${U(452)};right:${U(392)};bottom:${U(26)};display:flex;justify-content:center;gap:${U(10)};pointer-events:none}
  #lobby .lb-dk{pointer-events:auto;position:relative;width:${U(162)};height:${U(112)};padding:0;border-radius:var(--r);overflow:hidden;cursor:pointer;border:1px solid var(--ln);
    background:rgba(13,14,15,.86);box-shadow:0 0 0 1px rgba(0,0,0,.5),0 ${U(8)} ${U(20)} rgba(0,0,0,.35);transition:transform .15s,border-color .15s,background .15s;animation:lbIn .5s both var(--d)}
  #lobby .lb-dk::after{content:'';position:absolute;left:0;right:0;bottom:0;height:${U(2)};background:var(--acc);transform:scaleX(0);transition:transform .2s}
  #lobby .lb-dk:hover{transform:translateY(${U(-3)});border-color:rgba(255,255,255,.2);background:rgba(20,21,22,.92)}
  #lobby .lb-dk:hover::after{transform:none}
  #lobby .lb-dk .art{position:absolute;left:0;right:0;top:0;bottom:${U(34)};display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at 50% 100%,rgba(255,255,255,.05),transparent 70%)}
  #lobby .lb-dk .art img{max-width:90%;max-height:90%;object-fit:contain;filter:saturate(.82) brightness(.95) drop-shadow(0 ${U(4)} ${U(6)} rgba(0,0,0,.6))}
  #lobby .lb-dk .art img.op{max-width:none;max-height:none;width:100%;height:auto;align-self:flex-start;margin-top:${U(-4)};transform:scale(1.9);transform-origin:50% 8%}
  #lobby .lb-dk .art svg{width:72%;height:82%}
  #lobby .lb-dk .cap{position:absolute;left:${U(8)};top:${U(6)};z-index:1;font-size:${U(12)};font-weight:700;letter-spacing:.1em;color:var(--tx2);text-shadow:0 1px 2px #000;text-transform:uppercase}
  #lobby .lb-dk .lab{position:absolute;left:0;right:0;bottom:0;height:${U(34)};display:flex;align-items:center;justify-content:center;gap:${U(7)};font-size:${U(15)};font-weight:700;letter-spacing:.12em;
    background:rgba(0,0,0,.35);border-top:1px solid var(--ln);color:var(--tx2)}
  #lobby .lb-dk:hover .lab{color:var(--tx)}
  #lobby .lb-dk .lab .ic{font-size:${U(16)}}
  #lobby .lb-dk .tier{position:absolute;left:0;right:0;bottom:${U(34)};text-align:center;font-size:${U(13)};font-weight:700;letter-spacing:.08em;color:var(--mut)}
  #lobby .lb-dk .tbar{position:absolute;left:${U(12)};right:${U(12)};bottom:${U(6)};height:${U(3)};background:rgba(255,255,255,.12);overflow:hidden}
  #lobby .lb-dk .tbar i{display:block;height:100%;background:var(--acc)}
  #lobby .lb-dk.pass .lab{bottom:${U(10)};background:none;border:0;height:${U(26)}} #lobby .lb-dk.pass .art{bottom:${U(52)}}
  #lobby .lb-brand{position:absolute;right:${U(30)};bottom:${U(30)};text-align:right;font-weight:900;font-style:italic;font-size:${U(34)};line-height:.92;text-transform:uppercase;letter-spacing:.01em;color:var(--tx);
    transform:rotate(-6deg);text-shadow:0 ${U(2)} 0 rgba(0,0,0,.55),0 0 ${U(14)} rgba(0,0,0,.5);pointer-events:none;animation:lbIn .6s both .4s}
  #lobby .lb-brand span{display:block}
  #lobby .lb-brand span:last-of-type{margin-right:${U(-10)}}
  #lobby .lb-brand .lb-mark{width:${U(26)};height:${U(22)};display:inline-block;margin:${U(6)} ${U(16)} 0 0}
  #lobby .lb-build{position:absolute;left:50%;bottom:${U(4)};transform:translateX(-50%);font-size:10px;color:var(--dim);letter-spacing:.14em;pointer-events:none}

  #lobby .lb-tag{position:absolute;left:0;top:0;pointer-events:none;text-align:center;white-space:nowrap;transition:opacity .4s;will-change:transform}
  #lobby .lb-tag .pl{position:relative;display:inline-flex;align-items:center;gap:${U(7)};padding:${U(4)} ${U(10)} ${U(4)} ${U(12)};background:rgba(10,11,12,.82);border:1px solid var(--ln2);border-radius:var(--r);
    font-size:${U(16)};font-weight:700;letter-spacing:.05em;box-shadow:0 ${U(3)} ${U(10)} rgba(0,0,0,.35)}
  #lobby .lb-tag .pl .ic{font-size:${U(13)};color:var(--mut)}
  #lobby .lb-tag.me .pl{font-size:${U(18)}}
  #lobby .lb-tag.me .pl .ic.cr{color:var(--acc);font-size:${U(16)}}
  #lobby .lb-tag small{display:block;margin-top:${U(3)};font-size:${U(12)};font-weight:700;letter-spacing:.14em;color:var(--tx2);text-shadow:0 1px 3px #000}
  #lobby .lb-tag .bar{position:absolute;left:-1px;top:-1px;bottom:-1px;width:${U(2)};background:var(--c)}
  @keyframes lbpulse{50%{opacity:.25}} @keyframes lbIn{from{opacity:0;transform:translateY(${U(10)})}to{opacity:1;transform:none}}

  /* pickers (match type, map) */
  #lobby .lb-sheet{position:absolute;left:50%;top:50%;width:min(${U(900)},92vw);max-height:78vh;overflow:auto;transform:translate(-50%,-48%);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;
    background:rgba(15,16,17,.97);border:1px solid var(--ln2);border-radius:var(--r);padding:${U(18)} ${U(22)};box-shadow:0 0 0 1px rgba(0,0,0,.6),0 ${U(20)} ${U(60)} rgba(0,0,0,.7);z-index:6;box-sizing:border-box}
  #lobby .lb-sheet.on{opacity:1;transform:translate(-50%,-50%);pointer-events:auto}
  #lobby .lb-sheet h3{margin:0 0 ${U(14)};font-size:${U(24)};font-weight:800;letter-spacing:.08em;display:flex;justify-content:space-between;align-items:center;text-transform:uppercase}
  #lobby .lb-x{display:flex;align-items:center;gap:${U(6)};background:rgba(255,255,255,.04);border:1px solid var(--ln2);border-radius:var(--r);padding:${U(6)} ${U(12)};cursor:pointer;font-size:${U(14)};font-weight:700;letter-spacing:.12em;color:var(--tx2)}
  #lobby .lb-x:hover{border-color:rgba(255,255,255,.3);color:var(--tx)}
  #lobby .lb-x .ic{font-size:${U(15)}}
  #lobby h4{margin:${U(16)} 0 ${U(8)};letter-spacing:.14em;font-size:${U(14)};font-weight:700;color:var(--mut)}
  #lobby .lb-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(${U(200)},1fr));gap:${U(8)}}
  #lobby .lb-card{position:relative;border:1px solid var(--ln);border-radius:var(--r);padding:${U(12)} ${U(14)};background:var(--p2);cursor:pointer;text-align:left;color:var(--tx);transition:border-color .12s,background .12s}
  #lobby .lb-card:hover{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.05)}
  #lobby .lb-card b{display:flex;align-items:center;gap:${U(8)};font-size:${U(19)};font-weight:700;letter-spacing:.04em;text-transform:uppercase}
  #lobby .lb-card b .ic{font-size:${U(20)};color:var(--mut)}
  #lobby .lb-card small{color:var(--mut);font-size:${U(14)};font-weight:600;line-height:1.3;display:block;margin-top:${U(5)}}
  #lobby .lb-card.on{border-color:rgba(239,138,44,.7);background:var(--accd);box-shadow:inset ${U(3)} 0 0 var(--acc)}
  #lobby .lb-card.on b .ic{color:var(--acc)}
  #lobby .lb-note{font-size:${U(15)};font-weight:600;color:var(--mut);margin:0 0 ${U(8)};line-height:1.35}
  #lobby .lb-note b{color:var(--tx)}
  #lobby .lb-btn{display:inline-flex;align-items:center;justify-content:center;gap:${U(8)};background:var(--acc);color:#121110;border:1px solid var(--acc);border-radius:var(--r);padding:${U(9)} ${U(18)};font-size:${U(15)};font-weight:800;letter-spacing:.12em;cursor:pointer;margin:${U(10)} ${U(8)} 0 0;transition:background .12s}
  #lobby .lb-btn:hover{background:var(--acc2)}
  #lobby .lb-btn.gh{background:rgba(255,255,255,.04);color:var(--tx);border-color:var(--ln2)}
  #lobby .lb-btn.gh:hover{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.07)}
  #lobby .lb-btn:disabled{background:rgba(255,255,255,.04);border-color:var(--ln);color:var(--mut)}
  #lobby .lb-btn .ic{font-size:${U(16)}}
  #lobby .lb-fade{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .35s;z-index:9}
  #lobby .lb-scrim{position:absolute;inset:0;background:rgba(4,5,6,.6);opacity:0;pointer-events:none;transition:opacity .2s;z-index:5}
  #lobby.sheet .lb-scrim{opacity:1;pointer-events:auto}
  #lobby #lbTags{transition:opacity .25s} #lobby.sheet #lbTags{opacity:0}
  #lobby .netrow{display:flex;gap:${U(6)};margin:0 0 ${U(6)}}
  #lobby .netrow input{flex:1;min-width:0;background:rgba(255,255,255,.04);border:1px solid var(--ln2);border-radius:var(--r);color:var(--tx);padding:${U(8)} ${U(10)};font:inherit;font-size:${U(15)}}
  #lobby .netrow button{flex:none;background:rgba(255,255,255,.05);border:1px solid var(--ln2);border-radius:var(--r);padding:${U(8)} ${U(16)};font-size:${U(15)};font-weight:700;letter-spacing:.1em}
  #lobby .netnote{font-size:${U(13)};color:var(--mut);margin:0}

  /* full screens: LOADOUT, OPERATORS, BATTLE PASS, STORE, SETTINGS */
  #lobby .lb-scr{position:absolute;left:0;right:0;top:${U(60)};bottom:0;z-index:3;display:none;flex-direction:column;box-sizing:border-box;padding:${U(24)} ${U(36)} ${U(22)};
    background:linear-gradient(90deg,rgba(9,10,11,.95),rgba(9,10,11,.86) 50%,rgba(9,10,11,.95));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
  #lobby .lb-scr.on{display:flex;animation:lbFade .2s both}
  @keyframes lbFade{from{opacity:0}to{opacity:1}}
  #lobby.scr .lb-left,#lobby.scr .lb-right,#lobby.scr .lb-dock,#lobby.scr .lb-brand,#lobby.scr #lbTags,#lobby.scr .lb-stage,#lobby.scr #lbCanvas{visibility:hidden}
  #lobby .lb-sh{display:flex;align-items:flex-end;justify-content:space-between;gap:${U(20)};padding-bottom:${U(16)};border-bottom:1px solid var(--ln)}
  #lobby .lb-sh h2{margin:0;font-size:${U(38)};font-weight:800;letter-spacing:.03em;line-height:1;text-transform:uppercase}
  #lobby .lb-sh p{margin:${U(6)} 0 0;font-size:${U(16)};font-weight:600;color:var(--mut);max-width:${U(900)}}
  #lobby .lb-sh .act{display:flex;gap:${U(8)};align-items:center}
  #lobby .lb-sh .act .lb-btn{margin:0}
  #lobby .lb-sb{flex:1;min-height:0;display:grid;gap:${U(16)};margin-top:${U(16)}}
  #lobby .lb-sb.lo{grid-template-columns:${U(330)} minmax(0,1fr) ${U(440)}}
  #lobby .lb-sb.ops{grid-template-columns:${U(340)} minmax(0,1fr) ${U(420)}}
  #lobby .lb-sb.st{grid-template-columns:minmax(0,1fr) ${U(440)}}
  #lobby .lb-sb.bp{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto minmax(0,1fr)}
  #lobby .lb-sb.set{grid-template-columns:minmax(0,1fr)}
  #lobby .lb-col{display:flex;flex-direction:column;gap:${U(14)};min-height:0;min-width:0}
  #lobby .lb-blk{background:rgba(255,255,255,.022);border:1px solid var(--ln);border-radius:var(--r);display:flex;flex-direction:column;min-height:0}
  #lobby .lb-blk.grow{flex:1}
  #lobby .lb-bh{display:flex;align-items:center;justify-content:space-between;gap:${U(10)};padding:${U(10)} ${U(14)};border-bottom:1px solid var(--ln);font-size:${U(14)};font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--tx2)}
  #lobby .lb-bh > span:first-child{display:flex;align-items:center;gap:${U(8)}}
  #lobby .lb-bh > span:first-child::before{content:'';width:${U(3)};height:${U(12)};background:var(--acc)}
  #lobby .lb-bh > :not(:first-child){font-size:${U(13)};letter-spacing:.06em;color:var(--mut);text-transform:none;font-weight:600}
  #lobby .lb-bb{padding:${U(12)} ${U(14)};overflow:auto;min-height:0;flex:1}
  #lobby .lb-scr ::-webkit-scrollbar{width:${U(6)};height:${U(6)}} #lobby .lb-scr ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14)} #lobby .lb-scr ::-webkit-scrollbar-track{background:transparent}
  #lobby .lb-scr *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.14) transparent}
  #lobby .lb-scr .lbl{display:none}
  #lobby .lb-view{position:relative}
  #lobby .lb-cv{position:relative;flex:1;min-height:${U(220)};border:1px solid var(--ln);border-radius:var(--r);overflow:hidden;
    background:radial-gradient(ellipse at 50% 62%,rgba(255,255,255,.07),transparent 62%),linear-gradient(180deg,rgba(255,255,255,.015),rgba(0,0,0,.25))}
  #lobby .lb-cv::after{content:'';position:absolute;left:8%;right:8%;bottom:14%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);pointer-events:none}
  #lobby .lb-cv canvas#preview{position:absolute;inset:0;width:100%!important;height:100%!important;margin:0;border-radius:0;background:none;display:block}
  #lobby .lb-cv.art{display:flex;align-items:flex-end;justify-content:center}
  #lobby .lb-cv.art img{height:94%;width:auto;filter:brightness(.95) saturate(.85) drop-shadow(0 ${U(10)} ${U(16)} rgba(0,0,0,.55));position:relative;z-index:1}
  #lobby .lb-cv .fab{position:absolute;right:${U(14)};bottom:${U(14)};z-index:2;width:${U(120)};height:${U(120)};border:1px solid var(--ln2);border-radius:var(--r);box-shadow:0 0 0 1px rgba(0,0,0,.6),0 ${U(6)} ${U(16)} rgba(0,0,0,.5)}
  #lobby .lb-cv .fab::after{content:'PATTERN';position:absolute;left:0;right:0;bottom:${U(-20)};text-align:center;font-size:${U(11)};font-weight:700;letter-spacing:.16em;color:var(--mut)}
  #lobby .lb-cv .hint{position:absolute;left:${U(14)};top:${U(12)};z-index:2;font-size:${U(12)};font-weight:700;letter-spacing:.14em;color:var(--dim);text-transform:uppercase}
  /* the game's loadout controls, restyled in place */
  #lobby #prim,#lobby #sec,#lobby #ops{display:flex;flex-direction:column;gap:${U(4)}}
  #lobby #prim button,#lobby #sec button,#lobby #ops button{display:block;width:100%;opacity:1;filter:none;text-align:left;background:var(--p2);border:1px solid var(--ln);border-radius:var(--r);padding:${U(8)} ${U(12)};
    font-size:${U(17)};font-weight:700;letter-spacing:.04em;color:var(--tx);box-shadow:none;cursor:pointer;transition:border-color .12s,background .12s}
  #lobby #prim button small,#lobby #sec button small,#lobby #ops button small{display:block;opacity:1;font-size:${U(12)};font-weight:700;letter-spacing:.12em;color:var(--mut);text-transform:uppercase;margin-top:${U(2)}}
  #lobby #prim button:hover,#lobby #sec button:hover,#lobby #ops button:hover{border-color:rgba(255,255,255,.2);background-color:rgba(255,255,255,.05)}
  #lobby #prim button.focus,#lobby #sec button.focus{border-color:rgba(255,255,255,.3)}
  #lobby #prim button.on,#lobby #sec button.on,#lobby #ops button.on{background-color:var(--accd);border-color:rgba(239,138,44,.55);box-shadow:inset ${U(3)} 0 0 var(--acc)}
  #lobby #prim button.locked,#lobby #sec button.locked{color:var(--mut);background-color:rgba(255,255,255,.012)}
  #lobby #ops button{position:relative;min-height:${U(84)};padding-left:${U(96)};display:flex;flex-direction:column;justify-content:center;font-size:${U(24)};font-weight:800;letter-spacing:.06em;
    background-repeat:no-repeat;background-size:${U(72)} ${U(72)};background-position:${U(8)} center}
  #lobby #ops button[data-op="vanguard"]{background-image:url(${ART.ranger.face})} #lobby #ops button[data-op="axiom"]{background-image:url(${ART.viper.face})}
  #lobby #ops button.on::after{content:'EQUIPPED';position:absolute;right:${U(10)};top:${U(8)};font-size:${U(11)};font-weight:800;letter-spacing:.14em;color:var(--acc)}
  #lobby .wsel,#lobby .lb-wt{display:flex;align-items:baseline;gap:${U(12)};flex-wrap:wrap}
  #lobby #wselName,#lobby #opName{font-size:${U(30)};font-weight:800;letter-spacing:.03em;text-transform:uppercase;line-height:1}
  #lobby #wselCls{font-size:${U(14)};font-weight:700;letter-spacing:.12em;color:var(--mut);text-transform:uppercase;opacity:1;margin:0}
  #lobby #lonote{font-size:${U(13)};font-weight:700;letter-spacing:.08em;color:var(--acc);text-transform:uppercase}
  #lobby #stats{display:grid;grid-template-columns:${U(96)} 1fr;gap:${U(7)} ${U(12)};align-items:center;margin:0;font-size:${U(13)}}
  #lobby #stats span{font-weight:700;letter-spacing:.12em;color:var(--mut);text-transform:uppercase}
  #lobby #stats i{display:block;height:${U(3)};margin:0;border-radius:0;background:rgba(255,255,255,.09)}
  #lobby #stats i b{background:#d6d3cc}
  #lobby .arow{display:grid;grid-template-columns:${U(96)} 1fr;gap:${U(8)};align-items:center;margin:0 0 ${U(8)}}
  #lobby .arow > span{font-size:${U(12)};font-weight:700;letter-spacing:.12em;color:var(--mut);opacity:1}
  #lobby .achips{display:flex;gap:${U(4)};flex-wrap:wrap}
  #lobby .achips button{opacity:1;filter:none;background:var(--p2);border:1px solid var(--ln);border-radius:var(--r);padding:${U(5)} ${U(10)};font-size:${U(14)};font-weight:600;letter-spacing:.03em;color:var(--tx);cursor:pointer}
  #lobby .achips button:hover{border-color:rgba(255,255,255,.22)}
  #lobby .achips button.on{background:var(--accd);border-color:rgba(239,138,44,.6)}
  #lobby .achips button.locked{color:var(--dim);background:none}
  #lobby .achips button small{font-size:${U(11)};color:var(--mut);opacity:1}
  #lobby #anote,#lobby #skReq{font-size:${U(13)};font-weight:600;color:var(--mut);opacity:1;margin:${U(4)} 0 0;min-height:${U(16)};line-height:1.35}
  #lobby #skReq b{color:var(--tx)}
  #lobby #camoName{color:var(--tx2)}
  #lobby .camos,#lobby .skins{display:grid;grid-template-columns:repeat(auto-fill,minmax(${U(46)},1fr));gap:${U(5)}}
  #lobby .skins{grid-template-columns:repeat(auto-fill,minmax(${U(58)},1fr))}
  #lobby .camos button,#lobby .skins button{height:${U(46)};padding:0;border-radius:var(--r);border:1px solid rgba(0,0,0,.6)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)!important;background-size:cover;position:relative;cursor:pointer;opacity:1}
  #lobby .skins button{height:${U(58)}}
  #lobby .camos button:hover,#lobby .skins button:hover{box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)!important}
  #lobby .camos button.on,#lobby .skins button.on{outline:${U(2)} solid var(--tx);outline-offset:${U(1)}}
  #lobby .camos button.locked,#lobby .skins button.locked{filter:grayscale(.85) brightness(.4)}
  #lobby .camos button.locked::after,#lobby .skins button.locked::after{content:'';position:absolute;inset:0;margin:auto;width:${U(14)};height:${U(14)};background:${LOCK_URL} center/contain no-repeat;filter:none;font-size:0}
  #lobby .skins button.new::before{background:var(--acc);color:#121110;border-radius:0;font-size:${U(10)};left:${U(-3)};top:${U(-5)}}
  #lobby .ic.lki{display:inline-block;vertical-align:-.12em;margin-right:.35em;font-size:.82em;color:var(--mut)}
  #lobby .lb-opinfo{display:flex;flex-direction:column;gap:${U(6)}}
  #lobby #opSkinName{font-size:${U(15)};font-weight:600;color:var(--tx2)}
  #lobby #opSkinName span{color:var(--mut)!important}
  #lobby #skCount{font-size:${U(13)}}
  #lobby .lb-chips{display:flex;gap:${U(4)};margin:0 0 ${U(10)}}
  #lobby .lb-chips button{background:none;border:1px solid var(--ln);border-radius:var(--r);padding:${U(4)} ${U(12)};font-size:${U(13)};font-weight:700;letter-spacing:.12em;color:var(--mut);cursor:pointer}
  #lobby .lb-chips button:hover{color:var(--tx)}
  #lobby .lb-chips button.on{color:var(--tx);border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.05)}
  #lobby .lb-skgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(${U(150)},1fr));gap:${U(8)}}
  #lobby .lb-sk{position:relative;display:flex;flex-direction:column;gap:${U(3)};text-align:left;background:var(--p2);border:1px solid var(--ln);border-radius:var(--r);padding:${U(6)} ${U(6)} ${U(9)};cursor:pointer;transition:border-color .12s,background .12s}
  #lobby .lb-sk:hover{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.05)}
  #lobby .lb-sk.on{border-color:rgba(255,255,255,.5)}
  #lobby .lb-sk i{display:block;height:${U(64)};border-radius:${U(2)};margin-bottom:${U(5)};box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
  #lobby .lb-sk.lk i{filter:grayscale(.7) brightness(.55)}
  #lobby .lb-sk b{font-size:${U(15)};font-weight:700;letter-spacing:.03em;padding:0 ${U(4)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #lobby .lb-sk small{display:flex;align-items:center;gap:${U(5)};padding:0 ${U(4)};font-size:${U(12)};font-weight:700;letter-spacing:.08em;color:var(--mut);text-transform:uppercase;white-space:nowrap;overflow:hidden}
  #lobby .lb-sk small .ic{font-size:${U(12)};flex:none}
  #lobby .lb-sk.eq small{color:var(--acc)}
  #lobby .lb-sk.own small{color:var(--ok)}
  #lobby .lb-sk em{position:absolute;right:${U(10)};top:${U(10)};font-style:normal;font-size:${U(10)};font-weight:800;letter-spacing:.14em;text-transform:uppercase;background:rgba(0,0,0,.6);padding:${U(1)} ${U(5)};color:var(--c)}
  #lobby .lb-info b.nm{display:block;font-size:${U(26)};font-weight:800;letter-spacing:.03em;text-transform:uppercase;line-height:1.05}
  #lobby .lb-info .tg{display:flex;gap:${U(10)};margin:${U(4)} 0 ${U(8)};font-size:${U(13)};font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
  #lobby .lb-info .req{font-size:${U(15)};font-weight:600;color:var(--tx2)}
  #lobby .lb-info .req .ic,#lobby .lb-btn .ic{display:inline-block}
  #lobby .lb-info .req .ic{vertical-align:-.12em;margin-right:${U(4)};color:var(--mut)}
  #lobby .lb-info .pr{display:flex;justify-content:space-between;font-size:${U(13)};font-weight:700;color:var(--mut);margin-top:${U(8)}}
  #lobby .lb-bph{display:flex;align-items:flex-end;gap:${U(30)};flex-wrap:wrap}
  #lobby .lb-bph .tn{font-size:${U(15)};font-weight:700;letter-spacing:.14em;color:var(--mut)}
  #lobby .lb-bph .tn b{font-size:${U(56)};font-weight:800;letter-spacing:0;color:var(--tx);line-height:.9;margin:0 ${U(6)}}
  #lobby .lb-bph .pg{flex:1;min-width:${U(320)}}
  #lobby .lb-bph .pg .lb-bar{height:${U(6)};margin:${U(8)} 0 ${U(6)}}
  #lobby .lb-bph .meta{display:flex;justify-content:space-between;gap:${U(10)};font-size:${U(14)};font-weight:600;color:var(--mut)}
  #lobby .lb-bph .meta b{color:var(--tx)}
  #lobby .lb-track{display:flex;gap:${U(6)};overflow-x:auto;padding:${U(2)} ${U(2)} ${U(10)}}
  #lobby .lb-tier{position:relative;flex:none;width:${U(112)};height:${U(150)};box-sizing:border-box;background:var(--p2);border:1px solid var(--ln);border-radius:var(--r);display:flex;flex-direction:column;align-items:center;padding:${U(8)} ${U(6)};text-align:center}
  #lobby .lb-tier::before{content:'';position:absolute;left:0;right:0;top:0;height:${U(3)};background:var(--rc)}
  #lobby .lb-tier .n{align-self:flex-start;font-size:${U(13)};font-weight:800;letter-spacing:.08em;color:var(--mut)}
  #lobby .lb-tier .ic.big{font-size:${U(40)};margin:${U(6)} 0 ${U(8)};color:var(--rc);opacity:.9}
  #lobby .lb-tier b{font-size:${U(14)};font-weight:700;letter-spacing:.06em;text-transform:uppercase}
  #lobby .lb-tier small{font-size:${U(12)};font-weight:600;color:var(--mut)}
  #lobby .lb-tier em{margin-top:auto;display:flex;align-items:center;gap:${U(4)};font-style:normal;font-size:${U(12)};font-weight:800;letter-spacing:.1em;color:var(--dim)}
  #lobby .lb-tier.got{background:rgba(255,255,255,.045)} #lobby .lb-tier.got em{color:var(--ok)}
  #lobby .lb-tier.nx{border-color:rgba(239,138,44,.6);box-shadow:inset 0 0 0 1px rgba(239,138,44,.25)} #lobby .lb-tier.nx em{color:var(--acc)}
  #lobby .lb-tier.lk .ic.big{opacity:.35}
  #lobby .lb-crow{display:flex;align-items:center;gap:${U(14)};padding:${U(10)} 0;border-bottom:1px solid rgba(255,255,255,.045)}
  #lobby .lb-crow:last-child{border-bottom:0}
  #lobby .lb-crow .tx{flex:1;min-width:0}
  #lobby .lb-crow .t{display:flex;justify-content:space-between;gap:${U(8)};font-size:${U(16)};font-weight:600}
  #lobby .lb-crow .t em{font-style:normal;color:var(--mut);font-size:${U(14)}}
  #lobby .lb-crow .xpv{flex:none;width:${U(96)};text-align:right;font-size:${U(15)};font-weight:700}
  #lobby .lb-crow.done .xpv{color:var(--acc)} #lobby .lb-crow.done .t span{color:var(--mut)}
  #lobby .lb-crow .ck{width:${U(22)};height:${U(22)};flex:none;border:1px solid var(--ln2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${U(13)};color:transparent}
  #lobby .lb-crow.done .ck{border-color:var(--acc);color:var(--acc)}
  /* the game's settings screen, restyled */
  #lobby #settingsView{display:block!important;min-height:0;color:var(--tx);font-size:${U(16)}}
  #lobby #setBack{display:none}
  #lobby .sethead{margin:0 0 ${U(14)};border-bottom:1px solid var(--ln)}
  #lobby .settabs{gap:0}
  #lobby .settabs button{background:none;border:0;border-radius:0;opacity:1;color:var(--mut);font-size:${U(16)};font-weight:700;letter-spacing:.1em;padding:${U(8)} ${U(16)};text-transform:uppercase;box-shadow:none}
  #lobby .settabs button:hover{color:var(--tx)}
  #lobby .settabs button.on{color:var(--tx);background:none;box-shadow:inset 0 ${U(-2)} 0 var(--acc)}
  #lobby .setgrid{font-size:${U(16)};gap:${U(8)} ${U(18)}}
  #lobby .setgrid label{color:var(--tx2)}
  #lobby .setsub{color:var(--mut);opacity:1;border-top-color:var(--ln);font-size:${U(13)};font-weight:700}
  #lobby .seg{display:inline-flex;justify-self:start;width:max-content;max-width:100%;flex-wrap:wrap;background:rgba(255,255,255,.035);border:1px solid var(--ln);border-radius:var(--r)}
  #lobby #setReset{background:rgba(255,255,255,.04);border:1px solid var(--ln2);border-radius:var(--r);color:var(--tx2);font-size:${U(14)};font-weight:700;letter-spacing:.08em;padding:${U(7)} ${U(14)}}
  #lobby #setReset:hover{border-color:rgba(255,255,255,.3);color:var(--tx)}
  #lobby .seg button{background:none;border:0;border-radius:0;opacity:1;color:var(--mut);font-size:${U(14)};font-weight:700;letter-spacing:.06em;padding:${U(5)} ${U(12)}}
  #lobby .seg button:hover{color:var(--tx)}
  #lobby .seg button.on{background:rgba(255,255,255,.1);color:var(--tx);box-shadow:inset 0 ${U(-2)} 0 var(--acc)}
  #lobby .tog,#lobby .key{background:rgba(255,255,255,.04);border:1px solid var(--ln2);border-radius:var(--r);color:var(--tx2);font-size:${U(14)};font-weight:700;letter-spacing:.06em;padding:${U(5)} ${U(14)}}
  #lobby .tog.on{background:var(--accd);border-color:rgba(239,138,44,.6);color:var(--tx)}
  #lobby .key.wait{background:var(--accd);border-color:var(--acc)}
  #lobby .settings{justify-content:flex-start;margin:0 0 ${U(14)};font-size:${U(15)};color:var(--tx2)}
  #lobby input[type=range]{accent-color:var(--acc)}
  #lobby .swatches button{border-radius:50%;padding:0}

  @media (max-height:600px){
    #lobby .lb-daily,#lobby .lb-right,#lobby .lb-brand,#lobby .lb-chat{display:none}
    #lobby .lb-dock{right:${U(40)}} #lobby .lb-tag small{display:none}
    #lobby .lb-left{top:${U(78)}} #lobby .lb-right{top:${U(78)}}
    #lobby .lb-dock{bottom:${U(14)}} #lobby .lb-dk{width:${U(140)};height:${U(100)}}
  }
  @media (max-height:600px),(max-width:1000px){
    #lobby .lb-scr{padding:${U(14)} ${U(18)}}
    #lobby .lb-sh p{display:none}
    #lobby .lb-sb{display:flex;flex-direction:column;overflow:auto}
    #lobby .lb-col,#lobby .lb-blk,#lobby .lb-bb{flex:none;overflow:visible}
    #lobby .lb-cv{min-height:${U(260)};flex:none}
  }
  @media (max-aspect-ratio:1/1){
    #lobby .lb-right,#lobby .lb-brand,#lobby .lb-dock{display:none}
    #lobby .lb-tabs button{padding:0 ${U(10)}}
  }
  /* things the game shows on top of the lobby */
  body.lbOpen #toasts{z-index:8600}
  body.lbOpen .toast{background:rgba(14,15,16,.95);border-left:2px solid #ef8a2c;border-radius:2px;color:#e8e6e1;box-shadow:0 0 0 1px rgba(0,0,0,.6)}
  body.lbOpen .toast b{color:#e8e6e1}
  #locker{background:rgba(4,5,6,.72)!important}
  #locker .lk-box{background:#111213!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:3px!important;color:#e8e6e1}
  #locker .lk-h{font-size:24px!important;letter-spacing:.1em!important}
  #locker h3{color:#9a9b97;opacity:1!important;font-size:13px!important;letter-spacing:.14em!important}
  #locker .lk-it{background:rgba(255,255,255,.03)!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:3px!important}
  #locker .lk-it:hover{border-color:rgba(255,255,255,.25)!important}
  #locker .lk-it i{border-radius:2px!important;border-color:rgba(255,255,255,.1)!important}
  #locker .lk-it.eq{border-color:#ef8a2c!important;box-shadow:inset 3px 0 0 #ef8a2c!important}
  #locker .lk-it small{color:#9a9b97!important}`;
  document.head.appendChild(css);

  // ---------------- markup ----------------
  const TABS = ['PLAY', 'LOADOUT', 'OPERATORS', 'BATTLE PASS', 'STORE'];
  const BRUSH = 'M10 14 C60 6 190 10 300 4 C335 2 362 6 384 3 L392 14 L386 24 L397 38 L389 52 L398 66 L390 80 L396 96 L386 108 L394 118 C300 121 160 116 60 120 L14 121 L5 110 L12 98 L3 84 L11 70 L2 56 L10 42 L1 28 Z';
  const el = document.createElement('div'); el.id = 'lobby';
  el.innerHTML = `<div class="lb-bg"></div><canvas id="lbCanvas"></canvas><div class="lb-stage" id="lbStage"></div><div class="lb-vig"></div><div id="lbTags"></div>
  <div class="lb-ui">
    <header class="lb-top">
      <div class="lb-logo">${LOGO}<span>BOOM <b>ARENA</b></span></div>
      <nav class="lb-tabs" id="lbTabs">${TABS.map((t, i) => `<button data-tab="${t}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</nav>
      <div class="lb-tr">
        <button class="lb-ib" id="lbGear" title="Settings">${ico('gear')}</button>
        <span class="lb-cnt" title="Players in the match">${ico('users')}<span id="lbCnt">4/8</span></span>
        <button class="lb-me" id="lbMe" title="Locker: calling cards, emblems, charms"></button>
        ${window.boomDesktop ? `<button class="lb-ib" id="lbExit" title="Exit game">${ico('exit')}</button>` : ''}
      </div>
    </header>
    <section class="lb-left">
      <div class="lb-modeb" id="lbModeB" title="Change match type"><div class="lb-emb" id="lbEmb"></div><div class="lb-mt"><b id="lbModeName"></b><small id="lbModeDesc"></small></div></div>
      <button class="lb-map" id="lbMap" title="Change map"><div class="th"></div><div class="tx">${ico('pin')}<div><b id="lbMapName"></b><small>PRIMARY MAP</small></div></div></button>
      <div class="lb-sp"></div>
      <div class="lb-pn lb-daily" id="lbDailyP" title="All challenges and the season pass"><div class="lb-ph"><span class="t">DAILY CHALLENGES</span><span class="r">${ico('clock')}<span id="lbReset"></span></span></div><div id="lbDaily"></div></div>
      <div class="lb-fill">${ico('users')}<span class="sqf">SQUAD FILL</span><span class="onl">UP TO 8 PLAYERS · BOTS FILL IN</span><button class="sw" id="lbFill" title="Fill your squad with bots"></button><button class="lb-leave" id="lbLeave">LEAVE MATCH</button><button class="lb-ib" id="lbMus" title="Lobby music">${ico('speaker')}</button></div>
      <div class="lb-fill lb-net" id="lbNet">${ico('net')}<span class="sqf">ONLINE</span><button class="st" id="lbNetSt" title="Name, invite link, join a friend"></button><button class="lb-inv" id="lbInvite" title="Invite friends to your match">${ico('users')}INVITE</button><button class="sw" id="lbOnline" title="Play against people online (bots fill the empty places)"></button></div>
      <button class="lb-play" id="lbPlay">
        <svg class="brush" viewBox="0 0 400 124" preserveAspectRatio="none" aria-hidden="true"><defs>
          <linearGradient id="lbPgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f39b42"/><stop offset="1" stop-color="#e2781f"/></linearGradient>
          <filter id="lbRough" x="-5%" y="-10%" width="110%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035 .6" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter></defs>
          <g filter="url(#lbRough)"><path d="${BRUSH}" fill="url(#lbPgr)"/></g></svg>
        <span class="pt">${ico('play')}<span id="lbPlayT">PLAY</span></span><small id="lbPlaySub"></small>
      </button>
      <div class="lb-chat" id="lbChat"><div class="lb-chatlog" id="lbChatLog"></div>${ico('chat')}<input id="lbChatIn" maxlength="80" placeholder="Press Enter to chat" autocomplete="off" spellcheck="false">${ico('net')}</div>
    </section>
    <section class="lb-right">
      <div class="lb-pn lb-squad"><div class="lb-ph"><span class="t" id="lbSqT">YOUR SQUAD</span><span class="r" id="lbSqN">4/4</span></div><div id="lbSquad"></div></div>
      <div class="lb-pn lb-sets"><div class="lb-ph"><span class="t">${ico('gear')}SETTINGS</span><span class="r">Next match</span></div><div id="lbSets"></div></div>
    </section>
    <nav class="lb-dock">
      <button class="lb-dk" data-go="LOADOUT" style="--d:.3s"><span class="cap" id="lbDkLo"></span><div class="art"><img src="lobby/gun-ar.webp" alt="" draggable="false"></div><div class="lab">${ico('gun')}LOADOUT</div></button>
      <button class="lb-dk" data-go="OPERATORS" style="--d:.35s"><span class="cap" id="lbDkOpN"></span><div class="art"><img class="op" id="lbDkOp" alt="" draggable="false"></div><div class="lab">${ico('helm')}OPERATORS</div></button>
      <button class="lb-dk pass" data-go="BATTLE PASS" style="--d:.4s"><div class="art">${PASS_ART}</div><div class="tier" id="lbTier"></div><div class="lab">BATTLE PASS</div><div class="tbar"><i id="lbTierBar"></i></div></button>
      <button class="lb-dk" data-go="STORE" style="--d:.45s"><span class="cap" id="lbDkSt"></span><div class="art">${COIN}</div><div class="lab">${ico('store')}STORE</div></button>
    </nav>
    <div class="lb-brand"><span>GOOD VIBES</span><span>BETTER WINS</span>${LOGO}</div>
    <div class="lb-build">BUILD ${BUILD}</div>
  </div>
  <section class="lb-scr" id="lbScr"></section>
  <div class="lb-scrim" id="lbScrim"></div>
  <div class="lb-sheet" id="lbSheet"></div>
  <div class="lb-fade" id="lbFade"></div>`;
  document.body.appendChild(el);
  const bt = document.createElement('div');
  bt.style.cssText = 'position:fixed;left:50%;bottom:4px;transform:translateX(-50%);font-size:10px;opacity:.45;letter-spacing:.14em;z-index:5;pointer-events:none';
  bt.id = 'buildTag'; bt.textContent = 'BUILD ' + BUILD;
  ($('overlay') || document.body).appendChild(bt);

  const ui = (f = 1500, d = .03, v = .025, t = 'triangle') => { try { tone(f, d, v, t); } catch (e) {} };
  el.addEventListener('mouseover', e => { const b = e.target.closest('button,.lb-modeb,.lb-daily'); if (b && b !== el._hov) { el._hov = b; ui(2100, .02, .012, 'sine'); } });
  el.addEventListener('click', e => { if (e.target.closest('button,.lb-modeb,.lb-daily')) ui(1250, .045, .03); });
  const toastMsg = (a, b = '') => { try { toast(a, b); } catch (e) {} };

  // ---------------- squad state ----------------
  let open = false, paused = false, fillT = null, tickT = null, tPrev = 0, use3D = false, joined = 0, cur = 'PLAY';
  const fillPref = () => store.get('boomSquadFill', '1') !== '0';
  const fillOn = () => fillPref() && !netAny();
  // ---------------- online: the game's netcode (BoomNet in index.html) does the work, the lobby drives it ----------------
  const ns = () => window.BoomNet ? BoomNet.state() : null;
  const onlineOn = () => store.get('boomOnline', '0') === '1';
  // (a paused offline match finishes offline: online starts from the next match)
  const offMatch = () => typeof started !== 'undefined' && started && !matchOver && typeof NET !== 'undefined' && !NET.on;
  const netWant = () => { const s = ns(); return !!(s && s.served && onlineOn()) && !offMatch(); };
  const netAny = () => { const s = ns(); return !!(s && (s.on || s.connecting || s.dropped)) || netWant(); };
  const CODE_RE = /^[A-HJKMNP-Z2-9]{4,6}$/;
  let joinCode = '', codeMine = false, netErr = '', netCountN = -1, netCountT = null, wantDeploy = 0;
  {
    const q = new URLSearchParams(location.search).get('join'), c = String(q || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (CODE_RE.test(c)) { joinCode = c; store.set('boomOnline', '1'); }
  }
  const myName = () => (store.get('boomNetName', '') || 'Vanguard').slice(0, 14);
  const myLevel = () => { const c = careerOf(xpTotal); return c.master ? 'M' + c.master : c.level; };
  const squadSize = () => 1 + (fillOn() ? joined : 0);
  // the live 3D squad on the stage is opt-in: the staged art reads closer to the target look
  const want3D = () => /[?&]lobby3d/.test(location.search) || store.get('boomLobby3D', '') === '1';

  // ---------------- staged art ----------------
  function stageArt() {
    const list = [{ art: heroArt(), hero: true }, ...mates().map(m => ({ art: m.art }))];
    $('lbStage').innerHTML = list.map((m, i) => {
      const a = ART[m.art], s = SLOTS[i];
      return `<div class="lb-fig ${m.hero ? 'hero' : ''}" data-i="${i}" style="left:${s.x*100}%;top:${s.y*100}%;height:${s.h*100}vh;width:${s.h*a.ar*100}vh;z-index:${i ? 4 - i : 5};--img:url(${a.src})">
        <img class="refl" src="${a.src}" alt="" draggable="false"><img class="body" src="${a.src}" alt="" draggable="false"><div class="wash"></div></div>`;
    }).join('');
    figs();
  }
  function figs() {
    $('lbStage').querySelectorAll('.lb-fig').forEach(f => { const i = +f.dataset.i; f.classList.toggle('in', !i || (fillOn() && joined >= i)); });
  }

  // ---------------- 3D stage (the real operator models, with ?lobby3d) ----------------
  let pv = null, squad = [], drag = null;
  const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Vector3();
  function initView() {
    if (pv) return;
    try {
      const cv = $('lbCanvas'), r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, premultipliedAlpha: true });
      r.setClearColor(0x000000, 0);
      r.setPixelRatio(Math.min(devicePixelRatio, (typeof TOUCHPAD !== 'undefined' && TOUCHPAD.on) ? 1.25 : 1.5)); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .9;
      r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
      const s = new THREE.Scene();
      { const es = new THREE.Scene(), pm = new THREE.PMREMGenerator(r), box = (c, i, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1, 0); es.add(m); };
        es.background = new THREE.Color(0x1c1816);
        box(0xffa868, 4, -2, 1.5, -6, 6, 2.5); box(0x8090b0, 1.4, 0, 7, 0, 14, 8); box(0xffe0c8, 1.4, 3, 3, 6, 5, 4); box(0x141210, 1, 0, -2, 0, 14, 14);
        s.environment = pm.fromScene(es, .04).texture; pm.dispose(); }
      s.add(new THREE.HemisphereLight(0xe8d4c0, 0x1e1c1c, .45));
      const sun = new THREE.DirectionalLight(0xffb070, 2.6); sun.position.set(-2.5, 5.2, -6.5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.shadow.radius = 4;
      Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .5, far: 24 }); s.add(sun);
      const rim = new THREE.DirectionalLight(0xff9a60, 1.1); rim.position.set(5, 2.5, -5); s.add(rim);
      const fill = new THREE.DirectionalLight(0xd0d8e8, .7); fill.position.set(1.5, 3, 7); s.add(fill);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .5 }));
      ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; s.add(ground);
      const cam = new THREE.PerspectiveCamera(30, 1, .1, 60); cam.position.set(0, 1.45, 7.6); cam.lookAt(0, 1.0, 0);
      pv = { r, s, cam, t: 0 };
      cv.addEventListener('pointerdown', e => { if (!squad[0]) return; drag = { x: e.clientX, r: squad[0].spin || 0 }; cv.setPointerCapture(e.pointerId); musStart(); });
      cv.addEventListener('pointermove', e => { if (drag && squad[0]) squad[0].spin = clamp(drag.r + (e.clientX - drag.x)*.01, -2.4, 2.4); });
      cv.addEventListener('pointerup', () => { drag = null; });
    } catch (e) { console.warn('lobby 3D unavailable', e); pv = null; }
  }
  function makeFighter(opId, skin, wid) {
    const o = { group: new THREE.Group(), pivot: new THREE.Group() };
    o.group.add(o.pivot);
    setOperator(o, opId, skin);
    if (o.acts && o.acts.Idle) for (const n in o.acts) o.acts[n].setEffectiveWeight(n === 'Idle' ? 1 : 0);
    try {
      const w = WEAPONS[wid] || WEAPONS[0], g = buildGun(w.model, false, (typeof skinSel !== 'undefined' && skinSel[w.id]) || 'factory');
      g.rotation.y = Math.PI; g.scale.setScalar({ smg: 1.45, ar: 1.3, lmg: 1.2, shotgun: 1.3, sniper: 1.15, dmr: 1.2 }[w.model] || 1.3);
      g.position.set(-.12, 1.18, .24); g.rotation.x = .55;   // low ready
      o.pivot.add(g); o.gun = g;
    } catch (e) {}
    o.group.traverse(m => { if (m.isMesh) m.castShadow = true; });
    o.ph = Math.random()*6;
    return o;
  }
  function armsIK(o) {
    if (!o.gun || !o.gun.userData || typeof solveArm !== 'function') return;
    try {
      o.group.updateMatrixWorld(true); const gu = o.gun.userData;
      if (o.armR && gu.grip) { o.gun.localToWorld(_v.copy(gu.grip)); o.group.localToWorld(_q.set(-.9, .4, -.3)); solveArm(o.armR, _v, _q); }
      if (o.armL && gu.fore) { o.gun.localToWorld(_w.copy(gu.fore)); o.group.localToWorld(_q.set(.9, .5, .2)); solveArm(o.armL, _w, _q); }
    } catch (e) { o.gun.userData = null; }
  }
  // feet position on the ground for a screen slot (so the 3D squad lines up with the HUD at any aspect ratio)
  function slotWorld(i, out) {
    const s = SLOTS[i], c = pv.cam;
    out.set(s.x*2 - 1, -(s.y*2 - 1), .5).unproject(c).sub(c.position).normalize();
    const t = -c.position.y / Math.min(-.02, out.y);
    return out.multiplyScalar(t).add(c.position);
  }
  function placeSquad() {
    const c = pv.cam, fwd = c.getWorldDirection(_q), k = 2*Math.tan(c.fov*Math.PI/360);
    for (const o of squad) {
      slotWorld(o.slot, _w); o.group.position.set(_w.x, 0, _w.z);
      o.base = Math.atan2(c.position.x - _w.x, c.position.z - _w.z) + (o.face || 0);
      // sized to the slot's screen height, like the staged art (the kneeling slot gets a standing body, so a bit less)
      o.fit = clamp(SLOTS[o.slot].h*(o.slot === 3 ? 1.25 : 1)*k*_w.sub(c.position).dot(fwd)/1.8, .7, 1.6);
    }
  }
  function build3D() {
    for (const o of squad) { pv.s.remove(o.group); o.group.traverse(m => { if (m.isMesh) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => x.dispose()); }); }
    squad = [];
    const me = makeFighter(myOp, mySkin, loadout[0]); Object.assign(me, { slot: 0, me: true, op: myOp, sk: mySkin, wid: loadout[0], face: .12 });
    pv.s.add(me.group); squad.push(me);
    mates().forEach((m, i) => {
      const wid = WID[m.gun] != null ? WID[m.gun] : 0, o = makeFighter(m.op, m.skin, wid);
      Object.assign(o, { slot: i + 1, face: m.face, pop: 0 }); o.group.visible = false; pv.s.add(o.group); squad.push(o);
    });
    placeSquad();
  }
  function heroChanged() { const h = squad[0]; return !h || h.op !== myOp || h.sk !== mySkin || h.wid !== loadout[0]; }
  function refreshHero() {
    if (use3D) { if (pv && heroChanged()) build3D(); }
    else if (!$('lbStage').querySelector(`.hero .body[src="${ART[heroArt()].src}"]`)) stageArt();
    else figs();
    $('lbDkOp').src = ART[heroArt()].src; $('lbMe').style.backgroundImage = `url(${ART[heroArt()].face})`;
  }

  // name plates over each squad member's head
  function tagsHTML() {
    const ms = mates();
    $('lbTags').innerHTML = [0, 1, 2, 3].map(i => i
      ? `<div class="lb-tag" data-i="${i}" style="--c:${SLOT_COL[i]}"><div class="pl"><i class="bar"></i>${ico('mic')}<b>${ms[i - 1].name}</b>${ico('speaker')}</div><small>LVL ${mateLv(ms[i - 1].name)}</small></div>`
      : `<div class="lb-tag me" data-i="0" style="--c:${SLOT_COL[0]}"><div class="pl"><i class="bar"></i>${ico('crown', 'cr')}<b>${esc(myName())}</b>${ico('speaker')}</div><small>LVL ${myLevel()}</small></div>`).join('');
  }
  function tags() {
    const W = innerWidth, H = innerHeight;
    $('lbTags').querySelectorAll('.lb-tag').forEach(t => {
      const i = +t.dataset.i, s = SLOTS[i], vis = !i || (fillOn() && joined >= i);
      let x, y;
      if (use3D && pv && squad[i]) { const g = squad[i].group; _v.set(g.position.x, 1.98*g.scale.y, g.position.z).project(pv.cam); x = (_v.x*.5 + .5)*W; y = (-_v.y*.5 + .5)*H; }
      else { const a = ART[i ? mates()[i - 1].art : heroArt()], h = s.h*H; x = s.x*W + (a.hx - .5)*h*a.ar; y = s.y*H - h; }
      t.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,calc(-100% - ${i ? 6 : 10}px))`;
      t.style.opacity = vis ? 1 : 0;
    });
  }
  function frame(t) {
    if (!open) return;
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - tPrev)/1000 || .016); tPrev = t;
    if (!use3D || !pv || cur !== 'PLAY') return;
    const cv = pv.r.domElement, w = cv.clientWidth, h = cv.clientHeight;
    if (w && h && (w !== pv.w || h !== pv.h)) { pv.w = w; pv.h = h; pv.r.setSize(w, h, false); pv.cam.aspect = w/h; pv.cam.updateProjectionMatrix(); placeSquad(); }
    pv.t += dt;
    for (const o of squad) {
      const vis = o.me || (fillOn() && joined >= o.slot);
      if (vis && !o.group.visible) { o.group.visible = true; o.pop = 0; }
      if (!vis) { o.group.visible = false; continue; }
      if (o.pop != null && o.pop < 1) o.pop = Math.min(1, o.pop + dt*3.5);
      o.group.scale.setScalar(Math.max(.01, o.pop != null ? 1 - Math.pow(1 - o.pop, 3) : 1)*(o.fit || 1));
      o.group.rotation.y = o.base + (o.spin || 0) + Math.sin(pv.t*.4 + o.ph)*.05;
      if (o.mixer) o.mixer.update(dt);
      armsIK(o);
    }
    pv.r.render(pv.s, pv.cam);
    tags();
  }

  // ---------------- hub panels ----------------
  const MAPS = () => Object.entries(MAP_INFO).filter(([, m]) => !m.br);
  const TIME_OPTS = [3, 5, 10], SCORE_OPTS = [10, 20, 30, 50];
  function scoreText() {
    if (MODE === 'wz') return 'Last one standing';
    if (MODE === 'gun') return `${typeof GG_SEQ !== 'undefined' ? GG_SEQ.length : 8} guns`;
    try { return String(modeLimit()); } catch (e) { return String(S.scoreLimit); }
  }
  function banner() {
    const m = MODES[MODE];
    $('lbEmb').innerHTML = ico(modeIco(MODE));
    $('lbModeName').textContent = m.name.toUpperCase();
    $('lbModeDesc').textContent = m.desc.length > 60 ? m.desc.split('. ')[0] + '.' : m.desc;
    $('lbMapName').textContent = MAPDEF.name.toUpperCase();
    $('lbPlaySub').textContent = paused ? `MATCH IN PROGRESS · ${m.name} | ${MAPDEF.name}` : `${m.name} | ${MAPDEF.name}`;
    $('lbPlayT').textContent = paused ? 'RESUME' : 'PLAY';
    const n = typeof fighters !== 'undefined' && fighters.length ? fighters.length : 8;
    $('lbCnt').textContent = `${squadSize()}/${n}`;
    netPanel();
    const s = ns(); if (!s || !netAny()) return;
    const om = MODES[s.mode] || m, code = s.on ? s.code : joinCode;
    let t = 'PLAY', sub = !s.on && joinCode && !codeMine ? `ONLINE · JOIN MATCH ${joinCode}` : `ONLINE · ${om.name} | ${MAPDEF.name}`;
    if (s.dropped) { t = 'LOBBY'; sub = 'DISCONNECTED FROM THE SERVER'; }
    else if (s.connecting) { t = 'JOINING'; sub = code ? `JOINING MATCH ${code}…` : 'FINDING A MATCH…'; }
    else if (s.on && s.over) sub = 'NEXT ROUND STARTS IN A MOMENT';
    else if (s.on) t = s.deployed ? 'RESUME' : 'DEPLOY';
    $('lbPlayT').textContent = t; $('lbPlaySub').textContent = sub;
    if (s.on) $('lbCnt').textContent = `${s.people.length}/${n}`;
  }
  function netPanel() {
    const s = ns(), any = netAny(), sw = $('lbOnline');
    el.classList.toggle('online', any); el.classList.toggle('netin', !!(s && s.on));
    sw.textContent = any ? 'ON' : 'OFF'; sw.classList.toggle('on', any);
    let st;
    if (!s || !s.served) st = '<em>Needs the game server</em>';
    else if (s.on) st = `<b>●</b> ${s.people.length} in match${s.code ? ` · <em>${esc(s.code)}</em>` : ''}`;
    else if (s.connecting) st = joinCode ? `Joining <em>${esc(joinCode)}</em>…` : 'Finding a match…';
    else if (s.dropped) st = '<em>Disconnected</em>';
    else if (netErr && any) st = `<em style="color:#ff8a5a">${esc(netErr)}</em>`;
    else if (any) st = joinCode ? `Match <em>${esc(joinCode)}</em>` : netCountN >= 0 ? `<b>●</b> ${netCountN} online now` : 'Public match';
    else st = 'Off · bots only';
    $('lbNetSt').innerHTML = st;
    $('lbNetSt').title = netErr && any ? netErr : 'Name, invite link, join a friend';
  }
  // how many people are on the server, while the lobby shows it
  async function netCount() {
    const s = ns(); if (!s || !s.served || s.on || !open) return;
    try { const st = await (await fetch(netHttp('/status'), { cache: 'no-store' })).json(); netCountN = Math.max(0, st.players | 0); }
    catch (e) { netCountN = -1; }
    if (open && cur === 'PLAY') netPanel();
  }
  const xpHex = done => `<svg viewBox="0 0 40 44"><path d="M20 2.5l16 9.3v20.4L20 41.5 4 32.2V11.8z" fill="rgba(0,0,0,.35)" stroke="${done ? '#ef8a2c' : 'rgba(255,255,255,.3)'}" stroke-width="1.6"/></svg>`;
  function resetIn() { const d = new Date(), left = Math.max(0, (new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) - d)/1000); return `${Math.floor(left/3600)}h ${Math.floor(left % 3600/60)}m`; }
  function dailyPanel() {
    try { dailyFresh(); } catch (e) {}
    $('lbReset').textContent = `Resets in ${resetIn()}`;
    const list = typeof daily !== 'undefined' && daily ? daily.list : [];
    $('lbDaily').innerHTML = list.map(ch => {
      const def = CH_POOL.find(c => c.id === ch.id); if (!def) return '';
      const p = Math.min(1, ch.have/ch.n);
      return `<div class="lb-ch ${ch.done ? 'done' : ''}"><div class="lb-xp">${xpHex(ch.done)}<span>XP</span></div>
        <div class="tx"><div class="t"><span>${esc(def.text(ch.n))}</span><em>${ch.have}/${ch.n}</em></div><div class="lb-bar"><i style="width:${Math.round(p*100)}%"></i></div></div><div class="xpv">+${def.xp.toLocaleString()} XP</div></div>`;
    }).join('');
  }
  function squadPanel() {
    $('lbFill').textContent = fillPref() ? 'ON' : 'OFF'; $('lbFill').classList.toggle('on', fillPref());
    if (netAny()) return netSquad();
    $('lbSqT').textContent = 'YOUR SQUAD';
    const ms = mates(), rows = [`<div class="lb-sq" style="--c:${SLOT_COL[0]}"><div class="av" style="background-image:url(${ART[heroArt()].face})"></div><div class="nm"><b>${ico('crown')}${esc(myName())}</b><small><i></i>Ready</small></div>${ico('headset', 'hs')}</div>`];
    ms.forEach((m, k) => {
      const i = k + 1;
      if (!fillOn()) rows.push(`<div class="lb-sq open" style="--c:rgba(255,255,255,.15)"><div class="av">${ico('plus')}</div><div class="nm"><b>OPEN SLOT</b><small style="color:var(--mut)">Squad fill is off</small></div></div>`);
      else if (joined < i) rows.push(`<div class="lb-sq wait" style="--c:${SLOT_COL[i]}"><div class="av"></div><div class="nm"><b>SEARCHING…</b><small><i></i>Finding a squadmate</small></div></div>`);
      else rows.push(`<div class="lb-sq" style="--c:${SLOT_COL[i]}"><div class="av" style="background-image:url(${ART[m.art].face})"></div><div class="nm"><b>${m.name}</b><small><i></i>Ready</small></div>${ico('headset', 'hs')}</div>`);
    });
    $('lbSquad').innerHTML = rows.join('');
    $('lbSqN').textContent = `${squadSize()}/4`;
  }
  // online: the people in your match (bots take every empty place, up to 8)
  function netSquad() {
    const s = ns(), people = s.on ? s.people : [myName()];
    $('lbSqT').textContent = s.on ? 'IN THIS MATCH' : 'ONLINE';
    const rows = people.slice(0, 5).map((p, i) => `<div class="lb-sq" style="--c:${SLOT_COL[i % SLOT_COL.length]}"><div class="av" ${i ? '' : `style="background-image:url(${ART[heroArt()].face})"`}>${i ? ico('users') : ''}</div><div class="nm"><b>${i ? '' : ico('crown')}${esc(i ? p : myName())}</b><small><i></i>${i ? 'Online' : s.on ? (s.deployed ? 'In the fight' : 'In the lobby') : 'Ready'}</small></div>${ico('headset', 'hs')}</div>`);
    if (people.length > 5) rows.push(`<div class="lb-sq open" style="--c:rgba(255,255,255,.15)"><div class="av">${ico('users')}</div><div class="nm"><b>+${people.length - 5} MORE</b><small style="color:var(--mut)">Hold Tab in the match for the scoreboard</small></div></div>`);
    if (people.length < 8) rows.push(`<div class="lb-sq open lb-invrow" style="--c:rgba(255,255,255,.15);cursor:pointer"><div class="av">${ico('plus')}</div><div class="nm"><b>INVITE A FRIEND</b><small style="color:var(--mut)">${s.on ? `Bots fill the other ${8 - people.length} places` : 'Send a link, they land in your match'}</small></div></div>`);
    $('lbSquad').innerHTML = rows.join('');
    $('lbSqN').textContent = s.on ? `${people.length}/8` : '';
    const inv = $('lbSquad').querySelector('.lb-invrow'); if (inv) inv.onclick = () => onlineSheet();
  }
  function setsPanel() {
    const s = ns(), live = !!(s && (s.on || s.connecting)), lockMatch = paused || live;
    const rows = [
      ['mode', 'Match type', MODES[MODE].name, lockMatch],
      ['map', 'Map', MAPDEF.name, lockMatch],
      ['time', 'Time limit', `${S.timeLimit} Minutes`, live],
      ['score', 'Score limit', scoreText(), live || MODE === 'wz' || MODE === 'gun'],
      ['ff', 'Friendly fire', S.friendlyFire ? 'On' : 'Off', live || !MODES[MODE].teams],
      ['sp', 'Spawn protection', S.spawnProtect ? 'On' : 'Off', live],
    ];
    const why = k => live ? 'The online match sets this' : paused && (k === 'mode' || k === 'map') ? 'Leave the match to change this' : 'Not used in this mode';
    $('lbSets').innerHTML = rows.map(([k, l, v, lk]) => `<button class="lb-row ${lk ? 'locked' : ''}" data-k="${k}" title="${lk ? why(k) : (k === 'mode' || k === 'map' ? 'Choose' : 'Click to change · applies from the next match')}"><span>${l}</span><b>${esc(v)}</b>${ico(lk ? 'lock' : 'chev')}</button>`).join('');
    $('lbSets').querySelectorAll('.lb-row').forEach(b => b.onclick = () => { if (b.classList.contains('locked')) { if (live) toastMsg('THE ONLINE MATCH SETS THIS', 'Leave the match to play your own rules'); else if (paused && (b.dataset.k === 'mode' || b.dataset.k === 'map')) toastMsg('LEAVE THE MATCH TO CHANGE THIS'); return; } setRow(b.dataset.k); });
  }
  const next = (arr, v) => arr[(arr.indexOf(v) + 1) % arr.length];
  function setRow(k) {
    if (k === 'mode') return modesSheet();
    if (k === 'map') return mapsSheet();
    if (k === 'time') S.timeLimit = next(TIME_OPTS, S.timeLimit);
    if (k === 'score') S.scoreLimit = next(SCORE_OPTS, S.scoreLimit);
    if (k === 'ff') S.friendlyFire = !S.friendlyFire;
    if (k === 'sp') S.spawnProtect = !S.spawnProtect;
    saveSettings(); setsPanel();
  }
  const mySkins = () => OP_SKINS.filter(x => x.op === myOp).concat(OP_SKINS.filter(x => !x.op && !(OP_KITS[myOp] && x.id === 'standard')));
  function dock() {
    const R = window.BoomRewards;
    if (R) { const s = R.season(), tier = Math.min(25, Math.floor(s.sp/2500)); $('lbTier').textContent = `Tier ${tier} / 25`; $('lbTierBar').style.width = `${tier >= 25 ? 100 : Math.round(s.sp % 2500/25)}%`; }
    try { $('lbDkLo').textContent = WEAPONS[pendingLoadout[0]].name; } catch (e) {}
    $('lbDkOpN').textContent = opName();
    try { const c = careerOf(xpTotal), l = mySkins(); $('lbDkSt').textContent = `${l.filter(x => skinUnlocked(x, c)).length}/${l.length} skins`; } catch (e) {}
  }
  function refresh() { banner(); dailyPanel(); squadPanel(); setsPanel(); dock(); refreshHero(); tagsHTML(); tags(); }

  // ---------------- pickers ----------------
  function sheet(title, html) {
    const s = $('lbSheet');
    if (PANELS.net && PANELS.net.parentNode !== hold) hold.appendChild(PANELS.net);   // keep it in the page so the game can update it
    if (!title) { s.classList.remove('on'); el.classList.remove('sheet'); return; }
    s.innerHTML = `<h3>${title}<button class="lb-x" id="lbClose">${ico('x')}CLOSE</button></h3>${html}`; s.classList.add('on'); el.classList.add('sheet');
    $('lbClose').onclick = () => sheet(null);
  }
  function pickMap(id) { if (id === MAP_ID) return sheet(null); store.set('boomMap', id); $('lbPlaySub').textContent = 'LOADING ARENA…'; fadeOut(() => location.reload()); }
  function modesSheet() {
    sheet('Match type', `<div class="lb-cards" id="lbModes">${Object.entries(MODES).map(([id, m]) => `<button class="lb-card ${id === MODE ? 'on' : ''}" data-mode="${id}"><b>${ico(modeIco(id))}${m.name}</b><small>${m.desc}</small></button>`).join('')}</div>`);
    $('lbModes').querySelectorAll('.lb-card').forEach(b => b.onclick = () => { const mb = document.querySelector(`#modes button[data-mode="${b.dataset.mode}"]`); if (mb) mb.click(); sheet(null); refresh(); });
    if (netWant()) $('lbSheet').insertAdjacentHTML('beforeend', '<p class="lb-note" style="margin-top:12px">Online runs Free-for-all, Team Deathmatch and Mini Warzone. The other team modes play as Team Deathmatch online, Gun Game as Free-for-all.</p>');
  }
  // name, invite link / code, and joining a friend's match
  function onlineSheet() {
    const s = ns();
    if (!s || !s.served) {
      return sheet('Play online', `<div class="lb-onl"><p>Online matches run on the Boom Arena server. On this computer, double-click <b>start-server</b> in the boom-arena folder (or run <b>npm start</b>), then open the address it prints. Friends on the same Wi-Fi open the second address it shows.</p>
        <p>To play with anyone from a link, host the folder on a Node server (README: "Play online"). Single-player works without any of this.</p></div>`);
    }
    if (!s.on && !s.connecting && !joinCode) { joinCode = BoomNet.newCode(); codeMine = true; store.set('boomOnline', '1'); }
    const code = s.on ? s.code : joinCode, link = BoomNet.link(code);
    if (!s.on && code && !/[?&]join=/.test(location.search)) try { history.replaceState(null, '', `${location.pathname}?join=${code}`); } catch (e) {}
    sheet('Play online', `<div class="lb-onl">
      <label>YOUR NAME</label><div class="row"><input id="lbNmIn" maxlength="14" autocomplete="off" spellcheck="false" value="${esc(myName())}"${s.on || s.connecting ? ' disabled title="Used from your next match"' : ''}></div>
      <label>INVITE FRIENDS</label><div class="big">${esc(code)}</div>
      <div class="row" style="margin-top:12px"><input id="lbLink" readonly value="${esc(link)}"><button class="b acc" id="lbCopy">COPY LINK</button></div>
      <p>${s.on ? 'Anyone who opens this link lands in this match.' : 'Press <b>PLAY</b> to open this match, then anyone who opens the link lands in it with you.'} Or read the code out: they turn <b>ONLINE</b> on, open this panel and type it under <b>Join a friend</b>. Up to 8 people, bots fill the empty places.</p>
      ${s.on ? '' : `<label>JOIN A FRIEND</label><div class="row"><input class="code" id="lbJoinIn" maxlength="6" placeholder="CODE" autocomplete="off" spellcheck="false"><button class="b acc" id="lbJoinGo">JOIN</button><button class="b" id="lbPub" title="Play with whoever is on the server">PUBLIC MATCH</button></div>`}
    </div>`);
    const nm = $('lbNmIn');
    nm.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') nm.blur(); if (e.key === 'Escape') sheet(null); });
    nm.onchange = nm.onblur = () => { const v = nm.value.replace(/[<>&"'`]/g, '').trim().slice(0, 14); store.set('boomNetName', v); try { $('netName').value = v; } catch (e) {} refresh(); };
    $('lbCopy').onclick = async () => {
      const l = $('lbLink'); let ok = false;
      try { await navigator.clipboard.writeText(l.value); ok = true; } catch (e) { try { l.select(); ok = document.execCommand('copy'); } catch (er) {} }
      toastMsg(ok ? 'INVITE LINK COPIED' : 'COPY THE LINK ABOVE', ok ? 'Send it to a friend' : '');
      $('lbCopy').textContent = ok ? 'COPIED' : 'COPY LINK';
    };
    $('lbLink').onclick = e => e.target.select();
    if (s.on) return;
    const ji = $('lbJoinIn'), go = () => {
      const c = ji.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!CODE_RE.test(c)) { toastMsg('THAT CODE LOOKS WRONG', '5 letters and numbers, like K7QPX'); ji.focus(); return; }
      setCode(c); sheet(null); refresh(); toastMsg(`MATCH ${c}`, 'Press PLAY to join');
    };
    ji.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go(); if (e.key === 'Escape') sheet(null); });
    ji.oninput = () => { const p = ji.selectionStart; ji.value = ji.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); ji.setSelectionRange(p, p); };
    $('lbJoinGo').onclick = go;
    $('lbPub').onclick = () => { setCode(''); sheet(null); refresh(); toastMsg('PUBLIC MATCH', 'Press PLAY to join whoever is on'); };
  }
  function setCode(c, mine = false) {
    joinCode = c; codeMine = mine; netErr = ''; store.set('boomOnline', '1');
    try { history.replaceState(null, '', c ? `${location.pathname}?join=${c}` : location.pathname); } catch (e) {}
  }
  function onlineToggle() {
    const s = ns();
    if (s && (s.on || s.connecting || s.dropped)) { if (!s.on || confirm('Leave the online match?')) BoomNet.leave(); return; }
    if (!s || !s.served) return onlineSheet();
    if (offMatch()) return toastMsg('LEAVE THE MATCH TO PLAY ONLINE', 'Your offline match is still running');
    const on = !onlineOn(); store.set('boomOnline', on ? '1' : '0'); netErr = '';
    if (!on && joinCode) setCode(''), store.set('boomOnline', '0');
    if (on) { netCount(); if (BoomNet.mode() !== MODE) toastMsg(`ONLINE PLAYS ${MODES[BoomNet.mode()].name.toUpperCase()}`, `${MODES[MODE].name} is offline only`); }
    else if (fillPref()) fillSquad();
    figs(); refresh();
  }
  // the game calls this whenever the connection changes (joined, roster, full, disconnected)
  function netChanged() {
    const s = ns(); if (!s) return;
    // PLAY was pressed (here, or before the page reloaded onto the match's map): go straight in once the game has loaded
    if (s.on && !s.deployed) {
      let dep = wantDeploy && Date.now() - wantDeploy < 8000;
      try { const t = +sessionStorage.getItem('boomDeploy'); if (t && Date.now() - t < 60000) dep = true; } catch (e) {}
      if (dep && (!playFn || $('play').disabled)) { clearTimeout(netChanged.t); netChanged.t = setTimeout(netChanged, 400); return; }
      if (dep) { wantDeploy = 0; try { sessionStorage.removeItem('boomDeploy'); } catch (e) {} if (!open) show(); play({ clientX: -1, clientY: -1 }); return; }
    }
    if (!s.on && !s.connecting && (wantDeploy || !s.dropped) && s.status && /full|couldn|can't|look right|needs the game server/i.test(s.status)) {
      if (wantDeploy) toastMsg("COULDN'T JOIN", s.status);
      netErr = s.status.replace(/\s*Try again.*$/, '').slice(0, 80); wantDeploy = 0;
      try { sessionStorage.removeItem('boomDeploy'); } catch (e) {}
    }
    if (s.on) { netErr = ''; if (s.code && s.code !== joinCode) setCode(s.code); }
    if (open && cur === 'PLAY') { banner(); squadPanel(); setsPanel(); figs(); tags(); }
  }
  function mapsSheet() {
    sheet('Map', `<div class="lb-cards" id="lbMaps">${MAPS().map(([id, m]) => `<button class="lb-card ${id === MAP_ID ? 'on' : ''}" data-map="${id}"><b>${ico('pin')}${m.name}</b><small>${m.desc}</small></button>`).join('')}</div>`);
    $('lbMaps').querySelectorAll('.lb-card').forEach(b => b.onclick = () => pickMap(b.dataset.map));
  }
  function locker() {
    if (!window.BoomRewards) return;
    const lk = BoomRewards.openLocker(); lk.style.zIndex = 9001;
    const iv = setInterval(() => { if (!document.body.contains(lk) || lk.style.display === 'none') { clearInterval(iv); if (cur === 'PLAY') refresh(); } }, 400);
  }

  // ---------------- full screens ----------------
  // The old menu's loadout / operator / settings controls live here: each node is moved in by id when its screen opens
  // and parked again when it closes, so the game's own code keeps rendering them and handling their clicks.
  const PANELS = {}, hold = document.createElement('div'); hold.style.display = 'none'; document.body.appendChild(hold);
  const GAME_IDS = ['prim', 'sec', 'equip', 'atts', 'anote', 'camos', 'camoName', 'stats', 'preview', 'wselName', 'wselCls', 'lonote', 'ops', 'opName', 'opSkinName', 'skReq', 'skCount', 'skins', 'settingsView'];
  function adopt() {
    if (PANELS.lo) return;
    PANELS.lo = document.querySelector('#overlay .col.lo'); PANELS.set = $('settingsView'); PANELS.pv = $('preview');
    if (PANELS.lo) hold.appendChild(PANELS.lo);
    const q = document.querySelector('#overlay .settings'); if (q && PANELS.set) PANELS.set.insertBefore(q, PANELS.set.firstChild);
    PANELS.net = document.createElement('div'); hold.appendChild(PANELS.net); for (const id of ['netrow', 'netStatus']) { const n = id === 'netrow' ? document.querySelector('#overlay .netrow') : $(id); if (n) PANELS.net.appendChild(n); }
    for (const id of ['modes', 'maps']) { const n = $(id); if (n) { n.style.display = 'none'; n.previousElementSibling && n.previousElementSibling.classList.contains('lbl') && (n.previousElementSibling.style.display = 'none'); } }
    const ob = $('openSettings'); if (ob) ob.onclick = () => show({ paused: started && !matchOver, tab: 'SETTINGS' });
    const sb = $('setBack'); if (sb) { const o = sb.onclick; sb.onclick = e => { if (o) o.call(sb, e); tab('PLAY'); }; }
  }
  function park() {
    for (const id of GAME_IDS) { const n = $(id); if (n && n.closest('#lbScr')) hold.appendChild(n); }
    if (PANELS.pv && !PANELS.pv.isConnected) hold.appendChild(PANELS.pv);
  }
  // the canvas is held by reference: re-rendering a view's innerHTML detaches it, and $('preview') can't find it then
  const pvCanvas = () => $('preview') || PANELS.pv;
  const blk = (title, inner, cls = '', right = '', id = '') => `<div class="lb-blk ${cls}"${id ? ` id="${id}"` : ''}><div class="lb-bh"><span>${title}</span>${right}</div><div class="lb-bb">${inner}</div></div>`;
  const slot = id => `<i data-put="${id}"></i>`;
  function screen(kind, title, sub, body, acts = '') {
    park();
    const S_ = $('lbScr');
    S_.innerHTML = `<div class="lb-sh"><div><h2>${title}</h2><p>${sub}</p></div><div class="act">${acts}<button class="lb-x" data-back>${ico('back')}LOBBY</button></div></div><div class="lb-sb ${kind}">${body}</div>`;
    S_.querySelectorAll('[data-put]').forEach(ph => { const n = $(ph.dataset.put); if (n) ph.replaceWith(n); else ph.remove(); });
    S_.querySelector('[data-back]').onclick = () => tab('PLAY');
    return S_;
  }
  const loTab = k => { const b = PANELS.lo && PANELS.lo.querySelector(`[data-lt="${k}"]`); if (b) b.click(); };
  // the game writes padlock emoji into some labels; swap them for the lobby's icon
  function tidy(root) {
    root.querySelectorAll('button').forEach(b => { for (const n of b.childNodes) if (n.nodeType === 3 && n.data.includes('🔒')) { n.data = n.data.replace('🔒 ', '').replace('🔒', ''); b.insertAdjacentHTML('afterbegin', ico('lock', 'lki')); break; } });
  }
  const tidyObs = new MutationObserver(() => { if (cur !== 'PLAY') { tidyObs.disconnect(); tidy($('lbScr')); tidyObs.observe($('lbScr'), { childList: true, subtree: true }); } });
  tidyObs.observe($('lbScr'), { childList: true, subtree: true });

  function loadoutScr() {
    screen('lo', 'Loadout', `Primary, secondary, equipment, attachments and camo. Changes save instantly and carry into your next match${paused ? ' (in this match: on your next respawn)' : ''}.`,
      `<div class="lb-col">${blk('Primary', slot('prim'), 'grow')}${blk('Secondary', slot('sec'))}</div>
       <div class="lb-col lb-view"><div class="lb-wt">${slot('wselName')}${slot('wselCls')}${slot('lonote')}</div><div class="lb-cv"><span class="hint">Selected weapon</span>${slot('preview')}</div>${blk('Stats', slot('stats'))}</div>
       <div class="lb-col">${blk('Equipment', slot('equip'))}${blk('Gunsmith', slot('atts') + slot('anote'), 'grow')}${blk('Camo', slot('camos'), '', `<span>${slot('camoName')}</span>`)}</div>`);
    loTab('w');
  }
  function opsScr() {
    screen('ops', 'Operators', 'Choose who you deploy as and what they wear. Your pick is saved and used in every match, offline and online.',
      `<div class="lb-col">${blk('Operator', slot('ops'))}${blk('Equipped', `<div class="lb-opinfo">${slot('opName')}${slot('opSkinName')}${slot('skReq')}</div>`)}</div>
       <div class="lb-col lb-view"><div class="lb-cv" id="lbOpCv"></div></div>
       <div class="lb-col">${blk('Skins', slot('skins'), 'grow', `<span>${slot('skCount')}</span>`)}</div>`);
    loTab('o'); opView();
  }
  function opView() {
    const host = $('lbOpCv'); if (!host) return;
    if (has3D()) { const pc = pvCanvas(); host.classList.remove('art'); host.innerHTML = `<span class="hint">${esc(opName())}</span>`; host.appendChild(pc); }
    else { host.classList.add('art'); host.innerHTML = `<img src="${ART[heroArt()].src}" alt="${esc(opName())}">`; }
  }
  // armory: preview and equip operator skins; everything unlocks by playing
  let stF = 'all', stSel = null;
  const TIER_COL = { common: '#9a9b97', rare: '#7fa6c9', epic: '#a993c9', prestige: '#c9aa66', master: '#c98fb5', challenge: '#c98a7f' };
  const shortReq = s => s.lv ? `Level ${s.lv}` : s.p ? `Prestige ${s.p}` : s.mst ? `Master ${s.mst}` : s.stat ? `${s.n.toLocaleString()} ${(STAT_TEXT[s.stat] || s.stat).split(' ').slice(-2).join(' ')}` : '';
  function skinProgress(s, c) {
    if (s.lv) return [c.prestige ? s.lv : Math.min(c.level, s.lv), s.lv, 'Level'];
    if (s.p) return [Math.min(c.prestige, s.p), s.p, 'Prestige'];
    if (s.mst) return [Math.min(c.master, s.mst), s.mst, 'Master level'];
    if (s.stat) return [Math.min(careerStats[s.stat] || 0, s.n), s.n, STAT_TEXT[s.stat] || s.stat];
    return null;
  }
  function storeScr() {
    const c = careerOf(xpTotal), list = mySkins(), owned = list.filter(x => skinUnlocked(x, c)).length;
    if (!stSel || !list.some(x => x.id === stSel)) stSel = mySkin;
    const shown = list.filter(x => stF === 'all' || (stF === 'owned') === skinUnlocked(x, c));
    const keep = $('lbStGrid') ? $('lbStGrid').parentNode.scrollTop : 0;
    const card = x => { const lk = !skinUnlocked(x, c), t = skinTier(x);
      return `<button class="lb-sk ${x.id === mySkin ? 'eq' : lk ? 'lk' : 'own'} ${x.id === stSel ? 'on' : ''}" data-sk="${x.id}" style="--c:${TIER_COL[t]}"><i style="background:${skinSwatch(x)}"></i><em>${TIER_NAME[t]}</em><b>${esc(x.name)}</b><small>${x.id === mySkin ? ico('check') + 'Equipped' : lk ? ico('lock') + esc(shortReq(x)) : 'Owned'}</small></button>`; };
    screen('st', 'Store', `The armory for ${esc(opName())}. Preview any skin; everything here unlocks by playing (levels, prestige and challenges). No purchases, no currency.`,
      `<div class="lb-col">${blk(`${esc(opName())} skins`, `<div class="lb-chips">${[['all', 'ALL'], ['owned', 'OWNED'], ['locked', 'LOCKED']].map(([k, l]) => `<button data-f="${k}" class="${stF === k ? 'on' : ''}">${l}</button>`).join('')}</div><div class="lb-skgrid" id="lbStGrid">${shown.map(card).join('') || '<p class="lb-note">Nothing here yet.</p>'}</div>`, 'grow', `<span>${owned} / ${list.length} owned</span>`)}</div>
       <div class="lb-col">${blk('Preview', `<div class="lb-cv" id="lbStCv" style="flex:none;height:${U(250)};min-height:0"></div><div class="lb-info" id="lbStInfo" style="margin-top:${U(12)}"></div>`, 'grow')}
         ${blk('Loot crates', `<p class="lb-note">One free crate after every match with calling cards, emblems and charms. Better games, better odds. Season pass tiers drop them too.</p><button class="lb-btn gh" id="lbStLocker">OPEN LOCKER</button>`)}</div>`);
    $('lbStGrid').parentNode.scrollTop = keep;
    const S_ = $('lbScr');
    S_.querySelectorAll('.lb-chips button').forEach(b => b.onclick = () => { stF = b.dataset.f; storeScr(); });
    S_.querySelectorAll('.lb-sk').forEach(b => { b.onclick = () => { stSel = b.dataset.sk; storeScr(); }; b.ondblclick = () => equipSkin(OP_SKIN[b.dataset.sk]); });
    $('lbStLocker').onclick = locker;
    const x = OP_SKIN[stSel] || OP_SKIN.standard, lk = !skinUnlocked(x, c), t = skinTier(x), pr = lk ? skinProgress(x, c) : null;
    $('lbStInfo').innerHTML = `<b class="nm">${esc(x.name)}</b><div class="tg"><span style="color:${TIER_COL[t]}">${TIER_NAME[t]}</span><span>${x.op ? esc(opName()) + ' only' : 'Any operator'}</span></div>
      ${lk ? `<div class="req">${ico('lock')} ${esc(skinReq(x))}</div>${pr ? `<div class="pr"><span>${esc(pr[2])}</span><span>${pr[0].toLocaleString()} / ${pr[1].toLocaleString()}</span></div><div class="lb-bar acc"><i style="width:${Math.round(pr[0]/pr[1]*100)}%"></i></div>` : ''}` : `<div class="req">${x.id === mySkin ? 'Equipped on your operator.' : 'Unlocked. Equip it to wear it in your next match.'}</div>`}
      <button class="lb-btn" id="lbStEq" ${lk || x.id === mySkin ? 'disabled' : ''}>${lk ? ico('lock') + 'LOCKED' : x.id === mySkin ? ico('check') + 'EQUIPPED' : 'EQUIP'}</button>`;
    $('lbStEq').onclick = () => equipSkin(x);
    const cv = $('lbStCv');
    if (has3D()) {
      const pc = pvCanvas(); cv.innerHTML = '<span class="hint">Preview</span>'; cv.appendChild(pc);
      try { loTab('o'); const k = mySkin; mySkin = x.id; try { updatePreview(); } finally { mySkin = k; } } catch (e) {}
    } else { cv.classList.add('art'); cv.innerHTML = `<img src="${ART[heroArt()].src}" alt=""><div class="fab" style="background:${skinSwatch(x)}"></div>`; }
  }
  function equipSkin(x) {
    if (!x || !skinUnlocked(x) || x.id === mySkin) return;
    mySkin = x.id; store.set('boomOpSkin', mySkin); try { opChanged(); } catch (e) {}
    toastMsg('SKIN EQUIPPED', x.name); ui(880, .08, .05);
    storeScr();
  }
  // the free weekly season pass (rewards.js) and every challenge in one place
  const SP_PER = 2500, SP_N = 25;
  const tierRar = t => t % 5 === 0 ? (t === SP_N ? 'legendary' : t >= 15 ? 'epic' : 'rare') : t % 2 === 0 ? 'uncommon' : 'common';
  const RAR_COL = { common: '#8d8f8c', uncommon: '#86a873', rare: '#7298bd', epic: '#9c87bf', legendary: '#c99c52' };
  function chRow(ch, xp) {
    const def = CH_POOL.find(c => c.id === ch.id); if (!def) return '';
    return `<div class="lb-crow ${ch.done ? 'done' : ''}"><span class="ck">${ico('check')}</span><div class="tx"><div class="t"><span>${esc(def.text(ch.n))}</span><em>${Math.min(ch.have, ch.n).toLocaleString()} / ${ch.n.toLocaleString()}</em></div><div class="lb-bar"><i style="width:${Math.round(Math.min(1, ch.have/ch.n)*100)}%"></i></div></div><div class="xpv">+${xp.toLocaleString()} XP</div></div>`;
  }
  function passScr(focus) {
    const R = window.BoomRewards, s = R ? R.season() : { sp: 0 }, tier = Math.min(SP_N, Math.floor(s.sp/SP_PER)), into = s.sp % SP_PER, maxed = tier >= SP_N;
    const d = new Date(), nx = new Date(d); nx.setHours(0, 0, 0, 0); nx.setDate(nx.getDate() + 7 - (d.getDay() + 6) % 7); const days = Math.max(1, Math.ceil((nx - d)/864e5));
    const rn = r => R ? R.R(r).name : r;
    let tiles = '';
    for (let t = 1; t <= SP_N; t++) {
      const r = tierRar(t), st = t <= tier ? 'got' : t === tier + 1 ? 'nx' : 'lk';
      tiles += `<div class="lb-tier ${st}" style="--rc:${RAR_COL[r]}"><span class="n">${t}</span>${ico(t % 5 ? 'crate' : 'crown', 'big')}<b>${rn(r)}</b><small>Cosmetic</small><em>${st === 'got' ? ico('check') + 'EARNED' : st === 'nx' ? `${Math.round(into/SP_PER*100)}%` : ico('lock')}</em></div>`;
    }
    try { dailyFresh(); weeklyFresh(); } catch (e) {}
    const dl = typeof daily !== 'undefined' && daily ? daily.list : [], wl = typeof weekly !== 'undefined' && weekly ? weekly.list : [];
    const c = careerOf(xpTotal), tok = typeof streakTokens === 'function' ? streakTokens() : 0, streak = typeof playStreakN === 'function' ? playStreakN() : 0;
    screen('bp', 'Battle Pass', 'Free for everyone. Every XP you earn in a match also fills the pass, and each tier drops a cosmetic into your locker. Resets every Monday.',
      `<div class="lb-blk" style="grid-column:1/-1"><div class="lb-bb"><div class="lb-bph"><div class="tn">TIER<b>${tier}</b>/ ${SP_N}</div>
         <div class="pg"><div class="meta"><span>${maxed ? '<b>Pass complete.</b> Every tier earned this week.' : `<b>${into.toLocaleString()} / ${SP_PER.toLocaleString()}</b> to tier ${tier + 1} · ${rn(tierRar(tier + 1))} cosmetic`}</span><span>Ends in <b>${days}d</b></span></div><div class="lb-bar acc"><i style="width:${maxed ? 100 : Math.round(into/SP_PER*100)}%"></i></div>
         <div class="meta"><span>Level <b>${c.master ? 'M' + c.master : c.level}</b>${c.prestige && !c.master ? ` · Prestige <b>${c.prestige}</b>` : ''} · Play streak <b>${streak}</b> day${streak === 1 ? '' : 's'} · Streak tokens <b>${tok}</b></span><span>No premium track</span></div></div></div></div></div>
       <div class="lb-blk" style="grid-column:1/-1"><div class="lb-bh"><span>Rewards</span><span>Earned rewards are in your locker</span></div><div class="lb-bb" style="overflow:visible"><div class="lb-track" id="lbTrack">${tiles}</div></div></div>
       ${blk('Daily challenges', dl.map(ch => chRow(ch, (CH_POOL.find(x => x.id === ch.id) || { xp: 0 }).xp)).join(''), '', `<span>Resets in ${resetIn()}</span>`, 'lbChDaily')}
       ${blk('Weekly challenges', wl.map(ch => chRow(ch, 10000)).join('') + '<p class="lb-note" style="margin-top:8px">Each weekly also gives +5,000 pass progress and a streak token.</p>', '', '<span>Resets Monday</span>')}`,
      `<button class="lb-btn gh" id="lbBpLocker">OPEN LOCKER</button>`);
    $('lbBpLocker').onclick = locker;
    const tr = $('lbTrack'); tr.scrollLeft = Math.max(0, (tier - 2)*tr.firstElementChild.offsetWidth);
    if (focus === 'ch' && $('lbChDaily')) $('lbChDaily').scrollIntoView({ block: 'nearest' });
  }
  function setScr() {
    screen('set', 'Settings', 'Graphics, controls, audio and gameplay. Saved on this device.', `<div class="lb-col">${blk('Options', slot('settingsView'), 'grow')}</div>`);
    try { renderSettings(); } catch (e) {}
  }
  const SCREENS = { LOADOUT: loadoutScr, OPERATORS: opsScr, 'BATTLE PASS': passScr, STORE: storeScr, SETTINGS: setScr };
  function tab(t, arg) {
    adopt();
    if (!SCREENS[t]) t = 'PLAY';
    const was = cur; cur = t;
    el.querySelectorAll('#lbTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    sheet(null);
    el.classList.toggle('scr', t !== 'PLAY');
    if (was === 'STORE' && t !== 'STORE') try { updatePreview(); } catch (e) {}
    if (t === 'PLAY') { park(); $('lbScr').classList.remove('on'); $('lbScr').innerHTML = ''; refresh(); return; }
    $('lbScr').classList.add('on');
    SCREENS[t](arg);
    tidy($('lbScr'));
  }
  // the game's operator / skin / weapon buttons do their own work (and re-render themselves, hence the capture phase);
  // afterwards update what the lobby shows about them
  $('lbScr').addEventListener('click', e => {
    const op = e.target.closest('#ops button');
    if (op && op.dataset.op !== myOp) setTimeout(() => { opView(); dock(); toastMsg(`${opName()} EQUIPPED`, 'Used in your next match'); }, 0);
    else if (e.target.closest('#skins button, #prim button, #sec button')) setTimeout(dock, 0);
  }, true);
  el.querySelectorAll('#lbTabs button').forEach(b => b.onclick = () => tab(b.dataset.tab));
  el.querySelectorAll('.lb-dk').forEach(b => b.onclick = () => tab(b.dataset.go));
  $('lbScrim').onclick = () => sheet(null);
  $('lbGear').onclick = () => tab('SETTINGS');
  $('lbMe').onclick = locker;
  $('lbDailyP').onclick = () => tab('BATTLE PASS', 'ch');
  const netLive = () => { const s = ns(); return !!(s && (s.on || s.connecting)); };
  $('lbModeB').onclick = () => { if (netLive()) return toastMsg('THE ONLINE MATCH SETS THE MODE', 'Leave the match to pick another'); if (paused) return toastMsg('LEAVE THE MATCH TO CHANGE MODE'); modesSheet(); };
  $('lbMap').onclick = () => { if (netLive()) return toastMsg('THE ONLINE MATCH SETS THE MAP', 'Leave the match to pick another'); if (paused) return toastMsg('LEAVE THE MATCH TO CHANGE MAP'); mapsSheet(); };
  $('lbOnline').onclick = onlineToggle;
  $('lbNetSt').onclick = $('lbInvite').onclick = () => onlineSheet();
  $('lbFill').onclick = () => { store.set('boomSquadFill', fillPref() ? '0' : '1'); if (fillOn()) fillSquad(); else { clearInterval(fillT); joined = 0; } figs(); squadPanel(); banner(); tags(); };

  // ---------------- squad chat (your bot squadmates answer) ----------------
  const ACKS = ['Copy that.', 'On you, lead.', 'Ready when you are.', 'Roger. Let\'s go.', 'Watch the containers.', 'I\'ll cover the flank.', 'Good luck out there.'];
  function chatLine(who, col, text) {
    const log = $('lbChatLog'), d = document.createElement('div');
    d.innerHTML = `<b style="color:${col}">${esc(who)}:</b>${esc(text)}`; log.appendChild(d);
    while (log.children.length > 5) log.firstChild.remove();
    setTimeout(() => { d.style.opacity = 0; setTimeout(() => d.remove(), 700); }, 9000);
  }
  $('lbChatIn').addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.target.blur(); return; }
    if (e.key !== 'Enter') return;
    const v = e.target.value.trim(); e.target.value = ''; if (!v) { e.target.blur(); return; }
    chatLine(myName(), SLOT_COL[0], v);
    if (fillOn() && joined) { const k = Math.floor(Math.random()*Math.min(3, joined)), m = mates()[k]; setTimeout(() => chatLine(m.name, SLOT_COL[k + 1], ACKS[Math.floor(Math.random()*ACKS.length)]), 700 + Math.random()*900); }
  });

  // ---------------- music: original procedural ambient loop (Am – F – C – G, 92 bpm) ----------------
  const MUS = { on: false };
  const musOff = () => localStorage.getItem('boomLobbyMusic') === '0';
  const mtof = n => 440 * Math.pow(2, (n - 69)/12);
  function vox(type, f, t, dur, vol, det = 0, dest = MUS.g) {
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.6, dur*.3)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + .05);
  }
  function kick(t) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(38, t + .25); g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.0001, t + .3); o.connect(g); g.connect(MUS.dry); o.start(t); o.stop(t + .35); }
  const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], E = 60/92/2;
  function sched() {
    if (!MUS.on) return;
    while (MUS.next < AC.currentTime + .5) {
      const s = MUS.step++, t = MUS.next, ch = PROG[Math.floor(s/16) % 4];
      if (s % 16 === 0) for (const n of ch) { vox('sawtooth', mtof(n), t, E*16.5, .022, -7); vox('sawtooth', mtof(n), t, E*16.5, .022, 7); }
      if (s % 4 === 0) kick(t);
      if (s % 8 === 0 || s % 8 === 3 || s % 8 === 6) vox('sine', mtof(ch[0] - 24), t, E*2.2, .16, 0, MUS.dry);
      if (s % 2 === 0) vox('triangle', mtof(ch[(s/2) % 3] + 12 + (s % 16 > 8 ? 12 : 0)), t, E*1.6, .035);
      MUS.next += E;
    }
  }
  function musIcon() { $('lbMus').innerHTML = ico(MUS.on || !musOff() ? 'speaker' : 'mute'); }
  function musStart() {
    if (MUS.on || musOff() || !open) return;
    try { audio(); if (AC.state !== 'running') AC.resume(); } catch (e) { return; }
    if (typeof master === 'undefined' || !master) return;
    const g = AC.createGain(), lp = AC.createBiquadFilter(), dl = AC.createDelay(), fb = AC.createGain(), out = AC.createGain(), dry = AC.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 1600; dl.delayTime.value = E*3; fb.gain.value = .32;
    out.gain.value = 0; out.gain.linearRampToValueAtTime(.8, AC.currentTime + 2.5);
    g.connect(lp); lp.connect(out); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(out); dry.connect(out); out.connect(master);
    Object.assign(MUS, { on: true, g, dry, out, step: 0, next: AC.currentTime + .15 });
    MUS.timer = setInterval(sched, 120); sched(); musIcon();
  }
  function musStop() {
    if (!MUS.on) return;
    MUS.on = false; clearInterval(MUS.timer);
    const out = MUS.out; try { out.gain.cancelScheduledValues(AC.currentTime); out.gain.setValueAtTime(out.gain.value, AC.currentTime); out.gain.linearRampToValueAtTime(0, AC.currentTime + .6); setTimeout(() => out.disconnect(), 900); } catch (e) {}
  }
  $('lbMus').onclick = e => { e.stopPropagation(); if (MUS.on) { musStop(); localStorage.setItem('boomLobbyMusic', '0'); } else { localStorage.setItem('boomLobbyMusic', '1'); musStart(); } musIcon(); };
  musIcon();
  el.addEventListener('pointerdown', () => musStart());

  // ---------------- flow ----------------
  let playFn = null;
  function fadeOut(fn) { const f = $('lbFade'); f.style.opacity = 1; setTimeout(fn, 350); }
  function fillSquad() {
    clearInterval(fillT);
    if (!fillOn() || joined >= 3) { joined = fillOn() ? 3 : 0; return; }
    fillT = setInterval(() => {
      joined++; ui(660 + joined*110, .08, .05); figs(); squadPanel(); banner(); tags();
      if (joined >= 3) clearInterval(fillT);
    }, 380);
  }
  function show(o = {}) {
    paused = !!o.paused; document.body.classList.remove('ovShow'); document.body.classList.add('lbUp', 'lbOpen');
    el.classList.toggle('paused', paused);
    open = true; el.style.display = 'block'; requestAnimationFrame(() => el.classList.add('vis')); $('lbFade').style.opacity = 0;
    use3D = want3D() && has3D();
    if (use3D) { initView(); if (!pv) use3D = false; }
    $('lbCanvas').style.display = use3D ? 'block' : 'none';
    if (paused) joined = fillOn() ? 3 : 0;
    if (use3D) { $('lbStage').innerHTML = ''; if (!squad.length || heroChanged()) build3D(); } else stageArt();
    tab(o.tab || 'PLAY');
    if (!paused) fillSquad();
    clearInterval(tickT); tickT = setInterval(() => { if (open && cur === 'PLAY') dailyPanel(); }, 30000);
    clearInterval(netCountT); netCount(); netCountT = setInterval(() => { if (netWant()) netCount(); }, 8000);
    if (typeof AC !== 'undefined' && AC && AC.state === 'running') musStart();
    requestAnimationFrame(frame);
  }
  function hide() { open = false; el.classList.remove('vis', 'sheet', 'scr'); el.style.display = 'none'; document.body.classList.remove('lbOpen'); clearInterval(fillT); clearInterval(tickT); clearInterval(netCountT); sheet(null); park(); cur = 'PLAY'; musStop(); }
  function play(e) {
    if (!playFn) return;
    const s = ns();
    if (s && s.dropped) { BoomNet.leave(); return; }
    if (s && s.connecting) { wantDeploy = Date.now(); return; }
    if (s && s.on) {
      if (s.over) { toastMsg('NEXT ROUND STARTS IN A MOMENT'); return; }
      paused = false; $('lbPlaySub').textContent = 'DEPLOYING…'; ui(880, .1, .06, 'square');
      hide(); playFn(e); return;
    }
    if (netWant() && !paused) {
      netErr = '';
      if (BoomNet.join({ name: myName(), code: joinCode || undefined })) {
        wantDeploy = Date.now();
        try { sessionStorage.setItem('boomDeploy', String(wantDeploy)); } catch (er) {}
      }
      refresh(); return;
    }
    if (paused) { paused = false; hide(); playFn(e); return; }
    // the click itself is what lets the game grab the mouse, so start right away under a quick fade
    $('lbPlaySub').textContent = 'DEPLOYING…'; ui(880, .1, .06, 'square');
    hide(); playFn(e);
  }
  $('lbPlay').onclick = e => play(e);
  $('lbLeave').onclick = () => { const b = $('pmLobby'); if (b) b.onclick(); };
  window.addEventListener('resize', () => {
    const s = isShort() ? SLOTS_SHORT : SLOTS_WIDE;
    if (s !== SLOTS) { SLOTS = s; if (open) { if (use3D && pv) placeSquad(); else stageArt(); } }
    if (open) tags();
  });
  // Fullscreen (F11, or F while a menu is open, since F is inspect in-game).
  function fsToggle() {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { const r = d.documentElement, f = r.requestFullscreen || r.webkitRequestFullscreen; if (f) { const p = f.call(r, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } }
  }
  const fsLabel = () => { const on = !!(document.fullscreenElement || document.webkitFullscreenElement); const b = $('fsBtn'); if (b) b.textContent = on ? '⛶ Exit fullscreen' : '⛶ Fullscreen'; };
  document.addEventListener('fullscreenchange', fsLabel); document.addEventListener('webkitfullscreenchange', fsLabel);
  addEventListener('keydown', e => {
    const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    const inMenu = open || ($('overlay') && $('overlay').style.display !== 'none');
    if (e.code === 'F11' || (e.code === 'KeyF' && inMenu && !typing)) { e.preventDefault(); fsToggle(); }
    if (!open || typing) return;
    if (e.code === 'Escape') { if (el.classList.contains('sheet')) sheet(null); else if ($('locker')) $('locker').remove(); else tab('PLAY'); }
    if ((e.code === 'Enter' || e.code === 'NumpadEnter') && cur === 'PLAY' && !el.classList.contains('sheet')) { e.preventDefault(); $('lbChatIn').focus(); }
  });
  if ($('lbExit')) $('lbExit').onclick = () => { if (confirm('Exit Boom Arena?')) window.boomDesktop.quit(); };
  function install() {
    if ($('fsBtn') && !$('fsBtn').onclick) $('fsBtn').onclick = e => { e.stopPropagation(); fsToggle(); };
    const playBtn = $('play'); if (!playBtn || !playBtn.onclick) return setTimeout(install, 300);
    playFn = playBtn.onclick;
    playBtn.onclick = e => {
      if (open) { play(e); return; }   // gamepad A / Enter while the lobby is up: play / resume
      if (typeof NET !== 'undefined' && NET.on) return playFn(e);
      if (typeof started !== 'undefined' && started && !matchOver) return playFn(e);   // resuming a paused match skips the lobby
      show();
    };
    adopt();
    // the lobby IS the front screen: open it as soon as the game has loaded (not for online rejoins / mid-match)
    const iv = setInterval(() => {
      if (playBtn.disabled) return; clearInterval(iv);
      if ((typeof started !== 'undefined' && started) || /[?&]nolobby/.test(location.search)) return;
      show();
    }, 250);
  }
  install();
  // the game's loadout preview (canvas#preview) draws while one of these screens shows it
  const preview = () => open && (cur === 'LOADOUT' || ((cur === 'OPERATORS' || cur === 'STORE') && has3D()));
  window.BoomLobby = { show, hide, isOpen: () => open, fsToggle, tab, preview, screen: () => cur, music: () => MUS.on, mode: () => (use3D ? '3d' : 'art'), netChanged, online: onlineSheet };
})();
