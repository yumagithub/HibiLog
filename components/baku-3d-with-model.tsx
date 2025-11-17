// 3Dモデルファイルを使用する場合の例
// components/baku-3d-with-model.tsx

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { useBakuStore } from "@/lib/store";
import type { Group } from "three";

// 3Dモデルを読み込むコンポーネント
function BakuModelFromFile({ status }: { status: string }) {
  const groupRef = useRef<Group>(null);

  // GLBファイルを読み込み
  // Baku Tapir LoDsモデルを使用
  const { scene } = useGLTF("/models/baku-model.glb");

  // アニメーション
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    switch (status) {
      case "healthy":
        groupRef.current.rotation.y = time * 0.5;
        groupRef.current.position.y = Math.sin(time * 2) * 0.2;
        break;
      case "normal":
        groupRef.current.rotation.y = time * 0.3;
        break;
      case "hungry":
        groupRef.current.position.x = Math.sin(time * 8) * 0.05;
        break;
      case "critical":
        groupRef.current.rotation.z = Math.sin(time * 2) * 0.1;
        break;
    }
  });

  return (
    <Float speed={2} floatIntensity={0.5}>
      <group ref={groupRef}>
        <primitive object={scene} scale={2} position={[0, -1, 0]} />
      </group>
    </Float>
  );
}

export function Baku3DWithModel() {
  const { status, hunger } = useBakuStore();

  return (
    <div className="w-full h-80 rounded-xl overflow-hidden bg-linear-to-b from-blue-50 to-purple-50 relative">
      <Canvas camera={{ position: [0, 1, 15], fov: 45 }} shadows>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#a78bfa" />

        {/* 3Dモデルを表示 */}
        <BakuModelFromFile status={status} />

        {/* 床 */}
        <mesh
          position={[0, -1.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#f3f4f6" />
        </mesh>

        <Environment preset="sunset" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={status === "healthy"}
        />
      </Canvas>

      {/* 空腹度表示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4">
        <div className="bg-white/80 backdrop-blur-sm rounded-full p-2">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-xs font-medium text-gray-700">
              空腹度: {Math.round(hunger)}%
            </span>
            <span className="text-xs text-gray-500">{status}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-linear-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${hunger}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// GLTFファイルをプリロード（パフォーマンス向上）
useGLTF.preload("/models/Baku Tapir LoDs.glb");
