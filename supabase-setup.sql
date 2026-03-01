-- Phúc Tea - Bảng lưu trữ đánh giá mặt bằng
-- Copy toàn bộ đoạn này vào Supabase SQL Editor → bấm Run

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_street TEXT NOT NULL,
  address_ward TEXT DEFAULT '',
  address_district TEXT NOT NULL,
  address_city TEXT NOT NULL,
  landlord_name TEXT,
  landlord_phone TEXT,
  rent_price TEXT,
  rent_unit TEXT DEFAULT 'month',
  area_sqm TEXT,
  competitor_notes TEXT,
  surveyor_name TEXT,
  survey_date DATE,
  latitude FLOAT,
  longitude FLOAT,
  images JSONB DEFAULT '[]',
  scores JSONB NOT NULL,
  total_score INT NOT NULL,
  verdict TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cho phép đọc/ghi từ web app (anon key)
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu có (tránh lỗi duplicate)
DROP POLICY IF EXISTS "Allow public read" ON evaluations;
DROP POLICY IF EXISTS "Allow public insert" ON evaluations;

CREATE POLICY "Allow public read" ON evaluations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON evaluations
  FOR INSERT WITH CHECK (true);


-- ============================================================
-- === MIGRATION: Chạy đoạn dưới nếu bảng ĐÃ TỒN TẠI trước đó ===
-- ============================================================

-- Cho phép Phường/Xã để trống (chính quyền 2 cấp)
ALTER TABLE evaluations ALTER COLUMN address_ward DROP NOT NULL;
ALTER TABLE evaluations ALTER COLUMN address_ward SET DEFAULT '';

-- Thêm cột mới cho upload hình ảnh, ghi chú đối thủ, đơn vị thuê
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS competitor_notes TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS rent_unit TEXT DEFAULT 'month';


-- ============================================================
-- === SUPABASE STORAGE: Tạo bucket lưu hình ảnh/video ===
-- ============================================================
-- Bước 1: Vào Supabase Dashboard → Storage → New bucket
-- Bước 2: Tên bucket: survey-media
-- Bước 3: Chọn "Public bucket" = ON
-- Bước 4: Thêm policy:
--   - Policy name: "Allow public uploads"
--   - Allowed operations: INSERT
--   - Target roles: anon
--   - Using expression: true
-- Bước 5: Thêm policy:
--   - Policy name: "Allow public reads"
--   - Allowed operations: SELECT
--   - Target roles: anon
--   - Using expression: true
