const SOURCE_YELLOW_COLORS = [
  '#ffd428',  // kuning utama
  '#f7e28b',  // highlight terang
  '#ffeb8a',
  '#ffe066',
  '#ffc107',
  '#e6a800',
  '#b58600'
];


    const THRESHOLD = 0.16;

    function hexToRgb(hex) {
      hex = String(hex).replace('#', '').trim();

      if (hex.length === 3) {
        hex = hex.split('').map(function (c) {
          return c + c;
        }).join('');
      }

      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }

    function rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;

        s = l > 0.5
          ? d / (2 - max - min)
          : d / (max + min);

        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }

        h /= 6;
      }

      return { h: h, s: s, l: l };
    }

    function hslToRgb(h, s, l) {
      let r;
      let g;
      let b;

      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      if (s === 0) {
        r = g = b = l;
      } else {
        const q = l < 0.5
          ? l * (1 + s)
          : l + s - l * s;

        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    }

    function rgbDistance(a, b) {
      const dr = a[0] - b[0];
      const dg = a[1] - b[1];
      const db = a[2] - b[2];

      return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    function normalizeRgbArray(arr) {
      return [
        Number(arr[0]),
        Number(arr[1]),
        Number(arr[2])
      ];
    }

    function rgb255ToLottie(rgb) {
      return [
        rgb.r / 255,
        rgb.g / 255,
        rgb.b / 255,
        1
      ];
    }

    function buildPalette(targetHex) {
  const targetRgb = hexToRgb(targetHex);
  const targetHsl = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);

  // Lightness rata-rata palet sumber (kuning ~0.55)
  const sourceLs = SOURCE_YELLOW_COLORS.map(function (hex) {
    const rgb = hexToRgb(hex);
    return rgbToHsl(rgb.r, rgb.g, rgb.b).l;
  });
  const sourceMidL = sourceLs.reduce(function (a, b) { return a + b; }, 0) / sourceLs.length;

  return SOURCE_YELLOW_COLORS.map(function (sourceHex, i) {
    const sourceRgb = hexToRgb(sourceHex);
    const sourceHsl = rgbToHsl(sourceRgb.r, sourceRgb.g, sourceRgb.b);

    // Geser lightness sumber agar pusatnya = lightness target
    const delta = sourceHsl.l - sourceMidL;
    let newL = targetHsl.l + delta;
    if (newL < 0.05) newL = 0.05;
    if (newL > 0.95) newL = 0.95;

    const mappedRgb = hslToRgb(targetHsl.h, targetHsl.s, newL);

    return {
      source: rgb255ToLottie(sourceRgb).slice(0, 3),
      target: rgb255ToLottie(mappedRgb)
    };
  });
}


    function findNearestColor(color, palette) {
      let nearest = null;
      let nearestDistance = Infinity;

      palette.forEach(function (item) {
        const distance = rgbDistance(color, item.source);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = item;
        }
      });

      if (nearest && nearestDistance <= THRESHOLD) {
        return nearest.target;
      }

      return null;
    }

    function recolorValue(value, palette) {
      if (!Array.isArray(value)) return value;
      if (value.length < 3) return value;

      const color = normalizeRgbArray(value);
      const replacement = findNearestColor(color, palette);

      if (!replacement) return value;

      return [
        replacement[0],
        replacement[1],
        replacement[2],
        value.length > 3 ? value[3] : 1
      ];
    }

    function recolorLottie(obj, palette) {
      if (Array.isArray(obj)) {
        return obj.map(function (item) {
          return recolorLottie(item, palette);
        });
      }

      if (obj && typeof obj === 'object') {
        const copy = {};

        Object.keys(obj).forEach(function (key) {
          copy[key] = recolorLottie(obj[key], palette);
        });

        if (
          copy.c &&
          copy.c.k &&
          Array.isArray(copy.c.k) &&
          copy.c.k.length >= 3 &&
          typeof copy.c.k[0] === 'number'
        ) {
          copy.c.k = recolorValue(copy.c.k, palette);
        }

        if (
          copy.g &&
          copy.g.k &&
          copy.g.k.k &&
          Array.isArray(copy.g.k.k)
        ) {
          copy.g.k.k = copy.g.k.k.map(function (item, index, arr) {
            if ((index - 1) % 4 === 0) {
              const color = [
                item,
                arr[index + 1],
                arr[index + 2]
              ];

              const replacement = findNearestColor(color, palette);

              if (replacement) {
                return replacement[0];
              }
            }

            if ((index - 2) % 4 === 0) {
              const color = [
                arr[index - 1],
                item,
                arr[index + 1]
              ];

              const replacement = findNearestColor(color, palette);

              if (replacement) {
                return replacement[1];
              }
            }

            if ((index - 3) % 4 === 0) {
              const color = [
                arr[index - 2],
                arr[index - 1],
                item
              ];

              const replacement = findNearestColor(color, palette);

              if (replacement) {
                return replacement[2];
              }
            }

            return item;
          });
        }

        return copy;
      }

      return obj;
    }

    async function loadJsonFromUrl(url) {
      const response = await fetch(url, {
        cache: 'no-store'
      });

      const text = await response.text();
      const cleanText = text.trim();

      if (!response.ok) {
        throw new Error('URL Lottie gagal dibuka. Status: ' + response.status);
      }

      if (
        !cleanText.startsWith('{') &&
        !cleanText.startsWith('[')
      ) {
        console.log('[Lottie recolor] Isi response bukan JSON:', cleanText.slice(0, 120));
        throw new Error('File Lottie bukan JSON murni. Cek URL src lottie-player.');
      }

      return JSON.parse(cleanText);
    }

    function objectToDataUrl(obj) {
      const json = JSON.stringify(obj);
      const encoded = btoa(unescape(encodeURIComponent(json)));

      return 'data:application/json;base64,' + encoded;
    }

    async function applyLottieColor() {
      try {
        await customElements.whenDefined('lottie-player');

        const player = document.getElementById('empty-lottie');

        if (!player) return;

        const src = player.getAttribute('src');

        

        const originalJson = await loadJsonFromUrl(src);
        const palette = buildPalette(FIXED_LOTTIE_COLOR);
        const recoloredJson = recolorLottie(originalJson, palette);
        const dataUrl = objectToDataUrl(recoloredJson);

        player.removeAttribute('src');
        player.load(dataUrl);
      } catch (error) {
        console.error('[Lottie recolor] gagal:', error);
      }
    }

    applyLottieColor();

    window.refreshLottieColor = applyLottieColor;
  })();
