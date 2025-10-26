import { useState, useEffect } from 'react';

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('es');

  useEffect(() => {
    // Detectar idioma actual de la URL
    const path = window.location.pathname;
    if (path.startsWith('/en')) {
      setCurrentLang('en');
    } else {
      setCurrentLang('es');
    }
  }, []);

  const switchLanguage = (lang: string) => {
    const currentPath = window.location.pathname;
    let newPath: string;

    if (lang === 'en') {
      // Cambiar a inglés
      if (currentPath.startsWith('/en')) {
        newPath = currentPath;
      } else if (currentPath === '/' || currentPath === '') {
        newPath = '/en';
      } else {
        // Traducir rutas
        const translations: { [key: string]: string } = {
          '/cuartos-limpios': '/en/cleanrooms',
          '/servicios': '/en/services',
          '/services': '/en/services',
          '/filtros': '/en/filters',
          '/blog': '/en/blog',
          '/carrito': '/en/cart',
          '/checkout': '/en/checkout',
          '/perfil': '/en/profile',
        };
        newPath = translations[currentPath] || `/en${currentPath}`;
      }
    } else {
      // Cambiar a español
      if (currentPath.startsWith('/en')) {
        const pathWithoutLang = currentPath.replace('/en', '');
        // Traducir rutas de vuelta
        const translations: { [key: string]: string } = {
          '/cleanrooms': '/cuartos-limpios',
          '/services': '/servicios',
          '/filters': '/filtros',
          '/blog': '/blog',
          '/cart': '/carrito',
          '/checkout': '/checkout',
          '/profile': '/perfil',
        };
        newPath = translations[pathWithoutLang] || pathWithoutLang || '/';
      } else {
        newPath = currentPath;
      }
    }

    window.location.href = newPath;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage('es')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentLang === 'es'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentLang === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
