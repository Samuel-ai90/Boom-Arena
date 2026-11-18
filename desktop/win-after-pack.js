// electron-builder afterPack hook (Windows): puts the Boom Arena icon and name into "Boom Arena.exe".
// electron-builder would do this with rcedit, which needs Wine on a Mac; resedit does it in plain JavaScript.
const fs = require('fs'), path = require('path');
const from = [process.cwd(), process.env.BOOM_TOOLS || '', __dirname];
module.exports = async ctx => {
  if (ctx.electronPlatformName !== 'win32') return;
  const { load } = require(require.resolve('resedit/cjs', { paths: from }));
  const PELibrary = await import(require.resolve('pe-library', { paths: from.map(p => path.join(p, 'node_modules', 'resedit')).concat(from) }));
  const ResEdit = await load();
  const name = ctx.packager.appInfo.productFilename, exe = path.join(ctx.appOutDir, name + '.exe');
  const pe = PELibrary.NtExecutable.from(fs.readFileSync(exe), { ignoreCert: true });
  const res = PELibrary.NtExecutableResource.from(pe);
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'icon.ico')));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const id = groups.length ? groups[0].id : 1, lang = groups.length ? groups[0].lang : 1033;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, id, lang, ico.icons.map(i => i.data));
  const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0];
  if (vi) {
    const v = ctx.packager.appInfo.version, lang2 = { lang: 1033, codepage: 1200 };
    vi.setStringValues(lang2, { ProductName: 'Boom Arena', FileDescription: 'Boom Arena', CompanyName: 'Boom Arena', OriginalFilename: name + '.exe', InternalName: 'Boom Arena', LegalCopyright: '' });
    vi.setFileVersion(...v.split('.').map(Number), 0); vi.setProductVersion(...v.split('.').map(Number), 0);
    vi.outputToResourceEntries(res.entries);
  }
  res.outputResource(pe);
  fs.writeFileSync(exe, Buffer.from(pe.generate()));
  console.log('  • icon and name set on', path.basename(exe));
};
