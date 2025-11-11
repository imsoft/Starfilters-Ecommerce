import { useState, useEffect, useRef } from 'react';

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('es');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/en')) {
      setCurrentLang('en');
    } else {
      setCurrentLang('es');
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLanguage = (lang: string) => {
    const currentPath = window.location.pathname;
    let newPath: string = '';

    // Don't do anything if we're already in the target language
    if (lang === 'en' && (currentPath.startsWith('/en') || currentPath === '/en')) {
      return;
    }
    if (lang === 'es' && !currentPath.startsWith('/en') && currentPath !== '/en') {
      return;
    }

    if (lang === 'en') {
      // Converting from Spanish to English
      if (currentPath === '/' || currentPath === '') {
        newPath = '/en';
      } else {
        // Map Spanish routes to English routes
        const routeTranslations: { [key: string]: string } = {
          '/cuartos-limpios': '/en/cleanrooms',
          '/servicios': '/en/services',
          '/filtros': '/en/filters',
          '/contacto': '/en/contact',
          '/blog': '/en/blog',
          '/carrito': '/en/cart',
          '/checkout': '/en/checkout',
          '/perfil': '/en/profile',
          '/pedidos': '/en/orders',
          '/cambiar-contraseña': '/en/change-password',
        };

        // Check for exact match first
        if (routeTranslations[currentPath]) {
          newPath = routeTranslations[currentPath];
        }
        // Handle dynamic routes like /blog/[uuid] or /product/[id]
        else if (currentPath.startsWith('/blog/')) {
          newPath = currentPath.replace('/blog/', '/en/blog/');
        } else if (currentPath.startsWith('/product/')) {
          newPath = currentPath.replace('/product/', '/en/product/');
        } else {
          newPath = `/en${currentPath}`;
        }
      }
    } else {
      // Converting from English to Spanish
      // Handle /en specifically
      if (currentPath === '/en') {
        newPath = '/';
      }
      // Handle /en/ routes
      else if (currentPath.startsWith('/en/')) {
        // Map English routes back to Spanish routes
        const reverseRouteTranslations: { [key: string]: string } = {
          '/en/cleanrooms': '/cuartos-limpios',
          '/en/services': '/servicios',
          '/en/filters': '/filtros',
          '/en/contact': '/contacto',
          '/en/cart': '/carrito',
          '/en/checkout': '/checkout',
          '/en/profile': '/perfil',
          '/en/blog': '/blog',
          '/en/orders': '/pedidos',
          '/en/change-password': '/cambiar-contraseña',
        };

        // Check for exact match first
        if (reverseRouteTranslations[currentPath]) {
          newPath = reverseRouteTranslations[currentPath];
        }
        // Handle dynamic routes like /en/blog/[uuid] or /en/product/[id]
        else if (currentPath.startsWith('/en/blog/')) {
          newPath = currentPath.replace('/en/blog/', '/blog/');
        } else if (currentPath.startsWith('/en/product/')) {
          newPath = currentPath.replace('/en/product/', '/product/');
        } else {
          // Remove /en prefix for other routes
          newPath = currentPath.replace(/^\/en/, '') || '/';
        }
      } else {
        // Already in Spanish, no need to change
        return;
      }
    }

    console.log('Switching from', currentPath, 'to', newPath, 'lang:', lang);
    
    if (!newPath) {
      console.error('No path generated for', currentPath, 'lang:', lang);
      return;
    }
    
    window.location.href = newPath;
  };

  const languages = [
    { code: 'es', name: 'Español', flag: '🇲🇽' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border border-border z-50">
          <div className="py-1" role="menu">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  switchLanguage(language.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors ${
                  currentLang === language.code
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
                role="menuitem"
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
                {currentLang === language.code && (
                  <svg
                    className="ml-auto w-4 h-4 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
