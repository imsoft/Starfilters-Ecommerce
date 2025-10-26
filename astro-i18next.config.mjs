/** @type {import('astro-i18next').AstroI18nextConfig} */
export default {
  defaultLocale: "es",
  locales: ["es", "en"],
  routes: {
    en: {
      "cuartos-limpios": "cleanrooms",
      "servicios": "services",
      "filtros": "filters",
      "blog": "blog",
      "carrito": "cart",
      "checkout": "checkout",
      "perfil": "profile",
      "admin": "admin",
    }
  },
  showDefaultLocale: false,
};
