-- Add emotion score column to memories table (IF NOT EXISTS to avoid errors)
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS emotion_score DECIMAL(5,2);

COMMENT ON COLUMN memories.emotion_score IS '感情分析スコア (0-100)。APIから取得したcombined_score_100の値';
