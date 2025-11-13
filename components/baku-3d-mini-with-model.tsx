// components/baku-3d-mini-with-model.tsx
// サイドバー用のコンパクトな3Dモデル版

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { useBakuStore } from "@/lib/store";
import type { Group } from "three";

function BakuModelMini({ status }: { status: string }) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF("/models/Baku Tapir LoDs.glb");

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    switch (status) {
      case "healthy":
        groupRef.current.rotation.y = time * 0.5;
        groupRef.current.position.y = Math.sin(time * 2) * 0.1;
        break;
      case "normal":
        groupRef.current.rotation.y = time * 0.3;
        break;
      case "hungry":
        groupRef.current.position.x = Math.sin(time * 8) * 0.03;
        break;
      case "critical":
        groupRef.current.rotation.z = Math.sin(time * 2) * 0.05;
        break;
    }
  });

  return (
    <Float speed={1.5} floatIntensity={0.3}>
      <group ref={groupRef}>
        <primitive object={scene} scale={1.5} />
      </group>
    </Float>
  );
}

export function Baku3DMiniWithModel() {
  const { status } = useBakuStore();

  return (
    <div className="w-full h-32 rounded-lg overflow-hidden bg-linear-to-b from-blue-50 to-purple-50">
      <Canvas camera={{ position: [0, 0.5, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 3, 3]} intensity={0.8} />
        <pointLight position={[-3, 2, -3]} intensity={0.3} color="#a78bfa" />

        <BakuModelMini status={status} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/Baku Tapir LoDs.glb");
