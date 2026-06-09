#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera un reporte en PDF de lo que YA está bien implementado en el proyecto
StarFilters E-commerce, en las áreas de UX/UI, SEO y Ciberseguridad.
Explicado de forma muy sencilla ("como para un niño de 5 años").
"""
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
from fpdf import FPDF
from datetime import date

# ----------------------------------------------------------------------------
# Paleta de colores (azul de la marca StarFilters)
# ----------------------------------------------------------------------------
AZUL = (29, 78, 216)        # #1d4ed8 (theme-color del sitio)
AZUL_OSCURO = (23, 37, 84)  # encabezados
GRIS = (90, 90, 90)
GRIS_CLARO = (235, 238, 245)
VERDE = (22, 122, 72)
NEGRO = (33, 33, 33)
BLANCO = (255, 255, 255)

ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"
ARIAL_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
ARIAL_I = "/System/Library/Fonts/Supplemental/Arial Italic.ttf"


class PDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=18)
        self.add_font("Arial", "", ARIAL, uni=True)
        self.add_font("Arial", "B", ARIAL_B, uni=True)
        self.add_font("Arial", "I", ARIAL_I, uni=True)
        self.seccion_actual = ""

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Arial", "B", 9)
        self.set_text_color(*AZUL)
        self.cell(0, 8, "Star Filters", ln=0, align="L")
        self.set_font("Arial", "", 8)
        self.set_text_color(*GRIS)
        self.cell(0, 8, self.seccion_actual, ln=1, align="R")
        self.set_draw_color(*GRIS_CLARO)
        self.set_line_width(0.3)
        self.line(self.l_margin, 16, self.w - self.r_margin, 16)
        self.ln(6)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-15)
        self.set_font("Arial", "", 8)
        self.set_text_color(*GRIS)
        self.cell(0, 10, f"Reporte de implementación · Página {self.page_no()}", align="C")

    # --- helpers de contenido --------------------------------------------
    def titulo_seccion(self, num, texto, subtitulo=""):
        self.seccion_actual = texto
        self.ln(2)
        self.set_fill_color(*AZUL)
        self.set_text_color(*BLANCO)
        self.set_font("Arial", "B", 15)
        self.cell(12, 12, str(num), ln=0, align="C", fill=True)
        self.set_fill_color(*GRIS_CLARO)
        self.set_text_color(*AZUL_OSCURO)
        self.cell(0, 12, "  " + texto, ln=1, align="L", fill=True)
        if subtitulo:
            self.set_font("Arial", "I", 10)
            self.set_text_color(*GRIS)
            self.ln(1)
            self.multi_cell(0, 5, subtitulo)
        self.ln(3)

    def subtitulo(self, texto):
        if self.get_y() > self.h - 45:
            self.add_page()
        self.set_font("Arial", "B", 12)
        self.set_text_color(*AZUL_OSCURO)
        self.ln(1)
        self.cell(0, 7, texto, ln=1)
        self.set_draw_color(*AZUL)
        self.set_line_width(0.5)
        x = self.l_margin
        self.line(x, self.get_y(), x + 35, self.get_y())
        self.ln(3)

    def item(self, titulo, explicacion_simple, detalle_tecnico):
        """Una tarjeta con: qué es (sencillo) + cómo está hecho (técnico)."""
        # estimar espacio y saltar página si no cabe
        if self.get_y() > self.h - 50:
            self.add_page()
        x0 = self.l_margin
        ancho = self.w - self.l_margin - self.r_margin

        # check verde (dibujado con vectores) + título
        cy = self.get_y()
        self.set_draw_color(*VERDE)
        self.set_line_width(0.7)
        self.line(x0 + 0.8, cy + 3.2, x0 + 2.2, cy + 4.6)
        self.line(x0 + 2.2, cy + 4.6, x0 + 4.8, cy + 1.4)
        self.set_xy(x0 + 6, cy)
        self.set_font("Arial", "B", 11)
        self.set_text_color(*NEGRO)
        self.multi_cell(ancho - 6, 6, titulo)

        # explicación sencilla
        self.set_x(x0 + 6)
        self.set_font("Arial", "I", 10)
        self.set_text_color(*GRIS)
        self.multi_cell(ancho - 6, 5, "En simple: " + explicacion_simple)

        # detalle técnico
        self.set_x(x0 + 6)
        self.set_font("Arial", "", 9.5)
        self.set_text_color(80, 80, 80)
        self.multi_cell(ancho - 6, 5, "Cómo está hecho: " + detalle_tecnico)
        self.ln(3)

    def parrafo(self, texto, size=10.5):
        self.set_font("Arial", "", size)
        self.set_text_color(*NEGRO)
        self.multi_cell(0, 5.5, texto)
        self.ln(2)


# ----------------------------------------------------------------------------
pdf = PDF()

# ===================== PORTADA =====================
pdf.add_page()
pdf.set_fill_color(*AZUL)
pdf.rect(0, 0, pdf.w, 80, "F")
pdf.set_xy(0, 26)
pdf.set_font("Arial", "B", 30)
pdf.set_text_color(*BLANCO)
pdf.cell(0, 14, "Star Filters", ln=1, align="C")
pdf.set_font("Arial", "", 14)
pdf.cell(0, 8, "Reporte de Implementación", ln=1, align="C")

pdf.set_xy(0, 95)
pdf.set_font("Arial", "B", 19)
pdf.set_text_color(*AZUL_OSCURO)
pdf.cell(0, 10, "Lo que ya está bien hecho", ln=1, align="C")
pdf.set_font("Arial", "", 13)
pdf.set_text_color(*GRIS)
pdf.cell(0, 8, "UX/UI  ·  SEO  ·  Ciberseguridad", ln=1, align="C")

# caja explicativa
pdf.ln(14)
pdf.set_x(25)
pdf.set_fill_color(*GRIS_CLARO)
pdf.set_draw_color(*AZUL)
pdf.set_line_width(0.4)
pdf.set_font("Arial", "", 11)
pdf.set_text_color(*NEGRO)
caja = ("Este documento explica, de forma muy sencilla (como si se lo contaras a "
        "un niño de 5 años), todo lo que el sitio web YA tiene bien implementado "
        "en tres áreas importantes: que sea fácil y bonito de usar (UX/UI), que "
        "Google lo encuentre (SEO) y que esté protegido (Ciberseguridad).\n\n"
        "Solo se incluye lo que ya está hecho y funcionando. Cada punto tiene una "
        "explicación fácil y, debajo, el detalle técnico para tu equipo.")
pdf.multi_cell(pdf.w - 50, 6, caja, border=1, fill=True, align="L")

pdf.ln(16)
pdf.set_font("Arial", "", 11)
pdf.set_text_color(*GRIS)
fecha = date.today().strftime("%d/%m/%Y")
pdf.cell(0, 7, f"Proyecto: StarFilters E-commerce  ·  Fecha: {fecha}", ln=1, align="C")
pdf.cell(0, 7, "Tecnología: Astro (SSR) · TypeScript · MySQL · Stripe · BIND ERP", ln=1, align="C")

# ===================== ÍNDICE / RESUMEN =====================
pdf.add_page()
pdf.subtitulo("¿Qué vas a encontrar en este reporte?")
pdf.parrafo(
    "Imagina que tu sitio web es una tienda de verdad. Para que funcione bien necesita "
    "tres cosas: que la gente entre a gusto y encuentre todo rápido (eso es UX/UI), que "
    "haya muchos letreros en la calle para que la gente sepa que existe (eso es SEO), y "
    "que tenga buenas cerraduras y cámaras para que nadie robe (eso es Ciberseguridad). "
    "Tu tienda ya tiene muchas de esas cosas bien puestas. Aquí te las contamos una por una."
)
pdf.ln(2)
items_indice = [
    ("1", "UX/UI", "Que el sitio sea fácil, rápido y bonito de usar."),
    ("2", "SEO", "Que Google y la gente encuentren el sitio fácilmente."),
    ("3", "Ciberseguridad", "Que la información y el dinero estén protegidos."),
]
for num, t, d in items_indice:
    y0 = pdf.get_y()
    pdf.set_font("Arial", "B", 12)
    pdf.set_text_color(*AZUL)
    pdf.set_xy(pdf.l_margin, y0)
    pdf.cell(10, 8, num)
    pdf.set_text_color(*AZUL_OSCURO)
    pdf.cell(45, 8, t)
    pdf.set_font("Arial", "", 10.5)
    pdf.set_text_color(*GRIS)
    pdf.set_xy(pdf.l_margin + 55, y0)
    pdf.multi_cell(pdf.w - pdf.r_margin - (pdf.l_margin + 55), 8, d)
pdf.ln(4)
pdf.set_font("Arial", "I", 9.5)
pdf.set_text_color(*GRIS)
pdf.multi_cell(0, 5, "Nota: este reporte describe únicamente funciones que ya existen en el "
                     "código del proyecto al día de hoy. No incluye sugerencias ni pendientes.")

# ===================== 1. UX / UI =====================
pdf.seccion_actual = "UX / UI — Que sea fácil y bonito de usar"
pdf.add_page()
pdf.titulo_seccion("1", "UX / UI — Que sea fácil y bonito de usar",
                   "UX/UI significa que las personas usen el sitio sin esfuerzo y que se vea bien "
                   "en el celular y en la computadora.")

pdf.subtitulo("Navegación y estructura")
pdf.item("Menú (Navbar) y pie de página en todas las páginas",
         "Arriba siempre hay un menú para moverte y abajo un pie con la información importante, igual en toda la tienda.",
         "Layout central 'websiteLayout.astro' que incluye <Navbar>, <FooterSection> y botón flotante de WhatsApp en cada página, garantizando una experiencia consistente.")
pdf.item("Botón de WhatsApp siempre a la mano",
         "Hay un botón flotante para escribir por WhatsApp desde cualquier parte, sin tener que buscarlo.",
         "Componente 'WhatsAppButton.astro' fijo en el layout, disponible en todas las vistas del sitio público.")
pdf.item("Transiciones suaves entre páginas",
         "Cuando cambias de página no 'parpadea' todo; se siente fluido como una app.",
         "Uso de <ClientRouter /> (View Transitions de Astro) en el layout para navegación tipo SPA con transiciones nativas.")
pdf.item("Animaciones de aparición al hacer scroll",
         "Los elementos aparecen suavemente cuando bajas, lo que hace el sitio más vivo y agradable.",
         "Componente 'RevealOnScroll.astro' aplicado de forma uniforme en todo el sitio (reveal on scroll con IntersectionObserver).")

pdf.subtitulo("Velocidad y rendimiento")
pdf.item("Las imágenes se cargan solo cuando se necesitan (lazy loading)",
         "Las fotos que están más abajo no se descargan hasta que te acercas, así la página abre más rápido.",
         "Componente 'LazyImage.astro' con loading='lazy', decoding='async', placeholder en base64 y carga 'eager' solo para imágenes críticas (above the fold).")
pdf.item("Renderizado en el servidor (SSR)",
         "La página llega ya 'armada' desde el servidor, por eso se ve rápido y completa desde el primer momento.",
         "Astro configurado con output: 'server' y adaptador @astrojs/node en modo middleware sobre Express.")
pdf.item("Caché de productos",
         "El sitio recuerda los productos un ratito para no tener que pedirlos una y otra vez, y así responder más rápido.",
         "Módulo 'product-cache.ts' para evitar consultas repetidas a la base de datos / ERP.")
pdf.item("Imágenes optimizadas con Cloudinary",
         "Las fotos se guardan y entregan ya optimizadas (peso y tamaño justos) para que carguen ligeras.",
         "Integración con Cloudinary ('cloudinary.ts' + sharp) para alojar y transformar imágenes.")

pdf.subtitulo("Diseño responsivo y accesibilidad")
pdf.item("Se ve bien en celular, tablet y computadora",
         "No importa con qué aparato entres: el sitio se acomoda solo para verse bien.",
         "Diseño responsivo con Tailwind CSS v4 y meta viewport configurado; el layout usa utilidades responsivas en todos los componentes.")
pdf.item("Textos alternativos en imágenes (alt)",
         "Cada imagen tiene una descripción escondida que ayuda a personas con lectores de pantalla y a Google.",
         "Atributo alt presente en componentes de imagen (LazyImage exige 'alt' obligatorio) y a lo largo de páginas y componentes.")
pdf.item("Etiquetas de accesibilidad (ARIA)",
         "Algunos botones y menús 'le avisan' a los lectores de pantalla qué son, para personas con discapacidad visual.",
         "Uso de atributos aria-* en componentes interactivos (menús, botones, modales basados en Radix UI, que ya trae accesibilidad incorporada).")
pdf.item("Componentes accesibles de Radix UI",
         "Las ventanitas, avisos y globos de ayuda ya vienen pensados para todos, incluso con teclado.",
         "Uso de @radix-ui (dialog, alert-dialog, tooltip, separator, slot) que cumplen prácticas de accesibilidad (foco, teclado, roles ARIA).")

pdf.subtitulo("Idiomas y experiencia de compra")
pdf.item("Sitio en español e inglés",
         "La tienda habla dos idiomas: si llega alguien de otro país, puede verla en inglés.",
         "i18n nativo de Astro (locales 'es' y 'en', defaultLocale 'es'), rutas /en/* y helpers 'i18n-helpers.ts' para nombres, descripciones y precios por idioma.")
pdf.item("Precios en MXN y USD",
         "Los precios se muestran en pesos o en dólares según corresponda, sin confundir al cliente.",
         "Servicio 'currency-service.ts' y 'getProductPriceAndCurrency' / 'formatPriceByCurrency' para mostrar precio y moneda correctos.")
pdf.item("Carrito de compras y proceso de pago claro",
         "Puedes guardar productos en un carrito y pagar paso a paso sin perderte.",
         "Módulo 'cart.ts', páginas /cart y /checkout, y pago con Stripe (@stripe/react-stripe-js) integrado.")
pdf.item("Confirmación de compra con celebración",
         "Cuando compras, aparece una pantalla de '¡felicidades!' con confeti para que sepas que todo salió bien.",
         "Página /purchase-success con canvas-confetti; refuerza el feedback positivo al usuario tras el pago.")
pdf.item("Correos automáticos al cliente",
         "Después de comprar o registrarte, te llega un correo bonito confirmando todo.",
         "Servicio 'email.ts' con Resend para correos transaccionales (confirmaciones, verificación, recuperación de contraseña).")

# ===================== 2. SEO =====================
pdf.seccion_actual = "SEO — Que te encuentren en internet"
pdf.add_page()
pdf.titulo_seccion("2", "SEO — Que te encuentren en internet",
                   "SEO son todos los 'letreros' y pistas que ayudan a Google a entender tu sitio y "
                   "mostrarlo a más personas cuando buscan.")

pdf.subtitulo("Etiquetas para Google y redes sociales")
pdf.item("Componente central de SEO en cada página",
         "Cada página le 'cuenta' a Google su título y de qué trata, de forma ordenada y automática.",
         "Componente 'SEO.astro' reutilizable que genera title, meta description, keywords, canonical y robots de forma consistente.")
pdf.item("Títulos y descripciones optimizados",
         "Los títulos no son ni muy largos ni muy cortos; tienen la medida ideal para verse completos en Google.",
         "Utilidades en 'seo-utils.ts': generateSEOTitle (máx ~60 caracteres con sufijo de marca) y generateSEODescription (máx 160).")
pdf.item("Tarjetas bonitas al compartir (Open Graph y Twitter)",
         "Si alguien comparte un enlace en Facebook o X, aparece una tarjeta con foto, título y descripción.",
         "Meta tags Open Graph (og:title, og:description, og:image 1200x630, og:locale es_MX/en_US) y Twitter Card 'summary_large_image' en SEO.astro.")
pdf.item("Imagen por defecto para compartir",
         "Aunque una página no tenga foto propia, siempre se comparte con una imagen oficial de la marca.",
         "Fallback a '/og-image.jpg' cuando no se especifica ogImage.")

pdf.subtitulo("Datos estructurados (Schema.org)")
pdf.item("Google entiende que eres una empresa",
         "Le dices a Google 'soy una empresa, esta es mi info', y puede mostrar datos especiales en los resultados.",
         "generateOrganizationSchema: JSON-LD tipo Organization con nombre, logo, fundación (1984), país, idiomas y área de servicio.")
pdf.item("Los productos se muestran como productos",
         "Google sabe el precio y si hay existencia, y puede mostrar estrellas/precio en los resultados.",
         "generateProductSchema: JSON-LD tipo Product con offers, priceCurrency MXN, price, availability (InStock/OutOfStock) y priceValidUntil.")
pdf.item("Los artículos del blog se muestran como artículos",
         "Cada nota del blog le dice a Google quién la escribió y cuándo, para salir mejor posicionada.",
         "generateArticleSchema: JSON-LD tipo Article con headline, author, publisher, datePublished y dateModified.")
pdf.item("Migas de pan (breadcrumbs) y preguntas frecuentes",
         "Google muestra la 'ruta' para llegar a una página y puede mostrar tus preguntas frecuentes directo en la búsqueda.",
         "generateBreadcrumbSchema (BreadcrumbList) y generateFAQSchema (FAQPage) disponibles para enriquecer resultados.")

pdf.subtitulo("Direcciones limpias e idiomas")
pdf.item("Direcciones (URLs) bonitas y entendibles",
         "Las direcciones se leen fácil (con palabras, no códigos raros), y eso le gusta a Google.",
         "generateSlug normaliza texto a slugs SEO-friendly (minúsculas, sin acentos, con guiones).")
pdf.item("Etiqueta canónica (sin contenido duplicado)",
         "Le dices a Google cuál es la dirección 'oficial' de cada página para que no se confunda con copias.",
         "<link rel='canonical'> generado en SEO.astro a partir de la URL actual o de un canonical explícito.")
pdf.item("Señales de idioma (hreflang)",
         "Le avisas a Google qué páginas están en español y cuáles en inglés, para mostrar la correcta a cada quien.",
         "Etiquetas hreflang y og:locale:alternate generadas según alternateLanguages en SEO.astro.")

pdf.subtitulo("Mapa del sitio e indexación")
pdf.item("Mapa del sitio (sitemap.xml) automático",
         "Es como darle a Google un mapa con TODAS tus páginas para que no se pierda ninguna.",
         "'sitemap.xml.ts' genera dinámicamente el sitemap con páginas estáticas (ES/EN), productos y posts del blog, con priority y changefreq.")
pdf.item("Archivo robots.txt bien configurado",
         "Le dices a los robots de Google a dónde sí pueden entrar y a dónde no (como admin o carrito).",
         "'robots.txt' permite páginas públicas, bloquea /admin/, /api/, login, checkout, etc., y declara la ubicación del sitemap.")
pdf.item("Bloqueo de indexación en pruebas (staging)",
         "Cuando el sitio está en modo prueba, se 'esconde' de Google para no mostrar cosas a medio hacer.",
         "Variable PUBLIC_NOINDEX fuerza noindex/nofollow en todo el sitio desde 'websiteLayout.astro'.")
pdf.item("Favicons y manifiesto (instalable como app)",
         "El sitio tiene su iconito en la pestaña del navegador y puede 'instalarse' como una app en el celular.",
         "Favicons en varios tamaños, apple-touch-icon, site.webmanifest, theme-color y meta tags apple-mobile-web-app en el layout.")

# ===================== 3. CIBERSEGURIDAD =====================
pdf.seccion_actual = "Ciberseguridad — Que todo esté protegido"
pdf.add_page()
pdf.titulo_seccion("3", "Ciberseguridad — Que todo esté protegido",
                   "Ciberseguridad es tener buenas cerraduras: proteger las contraseñas, los pagos y "
                   "los datos de los clientes para que nadie haga trampa.")

pdf.subtitulo("Contraseñas y cuentas")
pdf.item("Las contraseñas se guardan cifradas (nunca en texto)",
         "La contraseña no se guarda como la escribiste; se convierte en un código secreto imposible de leer.",
         "Hash con bcrypt usando SALT_ROUNDS = 12 (hashPassword/verifyPassword en 'auth.ts'); jamás se almacena la contraseña en claro.")
pdf.item("Reglas de contraseña fuerte",
         "Para registrarte, tu contraseña debe tener mayúscula, minúscula, número y mínimo 8 letras: más difícil de adivinar.",
         "validatePassword exige longitud >= 8 y presencia de mayúscula, minúscula y dígito antes de aceptar el registro.")
pdf.item("Validación de datos de registro y login",
         "Antes de crear una cuenta, el sistema revisa que el correo, el nombre y el teléfono estén bien escritos.",
         "validateEmail, validatePhone, validateRegisterData y validateLoginData validan el formato de los datos de entrada.")
pdf.item("Tokens seguros para verificar correo y recuperar contraseña",
         "Cuando recuperas tu contraseña, se crea una llave secreta única que no se puede adivinar.",
         "generateVerificationToken/generateResetToken usan crypto.randomBytes(32) (32 bytes aleatorios criptográficos).")

pdf.subtitulo("Sesiones y accesos")
pdf.item("Sesión protegida con cookie segura (JWT)",
         "Cuando inicias sesión, tu 'pase de entrada' se guarda de forma que un ladrón no lo pueda robar fácil.",
         "JWT firmado (jsonwebtoken) guardado en cookie con httpOnly: true, sameSite: 'lax', secure en HTTPS y maxAge de 7 días; httpOnly impide acceso desde JavaScript (protege ante XSS robo de cookie).")
pdf.item("El pase de entrada caduca solo",
         "Tu sesión no dura para siempre: a la semana se cierra sola por seguridad.",
         "JWT_EXPIRES_IN = '7d'; el token expira y verifyJWT rechaza tokens vencidos.")
pdf.item("Zona de administración protegida",
         "Solo los administradores aprobados pueden entrar al panel de control; a los demás se les saca.",
         "requireAdmin/isAdminAsync verifican el JWT y consultan en base de datos si el usuario es admin antes de dar acceso a /admin.")
pdf.item("Páginas privadas requieren iniciar sesión",
         "Tu perfil, tus pedidos y el checkout no se pueden ver sin haber entrado a tu cuenta.",
         "Helpers requireAuth/authMiddleware redirigen a /login si no hay usuario autenticado, protegiendo páginas como /profile y /orders.")

pdf.subtitulo("Pagos e integridad de datos")
pdf.item("Pagos seguros con Stripe (no guardas tarjetas)",
         "El dinero lo maneja Stripe, una empresa experta en pagos; tu sitio nunca guarda los números de tarjeta.",
         "Integración con Stripe; los datos de tarjeta viajan directo a Stripe vía @stripe/react-stripe-js, fuera del alcance de tu servidor.")
pdf.item("Verificación de firma en los avisos de pago (webhooks)",
         "Cuando Stripe avisa que un pago se hizo, el sitio comprueba que el aviso es de verdad y no un engaño.",
         "stripe-webhook.ts valida la cabecera 'stripe-signature' con constructEvent y STRIPE_WEBHOOK_SECRET; rechaza eventos sin firma válida.")
pdf.item("El stock se valida contra el ERP antes de cobrar",
         "Antes de cobrar, el sistema revisa en el inventario real que sí haya producto, para no vender de más.",
         "create-payment-intent.ts y check-stock.ts leen inventario de BIND ERP (con respaldo en BD local) antes de crear el cobro.")
pdf.item("Consultas a la base de datos protegidas (sin inyección SQL)",
         "Cuando se busca algo en la base de datos, se hace de forma blindada para que nadie 'cuele' comandos maliciosos.",
         "Uso sistemático de consultas parametrizadas (prepared statements con placeholders '?') en 'database.ts' vía mysql2, evitando inyección SQL.")

pdf.subtitulo("Protección de archivos y configuración")
pdf.item("Las llaves secretas no están en el código",
         "Las contraseñas del sistema y llaves de pago se guardan aparte, no a la vista en el código.",
         "Uso de variables de entorno (dotenv) para JWT_SECRET, STRIPE_SECRET_KEY, BIND_TOKEN, credenciales de BD, etc.")
pdf.item("Carpetas sensibles bloqueadas para robots",
         "Las carpetas de administración, scripts y base de datos están escondidas de los buscadores.",
         "robots.txt bloquea /admin/, /api/, /scripts/, /database/ y archivos .json; no aparecen en resultados de búsqueda.")
pdf.item("Validación de archivos subidos (imágenes)",
         "Cuando se suben fotos, pasan por un servicio confiable que las revisa y guarda de forma segura.",
         "Subida de imágenes gestionada por Cloudinary y utilidades 'image-utils.ts'/'video-utils.ts', en lugar de guardar archivos crudos en el servidor.")

# ===================== CIERRE =====================
pdf.seccion_actual = "Resumen"
pdf.add_page()
pdf.subtitulo("Resumen para llevar")
pdf.parrafo(
    "Tu tienda en línea ya tiene cimientos muy sólidos en las tres áreas clave:"
)
resumen = [
    ("UX/UI", "El sitio es rápido, se ve bien en cualquier aparato, está en dos idiomas, "
              "tiene animaciones suaves, carrito, pagos claros y avisos por correo. La gente "
              "lo usa sin esfuerzo."),
    ("SEO", "Google puede encontrar y entender el sitio: tiene títulos optimizados, tarjetas "
            "para redes sociales, datos estructurados de empresa/productos/blog, mapa del sitio "
            "automático y robots.txt bien configurado."),
    ("Ciberseguridad", "Las contraseñas están cifradas, las sesiones usan cookies seguras, los "
                       "pagos pasan por Stripe con verificación de firma, las consultas a la base "
                       "de datos están blindadas contra inyección SQL y las llaves secretas no "
                       "están en el código."),
]
for t, d in resumen:
    pdf.set_font("Arial", "B", 11.5)
    pdf.set_text_color(*AZUL)
    pdf.cell(0, 7, t, ln=1)
    pdf.set_font("Arial", "", 10.5)
    pdf.set_text_color(*NEGRO)
    pdf.multi_cell(0, 5.5, d)
    pdf.ln(2)

pdf.ln(4)
pdf.set_draw_color(*AZUL)
pdf.set_line_width(0.4)
pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
pdf.ln(4)
pdf.set_font("Arial", "I", 10)
pdf.set_text_color(*GRIS)
pdf.multi_cell(0, 5.5,
    "Este reporte refleja únicamente funcionalidades ya implementadas y verificadas en el "
    "código del proyecto StarFilters E-commerce a la fecha indicada en la portada. "
    "Está pensado para compartirse con personas técnicas y no técnicas por igual.")

salida = "/Users/brangarciaramos/Proyectos/imSoft/sitios-web/starfilters-ecommerce/Reporte-StarFilters-Implementacion.pdf"
pdf.output(salida)
print("PDF generado en:", salida)
