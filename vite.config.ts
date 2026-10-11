import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { APP_NAME } from "./src/app/config.ts";
import en from "./src/i18n/en.json" with { type: "json" };

export default defineConfig({
  plugins: [
    react(),
    {
      name: "app-title",
      transformIndexHtml: (html) => html.replace("__APP_NAME__", APP_NAME),
    },
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: en.auth.manifestDescription,
        theme_color: "#0b0b0c",
        background_color: "#0b0b0c",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,webp,svg,woff2}"],
        runtimeCaching: [],
        navigateFallbackDenylist: [
          /^\/auth\//,
          /^\/functions\//,
          /^\/rest\//,
          /^\/storage\//,
        ],
      },
    }),
  ],
});
