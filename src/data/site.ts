import { withBase } from '../lib/paths';

export const site = {
  name: 'Jose Villa',
  fullName: 'Jose Daniel Villa',
  role: 'Lead Full-Stack Developer',
  title: 'Jose Villa, Lead Full-Stack Developer',
  description:
    'Lead Full-Stack Developer building web applications, SaaS and B2B platforms, and business automation. Systems in production across 30+ US locations, processing thousands of leads a day.',
  email: 'josedvilla18@gmail.com',
  cv: withBase('Jose-Daniel-Villa-Resume.pdf'),
  socials: {
    github: 'https://github.com/JoseDaVilla',
    linkedin: 'https://www.linkedin.com/in/jose-daniel-villa-712133204',
  },
  nav: [
    { href: '#experience', label: 'Experience' },
    { href: '#work', label: 'Work' },
    { href: '#about', label: 'About' },
    { href: '#contact', label: 'Contact' },
  ],
} as const;

/** Sand tones the project bands and dialogs are painted with (one per colour key). */
export const projectColors = {
  orange: '#E9E1D5',
  sky: '#E1D8CB',
  sun: '#ECE5DA',
  leaf: '#DDD3C5',
  blue: '#E6DED2',
} as const;
