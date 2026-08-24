/**
 * Zona horaria del negocio.
 *
 * Las fechas se guardan en la base de datos y se formatean en el SERVIDOR
 * (el sitio es SSR), así que sin `timeZone` cada `Intl.DateTimeFormat` usaba
 * la zona del servidor, no la del visitante ni la de Star Filters. En
 * producción el servidor corre en UTC, de modo que un pedido hecho a las 11:24
 * de la Ciudad de México se mostraba como las 17:24.
 *
 * Se fija la zona del negocio y no la del navegador a propósito: el admin y el
 * cliente tienen que ver la MISMA hora al hablar de un pedido por teléfono.
 * Un comprador en Tijuana y el almacén en Zapopan deben leer "11:24" los dos.
 *
 * México ya no aplica horario de verano (desde 2022), pero usar el nombre de
 * la zona en vez de un desfase fijo como "-06:00" mantiene esto correcto si
 * alguna vez vuelve a cambiar.
 */
export const ZONA_HORARIA = 'America/Mexico_City';

/**
 * Opciones base para mostrar una fecha con su hora.
 * Se expande sobre las opciones de cada pantalla, que ya eligen su formato.
 */
export const opcionesFechaHora = (
  extra: Intl.DateTimeFormatOptions = {}
): Intl.DateTimeFormatOptions => ({
  timeZone: ZONA_HORARIA,
  ...extra,
});
