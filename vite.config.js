import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// DBIM FTR-05: "Last updated" = date of the latest build/deploy
const today = new Date();
const LAST_UPDATED = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

export default defineConfig({
  //base: '/ems/',
  plugins: [react()],
  define: {
    __LAST_UPDATED__: JSON.stringify(LAST_UPDATED),
  },
});