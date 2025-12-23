import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StreakCard({
  loading,
  currentStreak,
  longestStreak,
}: {
  loading: boolean;
  currentStreak: number;
  longestStreak: number;
}) {
  return (
    <Card className="mt-6 p-4">
      <div className="flex items-center justify-around">
        {loading ? (
          <>
            {/* current streak skeleton */}
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>

            <div className="h-12 w-px bg-border" />

            {/* longest streak skeleton */}
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl">🔥</span>
                <span className="text-3xl font-bold text-orange-500">
                  {currentStreak}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">連続投稿</p>
            </div>

            <div className="h-12 w-px bg-border" />

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl">🏆</span>
                <span className="text-3xl font-bold text-yellow-600">
                  {longestStreak}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">最長記録</p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
