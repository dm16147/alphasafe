import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

async function buildAll() {
  console.log("Cleaning dist folder...");
  await rm("dist", { recursive: true, force: true });

  console.log("Building client...");
  await viteBuild();

  console.log("Build complete ✓");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
