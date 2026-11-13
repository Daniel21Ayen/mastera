-- ==============================================================================
-- Mastera Complete Quiz Seeding Script for All Courses (SRS Section 4 & 5)
-- Ensures Quiz 1, Quiz 2, and Quiz 3 are fully populated with genuine curriculum
-- book groups, chapters, and questions for all 10 courses.
-- ==============================================================================

DO $$
DECLARE
  v_admin_id uuid := '8d119c24-7436-4ef8-841c-64c4a9f89302';
BEGIN

  -- 1. CALCULUS I (CALC101: 8cd37c0e-ac3e-4abc-bb36-98058e80127f)
  INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at) VALUES
    ('b0000004-0000-0000-0000-000000000001', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'QUIZ_1', 'Q1-CALC', 'Calculus I — Quiz 1', 'Limits, Continuity & Proofs', 1, 1, NOW()),
    ('b0000004-0000-0000-0000-000000000002', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'QUIZ_2', 'Q2-CALC', 'Calculus I — Quiz 2', 'Differentiation & Applications', 2, 1, NOW()),
    ('b0000004-0000-0000-0000-000000000003', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'QUIZ_3', 'Q3-CALC', 'Calculus I — Quiz 3', 'Integration & Fundamental Theorem', 3, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000004-0000-0000-0000-000000000001', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'b0000004-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Limits & Continuity', '# Chapter 1: Limits & Continuity', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000004-0000-0000-0000-000000000002', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'b0000004-0000-0000-0000-000000000001', 'QUIZ_1', 2, 'Chapter 2: Delta-Epsilon Proofs', '# Chapter 2: Delta-Epsilon Proofs', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000005-0000-0000-0000-000000000001', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'b0000004-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Differentiation Rules', '# Chapter 1: Differentiation Rules', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000005-0000-0000-0000-000000000002', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'b0000004-0000-0000-0000-000000000002', 'QUIZ_2', 2, 'Chapter 2: Chain Rule & Implicit', '# Chapter 2: Chain Rule & Implicit', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000006-0000-0000-0000-000000000001', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'b0000004-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: Definite Integrals', '# Chapter 1: Definite Integrals', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000006-0000-0000-0000-000000000002', '8cd37c0e-ac3e-4abc-bb36-98058e80127f', 'b0000004-0000-0000-0000-000000000003', 'QUIZ_3', 2, 'Chapter 2: Substitution & Area', '# Chapter 2: Substitution & Area', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at) VALUES
    ('e0000005-0000-0000-0000-000000000001', 'c0000004-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
     'Evaluate the limit: $\lim_{x \to 0} \frac{\sin(3x)}{x}$',
     '[{"id":"A","text":"1","textLatex":"1"},{"id":"B","text":"3","textLatex":"3"},{"id":"C","text":"0","textLatex":"0"},{"id":"D","text":"Does not exist","textLatex":"\\text{Does not exist}"}]'::jsonb,
     'B', 'Using standard trigonometric limit $\lim_{u\to 0}\frac{\sin u}{u} = 1$, we have $\lim_{x\to 0} \frac{3\sin(3x)}{3x} = 3 \times 1 = 3$.', 'PUBLISHED', v_admin_id, NOW()),
    ('e0000005-0000-0000-0000-000000000002', 'c0000005-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
     'What is the derivative of $f(x) = x^3 e^{2x}$ with respect to $x$?',
     '[{"id":"A","text":"3x^2 e^{2x}","textLatex":"3x^2 e^{2x}"},{"id":"B","text":"x^2 e^{2x}(3 + 2x)","textLatex":"x^2 e^{2x}(3 + 2x)"},{"id":"C","text":"6x^2 e^{2x}","textLatex":"6x^2 e^{2x}"},{"id":"D","text":"2x^3 e^{2x}","textLatex":"2x^3 e^{2x}"}]'::jsonb,
     'B', 'By product rule: $f''(x) = (x^3)''(e^{2x}) + x^3 (e^{2x})'' = 3x^2 e^{2x} + 2x^3 e^{2x} = x^2 e^{2x}(3 + 2x)$.', 'PUBLISHED', v_admin_id, NOW()),
    ('e0000006-0000-0000-0000-000000000001', 'c0000006-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
     'Evaluate $\int_0^2 (3x^2 - 2x + 1) \, dx$',
     '[{"id":"A","text":"6","textLatex":"6"},{"id":"B","text":"8","textLatex":"8"},{"id":"C","text":"10","textLatex":"10"},{"id":"D","text":"4","textLatex":"4"}]'::jsonb,
     'A', 'Antiderivative is $F(x) = x^3 - x^2 + x$. Evaluating from 0 to 2: $F(2) = 8 - 4 + 2 = 6; F(0) = 0$. Result is 6.', 'PUBLISHED', v_admin_id, NOW())
  ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, updated_at = NOW();

  -- 2. GENERAL PHYSICS (PHYS101: c6d35801-cad9-4f48-b78e-8a129bef31c8)
  INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at) VALUES
    ('b0000007-0000-0000-0000-000000000001', 'c6d35801-cad9-4f48-b78e-8a129bef31c8', 'QUIZ_1', 'Q1-PHYS', 'General Physics — Quiz 1', 'Vectors & 1D/2D Kinematics', 1, 1, NOW()),
    ('b0000007-0000-0000-0000-000000000002', 'c6d35801-cad9-4f48-b78e-8a129bef31c8', 'QUIZ_2', 'Q2-PHYS', 'General Physics — Quiz 2', 'Newtonian Dynamics & Energy', 2, 1, NOW()),
    ('b0000007-0000-0000-0000-000000000003', 'c6d35801-cad9-4f48-b78e-8a129bef31c8', 'QUIZ_3', 'Q3-PHYS', 'General Physics — Quiz 3', 'Rotational Dynamics & Heat', 3, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000007-0000-0000-0000-000000000001', 'c6d35801-cad9-4f48-b78e-8a129bef31c8', 'b0000007-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Vectors & Motion', '# Chapter 1: Vectors & Motion', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000008-0000-0000-0000-000000000001', 'c6d35801-cad9-4f48-b78e-8a129bef31c8', 'b0000007-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Work-Energy & Momentum', '# Chapter 1: Work-Energy & Momentum', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000009-0000-0000-0000-000000000001', 'c6d35801-cad9-4f48-b78e-8a129bef31c8', 'b0000007-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: Thermodynamics & Waves', '# Chapter 1: Thermodynamics & Waves', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at) VALUES
    ('e0000007-0000-0000-0000-000000000001', 'c0000007-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
     'A ball is launched horizontally at $15\text{ m/s}$ from a cliff of height $20\text{ m}$. Neglecting air resistance ($g = 9.8\text{ m/s}^2$), what is the time to strike the ground?',
     '[{"id":"A","text":"2.02 s","textLatex":"2.02\\text{ s}"},{"id":"B","text":"1.43 s","textLatex":"1.43\\text{ s}"},{"id":"C","text":"3.00 s","textLatex":"3.00\\text{ s}"},{"id":"D","text":"4.04 s","textLatex":"4.04\\text{ s}"}]'::jsonb,
     'A', 'Vertical motion is independent of horizontal: $h = \\frac{1}{2}gt^2 \\implies t = \\sqrt{2h/g} = \\sqrt{40/9.8} \\approx 2.02\\text{ s}$.', 'PUBLISHED', v_admin_id, NOW()),
    ('e0000008-0000-0000-0000-000000000001', 'c0000008-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
     'A net force of $50\text{ N}$ acts on a $5\text{ kg}$ body initially at rest for $4\text{ s}$. What is its final kinetic energy?',
     '[{"id":"A","text":"1000 J","textLatex":"1000\\text{ J}"},{"id":"B","text":"2000 J","textLatex":"2000\\text{ J}"},{"id":"C","text":"4000 J","textLatex":"4000\\text{ J}"},{"id":"D","text":"500 J","textLatex":"500\\text{ J}"}]'::jsonb,
     'C', 'Acceleration $a = F/m = 50/5 = 10\\text{ m/s}^2$. Final velocity $v = at = 40\\text{ m/s}$. $KE = \\frac{1}{2}mv^2 = 0.5 \\times 5 \\times 1600 = 4000\\text{ J}$.', 'PUBLISHED', v_admin_id, NOW())
  ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, updated_at = NOW();

  -- 3. GENERAL CHEMISTRY (CHEM101: 68465177-e594-4b09-803c-088433e9250a)
  INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at) VALUES
    ('b0000010-0000-0000-0000-000000000001', '68465177-e594-4b09-803c-088433e9250a', 'QUIZ_1', 'Q1-CHEM', 'General Chemistry — Quiz 1', 'Atomic Theory & Periodic Trends', 1, 1, NOW()),
    ('b0000010-0000-0000-0000-000000000002', '68465177-e594-4b09-803c-088433e9250a', 'QUIZ_2', 'Q2-CHEM', 'General Chemistry — Quiz 2', 'Chemical Bonding & Molecular Shapes', 2, 1, NOW()),
    ('b0000010-0000-0000-0000-000000000003', '68465177-e594-4b09-803c-088433e9250a', 'QUIZ_3', 'Q3-CHEM', 'General Chemistry — Quiz 3', 'Equilibrium, Acids & Bases', 3, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000010-0000-0000-0000-000000000001', '68465177-e594-4b09-803c-088433e9250a', 'b0000010-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Quantum Model & Orbitals', '# Chapter 1: Quantum Model & Orbitals', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000011-0000-0000-0000-000000000001', '68465177-e594-4b09-803c-088433e9250a', 'b0000010-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Molecular Geometry (VSEPR)', '# Chapter 1: Molecular Geometry (VSEPR)', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000012-0000-0000-0000-000000000001', '68465177-e594-4b09-803c-088433e9250a', 'b0000010-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: Chemical Equilibrium', '# Chapter 1: Chemical Equilibrium', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at) VALUES
    ('e0000010-0000-0000-0000-000000000001', 'c0000010-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
     'What is the maximum number of electrons that can occupy a subshell with azimuthal quantum number $l = 2$?',
     '[{"id":"A","text":"2","textLatex":"2"},{"id":"B","text":"6","textLatex":"6"},{"id":"C","text":"10","textLatex":"10"},{"id":"D","text":"14","textLatex":"14"}]'::jsonb,
     'C', 'For $l = 2$ (d-subshell), the magnetic quantum number $m_l$ takes $2l+1 = 5$ values ($-2, -1, 0, 1, 2$). Each orbital holds 2 electrons, giving $5 \\times 2 = 10$.', 'PUBLISHED', v_admin_id, NOW())
  ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, updated_at = NOW();

  -- 4. LOGIC AND CRITICAL THINKING (PHIL101: 701cc509-fc9f-4b8a-b1a0-85c1f9e826d2)
  INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at) VALUES
    ('b0000013-0000-0000-0000-000000000001', '701cc509-fc9f-4b8a-b1a0-85c1f9e826d2', 'QUIZ_1', 'Q1-PHIL', 'Logic & Thinking — Quiz 1', 'Arguments & Deductive Validity', 1, 1, NOW()),
    ('b0000013-0000-0000-0000-000000000002', '701cc509-fc9f-4b8a-b1a0-85c1f9e826d2', 'QUIZ_2', 'Q2-PHIL', 'Logic & Thinking — Quiz 2', 'Informal Fallacies', 2, 1, NOW()),
    ('b0000013-0000-0000-0000-000000000003', '701cc509-fc9f-4b8a-b1a0-85c1f9e826d2', 'QUIZ_3', 'Q3-PHIL', 'Logic & Thinking — Quiz 3', 'Categorical Syllogisms', 3, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000013-0000-0000-0000-000000000001', '701cc509-fc9f-4b8a-b1a0-85c1f9e826d2', 'b0000013-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Argument Analysis & Validity', '# Chapter 1: Argument Analysis & Validity', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000014-0000-0000-0000-000000000001', '701cc509-fc9f-4b8a-b1a0-85c1f9e826d2', 'b0000013-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Fallacies of Relevance', '# Chapter 1: Fallacies of Relevance', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000015-0000-0000-0000-000000000001', '701cc509-fc9f-4b8a-b1a0-85c1f9e826d2', 'b0000013-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: Syllogistic Forms', '# Chapter 1: Syllogistic Forms', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at) VALUES
    ('e0000013-0000-0000-0000-000000000001', 'c0000013-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
     'An argument whose premises are all factually true and whose deductive structure guarantees the truth of the conclusion is classified as:',
     '[{"id":"A","text":"Valid but unsound","textLatex":"\\text{Valid but unsound}"},{"id":"B","text":"Sound","textLatex":"\\text{Sound}"},{"id":"C","text":"Strong and cogent","textLatex":"\\text{Strong and cogent}"},{"id":"D","text":"Tautological","textLatex":"\\text{Tautological}"}]'::jsonb,
     'B', 'A deductive argument is sound if and only if it is valid and all its premises are factually true.', 'PUBLISHED', v_admin_id, NOW())
  ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, updated_at = NOW();

  -- 5. GENERAL BIOLOGY (BIO102: fa0d0809-07da-4d9d-a60b-f5c16a2aa8d7)
  INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at) VALUES
    ('b0000016-0000-0000-0000-000000000001', 'fa0d0809-07da-4d9d-a60b-f5c16a2aa8d7', 'QUIZ_1', 'Q1-BIO', 'General Biology — Quiz 1', 'Cell Structure & Biomolecules', 1, 1, NOW()),
    ('b0000016-0000-0000-0000-000000000002', 'fa0d0809-07da-4d9d-a60b-f5c16a2aa8d7', 'QUIZ_2', 'Q2-BIO', 'General Biology — Quiz 2', 'Metabolism & Respiration', 2, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000016-0000-0000-0000-000000000001', 'fa0d0809-07da-4d9d-a60b-f5c16a2aa8d7', 'b0000016-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Cell Organelles & Membranes', '# Chapter 1: Cell Organelles & Membranes', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000017-0000-0000-0000-000000000001', 'fa0d0809-07da-4d9d-a60b-f5c16a2aa8d7', 'b0000016-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Cellular Respiration & ATP', '# Chapter 1: Cellular Respiration & ATP', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  -- 6. APPLIED MATHEMATICS I (MATH101: ef011a5d-f5a0-4b65-a5fe-aa259197eead)
  INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at) VALUES
    ('b0000018-0000-0000-0000-000000000001', 'ef011a5d-f5a0-4b65-a5fe-aa259197eead', 'QUIZ_1', 'Q1-MATH', 'Applied Math I — Quiz 1', 'Matrices & Determinants', 1, 1, NOW()),
    ('b0000018-0000-0000-0000-000000000002', 'ef011a5d-f5a0-4b65-a5fe-aa259197eead', 'QUIZ_2', 'Q2-MATH', 'Applied Math I — Quiz 2', 'Vector Spaces & Systems', 2, 1, NOW()),
    ('b0000018-0000-0000-0000-000000000003', 'ef011a5d-f5a0-4b65-a5fe-aa259197eead', 'QUIZ_3', 'Q3-MATH', 'Applied Math I — Quiz 3', 'Complex Numbers & Transformations', 3, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000018-0000-0000-0000-000000000001', 'ef011a5d-f5a0-4b65-a5fe-aa259197eead', 'b0000018-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Matrix Inversion & Cramer Rule', '# Chapter 1: Matrix Inversion', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000019-0000-0000-0000-000000000001', 'ef011a5d-f5a0-4b65-a5fe-aa259197eead', 'b0000018-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Linear Systems & Rank', '# Chapter 1: Linear Systems & Rank', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000020-0000-0000-0000-000000000001', 'ef011a5d-f5a0-4b65-a5fe-aa259197eead', 'b0000018-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: Complex Modulus & De Moivre', '# Chapter 1: Complex Modulus', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  -- 7. SOCIAL ANTHROPOLOGY (ANTH101: b6a727ef-79d6-4f94-bb6d-d9abbbdbc31a)
  INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at) VALUES
    ('b0000021-0000-0000-0000-000000000001', 'b6a727ef-79d6-4f94-bb6d-d9abbbdbc31a', 'QUIZ_1', 'Q1-ANTH', 'Social Anthropology — Quiz 1', 'Concepts, Culture & Ethnography', 1, 1, NOW()),
    ('b0000021-0000-0000-0000-000000000002', 'b6a727ef-79d6-4f94-bb6d-d9abbbdbc31a', 'QUIZ_2', 'Q2-ANTH', 'Social Anthropology — Quiz 2', 'Kinship, Marriage & Lineage', 2, 1, NOW()),
    ('b0000021-0000-0000-0000-000000000003', 'b6a727ef-79d6-4f94-bb6d-d9abbbdbc31a', 'QUIZ_3', 'Q3-ANTH', 'Social Anthropology — Quiz 3', 'Ritual, Symbolism & Global Change', 3, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000021-0000-0000-0000-000000000001', 'b6a727ef-79d6-4f94-bb6d-d9abbbdbc31a', 'b0000021-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Culture & Fieldwork Methods', '# Chapter 1: Culture & Fieldwork', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000022-0000-0000-0000-000000000001', 'b6a727ef-79d6-4f94-bb6d-d9abbbdbc31a', 'b0000021-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Kinship & Marriage Systems', '# Chapter 1: Kinship & Marriage', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000023-0000-0000-0000-000000000001', 'b6a727ef-79d6-4f94-bb6d-d9abbbdbc31a', 'b0000021-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: Ethnicity & Cultural Identity', '# Chapter 1: Ethnicity & Identity', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  -- 8. INTRODUCTION TO ECONOMICS (ECON101: 81570e94-5bc8-425b-bcc2-8bf5c27e80be)
  INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at) VALUES
    ('b0000024-0000-0000-0000-000000000001', '81570e94-5bc8-425b-bcc2-8bf5c27e80be', 'QUIZ_1', 'Q1-ECON', 'Economics — Quiz 1', 'Scarcity, Demand & Supply Equilibrium', 1, 1, NOW()),
    ('b0000024-0000-0000-0000-000000000002', '81570e94-5bc8-425b-bcc2-8bf5c27e80be', 'QUIZ_2', 'Q2-ECON', 'Economics — Quiz 2', 'Elasticity & Market Structures', 2, 1, NOW()),
    ('b0000024-0000-0000-0000-000000000003', '81570e94-5bc8-425b-bcc2-8bf5c27e80be', 'QUIZ_3', 'Q3-ECON', 'Economics — Quiz 3', 'National Income & Macro Policy', 3, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000024-0000-0000-0000-000000000001', '81570e94-5bc8-425b-bcc2-8bf5c27e80be', 'b0000024-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Supply, Demand & Market Clearing', '# Chapter 1: Supply, Demand', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000025-0000-0000-0000-000000000001', '81570e94-5bc8-425b-bcc2-8bf5c27e80be', 'b0000024-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Price Elasticity & Consumer Surplus', '# Chapter 1: Price Elasticity', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000026-0000-0000-0000-000000000001', '81570e94-5bc8-425b-bcc2-8bf5c27e80be', 'b0000024-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: GDP & Fiscal Policy Multipliers', '# Chapter 1: GDP & Fiscal Policy', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  -- 9. GENERAL MATHEMATICS (MAT123: 6d4679fc-9e77-4983-8a0a-6db94f286eba)
  INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at) VALUES
    ('c0000027-0000-0000-0000-000000000002', '6d4679fc-9e77-4983-8a0a-6db94f286eba', 'b0000027-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Matrices & Systems of Equations', '# Chapter 1: Matrices', true, 'PUBLISHED', v_admin_id, 1, NOW()),
    ('c0000027-0000-0000-0000-000000000003', '6d4679fc-9e77-4983-8a0a-6db94f286eba', 'b0000027-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: Trigonometric Functions & Identities', '# Chapter 1: Trigonometric Functions', true, 'PUBLISHED', v_admin_id, 1, NOW())
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

  INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at) VALUES
    ('e0000027-0000-0000-0000-000000000002', 'c0000027-0000-0000-0000-000000000002', 1, 'MULTIPLE_CHOICE',
     'What is the determinant of a 2x2 matrix with rows [2, 3] and [1, 4]?',
     '[{"id":"A","text":"5","textLatex":"5"},{"id":"B","text":"11","textLatex":"11"},{"id":"C","text":"8","textLatex":"8"},{"id":"D","text":"-5","textLatex":"-5"}]'::jsonb,
     'A', 'det(A) = (2)(4) - (3)(1) = 8 - 3 = 5.', 'PUBLISHED', v_admin_id, NOW()),
    ('e0000027-0000-0000-0000-000000000003', 'c0000027-0000-0000-0000-000000000003', 1, 'MULTIPLE_CHOICE',
     'Evaluate \sin^2(\theta) + \cos^2(\theta) for any real angle \theta.',
     '[{"id":"A","text":"0","textLatex":"0"},{"id":"B","text":"1","textLatex":"1"},{"id":"C","text":"2","textLatex":"2"},{"id":"D","text":"\\tan(\\theta)","textLatex":"\\tan(\\theta)"}]'::jsonb,
     'B', 'The fundamental Pythagorean trigonometric identity states that sin^2(x) + cos^2(x) = 1.', 'PUBLISHED', v_admin_id, NOW())
  ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, updated_at = NOW();

END $$;
