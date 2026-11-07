// Surface textures: CC0 photo-scanned PBR sets at 1K (WebP in textures/1k/), shared by every map.
// Poly Haven (https://polyhaven.com, CC0) and ambientCG (https://ambientcg.com, CC0): see CREDITS.md.
// At High / Ultra the game upgrades to bundled 2K WebP in textures/2k/ (offline) then, on Ultra, 4K from Poly Haven when online.
// Over file:// the browser won't let WebGL read local images, so the game keeps its procedural surfaces there.
(() => {
  if (!/^https?:$/.test(location.protocol)) return;
  const SETS = {
    asphalt_02: 'd,n,r,ao',
    bark_brown_02: 'd,n,r,ao',
    brown_planks_05: 'd,n,r,ao',
    coast_sand_01: 'd,n,r,ao',
    concrete_floor_02: 'd,n,r,ao',
    concrete_wall_008: 'd,n,r,ao',
    corrugated_iron_02: 'd,n,r,ao',
    forest_leaves_02: 'd,n,r,ao',
    gravel_road: 'd,n,r,ao',
    grey_roof_tiles: 'd,n,r,ao',
    gun_metal: 'n,r',
    gun_poly: 'n,r',
    leafy_grass: 'd,n,r,ao',
    metal_plate: 'd,n,r,ao',
    painted_metal: 'n,r,ao',
    rectangular_paving: 'd,n,r,ao',
    red_brick_03: 'd,n,r,ao',
    rock_face: 'd,n,r,ao',
    sparse_grass: 'd,n,r,ao',
    weathered_plank_siding: 'd,n,r,ao',
    weathered_planks: 'd,n,r,ao',
    white_stucco: 'd,n,r,ao',
    wood_floor: 'd,n,r,ao',
  };
  const ACG = new Set(['painted_metal', 'gun_metal', 'gun_poly']);
  const T = window.BOOM_TEX = window.BOOM_TEX || {};
  for (const [name, kinds] of Object.entries(SETS)) {
    if (T[name]) continue;
    T[name] = { ph: !ACG.has(name) };
    for (const k of kinds.split(',')) T[name][k] = `textures/1k/${name}_${k}.webp`;
  }
})();
