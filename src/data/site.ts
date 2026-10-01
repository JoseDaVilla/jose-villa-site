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

/** Flat brand colours a project can be painted with (see global.css). */
export const projectColors = {
  orange: 'var(--orange)',
  sky: 'var(--sky)',
  sun: 'var(--sun)',
  leaf: 'var(--leaf)',
  blue: 'var(--blue)',
} as const;
