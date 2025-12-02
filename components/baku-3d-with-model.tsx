// 3Dモデルファイルを使用する場合の例
// components/baku-3d-with-model.tsx

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  OrbitControls,
  Environment,
  useGLTF,
  useAnimations,
} from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { useBakuStore } from "@/lib/store";
import type { Group } from "three";
import { GLBAnimationChecker } from "./glb-animation-checker";

// 3Dモデルを読み込むコンポーネント
function BakuModelFromFile({ status }: { status: string }) {
  const groupRef = useRef<Group>(null);

  // アニメーション管理用のステート
  const [currentAction, setCurrentAction] = useState("stand"); // 初期状態は"stand"
  const [isWalking, setIsWalking] = useState(false); // 歩行中かどうかのフラグ

  // GLBファイルを読み込み、アニメーションを取得
  const { scene, animations } = useGLTF("/models/baku-model1118.glb");
  const { actions, mixer } = useAnimations(animations, groupRef);

  // アニメーションの切り替えとクロスフェード処理
  useEffect(() => {
    const action = actions[currentAction];
    if (action && mixer) {
      mixer.stopAllAction();
      action.reset().fadeIn(0.5).play();
    }
    return () => {
      action?.fadeOut(0.5);
    };
  }, [currentAction, actions, mixer]);

  // ランダムな待機、歩行ロジック
  useEffect(() => {
    if (status !== "healthy") {
      setCurrentAction("stand");
      setIsWalking(false);
      return;
    }

    let intervalId: number;
    const startRandomMovement = () => {
      intervalId = window.setInterval(() => {
        const nextAction = Math.random() < 0.6 ? "walk" : "stand";
        setCurrentAction(nextAction);
        setIsWalking(nextAction === "walk");
      }, Math.random() * 2000 + 1000);
    };

    startRandomMovement();

    return () => {
      clearInterval(intervalId);
    };
  }, [status]);

  // アニメーションミキサーの更新のみ
  useFrame((state) => {
    mixer.update(state.clock.getDelta());
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={2} position={[0, -1.5, 0]} />
    </group>
  );
}

export function Baku3DWithModel() {
  const { status, hunger } = useBakuStore();

  return (
    <div className="w-full h-80 rounded-xl overflow-hidden bg-linear-to-b from-blue-50 to-purple-50 relative">
      {/* デバッグ用：開発環境でのみアニメーション情報を出力 */}
      {process.env.NODE_ENV === "development" && <GLBAnimationChecker />}

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
useGLTF.preload("/models/baku-model1118.glb");
