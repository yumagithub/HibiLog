// 3Dモデルファイルを使用する場合の例
// components/baku-3d-with-model.tsx

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  useGLTF,
  useAnimations,
} from "@react-three/drei";
import { useRef, useEffect, useState, useMemo } from "react";
import { useBakuStore } from "@/lib/store";
import type { Group, AnimationAction } from "three";
import { Vector3, MathUtils } from "three";
import { GLBAnimationChecker } from "./glb-animation-checker";

type BehaviorState = "Idle" | "Walking";

// 3Dモデルを読み込むコンポーネント
function BakuModelFromFile({
  status,
  hunger,
}: {
  status: string;
  hunger: number;
}) {
  const groupRef = useRef<Group>(null);

  // 動作状態管理
  const [behavior, setBehavior] = useState<BehaviorState>("Idle");

  // 移動・回転計算用のRef
  const targetPositionRef = useRef(new Vector3(0, 0, 0)); // 目標地点
  const currentDirectionRef = useRef(new Vector3(1, 0, 0)); // 現在の向き（正規化済み）
  const walkStartTimeRef = useRef(0); // 歩き始めた時刻

  // アニメーション管理
  const previousActionRef = useRef<AnimationAction | null>(null);
  const { scene, animations } = useGLTF("/models/baku-model.glb");
  const { actions, mixer } = useAnimations(animations, groupRef);

  const animNames = useMemo(() => {
    const names = Object.keys(actions);
    return {
      stand: names.find((n) => n === "stand" || n === "stand.001") || "stand",
      walk: names.find((n) => n === "walk") || "walk",
    };
  }, [actions]);

  // パラメータ計算関数
  const getParams = () => {
    const h = Math.max(0, Math.min(100, hunger));
    return {
      walkProb: Math.max(0.15, 1.0 - (h / 100) * 0.35),
      interval: [1500 + (h / 100) * 1500, 2500 + (h / 100) * 2500],
      walkSpeed: Math.max(1.0, 1.5 - (h / 100) * 0.75),
      moveSpeed: Math.max(3.0, 5.0 - (h / 100) * 2.5),
    };
  };

  // アニメーションの切り替えとクロスフェード処理
  useEffect(() => {
    if (!mixer || !actions) return;

    const targetAnimName =
      behavior === "Walking" ? animNames.walk : animNames.stand;
    const newAction = actions[targetAnimName];

    if (!newAction) return;

    const prevAction = previousActionRef.current;

    if (prevAction !== newAction) {
      // クロスフェード処理
      if (prevAction) {
        newAction.reset();
        newAction.play();
        prevAction.crossFadeTo(newAction, 0.5, true);
      } else {
        newAction.reset().fadeIn(0.5).play();
      }
      previousActionRef.current = newAction;
    }

    // 速度調整
    const { walkSpeed } = getParams();
    newAction.timeScale = behavior === "Walking" ? walkSpeed : 1.0;
  }, [behavior, actions, mixer, animNames, hunger]);

  // 意思決定ロジック
  useEffect(() => {
    // healthy状態: ランダムに歩く
    // それ以外: stand状態を保持
    if (status !== "healthy") {
      setBehavior("Idle");
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const { walkProb, interval } = getParams();
    const [minTime, maxTime] = interval;
    const waitTime = Math.random() * (maxTime - minTime) + minTime;

    if (behavior === "Idle") {
      // 待機中 -> 確率で歩行開始 or 待機継続
      timeoutId = setTimeout(() => {
        if (Math.random() < walkProb) {
          // ランダムな目標地点を決定（-8〜8の範囲内）
          const targetX = (Math.random() - 0.5) * 16;
          const targetZ = (Math.random() - 0.5) * 16;
          targetPositionRef.current.set(targetX, 0, targetZ);

          if (groupRef.current) {
            const rot = groupRef.current.rotation.y;
            // 現在の回転角度からベクトルを計算
            currentDirectionRef.current
              .set(Math.sin(rot), 0, Math.cos(rot))
              .normalize();
          }

          walkStartTimeRef.current = Date.now();
          setBehavior("Walking");
        }
      }, waitTime);
    } else if (behavior === "Walking") {
      // 歩行中 -> 一定時間歩いたら停止
      timeoutId = setTimeout(() => {
        setBehavior("Idle");
      }, waitTime);
    }

    return () => clearTimeout(timeoutId);
  }, [behavior, status, hunger]);

  // フレーム毎の更新処理
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    // アニメーションミキサーの更新（getDeltaは1回のみ）
    mixer.update(delta);

    // 移動処理（歩きながら向き転換）
    if (behavior === "Walking") {
      const { moveSpeed } = getParams();
      const moveDist = moveSpeed * delta;

      // 目標地点への方向を計算
      const toTarget = new Vector3(
        targetPositionRef.current.x - group.position.x,
        0,
        targetPositionRef.current.z - group.position.z
      );
      const distanceToTarget = toTarget.length();

      // 目標に到着したか判定（距離が0.5以下）
      if (distanceToTarget < 0.5) {
        // 目標に着いたので停止
        setBehavior("Idle");
        return;
      }

      toTarget.normalize();

      // 緩やかに目標方向へ回転（ステアリング）
      const steeringLerp = 0.08; // 回転速度の調整値
      currentDirectionRef.current.lerp(toTarget, steeringLerp);
      currentDirectionRef.current.normalize();

      // 前進
      group.position.x += currentDirectionRef.current.x * moveDist;
      group.position.z += currentDirectionRef.current.z * moveDist;

      // ベクトルから直接回転角度を計算（二重スムージング廃止）
      const targetRotation = Math.atan2(
        currentDirectionRef.current.x,
        currentDirectionRef.current.z
      );
      group.rotation.y = targetRotation;

      // 壁の境界判定
      const BOUND = 8;
      if (
        group.position.x < -BOUND ||
        group.position.x > BOUND ||
        group.position.z < -BOUND ||
        group.position.z > BOUND
      ) {
        // 境界を超えたら即座にIdleへ戻す
        group.position.x = MathUtils.clamp(group.position.x, -BOUND, BOUND);
        group.position.z = MathUtils.clamp(group.position.z, -BOUND, BOUND);
        setBehavior("Idle");
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group position={[5.4, 0, -1.0]}>
        {/* バクのモデル */}
        <primitive object={scene} scale={2} position={[0, -1.5, 0]} />
      </group>
    </group>
  );
}

export function Baku3DWithModel() {
  const { status, hunger } = useBakuStore();

  return (
    <div className="w-full h-80 rounded-xl overflow-hidden bg-linear-to-b from-blue-50 to-purple-50 relative">
      {/* デバッグ用：開発環境でのみアニメーション情報を出力 */}
      {process.env.NODE_ENV === "development" && <GLBAnimationChecker />}

      <Canvas
        camera={{ position: [0, 5, 20], fov: 50 }}
        shadows
        frameloop="always"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#a78bfa" />

        {/* 3Dモデルを表示 */}
        <BakuModelFromFile status={status} hunger={hunger} />

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
          autoRotate={false}
          autoRotateSpeed={2}
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
useGLTF.preload("/models/baku-model.glb");
