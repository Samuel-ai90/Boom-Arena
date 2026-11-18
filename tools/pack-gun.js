// Boom Arena gun importer (not shipped with the app): packs a Sketchfab glTF download into one small GLB for weapons/.
//   node tools/pack-gun.js <unzipped>/scene.gltf weapons/<name>.glb tools/guns/<name>.json
// Options (see tools/guns/*.json for the ones used, with the texture steps in "_steps"):
//   drop      regex: nodes (and their subtrees) to leave out, by name
//   bake      true: turn skinned meshes into plain meshes in their rest pose; split: [{ name, bones }] makes the
//             triangles bound mostly to those bones their own mesh (moving parts: cylinder, hammer)
//   align     { bone, to }: turn the model so that bone's +y axis lies on `to` (levels a tilted model)
//   game      { rotY, len }: the game's placement (same as REAL_GUN rotY / len), used by the boxes below:
//   cut       boxes [x0,y0,z0,x1,y1,z1]: drop every loose piece lying wholly inside one (bipods, spare rounds, caps)
//   cutTris   boxes: drop single triangles by their centre (a cord welded onto a bigger piece)
//   parts     { Name: [boxes] }: loose pieces wholly inside become their own mesh "Name" (Mag, Bolt, Supp)
//   probe     boxes: just print the pieces inside (to find coordinates); images: replacement (resized) textures
//   dropMaterials  true: strip textures (the game gives the model its own materials)
const fs = require('fs'), path = require('path');
const [src, out, optFile] = process.argv.slice(2);
const O = optFile ? JSON.parse(fs.readFileSync(optFile, 'utf8')) : {};
if (O.images) for (const k in O.images) if (!path.isAbsolute(O.images[k])) O.images[k] = path.resolve(path.dirname(optFile), O.images[k]);
const dir = path.dirname(src), j = JSON.parse(fs.readFileSync(src, 'utf8'));
const bufs = j.buffers.map(b => fs.readFileSync(path.join(dir, decodeURIComponent(b.uri))));

// ---------- reading accessors ----------
const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const NORM = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
function read(ai) {   // -> { n, c, data: Float64Array (or plain numbers), ct }
  const a = j.accessors[ai], n = NC[a.type], T = CT[a.componentType], out = new Float64Array(a.count * n);
  if (a.bufferView == null) return { n, count: a.count, data: out, ct: a.componentType };
  const bv = j.bufferViews[a.bufferView], buf = bufs[bv.buffer], es = T.BYTES_PER_ELEMENT, stride = bv.byteStride || n * es;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0), dv = new DataView(buf.buffer, buf.byteOffset);
  const get = { 5120: o => dv.getInt8(o), 5121: o => dv.getUint8(o), 5122: o => dv.getInt16(o, true), 5123: o => dv.getUint16(o, true), 5125: o => dv.getUint32(o, true), 5126: o => dv.getFloat32(o, true) }[a.componentType];
  const k = a.normalized ? 1 / NORM[a.componentType] : 1;
  for (let i = 0; i < a.count; i++) for (let c = 0; c < n; c++) out[i * n + c] = get(base + i * stride + c * es) * k;
  if (a.sparse) throw new Error('sparse accessors not supported');
  return { n, count: a.count, data: out, ct: a.componentType };
}

// ---------- matrices (column-major, like glTF) ----------
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) { const r = new Array(16); for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + rr] * b[c * 4 + k]; r[c * 4 + rr] = s; } return r; }
function trs(n) {
  if (n.matrix) return n.matrix.slice();
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], [tx, ty, tz] = n.translation || [0, 0, 0];
  return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
          2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
          2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, tx, ty, tz, 1];
}
const xp = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
const xv = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];
function nrm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

