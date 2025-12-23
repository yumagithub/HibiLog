"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

export function GLBAnimationChecker() {
  const gltf = useGLTF("/models/baku-model.glb");

  useEffect(() => {
    console.log("\n=== Baku Model Analysis ===");
    console.log("Animations:", gltf.animations.length);

    if (gltf.animations && gltf.animations.length > 0) {
      gltf.animations.forEach((clip, index) => {
        console.log(`\n[${index}] Animation: "${clip.name}"`);
        console.log(`  Duration: ${clip.duration.toFixed(2)}s`);
        console.log(`  Tracks: ${clip.tracks.length}`);

        // トラックの詳細
        const trackInfo: { [key: string]: number } = {};
        clip.tracks.forEach((track) => {
          const parts = track.name.split(".");
          const type = parts[parts.length - 1];
          trackInfo[type] = (trackInfo[type] || 0) + 1;
        });
        console.log(`  Track types:`, trackInfo);
      });
    } else {
      console.log("⚠️ No animations found");
    }

    console.log("\nScene structure:");
    console.log("Children:", gltf.scene.children.length);
    gltf.scene.children.forEach((child, i) => {
      console.log(`  [${i}] ${child.type} - ${child.name}`);
    });

    console.log("\n=========================\n");
  }, [gltf]);

  return null;
}
