// Original line drawings, authored for Tidepost. No external assets.
const drawings = {
  house: '<path d="M5 20 20 7l15 13M9 18v21h22V18M17 39V27h7v12M12 23h4v5h-4M27 23h-4v5h4"/><path d="M27 11V5h4v10"/>',
  post: '<path d="M4 18 20 5l16 13M8 16v23h24V16M16 39V26h8v13"/><rect x="12" y="17" width="16" height="7" rx="1"/><path d="m12 17 8 5 8-5M4 39h32"/>',
  tower: '<path d="m12 39 3-23h10l3 23M12 16h16M14 10h12v6H14zM12 10l8-7 8 7M18 20h4M17 29h7M10 39h20M18 39v-5h4v5"/><path d="M6 13H2m32 0h4M8 7 5 5m27 2 3-2"/>',
  jetty: '<path d="M9 17h24v6H9zM13 23v15m8-15v15m8-15v15M13 17V8m7 9V8m-7 3h7M5 35q4-4 8 0t8 0t8 0t8 0M3 41q4-4 8 0t8 0t8 0t8 0"/>'
};
export function building(kind) {
  return `<svg viewBox="0 0 40 44" width="32" height="35" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[kind] || drawings.house}</svg>`;
}
