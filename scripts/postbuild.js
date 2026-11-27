import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';

async function main() {
  const distDir = path.resolve('dist');
  const zipPath = path.join(distDir, 'update.zip');
  const versionPath = path.join(distDir, 'version.json');

  if (!fs.existsSync(distDir)) {
    console.error('Dist directory mavjud emas! Avval npm run build qiling.');
    process.exit(1);
  }

  // 1. version.json yaratish (yil-oy-kun-soat formatida)
  const now = new Date();
  const version = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14); // masalan: "20261123231500"
  const versionData = {
    version: version,
    url: 'https://bank-backend-syzt.onrender.com/auth/ota/update.zip',
    releasedAt: now.toISOString(),
  };
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
  console.log(`✅ [OTA Update] version.json yaratildi (versiya: ${version})`);

  // 2. update.zip arxivini yaratish
  const output = fs.createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`✅ [OTA Update] update.zip yaratildi (${archive.pointer()} bayt)`);
    // Backend OTA papkasiga nusxalash (agar mavjud bo'lsa)
    const backendOtaDir = path.resolve('..', 'backend', 'public', 'ota');
    if (fs.existsSync(path.resolve('..', 'backend'))) {
      fs.mkdirSync(backendOtaDir, { recursive: true });
      fs.copyFileSync(versionPath, path.join(backendOtaDir, 'version.json'));
      fs.copyFileSync(zipPath, path.join(backendOtaDir, 'update.zip'));
      console.log(`✅ [OTA Update] backend/public/ota ga nusxalandi`);
    }
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  archive.glob('**/*', {
    cwd: distDir,
    ignore: ['update.zip'],
  });

  await archive.finalize();
}

main().catch((err) => {
  console.error('[Postbuild] Xatolik:', err);
  process.exit(1);
});
