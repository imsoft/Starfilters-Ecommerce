declare module 'astro-i18next' {
  export function t(key: string, options?: any): string;
  export function changeLanguage(lng: string): Promise<void>;
  export default function astroI18next(): any;
  export const localizePath: (path: string, locale?: string) => string;
  export const localizeUrl: (url: string, locale?: string) => string;
}
