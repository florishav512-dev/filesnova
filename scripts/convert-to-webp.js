// scripts/convert-to-webp.js
import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";

async function run() {
  // Convert images in public/
  await imagemin(["public/*.{jpg,png}"], {
    destination: "public",
    plugins: [imageminWebp({ quality: 80 })],
  });

  // Convert images in src/assets/
  await imagemin(["src/assets/*.{jpg,png}"], {
    destination: "src/assets",
    plugins: [imageminWebp({ quality: 80 })],
  });

  console.log("✅ All images converted to WebP!");
}

run().catch((err) => {
  console.error("❌ Error during WebP conversion:", err);
});

