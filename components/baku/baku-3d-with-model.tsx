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
import { GLBAnimationChecker } from "@/components/dev/glb-animation-checker";
import { createClient } from "@/lib/supabase/client";
import { MemoryDetailModal } from "@/components/memory/memory-detail-modal";
import type { Memory } from "@/app/memories/page";

type BehaviorState = "Idle" | "Walking";

const DEFAULT_SIZE = 30;

// 3Dモデルを読み込むコンポーネント
function BakuModelFromFile({
  status,
  hunger,
}: {
  status: string;
  hunger: number;
}) {
  const groupRef = useRef<Group>(null);
  
  // メニューの状態をストアから取得（動作停止用：hunger/sizeとは無関係）
  // ★ ストアから現在のサイズを取得
  const size = useBakuStore((state) => state.size);
  // ★ 追加：メニューの状態をストアから取得
  const isMenuOpen = useBakuStore((state) => state.isMenuOpen);

  // ★ サイズに基づいたスケール計算（初期サイズ30cmを基準に、スケール2.0からスタート）
  // 成長するにつれてモデルが大きくなります
  const currentScale = 2.0 + (size - 30) * 0.1;

  // ウィンドウサイズに応じた移動範囲を計算（useRefで初期値を設定）
  const boundValueRef = useRef(
    typeof window !== "undefined" && window.innerWidth < 768 ? 6 : 8,
  );

  useEffect(() => {
    const updateBound = () => {
      // スマホ（幅 < 768px）：BOUND = 6
      // タブレット・PC（幅 >= 768px）：BOUND = 8
      if (typeof window !== "undefined") {
        boundValueRef.current = window.innerWidth < 768 ? 6 : 8;
      }
    };

    updateBound();
    window.addEventListener("resize", updateBound);
    return () => window.removeEventListener("resize", updateBound);
  }, []);

  // 初期位置を安全に中央へ
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.set(0, 0, 0);
    }
  }, []);

  // 動作状態管理
  const [behavior, setBehavior] = useState<BehaviorState>("Idle");

  // 移動・回転計算用のRef
  const targetPositionRef = useRef(new Vector3(0, 0, 0)); // 目標地点
  const currentDirectionRef = useRef(new Vector3(1, 0, 0)); // 現在の向き（正規化済み）
  const walkStartTimeRef = useRef(0); // 歩き始めた時刻（将来の拡張用）

  // アニメーション管理
  const previousActionRef = useRef<AnimationAction | null>(null);
  const { scene, animations } = useGLTF("/models/baku-model.glb");
  const { actions, mixer } = useAnimations(animations, groupRef);

  // クリーンアップ時にアニメーションミキサーを停止
  useEffect(() => {
    return () => {
      if (mixer) mixer.stopAllAction();
    };
  }, [mixer]);

  const animNames = useMemo(() => {
    const names = Object.keys(actions);
    return {
      stand: names.find((n) => n === "stand" || n === "stand.001") || "stand",
      walk: names.find((n) => n === "walk") || "walk",
    };
  }, [actions]);

  // パラメータ計算（hungerに応じて確率・速度を調整）
  const getParams = () => {
    const h = Math.max(0, Math.min(100, hunger));
    return {
      walkProb: Math.max(0.15, 1.0 - (h / 100) * 0.35),
      interval: [1500 + (h / 100) * 1500, 2500 + (h / 100) * 2500] as const,
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
      // クロスフェード
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
    // それ以外: Idleを維持
    if (status !== "healthy") {
      setBehavior("Idle");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const { walkProb, interval } = getParams();
    const [minTime, maxTime] = interval;
    const waitTime = Math.random() * (maxTime - minTime) + minTime;

    if (behavior === "Idle") {
      timeoutId = setTimeout(() => {
        if (Math.random() < walkProb) {
          // ランダムな目標地点を決定（-8〜8相当のスケール）
          const targetX = (Math.random() - 0.5) * 16;
          const targetZ = (Math.random() - 0.5) * 16;
          targetPositionRef.current.set(targetX, 0, targetZ);

          if (groupRef.current) {
            const rot = groupRef.current.rotation.y;
            currentDirectionRef.current
              .set(Math.sin(rot), 0, Math.cos(rot))
              .normalize();
          }

          walkStartTimeRef.current = Date.now();
          setBehavior("Walking");
        }
      }, waitTime);
    } else if (behavior === "Walking") {
      timeoutId = setTimeout(() => {
        setBehavior("Idle");
      }, waitTime);
    }

    return () => clearTimeout(timeoutId);
  }, [behavior, status, hunger]);

  // フレーム毎の更新処理
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!mixer) return;
    if (isMenuOpen) return; // メニューが開いている間は動作停止

    const group = groupRef.current;

    // アニメーション更新
    mixer.update(delta);

    // 移動処理（歩きながら向き転換）
    if (behavior === "Walking") {
      const { moveSpeed } = getParams();
      const moveDist = moveSpeed * delta;

      const toTarget = new Vector3(
        targetPositionRef.current.x - group.position.x,
        0,
        targetPositionRef.current.z - group.position.z,
      );
      const distanceToTarget = toTarget.length();

      // 到着判定
      if (distanceToTarget < 0.5) {
        setBehavior("Idle");
        return;
      }

      toTarget.normalize();

      // ステアリング（緩やかに向きを目標へ）
      const steeringLerp = 0.08;
      currentDirectionRef.current.lerp(toTarget, steeringLerp).normalize();

      // 前進
      group.position.x += currentDirectionRef.current.x * moveDist;
      group.position.z += currentDirectionRef.current.z * moveDist;

      // 回転（方向ベクトルから算出）
      group.rotation.y = Math.atan2(
        currentDirectionRef.current.x,
        currentDirectionRef.current.z,
      );

      // 壁の境界判定（ビューポートから動的に調整）
      const vp = state.viewport.getCurrentViewport(
        state.camera,
        new Vector3(0, 0, 0),
      );
      const dynamicBound = Math.max(5, Math.min(8, vp.width * 0.45));
      const BOUND = Math.min(boundValueRef.current, dynamicBound);

      if (
        group.position.x < -BOUND ||
        group.position.x > BOUND ||
        group.position.z < -BOUND ||
        group.position.z > BOUND
      ) {
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
        <primitive object={scene} scale={currentScale} position={[0, -1.5, 0]} />
      </group>
    </group>
  );
}

