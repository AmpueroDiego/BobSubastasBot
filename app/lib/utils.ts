import { Revenue } from './definitions';

export const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

export const formatDateToLocal = (
  dateStr: string,
  locale: string = 'en-US',
) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export function getNombreAMostrar(
  nombre: string | null | undefined,
  apellido: string | null | undefined,
  alias: string | null | undefined,
  numero: string | null | undefined
): string {
  // Si existe nombre y apellido, usar eso
  if (nombre?.trim() && apellido?.trim()) {
    return `${nombre.trim()} ${apellido.trim()}`;
  }

  // Si solo existe alias, usar alias
  if (alias?.trim()) {
    return alias.trim();
  }

  // Fallback a numero o "Sin nombre"
  return numero || 'Sin nombre';
}

export function getInicial(
  nombre: string | null | undefined,
  apellido: string | null | undefined,
  alias: string | null | undefined,
  numero: string | null | undefined
): string {
  const nombreAMostrar = getNombreAMostrar(nombre, apellido, alias, numero);
  return nombreAMostrar.charAt(0).toUpperCase();
}


export function formatTiempo(fecha: string | null | undefined): string {
  // Si no hay fecha, retornar "Sin fecha"
  if (!fecha) return 'Sin fecha';

  try {
    const ahora = new Date();
    const entonces = new Date(fecha);
    
    // Validar que la fecha es válida
    if (isNaN(entonces.getTime())) {
      return 'Sin fecha';
    }

    const diferencia = ahora.getTime() - entonces.getTime();

    // Si la diferencia es negativa (fecha futura), mostrar la fecha
    if (diferencia < 0) {
      return entonces.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const días = Math.floor(horas / 24);
    const semanas = Math.floor(días / 7);

    // Mostrar tiempo relativo según la antigüedad
    if (segundos < 60) return 'Hace poco';
    if (minutos < 60) return `Hace ${minutos}m`;
    if (horas < 24) return `Hace ${horas}h`;
    if (días < 7) return `Hace ${días}d`;
    if (semanas < 4) return `Hace ${semanas} sem`;

    // Para fechas más antiguas, mostrar fecha completa pero corta
    return entonces.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  } catch (error) {
    console.error('Error al formatear tiempo:', error);
    return 'Sin fecha';
  }
}


export const generateYAxis = (revenue: Revenue[]) => {
  // Calculate what labels we need to display on the y-axis
  // based on highest record and in 1000s
  const yAxisLabels = [];
  const highestRecord = Math.max(...revenue.map((month) => month.revenue));
  const topLabel = Math.ceil(highestRecord / 1000) * 1000;

  for (let i = topLabel; i >= 0; i -= 1000) {
    yAxisLabels.push(`$${i / 1000}K`);
  }

  return { yAxisLabels, topLabel };
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage > totalPages - 3) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};
// Función para formatear número de WhatsApp - mostrar solo 9 dígitos
export function formatearNumeroParaMostrar(numero: string | null): string {
  if (!numero) return '';
  
  // Si tiene formato de WhatsApp: 51963449351@s.whatsapp.net
  if (numero.includes('@s.whatsapp.net')) {
    const match = numero.match(/(\d+)@s\.whatsapp\.net/);
    if (match && match[1]) {
      const digitos = match[1];
      // Si empieza con 51 (código de Perú), removerlo
      if (digitos.startsWith('51') && digitos.length > 9) {
        return digitos.substring(2);
      }
      return digitos;
    }
  }
  
  // Si es solo número con código 51
  if (numero.startsWith('51') && numero.length > 9) {
    return numero.substring(2);
  }
  
  // Devolver solo los dígitos
  return numero.replace(/\D/g, '');
}