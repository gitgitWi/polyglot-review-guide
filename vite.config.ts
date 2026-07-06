import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    // SSG: prerender the whole guide at build time and crawl internal links to
    // discover every /guide/:id and /tags/:tag page. Unprerendered paths fall
    // back to Worker SSR.
    tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
    viteReact(),
    tailwindcss(),
  ],
});
