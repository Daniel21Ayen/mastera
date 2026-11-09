-- Add BDU departments / programs if they don't exist
INSERT INTO program (id, university_id, name, is_active, version, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000106', '982316db-5604-4618-a924-656d6928d39c', 'Freshman Department', true, 1, NOW()),
  ('00000000-0000-0000-0000-000000000107', '982316db-5604-4618-a924-656d6928d39c', 'Computer Science', true, 1, NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, university_id = EXCLUDED.university_id, updated_at = NOW();

-- Assign BDU Freshman Department to Freshman Courses
UPDATE course
SET program_id = '00000000-0000-0000-0000-000000000106', university_id = '982316db-5604-4618-a924-656d6928d39c', updated_at = NOW()
WHERE code IN ('ENG101', 'PHYS101', 'CALC101', 'CHEM101', 'PHIL101');

-- Assign AASTU Freshman Engineering to AASTU Courses
UPDATE course
SET program_id = '00000000-0000-0000-0000-000000000102', university_id = '856a9acc-aaa3-4f29-ac7a-cc5ece2a299c', updated_at = NOW()
WHERE code IN ('MATH101', 'MAT123');

-- Assign AASTU Software Engineering to BIO102
UPDATE course
SET program_id = '00000000-0000-0000-0000-000000000101', university_id = '856a9acc-aaa3-4f29-ac7a-cc5ece2a299c', updated_at = NOW()
WHERE code = 'BIO102';

-- Assign AAU Freshman Social Science to ECON101 and ANTH101
UPDATE course
SET program_id = '00000000-0000-0000-0000-000000000104', university_id = '341fb0a6-3681-4da5-88d2-e6a47e55be94', updated_at = NOW()
WHERE code IN ('ECON101', 'ANTH101');
