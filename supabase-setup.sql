-- Phúc Tea - Bảng lưu trữ đánh giá mặt bằng
-- Copy toàn bộ đoạn này vào Supabase SQL Editor → bấm Run

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_street TEXT NOT NULL,
  address_ward TEXT NOT NULL,
  address_district TEXT NOT NULL,
  address_city TEXT NOT NULL,
  landlord_name TEXT,
  landlord_phone TEXT,
  rent_price TEXT,
  area_sqm TEXT,
  surveyor_name TEXT,
  survey_date DATE,
  latitude FLOAT,
  longitude FLOAT,
  scores JSONB NOT NULL,
  total_score INT NOT NULL,
  verdict TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cho phép đọc/ghi từ web app (anon key)
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON evaluations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON evaluations
  FOR INSERT WITH CHECK (true);

-- === MIGRATION v2: Thêm cột mới (chạy nếu bảng đã tồn tại) ===
-- Copy đoạn dưới vào SQL Editor → Run

ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS competitor_notes TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS rent_unit TEXT DEFAULT 'month';

-- === Supabase Storage: Tạo bucket survey-media ===
-- 1. Vào Storage → New bucket → Tên: survey-media
-- 2. Chọn Public bucket
-- 3. Thêm policy: Allow public uploads (INSERT) và reads (SELECT)
