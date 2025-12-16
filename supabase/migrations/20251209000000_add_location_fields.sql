-- Add location fields to memories table
ALTER TABLE public.memories
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN location_name TEXT,
ADD COLUMN address TEXT;

COMMENT ON COLUMN public.memories.latitude IS '思い出の緯度';
COMMENT ON COLUMN public.memories.longitude IS '思い出の経度';
COMMENT ON COLUMN public.memories.location_name IS '場所の名前（例: 東京タワー）';
COMMENT ON COLUMN public.memories.address IS '住所（例: 東京都港区芝公園）';
