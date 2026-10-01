import { OGImageRoute } from 'astro-og-canvas';
import { site } from '../../data/site';

// Static instances of the site's typefaces (made from the @fontsource-variable
// packages, SIL OFL) so the build never fetches fonts from a CDN.
const FONTS = ['./src/assets/fonts/Rubik-SemiBold.ttf', './src/assets/fonts/Figtree-Regular.ttf'];

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages: {
    default: {
      title: 'I build the web applications businesses run on.',
      description: `${site.name} · ${site.role}`,
    },
  },
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[251, 247, 242]],
    bgImage: { path: './src/assets/og-bg.png' },
    padding: 72,
    fonts: FONTS,
    font: {
      title: { color: [36, 33, 29], size: 62, weight: 'SemiBold', lineHeight: 1.05, families: ['Rubik'] },
      description: { color: [90, 82, 73], size: 34, families: ['Figtree'] },
    },
  }),
});
