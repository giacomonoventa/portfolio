/**
 * build-manifest.js
 * Scansiona /foto e genera manifest.json con la struttura del sito.
 * Nessuna dipendenza esterna: legge le dimensioni di JPEG/PNG a basso livello.
 *
 * Eseguire con: node scripts/build-manifest.js
 * (Cloudflare Pages lo esegue automaticamente come build command)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FOTO_DIR = path.join(ROOT, 'foto');
const OUT_FILE = path.join(ROOT, 'manifest.json');

const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

// ---- lettura dimensioni immagine senza librerie esterne ----
function getImageSize(filePath) {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.png') {
    // 8 byte firma PNG + 4 byte lunghezza chunk + 4 byte "IHDR" -> width/height a offset 16/20
    if (buf.length < 24) return null;
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  }

  if (ext === '.jpg' || ext === '.jpeg' || ext === '.webp') {
    let offset = 2; // salta 0xFFD8
    while (offset < buf.length) {
      if (buf[offset] !== 0xff) { offset++; continue; }
      const marker = buf[offset + 1];
      // marker SOF (Start Of Frame), esclude DHT(C4), JPG(C8), DAC(CC)
      const isSOF = (marker >= 0xc0 && marker <= 0xcf) &&
        marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { width, height };
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2; continue;
      }
      const segLength = buf.readUInt16BE(offset + 2);
      offset += 2 + segLength;
    }
    return null;
  }
  return null;
}

function orientationOf(w, h) {
  if (!w || !h) return 'sq';
  const ratio = w / h;
  if (ratio > 1.15) return 'h';   // orizzontale
  if (ratio < 0.87) return 'v';   // verticale
  return 'sq';                    // quadrata
}

function listImages(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const allFiles = fs.readdirSync(dirPath)
    .filter(f => IMG_EXT.includes(path.extname(f).toLowerCase()));

  // le varianti mobile (es. "01-mobile.jpg") non contano come foto a sé:
  // vengono agganciate al file principale corrispondente ("01.jpg")
  const mobileSuffix = '-mobile';
  const isMobileVariant = f => path.basename(f, path.extname(f)).endsWith(mobileSuffix);
  const mainFiles = allFiles.filter(f => !isMobileVariant(f));

  return mainFiles
    .sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    })
    .map(f => {
      const size = getImageSize(path.join(dirPath, f));
      const ext = path.extname(f);
      const base = path.basename(f, ext);
      const mobileFile = allFiles.find(mf =>
        path.basename(mf, path.extname(mf)) === base + mobileSuffix
      );
      return {
        file: f,
        mobileFile: mobileFile || null,
        width: size ? size.width : null,
        height: size ? size.height : null,
        orientation: size ? orientationOf(size.width, size.height) : 'sq'
      };
    });
}

// se le posizioni richieste non esistono (categoria con poche foto),
// ripiega sulle prime immagini disponibili invece di lasciare la copertina vuota
function fallbackCover(selected, allImages) {
  if (selected.length > 0) return selected;
  return allImages.slice(0, 3);
}

function titleCase(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function scanCategories(baseDir, type) {
  if (!fs.existsSync(baseDir)) return [];
  return fs.readdirSync(baseDir)
    .filter(name => fs.statSync(path.join(baseDir, name)).isDirectory())
    .map(slug => {
      const dir = path.join(baseDir, slug);
      const images = listImages(dir);
      const relBase = `foto/${type === 'sport' ? 'sport' : 'eventi'}/${slug}`;
      const withUrl = img => ({ ...img, url: `${relBase}/${img.file}`, mobileUrl: img.mobileFile ? `${relBase}/${img.mobileFile}` : null });
      return {
        slug,
        name: titleCase(slug),
        type,
        count: images.length,
        cover: {
          // desktop: 2ª, 4ª, 6ª, 8ª immagine (indici 0-based: 1,3,5,7)
          desktop: fallbackCover([1,3,5,7].map(i => images[i]).filter(Boolean), images).map(withUrl),
          // mobile: 1ª, 3ª, 5ª immagine (indici 0-based: 0,2,4)
          mobile: fallbackCover([0,2,4].map(i => images[i]).filter(Boolean), images).map(withUrl)
        },
        images: images.map(withUrl)
      };
    });
}

// ---- copertina (hero) ----
const copertinaImages = listImages(path.join(FOTO_DIR, 'copertina'))
  .map(img => ({ ...img, url: `foto/copertina/${img.file}`, mobileUrl: img.mobileFile ? `foto/copertina/${img.mobileFile}` : null }));

// ---- sistema (logo, profilo) ----
function findSystemFile(baseName) {
  const dir = path.join(FOTO_DIR, 'sistema');
  if (!fs.existsSync(dir)) return null;
  const match = fs.readdirSync(dir).find(f =>
    IMG_EXT.includes(path.extname(f).toLowerCase()) &&
    path.basename(f, path.extname(f)).toLowerCase() === baseName
  );
  return match ? `foto/sistema/${match}` : null;
}

const manifest = {
  generatedAt: new Date().toISOString(),
  sistema: {
    logo: findSystemFile('logo'),
    profilo: findSystemFile('profilo')
  },
  copertina: copertinaImages,
  sport: scanCategories(path.join(FOTO_DIR, 'sport'), 'sport'),
  eventi: scanCategories(path.join(FOTO_DIR, 'eventi'), 'evento')
};

fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`manifest.json generato: ${manifest.sport.length} sport, ${manifest.eventi.length} categorie eventi, ${manifest.copertina.length} foto copertina.`);
