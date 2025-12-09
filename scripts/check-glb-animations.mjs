import { readFileSync } from "fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

// GLBファイルを読み込み
const glbPath = "./public/models/baku-model.glb";
const glbData = readFileSync(glbPath);
const arrayBuffer = glbData.buffer.slice(
  glbData.byteOffset,
  glbData.byteOffset + glbData.byteLength
);

loader.parse(
  arrayBuffer,
  "",
  (gltf) => {
    console.log("\n=== GLB Model Analysis ===\n");

    // アニメーション情報
    if (gltf.animations && gltf.animations.length > 0) {
      console.log(`📹 Animations found: ${gltf.animations.length}\n`);
      gltf.animations.forEach((clip, index) => {
        console.log(`[${index}] Name: "${clip.name}"`);
        console.log(`    Duration: ${clip.duration.toFixed(2)}s`);
        console.log(`    Tracks: ${clip.tracks.length}`);

        // トラック情報の詳細
        const trackTypes = {};
        clip.tracks.forEach((track) => {
          const type = track.name.split(".").pop();
          trackTypes[type] = (trackTypes[type] || 0) + 1;
        });
        console.log(`    Track types:`, trackTypes);
        console.log("");
      });
    } else {
      console.log("⚠️  No animations found in this model.\n");
    }

    // シーン情報
    console.log("🎬 Scene info:");
    console.log(`   Objects: ${gltf.scene.children.length}`);

    // メッシュ情報
    let meshCount = 0;
    gltf.scene.traverse((child) => {
      if (child.isMesh) meshCount++;
    });
    console.log(`   Meshes: ${meshCount}`);

    // マテリアル情報
    const materials = new Set();
    gltf.scene.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => materials.add(mat.name || "unnamed"));
        } else {
          materials.add(child.material.name || "unnamed");
        }
      }
    });
    console.log(
      `   Materials: ${materials.size} (${[...materials].join(", ")})`
    );

    console.log("\n=========================\n");
  },
  (error) => {
    console.error("Error loading GLB:", error);
  }
);
