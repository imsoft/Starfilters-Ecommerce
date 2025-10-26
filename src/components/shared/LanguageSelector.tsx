import { useState, useEffect } from 'react';

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('es');

  useEffect(() => {
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
      if (currentPath.startsWith('/en')) {
        newPath = currentPath;
      } else if (currentPath === '/' || currentPath === '') {
        newPath = '/en';
      } else {
        const routeTranslations: { [key: string]: string } = {
          '/cuartos-limpios': '/en/cuartos-limpios',
          '/servicios': '/en/servicios',
          '/services': '/en/servicios',
          '/filtros': '/en/filtros',
          '/blog': '/en/blog',
          '/carrito': '/en/carrito',
          '/checkout': '/en/checkout',
          '/perfil': '/en/perfil',
        };
        newPath = routeTranslations[currentPath] || `/en${currentPath}`;
      }
    } else {
      if (currentPath.startsWith('/en/')) {
        newPath = currentPath.replace('/en', '') || '/';
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