// ---------- scene graph ----------
const scene = j.scenes[j.scene || 0], parent = {};
j.nodes.forEach((n, i) => (n.children || []).forEach(c => parent[c] = i));
const dropRe = O.drop ? new RegExp(O.drop, 'i') : null;
if (dropRe) j.nodes.forEach(n => { if (n.children) n.children = n.children.filter(c => !dropRe.test(j.nodes[c].name || '')); });
scene.nodes = scene.nodes.filter(c => !(dropRe && dropRe.test(j.nodes[c].name || '')));
const world = {};
(function walk(list, m) { for (const i of list) { world[i] = mul(m, trs(j.nodes[i])); walk(j.nodes[i].children || [], world[i]); } })(scene.nodes, I4());
// align: turn the whole model so a bone's own +y axis (e.g. the revolver's cylinder bone, which runs along the bore) lies on
// `to`. Baked meshes get it in their vertices (so bounding boxes stay tight); anything else gets a wrapper node.
let A = I4(), alignQ = null;
if (O.align) {
  const bi = j.nodes.findIndex(n => new RegExp(O.align.bone).test(n.name || ''));
  const d = nrm(xv(world[bi], 0, 1, 0)), t = nrm(O.align.to);
  const cx = [d[1] * t[2] - d[2] * t[1], d[2] * t[0] - d[0] * t[2], d[0] * t[1] - d[1] * t[0]], w = 1 + d[0] * t[0] + d[1] * t[1] + d[2] * t[2];
  const l = Math.hypot(cx[0], cx[1], cx[2], w); alignQ = [cx[0] / l, cx[1] / l, cx[2] / l, w / l];
  A = trs({ rotation: alignQ });
  console.log('align', j.nodes[bi].name, 'dir', d.map(v => +v.toFixed(4)), 'quat', alignQ.map(v => +v.toFixed(4)));
}
const reachable = new Set(); (function walk(l) { for (const i of l) { reachable.add(i); walk(j.nodes[i].children || []); } })(scene.nodes);

// new output model: list of { name, matrix|null(=identity at root), prims: [{ attrs: {NAME: {n, data}}, idx: Uint32Array, mat }] }
// We rebuild the node tree: unskinned meshes keep their hierarchy; baked meshes go to the root with an identity transform.
const outMeshes = [];   // { name, prims }
const baked = [];       // nodes to add at root: { name, mesh }
const prim = (p, attrsOverride) => {
  const attrs = {};
  for (const k in p.attributes) { if (/^(JOINTS|WEIGHTS)_/.test(k)) continue; attrs[k] = read(p.attributes[k]); }
  Object.assign(attrs, attrsOverride || {});
  const idx = p.indices != null ? Uint32Array.from(read(p.indices).data) : Uint32Array.from({ length: attrs.POSITION.count }, (_, i) => i);
  return { attrs, idx, mat: p.material };
};
const meshMap = {};   // old mesh index -> new mesh index (for unskinned)
const keepNode = {};  // old node -> new node object
for (const i of reachable) {
  const n = j.nodes[i];
  if (n.mesh == null) continue;
  if (n.skin != null && O.bake) {
    const sk = j.skins[n.skin], ibm = read(sk.inverseBindMatrices).data;
    const jm = sk.joints.map((jn, k) => mul(A, mul(world[jn] || I4(), Array.from(ibm.slice(k * 16, k * 16 + 16)))));
    const splitRes = (O.split || []).map(s => ({ name: s.name, re: new RegExp(s.bones, 'i') }));
    const jointSplit = sk.joints.map(jn => { const nm = j.nodes[jn].name || ''; const s = splitRes.findIndex(s => s.re.test(nm)); return s; });
    const groups = [{ name: n.name || 'mesh', prims: [] }, ...splitRes.map(s => ({ name: s.name, prims: [] }))];
    for (const p of j.meshes[n.mesh].primitives) {
      const P = prim(p), J = read(p.attributes.JOINTS_0), W = read(p.attributes.WEIGHTS_0), cnt = P.attrs.POSITION.count;
      const pos = P.attrs.POSITION.data, nor = P.attrs.NORMAL && P.attrs.NORMAL.data, tan = P.attrs.TANGENT && P.attrs.TANGENT.data;
      const dom = new Int32Array(cnt);   // split group of each vertex (by its heaviest joint), -1 = main
      for (let v = 0; v < cnt; v++) {
        const m = new Array(16).fill(0); let best = -1, bw = -1;
        for (let k = 0; k < 4; k++) { const w = W.data[v * 4 + k]; if (!w) continue; const M = jm[J.data[v * 4 + k]]; for (let e = 0; e < 16; e++) m[e] += w * M[e]; if (w > bw) { bw = w; best = J.data[v * 4 + k]; } }
        const q = xp(m, pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); pos.set(q, v * 3);
        if (nor) nor.set(nrm(xv(m, nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2])), v * 3);
        if (tan) tan.set(nrm(xv(m, tan[v * 4], tan[v * 4 + 1], tan[v * 4 + 2])), v * 4);
        dom[v] = best >= 0 ? jointSplit[best] : -1;
      }
      const lists = groups.map(() => []);
      for (let t = 0; t < P.idx.length; t += 3) {
        const c = [dom[P.idx[t]], dom[P.idx[t + 1]], dom[P.idx[t + 2]]];
        const g = c[0] === c[1] || c[0] === c[2] ? c[0] : c[1] === c[2] ? c[1] : c[0];   // majority vote of the 3 corners
        lists[g + 1].push(P.idx[t], P.idx[t + 1], P.idx[t + 2]);
      }
      lists.forEach((l, gi) => { if (l.length) groups[gi].prims.push({ attrs: P.attrs, idx: Uint32Array.from(l), mat: P.mat }); });
    }
    for (const g of groups) if (g.prims.length) { outMeshes.push(g); baked.push({ name: g.name, mesh: outMeshes.length - 1 }); }
    keepNode[i] = 'baked';
  } else {
    if (meshMap[n.mesh] == null) { outMeshes.push({ name: j.meshes[n.mesh].name, prims: j.meshes[n.mesh].primitives.map(p => prim(p)) }); meshMap[n.mesh] = outMeshes.length - 1; }
  }
}

