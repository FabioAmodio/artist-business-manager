/** Link di ricerca Google Maps (API pubblica documentata): accetta testo libero (nome luogo/indirizzo), nessun formato strutturato richiesto. */
export function buildMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}
