import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";

export default defineConfig({
  plugins: [react()],

  define: {
    global: "globalThis",
    "process.env": {},
  },

  resolve: {
    alias: {
      process: "process/browser",
      util: "util",
      events: "events",
      buffer: "buffer",
      stream: "stream-browserify",
    },
  },

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
});