// ---------- loose pieces: drop or split whole connected pieces by where their centre lies ----------
// Boxes are in the game's frame for this gun: turned by rotY, scaled so the whole model is len long, centred in x,
// butt at z = 0 (barrel toward -z) — the same placement the game's loadRealGuns does.
const extraKids = {};   // old node -> [{ name, mesh }]
if (O.game) {
  const { rotY = 0, len } = O.game, c = Math.cos(rotY), s = Math.sin(rotY);
  const R = [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  const meshNodes = [...reachable].filter(i => j.nodes[i].mesh != null && meshMap[j.nodes[i].mesh] != null);
  const bb = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const i of meshNodes) { const M = mul(R, world[i]); for (const p of outMeshes[meshMap[j.nodes[i].mesh]].prims) { const d = p.attrs.POSITION.data; for (let v = 0; v < d.length; v += 3) { const q = xp(M, d[v], d[v + 1], d[v + 2]); for (let e = 0; e < 3; e++) { bb[e] = Math.min(bb[e], q[e]); bb[e + 3] = Math.max(bb[e + 3], q[e]); } } } }
  const k = len / (bb[5] - bb[2]), G = mul([k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, -(bb[0] + bb[3]) / 2 * k, 0, -bb[5] * k, 1], R);
  const inBox = (p, b) => p[0] >= b[0] && p[1] >= b[1] && p[2] >= b[2] && p[0] <= b[3] && p[1] <= b[4] && p[2] <= b[5];
  const after = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const i of meshNodes) {
    const M = mul(G, world[i]), me = outMeshes[meshMap[j.nodes[i].mesh]], parts = {};
    for (const p of me.prims) {
      const d = p.attrs.POSITION.data, nv = d.length / 3, wp = new Float64Array(d.length);
      for (let v = 0; v < nv; v++) wp.set(xp(M, d[v * 3], d[v * 3 + 1], d[v * 3 + 2]), v * 3);
      if (O.cutTris) {   // single triangles (by centre) — for a strap or cord that's welded onto a bigger piece
        const keepT = []; let n = 0;
        for (let t = 0; t < p.idx.length; t += 3) {
          const c = [0, 1, 2].map(a => (wp[p.idx[t] * 3 + a] + wp[p.idx[t + 1] * 3 + a] + wp[p.idx[t + 2] * 3 + a]) / 3);
          if (O.cutTris.some(b => inBox(c, b))) { n++; if (O.showCut) console.log('   tri', c.map(v => +v.toFixed(3)).join(' ')); continue; } keepT.push(p.idx[t], p.idx[t + 1], p.idx[t + 2]);
        }
        p.idx = Uint32Array.from(keepT); console.log('  cutTris removed', n);
      }
      // weld by position (0.05 mm) so UV seams don't break a piece apart, then union-find over the triangles
      const key = new Map(), id = new Int32Array(nv);
      for (let v = 0; v < nv; v++) { const kk = Math.round(wp[v * 3] * 2e4) + ',' + Math.round(wp[v * 3 + 1] * 2e4) + ',' + Math.round(wp[v * 3 + 2] * 2e4); let q = key.get(kk); if (q == null) { q = key.size; key.set(kk, q); } id[v] = q; }
      const par = new Int32Array(key.size).map((_, i) => i), find = x => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
      for (let t = 0; t < p.idx.length; t += 3) { const a = find(id[p.idx[t]]), b = find(id[p.idx[t + 1]]), c2 = find(id[p.idx[t + 2]]); par[b] = a; par[find(c2)] = a; }
      const comp = new Map();   // root -> { box, tris: [] }
      for (let t = 0; t < p.idx.length; t += 3) {
        const r = find(id[p.idx[t]]); let C = comp.get(r); if (!C) comp.set(r, C = { b: [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity], tris: [] });
        for (let e = 0; e < 3; e++) { const v = p.idx[t + e]; for (let a = 0; a < 3; a++) { C.b[a] = Math.min(C.b[a], wp[v * 3 + a]); C.b[a + 3] = Math.max(C.b[a + 3], wp[v * 3 + a]); } }
        C.tris.push(t);
      }
      const keep = [], pl = {};
      for (const C of comp.values()) {
        const ctr = [0, 1, 2].map(a => (C.b[a] + C.b[a + 3]) / 2), f = v => v.map(x => +x.toFixed(3));
        // a piece is caught only when it lies wholly inside a box
        const inside = b => inBox(C.b.slice(0, 3), b) && inBox(C.b.slice(3), b);
        const dest = (O.cut || []).some(inside) ? 'CUT' : Object.keys(O.parts || {}).find(n => O.parts[n].some(inside)) || null;
        if (!dest && (O.probe || []).some(inside)) console.log('  PROBE', C.tris.length + 't', 'min', f(C.b.slice(0, 3)), 'max', f(C.b.slice(3)), 'ctr', f(ctr));
        if (dest && O.verbose !== false) console.log(' ', dest, C.tris.length + 't', 'min', f(C.b.slice(0, 3)), 'max', f(C.b.slice(3)));
        if (dest === 'CUT') continue;
        const list = dest ? (pl[dest] = pl[dest] || []) : keep;
        for (const t of C.tris) list.push(p.idx[t], p.idx[t + 1], p.idx[t + 2]);
        if (!dest) for (let a = 0; a < 3; a++) { after[a] = Math.min(after[a], C.b[a]); after[a + 3] = Math.max(after[a + 3], C.b[a + 3]); }
      }
      for (const n in pl) (parts[n] = parts[n] || []).push({ attrs: p.attrs, idx: Uint32Array.from(pl[n]), mat: p.mat });
      p.idx = Uint32Array.from(keep);
    }
    extraKids[i] = Object.keys(parts).map(n => { outMeshes.push({ name: n, prims: parts[n] }); return { name: n, mesh: outMeshes.length - 1 }; });
  }
  console.log('game frame after cuts: x', after[0].toFixed(4), after[3].toFixed(4), 'y', after[1].toFixed(4), after[4].toFixed(4), 'z', after[2].toFixed(4), after[5].toFixed(4), '=> len', (after[5] - after[2]).toFixed(4));
}

