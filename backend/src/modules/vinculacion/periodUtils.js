/**
 * Utilidades puras para calcular claves de mes, trimestre y semestre desde
 * las fechas reales del periodo academico. No dependen de base de datos.
 */
const MONTH_NAMES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

function normalizeMonth(month) {
  const parsed = Number(month);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
    throw new Error('El mes debe ser un numero entre 1 y 12');
  }
  return parsed;
}

function buildPeriodoClave({ frecuencia, mes, trimestre, semestre }) {
  if (frecuencia === 'MENSUAL' || frecuencia === 'CONSOLIDADO') {
    return `M${String(normalizeMonth(mes)).padStart(2, '0')}`;
  }

  if (frecuencia === 'TRIMESTRAL') {
    const parsed = Number(trimestre);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) {
      throw new Error('El trimestre debe estar entre 1 y 4');
    }
    return `T${String(parsed).padStart(2, '0')}`;
  }

  const parsed = Number(semestre || 1);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 2) {
    throw new Error('El semestre debe estar entre 1 y 2');
  }
  return `S${String(parsed).padStart(2, '0')}`;
}

function monthName(month) {
  return MONTH_NAMES[normalizeMonth(month) - 1];
}

module.exports = {
  buildPeriodoClave,
  monthName,
  normalizeMonth,
};
