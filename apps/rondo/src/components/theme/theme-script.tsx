// Runs before paint to apply the stored theme and avoid a flash of the wrong
// colour scheme. Kept dependency-free and inlined in <head>.
const script = `(() => {
  try {
    const stored = localStorage.getItem("rondo-theme") || "system";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (stored === "system" && systemDark);
    document.documentElement.classList.toggle("dark", dark);
  } catch (_) {}
})();`;

export function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: required to inline the no-flash theme script before hydration.
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