// ---------- write ----------
const chunks = []; let off = 0;
const bufferViews = [], accessors = [];
function addView(bytes, target) { const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); off += pad; } bufferViews.push({ buffer: 0, byteOffset: off, byteLength: bytes.length, ...(target ? { target } : {}) }); chunks.push(bytes); off += bytes.length; return bufferViews.length - 1; }
const TYPE = { 1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4' };
function addAttr(a, compact) {   // compact: Uint32 remap of used vertices
  const n = a.n, f = new Float32Array(compact.length * n);
  for (let i = 0; i < compact.length; i++) for (let c = 0; c < n; c++) f[i * n + c] = a.data[compact[i] * n + c];
  const min = new Array(n).fill(Infinity), max = new Array(n).fill(-Infinity);
  for (let i = 0; i < compact.length; i++) for (let c = 0; c < n; c++) { const v = f[i * n + c]; if (v < min[c]) min[c] = v; if (v > max[c]) max[c] = v; }
  accessors.push({ bufferView: addView(Buffer.from(f.buffer), 34962), componentType: 5126, count: compact.length, type: TYPE[n], min, max });
  return accessors.length - 1;
}
function addIdx(idx, nv) {
  const T = nv < 65536 ? Uint16Array : Uint32Array, d = T.from(idx);
  accessors.push({ bufferView: addView(Buffer.from(d.buffer), 34963), componentType: nv < 65536 ? 5123 : 5125, count: d.length, type: 'SCALAR' });
  return accessors.length - 1;
}
const usedMats = new Set();
const meshes = outMeshes.map(m => ({ name: m.name, primitives: m.prims.map(p => {
  // keep only the vertices this primitive's triangles use
  const remap = new Map(), compact = [], idx = new Uint32Array(p.idx.length);
  for (let k = 0; k < p.idx.length; k++) { let r = remap.get(p.idx[k]); if (r == null) { r = compact.length; remap.set(p.idx[k], r); compact.push(p.idx[k]); } idx[k] = r; }
  const attributes = {}; for (const k in p.attrs) attributes[k] = addAttr(p.attrs[k], compact);
  if (p.mat != null) usedMats.add(p.mat);
  return { attributes, indices: addIdx(idx, compact.length), ...(p.mat != null ? { material: p.mat } : {}) };
}) }));

// materials / textures / images, compacted
const matIdx = {}, materials = [], texIdx = {}, textures = [], imgIdx = {}, images = [], samplers = j.samplers || [];
function tex(ti) {
  if (texIdx[ti] != null) return texIdx[ti];
  const t = j.textures[ti], ii = t.source;
  if (imgIdx[ii] == null) {
    const im = j.images[ii]; let file = im.uri ? decodeURIComponent(im.uri) : null;
    const rep = O.images && O.images[file]; const f = rep || path.join(dir, file);
    const ext = path.extname(f).toLowerCase(), mime = ext === '.png' ? 'image/png' : 'image/jpeg';
    images.push({ bufferView: addView(fs.readFileSync(f)), mimeType: mime, name: path.basename(f) }); imgIdx[ii] = images.length - 1;
  }
  textures.push({ source: imgIdx[ii], ...(t.sampler != null ? { sampler: t.sampler } : {}) }); return texIdx[ti] = textures.length - 1;
}
function fixTex(o) { if (!o || typeof o !== 'object') return; for (const k in o) { if (k.endsWith('Texture') && o[k] && o[k].index != null) { if (O.dropMaterials) delete o[k]; else o[k].index = tex(o[k].index); } else fixTex(o[k]); } }
for (const mi of [...usedMats].sort((a, b) => a - b)) { const m = JSON.parse(JSON.stringify(j.materials[mi])); fixTex(m); if (m.extensions) { for (const e in m.extensions) if (e !== 'KHR_materials_emissive_strength') delete m.extensions[e]; if (!Object.keys(m.extensions).length) delete m.extensions; } materials.push(m); matIdx[mi] = materials.length - 1; }
for (const m of meshes) for (const p of m.primitives) if (p.material != null) p.material = matIdx[p.material];

// nodes: copy the unskinned hierarchy (pruning branches with no meshes), then the baked meshes at the root
const nodes = [];
function hasMesh(i) { const n = j.nodes[i]; return (n.mesh != null && keepNode[i] !== 'baked') || (n.children || []).some(hasMesh); }
function copy(i) {
  const n = j.nodes[i], o = { name: n.name };
  for (const k of ['matrix', 'translation', 'rotation', 'scale']) if (n[k]) o[k] = n[k];
  if (n.mesh != null && keepNode[i] !== 'baked') o.mesh = meshMap[n.mesh];
  nodes.push(o); const me = nodes.length - 1;
  const kids = (n.children || []).filter(hasMesh).map(copy);
  for (const e of extraKids[i] || []) { nodes.push({ name: e.name, mesh: e.mesh }); kids.push(nodes.length - 1); }   // split-off pieces ride on their source node
  if (kids.length) o.children = kids;
  return me;
}
const roots = scene.nodes.filter(hasMesh).map(copy);
for (const b of baked) { nodes.push({ name: b.name, mesh: b.mesh }); roots.push(nodes.length - 1); }

let sceneRoots = roots;
if (alignQ) {   // baked meshes already carry the turn; wrap the rest
  const unbaked = roots.filter(r => !baked.some(b => nodes[r].name === b.name && nodes[r].mesh === b.mesh));
  if (unbaked.length) { nodes.push({ name: 'Aligned', rotation: alignQ, children: unbaked }); sceneRoots = roots.filter(r => !unbaked.includes(r)).concat(nodes.length - 1); }
}
const bin = Buffer.concat(chunks); const binPad = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
const outJ = { asset: { version: '2.0', generator: 'boom-arena pack.js', copyright: j.asset && j.asset.copyright }, scene: 0, scenes: [{ nodes: sceneRoots }], nodes, meshes, materials,
  ...(textures.length ? { textures, images, samplers } : {}), accessors, bufferViews, buffers: [{ byteLength: binPad.length }] };
let js = Buffer.from(JSON.stringify(outJ)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + binPad.length, 8);
const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
fs.writeFileSync(out, Buffer.concat([head, ch(js.length, 0x4E4F534A), js, ch(binPad.length, 0x004E4942), binPad]));
let tris = 0; for (const m of meshes) for (const p of m.primitives) tris += accessors[p.indices].count / 3;
console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(2) + ' MB', 'tris', tris, 'meshes', meshes.map(m => m.name).join(', '), 'images', images.map(i => i.name).join(', '));
