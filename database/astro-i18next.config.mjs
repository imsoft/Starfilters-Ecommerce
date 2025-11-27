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
      "cambiar-contraseña": "change-password",
      "pedidos": "orders",
      "admin": "admin",
      "login": "login",
      "signup": "signup",
      "forgot-password": "forgot-password",
      "reset-password": "reset-password",
      "acerca-de": "about",
    }
  },
  showDefaultLocale: false,
};
