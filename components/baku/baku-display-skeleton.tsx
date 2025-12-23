export default function BakuDisplaySkeleton() {
  return (
    <div className="space-y-4">
      {/* Alert の場所確保 */}
      <div className="h-12" />

      {/* 3D表示エリアのスケルトン */}
      <div className="w-full h-80 rounded-xl bg-linear-to-b from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse space-y-3 text-center">
          <div className="w-32 h-32 rounded-full bg-gray-300/50 mx-auto" />
          <div className="h-4 w-24 bg-gray-300/50 mx-auto rounded" />
        </div>
      </div>
    </div>
  );
}
