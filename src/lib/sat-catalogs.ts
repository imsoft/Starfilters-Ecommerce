/**
 * Catálogos del SAT para facturación (CFDI 4.0).
 *
 * Se usan en el checkout para que el cliente elija de una lista en vez de
 * escribir a mano el régimen o el uso de CFDI: capturados libres casi siempre
 * llegan mal y la factura se rechaza.
 *
 * Las descripciones son las oficiales y van en español en los dos idiomas del
 * sitio: son los textos que el SAT exige y con los que se emite la factura.
 */

export interface OpcionSat {
  code: string;
  label: string;
}

/** c_RegimenFiscal (los vigentes para emitir a clientes) */
export const REGIMENES_FISCALES: OpcionSat[] = [
  { code: '601', label: 'General de Ley Personas Morales' },
  { code: '603', label: 'Personas Morales con Fines no Lucrativos' },
  { code: '605', label: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { code: '606', label: 'Arrendamiento' },
  { code: '607', label: 'Régimen de Enajenación o Adquisición de Bienes' },
  { code: '608', label: 'Demás ingresos' },
  { code: '610', label: 'Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { code: '611', label: 'Ingresos por Dividendos (socios y accionistas)' },
  { code: '612', label: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { code: '614', label: 'Ingresos por intereses' },
  { code: '615', label: 'Régimen de los ingresos por obtención de premios' },
  { code: '616', label: 'Sin obligaciones fiscales' },
  { code: '620', label: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
  { code: '621', label: 'Incorporación Fiscal' },
  { code: '622', label: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { code: '623', label: 'Opcional para Grupos de Sociedades' },
  { code: '624', label: 'Coordinados' },
  { code: '625', label: 'Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { code: '626', label: 'Régimen Simplificado de Confianza (RESICO)' },
];

/**
 * c_UsoCFDI. Los primeros son los que aplican a una compra de filtros; después
 * van los demás por si el cliente los necesita.
 */
export const USOS_CFDI: OpcionSat[] = [
  { code: 'G01', label: 'Adquisición de mercancías' },
  { code: 'G03', label: 'Gastos en general' },
  { code: 'I08', label: 'Otra maquinaria y equipo' },
  { code: 'I01', label: 'Construcciones' },
  { code: 'I02', label: 'Mobiliario y equipo de oficina por inversiones' },
  { code: 'I03', label: 'Equipo de transporte' },
  { code: 'I04', label: 'Equipo de cómputo y accesorios' },
  { code: 'I05', label: 'Dados, troqueles, moldes, matrices y herramental' },
  { code: 'I06', label: 'Comunicaciones telefónicas' },
  { code: 'I07', label: 'Comunicaciones satelitales' },
  { code: 'G02', label: 'Devoluciones, descuentos o bonificaciones' },
  { code: 'D01', label: 'Honorarios médicos, dentales y gastos hospitalarios' },
  { code: 'D02', label: 'Gastos médicos por incapacidad o discapacidad' },
  { code: 'D03', label: 'Gastos funerales' },
  { code: 'D04', label: 'Donativos' },
  { code: 'D05', label: 'Intereses reales efectivamente pagados por créditos hipotecarios' },
  { code: 'D06', label: 'Aportaciones voluntarias al SAR' },
  { code: 'D07', label: 'Primas por seguros de gastos médicos' },
  { code: 'D08', label: 'Gastos de transportación escolar obligatoria' },
  { code: 'D09', label: 'Depósitos en cuentas para el ahorro, primas de planes de pensiones' },
  { code: 'D10', label: 'Pagos por servicios educativos (colegiaturas)' },
  { code: 'S01', label: 'Sin efectos fiscales' },
];

/** Texto que se guarda en el pedido: "601 - General de Ley Personas Morales" */
export const etiquetaSat = (opcion: OpcionSat): string => `${opcion.code} - ${opcion.label}`;
