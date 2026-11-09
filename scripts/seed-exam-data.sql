-- Seeding Real Ethiopian University Exam Sets for English Course (a2661b0d-9021-4730-a457-94287163f682)
-- Matching Mid, Final and Mock exam flows@1x.png exactly with valid hexadecimal UUIDs

-- 1. Mid Exams
INSERT INTO exam_set (id, exam_set_code, category, university_id, course_id, year, title, time_allowed_minutes, is_free_sample, status, authored_by, version, updated_at)
VALUES
  ('e5000001-0000-0000-0000-000000000001', 'ENG-MID-AASTU-2024', 'MID', '856a9acc-aaa3-4f29-ac7a-cc5ece2a299c', 'a2661b0d-9021-4730-a457-94287163f682', '2024', 'AASTU · Mid', 40, true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('e5000001-0000-0000-0000-000000000002', 'ENG-MID-BDU-2024', 'MID', '982316db-5604-4618-a924-656d6928d39c', 'a2661b0d-9021-4730-a457-94287163f682', '2024', 'BDU · Mid', 40, false, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('e5000001-0000-0000-0000-000000000003', 'ENG-MID-AAU-2024', 'MID', '341fb0a6-3681-4da5-88d2-e6a47e55be94', 'a2661b0d-9021-4730-a457-94287163f682', '2024', 'AAU · Mid', 50, false, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, year = EXCLUDED.year, time_allowed_minutes = EXCLUDED.time_allowed_minutes, is_free_sample = EXCLUDED.is_free_sample, status = 'PUBLISHED', updated_at = NOW();

-- 2. Final Exams
INSERT INTO exam_set (id, exam_set_code, category, university_id, course_id, year, title, time_allowed_minutes, is_free_sample, status, authored_by, version, updated_at)
VALUES
  ('e5000002-0000-0000-0000-000000000001', 'ENG-FINAL-AASTU-2023', 'FINAL', '856a9acc-aaa3-4f29-ac7a-cc5ece2a299c', 'a2661b0d-9021-4730-a457-94287163f682', '2023', 'AASTU · Final', 40, true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('e5000002-0000-0000-0000-000000000002', 'ENG-FINAL-BDU-2023', 'FINAL', '982316db-5604-4618-a924-656d6928d39c', 'a2661b0d-9021-4730-a457-94287163f682', '2023', 'BDU · Final', 40, false, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('e5000002-0000-0000-0000-000000000003', 'ENG-FINAL-AAU-2023', 'FINAL', '341fb0a6-3681-4da5-88d2-e6a47e55be94', 'a2661b0d-9021-4730-a457-94287163f682', '2023', 'AAU · Final', 50, false, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, year = EXCLUDED.year, time_allowed_minutes = EXCLUDED.time_allowed_minutes, is_free_sample = EXCLUDED.is_free_sample, status = 'PUBLISHED', updated_at = NOW();

-- 3. Mock Exams
INSERT INTO exam_set (id, exam_set_code, category, university_id, course_id, year, title, time_allowed_minutes, is_free_sample, status, authored_by, version, updated_at)
VALUES
  ('e5000003-0000-0000-0000-000000000001', 'ENG-MOCK-1-2026', 'MOCK', NULL, 'a2661b0d-9021-4730-a457-94287163f682', '2026', 'Mock Exam 1', 40, true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('e5000003-0000-0000-0000-000000000002', 'ENG-MOCK-2-2026', 'MOCK', NULL, 'a2661b0d-9021-4730-a457-94287163f682', '2026', 'Mock Exam 2', 40, false, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('e5000003-0000-0000-0000-000000000003', 'ENG-MOCK-3-2026', 'MOCK', NULL, 'a2661b0d-9021-4730-a457-94287163f682', '2026', 'Mock Exam 3', 50, false, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, year = EXCLUDED.year, time_allowed_minutes = EXCLUDED.time_allowed_minutes, is_free_sample = EXCLUDED.is_free_sample, status = 'PUBLISHED', updated_at = NOW();

-- Real Questions for Mid Exam 1 (AASTU · Mid)
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000001-0000-0000-0000-000000000001', 'e5000001-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
   'Which word is a noun?',
   '[{"id":"A","text":"quickly","textLatex":"quickly"},{"id":"B","text":"happiness","textLatex":"happiness"},{"id":"C","text":"run","textLatex":"run"}]'::jsonb,
   'B',
   'Happiness is an abstract noun denoting an emotional state or condition. Quickly is an adverb and run is primarily a verb.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000001-0000-0000-0000-000000000002', 'e5000001-0000-0000-0000-000000000001', 2, 'MULTIPLE_CHOICE',
   'Identify the grammatically correct sentence displaying proper subject-verb agreement with collective nouns.',
   '[{"id":"A","text":"The committee have made their final decision yesterday.","textLatex":"The committee have made their final decision yesterday."},{"id":"B","text":"The committee has reached consensus on the new academic calendar.","textLatex":"The committee has reached consensus on the new academic calendar."},{"id":"C","text":"The committee are unanimous in its vote.","textLatex":"The committee are unanimous in its vote."},{"id":"D","text":"The committee do not agree among each other.","textLatex":"The committee do not agree among each other."}]'::jsonb,
   'B',
   'When a collective noun acts as a unified singular entity, it requires a singular verb: "The committee has reached consensus".',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000001-0000-0000-0000-000000000003', 'e5000001-0000-0000-0000-000000000001', 3, 'MULTIPLE_CHOICE',
   'What rhetorical pattern is most appropriate for discussing similarities and differences between qualitative and quantitative research methods?',
   '[{"id":"A","text":"Chronological order","textLatex":"Chronological order"},{"id":"B","text":"Cause and effect pattern","textLatex":"Cause and effect pattern"},{"id":"C","text":"Comparison and contrast pattern","textLatex":"Comparison and contrast pattern"},{"id":"D","text":"Spatial order","textLatex":"Spatial order"}]'::jsonb,
   'C',
   'Comparison and contrast evaluates dual subjects by organizing their parallel features, strengths, and distinctions systematically.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Real Questions for Mid Exam 2 (BDU · Mid)
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000001-0000-0000-0000-000000000004', 'e5000001-0000-0000-0000-000000000002', 1, 'MULTIPLE_CHOICE',
   'Which sentence contains an example of a dangling modifier?',
   '[{"id":"A","text":"Walking through the university quad, the library tower came into view.","textLatex":"Walking through the university quad, the library tower came into view."},{"id":"B","text":"While walking through the quad, Abebe saw the library tower.","textLatex":"While walking through the quad, Abebe saw the library tower."},{"id":"C","text":"The students walked across the lawn to reach the auditorium.","textLatex":"The students walked across the lawn to reach the auditorium."},{"id":"D","text":"The campus was quiet before morning lectures began.","textLatex":"The campus was quiet before morning lectures began."}]'::jsonb,
   'A',
   'In sentence A, the introductory participial phrase "Walking through the university quad" illogically modifies "the library tower" instead of a person walking.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000001-0000-0000-0000-000000000005', 'e5000001-0000-0000-0000-000000000002', 2, 'MULTIPLE_CHOICE',
   'Choose the correct transition word to signal a concession in academic discourse: "The initial hypothesis was plausible; ____, experimental outcomes disproved the premise."',
   '[{"id":"A","text":"furthermore","textLatex":"furthermore"},{"id":"B","text":"nevertheless","textLatex":"nevertheless"},{"id":"C","text":"consequently","textLatex":"consequently"},{"id":"D","text":"similarly","textLatex":"similarly"}]'::jsonb,
   'B',
   '"Nevertheless" signals a contrastive concession between the plausibility of the initial hypothesis and the contradicting empirical outcome.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Real Questions for Mid Exam 3 (AAU · Mid)
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000001-0000-0000-0000-000000000006', 'e5000001-0000-0000-0000-000000000003', 1, 'MULTIPLE_CHOICE',
   'In academic essay writing, where is the thesis statement most conventionally positioned?',
   '[{"id":"A","text":"At the very beginning of the introductory paragraph","textLatex":"At the very beginning of the introductory paragraph"},{"id":"B","text":"At the end of the introductory paragraph","textLatex":"At the end of the introductory paragraph"},{"id":"C","text":"In the middle of the second body paragraph","textLatex":"In the middle of the second body paragraph"},{"id":"D","text":"Only in the final sentence of the conclusion","textLatex":"Only in the final sentence of the conclusion"}]'::jsonb,
   'B',
   'In standard academic essays, the introductory paragraph moves from general context to a specific thesis placed as the final sentence.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000001-0000-0000-0000-000000000007', 'e5000001-0000-0000-0000-000000000003', 2, 'MULTIPLE_CHOICE',
   'Select the option that exhibits correct parallel grammatical structure.',
   '[{"id":"A","text":"She likes reading peer-reviewed journals, analyzing raw datasets, and to write concise summaries.","textLatex":"She likes reading peer-reviewed journals, analyzing raw datasets, and to write concise summaries."},{"id":"B","text":"She likes reading peer-reviewed journals, analyzing raw datasets, and writing concise summaries.","textLatex":"She likes reading peer-reviewed journals, analyzing raw datasets, and writing concise summaries."},{"id":"C","text":"She likes to read journals, analyzing datasets, and writes summaries.","textLatex":"She likes to read journals, analyzing datasets, and writes summaries."},{"id":"D","text":"She likes read journals, analyze datasets, and summary writing.","textLatex":"She likes read journals, analyze datasets, and summary writing."}]'::jsonb,
   'B',
   'Parallelism requires matching grammatical forms: reading, analyzing, and writing are all parallel gerund phrases.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Real Questions for Final Exam 1 (AASTU · Final)
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000002-0000-0000-0000-000000000001', 'e5000002-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
   'Which word is a noun?',
   '[{"id":"A","text":"quickly","textLatex":"quickly"},{"id":"B","text":"happiness","textLatex":"happiness"},{"id":"C","text":"run","textLatex":"run"}]'::jsonb,
   'B',
   'Happiness is an abstract noun, whereas quickly is an adverb and run is an action verb.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000002-0000-0000-0000-000000000002', 'e5000002-0000-0000-0000-000000000001', 2, 'MULTIPLE_CHOICE',
   'Identify the primary communicative purpose of an argumentative essay.',
   '[{"id":"A","text":"To narrate a chronological sequence of personal experiences","textLatex":"To narrate a chronological sequence of personal experiences"},{"id":"B","text":"To persuade the reader of a claim using reason and verifiable evidence","textLatex":"To persuade the reader of a claim using reason and verifiable evidence"},{"id":"C","text":"To describe sensory imagery in a fictional setting","textLatex":"To describe sensory imagery in a fictional setting"},{"id":"D","text":"To provide poetic entertainment through rhyme and meter","textLatex":"To provide poetic entertainment through rhyme and meter"}]'::jsonb,
   'B',
   'Argumentative writing aims to defend a clear stance through logical deduction, evidence, and critical engagement with counterarguments.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Real Questions for Mock Exam 1 (Mock Exam 1)
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000003-0000-0000-0000-000000000001', 'e5000003-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
   'Which word is a noun?',
   '[{"id":"A","text":"quickly","textLatex":"quickly"},{"id":"B","text":"happiness","textLatex":"happiness"},{"id":"C","text":"run","textLatex":"run"}]'::jsonb,
   'B',
   'Happiness is an abstract noun, quickly is an adverb, and run is an action verb.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000003-0000-0000-0000-000000000002', 'e5000003-0000-0000-0000-000000000001', 2, 'MULTIPLE_CHOICE',
   'In academic writing, what distinguishes quoting from paraphrasing?',
   '[{"id":"A","text":"Quoting rephrases ideas in one''s own words, while paraphrasing reproduces exact text.","textLatex":"Quoting rephrases ideas in one''s own words, while paraphrasing reproduces exact text."},{"id":"B","text":"Quoting reproduces source text word-for-word in quotation marks, while paraphrasing expresses source ideas in new phrasing with citation.","textLatex":"Quoting reproduces source text word-for-word in quotation marks, while paraphrasing expresses source ideas in new phrasing with citation."},{"id":"C","text":"Paraphrasing requires citation, but direct quoting does not.","textLatex":"Paraphrasing requires citation, but direct quoting does not."},{"id":"D","text":"Quoting is only permissible in literary humanities subjects.","textLatex":"Quoting is only permissible in literary humanities subjects."}]'::jsonb,
   'B',
   'Quoting keeps identical phrasing enclosed in quotation marks, whereas paraphrasing translates authorial meaning into student vocabulary while giving full credit.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Real Questions for Final Exam 2 (BDU · Final)
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000002-0000-0000-0000-000000000003', 'e5000002-0000-0000-0000-000000000002', 1, 'MULTIPLE_CHOICE',
   'Which word is a noun?',
   '[{"id":"A","text":"quickly","textLatex":"quickly"},{"id":"B","text":"happiness","textLatex":"happiness"},{"id":"C","text":"run","textLatex":"run"}]'::jsonb,
   'B',
   'Happiness is an abstract noun denoting emotional well-being.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000002-0000-0000-0000-000000000004', 'e5000002-0000-0000-0000-000000000002', 2, 'MULTIPLE_CHOICE',
   'Identify the sentence featuring an accurate conditional structure expressing hypothetical situations.',
   '[{"id":"A","text":"If she studied harder, she will pass the entrance exam.","textLatex":"If she studied harder, she will pass the entrance exam."},{"id":"B","text":"If she had studied harder, she would have passed the entrance exam.","textLatex":"If she had studied harder, she would have passed the entrance exam."},{"id":"C","text":"If she studies harder, she would have passed the exam.","textLatex":"If she studies harder, she would have passed the exam."},{"id":"D","text":"If she study harder, she passed the exam.","textLatex":"If she study harder, she passed the exam."}]'::jsonb,
   'B',
   'The third conditional uses the past perfect in the if-clause and would have + past participle in the main clause to reflect an unreal past situation.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Real Questions for Final Exam 3 (AAU · Final)
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000002-0000-0000-0000-000000000005', 'e5000002-0000-0000-0000-000000000003', 1, 'MULTIPLE_CHOICE',
   'Which word is a noun?',
   '[{"id":"A","text":"quickly","textLatex":"quickly"},{"id":"B","text":"happiness","textLatex":"happiness"},{"id":"C","text":"run","textLatex":"run"}]'::jsonb,
   'B',
   'Happiness is an abstract noun, quickly is an adverb, and run is a verb.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000002-0000-0000-0000-000000000006', 'e5000002-0000-0000-0000-000000000003', 2, 'MULTIPLE_CHOICE',
   'What is the function of a topic sentence in an academic paragraph?',
   '[{"id":"A","text":"To state the central controlling idea of the paragraph","textLatex":"To state the central controlling idea of the paragraph"},{"id":"B","text":"To list references cited in the bibliography","textLatex":"To list references cited in the bibliography"},{"id":"C","text":"To provide concluding numerical statistics","textLatex":"To provide concluding numerical statistics"},{"id":"D","text":"To present counterarguments exclusively","textLatex":"To present counterarguments exclusively"}]'::jsonb,
   'A',
   'The topic sentence asserts the primary argument or focal point that all supporting sentences in the paragraph develop.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Real Questions for Mock Exam 2
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000003-0000-0000-0000-000000000003', 'e5000003-0000-0000-0000-000000000002', 1, 'MULTIPLE_CHOICE',
   'Which word is a noun?',
   '[{"id":"A","text":"quickly","textLatex":"quickly"},{"id":"B","text":"happiness","textLatex":"happiness"},{"id":"C","text":"run","textLatex":"run"}]'::jsonb,
   'B',
   'Happiness is an abstract noun, quickly is an adverb, and run is a verb.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000003-0000-0000-0000-000000000004', 'e5000003-0000-0000-0000-000000000002', 2, 'MULTIPLE_CHOICE',
   'Which punctuation mark is properly utilized to join two independent clauses without a coordinating conjunction?',
   '[{"id":"A","text":"Comma","textLatex":"Comma"},{"id":"B","text":"Semicolon","textLatex":"Semicolon"},{"id":"C","text":"Hyphen","textLatex":"Hyphen"},{"id":"D","text":"Apostrophe","textLatex":"Apostrophe"}]'::jsonb,
   'B',
   'A semicolon links two closely connected independent clauses without requiring a coordinating conjunction such as and or but.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Real Questions for Mock Exam 3
INSERT INTO question (id, exam_set_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('ef000003-0000-0000-0000-000000000005', 'e5000003-0000-0000-0000-000000000003', 1, 'MULTIPLE_CHOICE',
   'Which word is a noun?',
   '[{"id":"A","text":"quickly","textLatex":"quickly"},{"id":"B","text":"happiness","textLatex":"happiness"},{"id":"C","text":"run","textLatex":"run"}]'::jsonb,
   'B',
   'Happiness is an abstract noun, quickly is an adverb, and run is a verb.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('ef000003-0000-0000-0000-000000000006', 'e5000003-0000-0000-0000-000000000003', 2, 'MULTIPLE_CHOICE',
   'Identify the sentence demonstrating active voice.',
   '[{"id":"A","text":"The experimental protocol was conducted by senior researchers.","textLatex":"The experimental protocol was conducted by senior researchers."},{"id":"B","text":"Senior researchers conducted the experimental protocol.","textLatex":"Senior researchers conducted the experimental protocol."},{"id":"C","text":"The data was gathered over a three-month duration.","textLatex":"The data was gathered over a three-month duration."},{"id":"D","text":"Results were analyzed systematically.","textLatex":"Results were analyzed systematically."}]'::jsonb,
   'B',
   'In sentence B, the grammatical subject ("Senior researchers") directly performs the action ("conducted") upon the direct object ("the experimental protocol").',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();
