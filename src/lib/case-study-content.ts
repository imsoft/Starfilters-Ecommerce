/**
 * Contenido de los casos de éxito
 *
 * Los campos challenge / solution / results son texto libre que el admin
 * captura con saltos de línea y viñetas escritas a mano ("• ", "- ", "* ").
 * La página los pintaba con `whitespace-pre-line`, así que las viñetas salían
 * como texto plano y sin sangría: un párrafo gris difícil de leer.
 *
 * Aquí se parte ese texto en bloques —párrafos y listas— para que cada página
 * los maquete de verdad. Vive en un módulo compartido a propósito: /casos-de-exito
 * y /en/success-cases son plantillas gemelas y se desincronizan si cada una
 * lleva su propia copia de la lógica.
 */

export type CaseStudyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

// Viñetas que el admin usa al capturar. El guion largo aparece cuando el texto
// pasa por Word o por el corrector de macOS.
const BULLET_PATTERN = /^\s*[•·‣▪*\-–—]\s+/;

const isBullet = (line: string) => BULLET_PATTERN.test(line);

const stripBullet = (line: string) => line.replace(BULLET_PATTERN, '').trim();

/**
 * Convierte el texto libre de una sección en bloques maquetables.
 * Un renglón en blanco separa párrafos; renglones seguidos con viñeta forman
 * una sola lista.
 */
export const parseCaseStudyBody = (raw?: string | null): CaseStudyBlock[] => {
  if (!raw) return [];

  const blocks: CaseStudyBlock[] = [];
  // Párrafo en curso: se acumulan los renglones sueltos hasta encontrar una
  // línea en blanco o una viñeta.
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  };

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (isBullet(trimmed)) {
      flushParagraph();
      const item = stripBullet(trimmed);
      // Una viñeta vacía ("- " suelto) no aporta nada y dejaría un punto huérfano.
      if (item) list.push(item);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
};

/**
 * Las secciones que el caso tiene capturadas, ya numeradas.
 *
 * La numeración se calcula sobre lo que existe: si un caso no tiene "reto",
 * la solución es 01 y no 02. Antes los números estaban escritos a mano en la
 * plantilla y un caso sin reto empezaba en el 2.
 */
export interface CaseStudySection {
  label: string;
  number: string;
  blocks: CaseStudyBlock[];
}

export const buildCaseStudySections = (
  parts: Array<{ label: string; body?: string | null }>
): CaseStudySection[] =>
  parts
    .map((part) => ({ label: part.label, blocks: parseCaseStudyBody(part.body) }))
    .filter((part) => part.blocks.length > 0)
    .map((part, index) => ({ ...part, number: String(index + 1).padStart(2, '0') }));
