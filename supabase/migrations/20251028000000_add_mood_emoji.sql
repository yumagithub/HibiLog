-- Add mood emoji columns to memories table
ALTER TABLE memories 
ADD COLUMN mood_emoji VARCHAR(10),
ADD COLUMN mood_category VARCHAR(20);

-- Update existing records with a default value (optional, can be NULL)
UPDATE memories 
SET mood_emoji = '😊', mood_category = 'positive' 
WHERE mood_emoji IS NULL;
