// Usa el mismo logotipo horizontal publicado que aparece en la cabecera principal.
// Se elimina la antigua imagen PNG incrustada, cuyo contenido se mostraba recortado
// en la vista consolidada y al imprimir/exportar a PDF.
const baseUrl = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
export const GSARITAMA_LOGO_PNG = `${baseUrl}/gasv-logo.png`;