export function Baku3DWithModel() {
  // status/memoriesは既存設計上ストアを利用（hunger/sizeは利用しない）
  const status = useBakuStore((state) => state.status);
  const memories = useBakuStore((state) => state.memories);

  // DB由来の値（ストアに依存しない）
  const [hungerValue, setHungerValue] = useState<number | null>(null); // DB: hunger_level
  const [sizeValue, setSizeValue] = useState<number | null>(null); // DB: size

  // 画面表示・3Dは number が必要なため、未取得時は0扱い（必要なら変更可）
  const hungerFor3D = typeof hungerValue === "number" ? hungerValue : 0;

  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [latestMemory, setLatestMemory] = useState<Memory | null>(null);

  // Supabaseクライアントを安定化（レンダー毎に作り直さない）
  const supabase = useMemo(() => createClient(), []);

  // DBから空腹度(hunger_level)とサイズ(size)を取得
  useEffect(() => {
    const fetchBakuState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        // 未ログイン（ゲスト）はDB状態が取れないためnullにする
        setHungerValue(null);
        setSizeValue(null);
        return;
      }

      // ユーザーの状態を取得（テーブル名はプロジェクトに合わせて調整）
      const { data, error } = await supabase
        .from("baku_profiles")
        .select("hunger_level, size")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setHungerValue(null);
        setSizeValue(null);
        return;
      }

      const h =
        typeof data.hunger_level === "number" ? data.hunger_level : null;
      const s = typeof data.size === "number" ? data.size : null;

      setHungerValue(h);
      setSizeValue(s);

      // 空腹度が0ならサイズをDEFAULT_SIZEに揃える（DBも更新する）
      // ※DB更新を望まない場合は、このupdateブロックを削除してください
      if (h === 0 && typeof s === "number" && s !== DEFAULT_SIZE) {
        const { error: updErr } = await supabase
          .from("baku_profiles")
          .update({ size: DEFAULT_SIZE })
          .eq("user_id", user.id);

        if (!updErr) {
          setSizeValue(DEFAULT_SIZE);
        }
      }
    };

    fetchBakuState();
  }, [supabase]);

  // 最新の画像を取得（ログイン時はDB、未ログイン時はローカルmemories）
  useEffect(() => {
    const fetchLatestMemory = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        const { data } = await supabase
          .from("memories")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setLatestMemory(data as Memory);
          return;
        }
      }

      // ゲスト or DBに画像がない場合：Zustand(LocalStorage)のmemoriesから取得
      if (memories && memories.length > 0) {
        const lastLocalMemory = memories[memories.length - 1];
        setLatestMemory({
          id: lastLocalMemory.id,
          media_url: lastLocalMemory.imageUrl,
          memory_date: lastLocalMemory.timestamp,
          text_content: lastLocalMemory.textContent || null,
          mood_emoji: lastLocalMemory.moodEmoji || null,
          mood_category: lastLocalMemory.moodCategory || null,
          latitude: lastLocalMemory.latitude,
          longitude: lastLocalMemory.longitude,
          user_id: "guest",
          created_at: lastLocalMemory.timestamp,
        } as Memory);
      } else {
        setLatestMemory(null);
      }
    };

    fetchLatestMemory();
  }, [supabase, memories]);

  // 表示用に0〜100へクランプ（DBが想定外の値でもUIが破綻しないように）
  const hungerForUI =
    typeof hungerValue === "number"
      ? Math.max(0, Math.min(100, hungerValue))
      : null;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden bg-linear-to-b from-blue-50 to-purple-50"
      style={{
        height: "100dvh",
        minHeight: "600px",
        maxHeight: "100dvh",
        backgroundImage: "url(/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* デバッグ用：開発環境でのみアニメーション情報を出力 */}
      {process.env.NODE_ENV === "development" && <GLBAnimationChecker />}

      <div className="absolute inset-0 z-0 h-full w-full">
        <Canvas
          resize={{ scroll: false, debounce: 0 }}
          camera={{ position: [0, 5, 30], fov: 50 }}
          shadows
          frameloop="always"
          dpr={[1, 1.5]}
          gl={{
            alpha: true,
            preserveDrawingBuffer: false,
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <pointLight position={[-5, 3, -5]} intensity={0.5} color="#a78bfa" />

          {/* 3Dモデルを表示（空腹度はDB値のみ使用） */}
          <BakuModelFromFile status={status} hunger={hungerFor3D} />

          {/* 床（当たり判定用の透明プレーン） */}
          <mesh
            position={[0, -1.5, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          <Environment preset="sunset" />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate={false}
            autoRotateSpeed={2}
          />
        </Canvas>
      </div>

      {/* 空腹度表示（DB: hunger_level） */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] flex items-center gap-3 z-10 pointer-events-none">
        {/* メーター左：直近の写真 */}
        {latestMemory && (
          <button
            onClick={() => {
              setSelectedMemory(latestMemory);
              setIsDetailOpen(true);
            }}
            className="w-12 h-16 flex-shrink-0 rounded-md overflow-hidden border border-white shadow-md active:scale-95 transition pointer-events-auto"
          >
            <img
              src={latestMemory.media_url || ""}
              alt="最新の思い出"
              className="w-full h-full object-cover cursor-pointer"
            />
          </button>
        )}

        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-full p-2">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-xs font-medium text-gray-700">
              空腹度: {typeof hungerForUI === "number" ? Math.round(hungerForUI) : "-"}%
            </span>
            <span className="text-xs text-gray-500">{status}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-linear-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${typeof hungerForUI === "number" ? hungerForUI : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      <MemoryDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        memory={selectedMemory}
        memories={selectedMemory ? [selectedMemory] : []}
      />

      {/* サイズ表示（DB: size） */}
      <div className="absolute top-20 right-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
          <span className="text-xs font-medium text-gray-700">
            サイズ: {typeof sizeValue === "number" ? sizeValue.toFixed(1) : "-"} cm
          </span>
        </div>
      </div>
    </div>
  );
}

// GLTFファイルをプリロード（パフォーマンス向上）
useGLTF.preload("/models/baku-model.glb");
