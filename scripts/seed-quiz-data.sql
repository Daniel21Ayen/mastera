-- Seeding Quiz Book Groups for ENG101
INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version, updated_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a2661b0d-9021-4730-a457-94287163f682', 'QUIZ_1', 'Q1', 'Communicative English — Quiz 1', 'Quiz Series for Freshman Students', 1, 1, NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'a2661b0d-9021-4730-a457-94287163f682', 'QUIZ_2', 'Q2', 'Communicative English — Quiz 2', 'Quiz Series for Freshman Students', 2, 1, NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'a2661b0d-9021-4730-a457-94287163f682', 'QUIZ_3', 'Q3', 'Communicative English — Quiz 3', 'Quiz Series for Freshman Students', 3, 1, NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, updated_at = NOW();

-- Seeding Quiz Chapters for Quiz 1
INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000001', 'QUIZ_1', 1, 'Chapter 1: Fundamentals', '# Chapter 1: Fundamentals', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000001-0000-0000-0000-000000000002', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000001', 'QUIZ_1', 2, 'Chapter 2: Core Methods', '# Chapter 2: Core Methods', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000001-0000-0000-0000-000000000003', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000001', 'QUIZ_1', 3, 'Chapter 3: Applications', '# Chapter 3: Applications', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000001-0000-0000-0000-000000000004', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000001', 'QUIZ_1', 4, 'Chapter 4: Synthesis & Review', '# Chapter 4: Synthesis & Review', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, book_group_id = EXCLUDED.book_group_id, category = EXCLUDED.category, status = 'PUBLISHED', updated_at = NOW();

-- Seeding Quiz Chapters for Quiz 2
INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at)
VALUES
  ('c0000002-0000-0000-0000-000000000001', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000002', 'QUIZ_2', 1, 'Chapter 1: Fundamentals', '# Chapter 1: Fundamentals', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000002-0000-0000-0000-000000000002', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000002', 'QUIZ_2', 2, 'Chapter 2: Core Methods', '# Chapter 2: Core Methods', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000002-0000-0000-0000-000000000003', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000002', 'QUIZ_2', 3, 'Chapter 3: Applications', '# Chapter 3: Applications', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000002-0000-0000-0000-000000000004', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000002', 'QUIZ_2', 4, 'Chapter 4: Synthesis & Review', '# Chapter 4: Synthesis & Review', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, book_group_id = EXCLUDED.book_group_id, category = EXCLUDED.category, status = 'PUBLISHED', updated_at = NOW();

-- Seeding Quiz Chapters for Quiz 3
INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version, updated_at)
VALUES
  ('c0000003-0000-0000-0000-000000000001', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000003', 'QUIZ_3', 1, 'Chapter 1: Fundamentals', '# Chapter 1: Fundamentals', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000003-0000-0000-0000-000000000002', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000003', 'QUIZ_3', 2, 'Chapter 2: Core Methods', '# Chapter 2: Core Methods', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000003-0000-0000-0000-000000000003', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000003', 'QUIZ_3', 3, 'Chapter 3: Applications', '# Chapter 3: Applications', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW()),
  ('c0000003-0000-0000-0000-000000000004', 'a2661b0d-9021-4730-a457-94287163f682', 'b0000000-0000-0000-0000-000000000003', 'QUIZ_3', 4, 'Chapter 4: Synthesis & Review', '# Chapter 4: Synthesis & Review', true, 'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', 1, NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, book_group_id = EXCLUDED.book_group_id, category = EXCLUDED.category, status = 'PUBLISHED', updated_at = NOW();

-- Questions for Quiz 1 · Chapter 1: Fundamentals
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
   'Which word functions as an abstract noun in academic English?',
   '[{"id":"A","text":"quickly","textLatex":"quickly"},{"id":"B","text":"happiness","textLatex":"happiness"},{"id":"C","text":"run","textLatex":"run"},{"id":"D","text":"blue","textLatex":"blue"}]'::jsonb,
   'B',
   'An abstract noun denotes an idea, emotion, state of being, or quality such as happiness.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('e0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 2, 'MULTIPLE_CHOICE',
   'Identify the complete subject in the sentence: "The newly established campus library opens at 8:00 AM daily."',
   '[{"id":"A","text":"library","textLatex":"library"},{"id":"B","text":"The newly established campus library","textLatex":"The newly established campus library"},{"id":"C","text":"opens at 8:00 AM","textLatex":"opens at 8:00 AM"},{"id":"D","text":"daily","textLatex":"daily"}]'::jsonb,
   'B',
   'The complete subject consists of the noun phrase including all determiners and modifiers: "The newly established campus library".',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('e0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 3, 'MULTIPLE_CHOICE',
   'Which sentence adheres strictly to grammatical subject-verb agreement?',
   '[{"id":"A","text":"The list of freshman courses are updated on the university portal.","textLatex":"The list of freshman courses are updated on the university portal."},{"id":"B","text":"The list of freshman courses is updated on the university portal.","textLatex":"The list of freshman courses is updated on the university portal."},{"id":"C","text":"Neither of the course representatives have arrived yet.","textLatex":"Neither of the course representatives have arrived yet."},{"id":"D","text":"The team of researchers were divided in their verdict.","textLatex":"The team of researchers were divided in their verdict."}]'::jsonb,
   'B',
   'The subject head noun "list" is singular, so it requires the singular auxiliary verb "is".',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 1 · Chapter 2: Core Methods
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000002-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002', 1, 'MULTIPLE_CHOICE',
   'In academic reading, which reading strategy is most effective for locating a specific statistic or date?',
   '[{"id":"A","text":"Skimming","textLatex":"Skimming"},{"id":"B","text":"Scanning","textLatex":"Scanning"},{"id":"C","text":"Intensive reading","textLatex":"Intensive reading"},{"id":"D","text":"Extensive reading","textLatex":"Extensive reading"}]'::jsonb,
   'B',
   'Scanning involves rapid search across lines to spot isolated target keywords, dates, or numbers.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('e0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', 2, 'MULTIPLE_CHOICE',
   'What is the primary rhetorical purpose of a topic sentence in an academic paragraph?',
   '[{"id":"A","text":"To provide statistical citations and empirical data","textLatex":"To provide statistical citations and empirical data"},{"id":"B","text":"To introduce the controlling idea and scope of the paragraph","textLatex":"To introduce the controlling idea and scope of the paragraph"},{"id":"C","text":"To restate the essay conclusion","textLatex":"To restate the essay conclusion"},{"id":"D","text":"To provide a bibliography entry","textLatex":"To provide a bibliography entry"}]'::jsonb,
   'B',
   'The topic sentence introduces the paragraph controlling idea, guiding coherence for all supporting sentences.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 1 · Chapter 3: Applications
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000003-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003', 1, 'MULTIPLE_CHOICE',
   'Which in-text citation correctly conforms to APA 7th edition conventions for an authoritative single author?',
   '[{"id":"A","text":"According to Kebede (2023), academic writing requires precision.","textLatex":"According to Kebede (2023), academic writing requires precision."},{"id":"B","text":"According to (Kebede, 2023), academic writing requires precision.","textLatex":"According to (Kebede, 2023), academic writing requires precision."},{"id":"C","text":"According to Kebede [2023], academic writing requires precision.","textLatex":"According to Kebede [2023], academic writing requires precision."},{"id":"D","text":"According to Dr. Kebede (2023), academic writing requires precision.","textLatex":"According to Dr. Kebede (2023), academic writing requires precision."}]'::jsonb,
   'A',
   'In APA 7th edition narrative citations, the author surname is followed immediately by the publication year in parentheses.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW()),

  ('e0000003-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000003', 2, 'MULTIPLE_CHOICE',
   'Which transitional cohesive device best conveys an adversative contrast between two independent claims?',
   '[{"id":"A","text":"Furthermore","textLatex":"Furthermore"},{"id":"B","text":"However","textLatex":"However"},{"id":"C","text":"Consequently","textLatex":"Consequently"},{"id":"D","text":"Similarly","textLatex":"Similarly"}]'::jsonb,
   'B',
   '"However" is an adversative transition signaling contrast or qualification.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 2 · Chapter 1: Fundamentals
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000004-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
   'Which sentence correctly avoids a comma splice between two independent clauses?',
   '[{"id":"A","text":"The campus library was closed, we went to the laboratory to complete the assignment.","textLatex":"The campus library was closed, we went to the laboratory to complete the assignment."},{"id":"B","text":"The campus library was closed; therefore, we went to the laboratory to complete the assignment.","textLatex":"The campus library was closed; therefore, we went to the laboratory to complete the assignment."},{"id":"C","text":"The campus library was closed, therefore we went to the laboratory.","textLatex":"The campus library was closed, therefore we went to the laboratory."},{"id":"D","text":"The campus library was closed we went to the laboratory.","textLatex":"The campus library was closed we went to the laboratory."}]'::jsonb,
   'B',
   'A comma splice occurs when independent clauses are joined with just a comma. A semicolon and conjunctive adverb correctly resolves it.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 2 · Chapter 2: Core Methods
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000005-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002', 1, 'MULTIPLE_CHOICE',
   'In classical rhetoric and academic argument, which appeal relies on verifiable empirical facts, statistics, and deductive logic?',
   '[{"id":"A","text":"Pathos","textLatex":"Pathos"},{"id":"B","text":"Logos","textLatex":"Logos"},{"id":"C","text":"Ethos","textLatex":"Ethos"},{"id":"D","text":"Kairos","textLatex":"Kairos"}]'::jsonb,
   'B',
   'Logos represents the appeal to reason, logic, and factual evidence.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 2 · Chapter 3: Applications
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000006-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000003', 1, 'MULTIPLE_CHOICE',
   'When summarizing an academic source for a research proposal, what is mandatory to uphold academic integrity?',
   '[{"id":"A","text":"Substituting synonyms with a thesaurus without reading the thesis","textLatex":"Substituting synonyms with a thesaurus without reading the thesis"},{"id":"B","text":"Restating the essence in your own syntax and attributing the source with a citation","textLatex":"Restating the essence in your own syntax and attributing the source with a citation"},{"id":"C","text":"Omitting citation if the summary is shorter than three lines","textLatex":"Omitting citation if the summary is shorter than three lines"},{"id":"D","text":"Enclosing paraphrased sentences in italics without year","textLatex":"Enclosing paraphrased sentences in italics without year"}]'::jsonb,
   'B',
   'Paraphrasing requires expressing the author concepts in your own original phrasing while providing full bibliographic attribution.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 3 · Chapter 1: Fundamentals
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000007-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000001', 1, 'MULTIPLE_CHOICE',
   'Which sentence contains a grammatical dangling modifier?',
   '[{"id":"A","text":"Walking across the quadrangle, the heavy thunderstorm began suddenly.","textLatex":"Walking across the quadrangle, the heavy thunderstorm began suddenly."},{"id":"B","text":"Walking across the quadrangle, the students noticed the thunderstorm beginning suddenly.","textLatex":"Walking across the quadrangle, the students noticed the thunderstorm beginning suddenly."},{"id":"C","text":"As the students walked across the quadrangle, rain began to fall.","textLatex":"As the students walked across the quadrangle, rain began to fall."},{"id":"D","text":"The students hurried indoors when rain began falling.","textLatex":"The students hurried indoors when rain began falling."}]'::jsonb,
   'A',
   'In option A, the introductory modifier "Walking across the quadrangle" mistakenly attaches to "the heavy thunderstorm".',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 3 · Chapter 2: Core Methods
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000008-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000002', 1, 'MULTIPLE_CHOICE',
   'What distinguishes an academic argumentative thesis statement from an informative summary statement?',
   '[{"id":"A","text":"An argumentative thesis makes a debatable claim supported with reason and evidence.","textLatex":"An argumentative thesis makes a debatable claim supported with reason and evidence."},{"id":"B","text":"An argumentative thesis lists facts chronologically without interpretation.","textLatex":"An argumentative thesis lists facts chronologically without interpretation."},{"id":"C","text":"An argumentative thesis consists of a single rhetorical question.","textLatex":"An argumentative thesis consists of a single rhetorical question."},{"id":"D","text":"An argumentative thesis describes general background information.","textLatex":"An argumentative thesis describes general background information."}]'::jsonb,
   'A',
   'An argumentative thesis advances a stance that a reasonable person could contest and which requires evidentiary substantiation.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 3 · Chapter 3: Applications
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000009-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000003', 1, 'MULTIPLE_CHOICE',
   'In formal correspondence within higher education institutions, which salutation is most appropriate when contacting an admissions committee whose individual names are undisclosed?',
   '[{"id":"A","text":"Hi folks,","textLatex":"Hi folks,"},{"id":"B","text":"Dear Admissions Committee / Department Head,","textLatex":"Dear Admissions Committee / Department Head,"},{"id":"C","text":"To Whom It May Concern,","textLatex":"To Whom It May Concern,"},{"id":"D","text":"Both B and C represent recognized professional academic conventions.","textLatex":"Both B and C represent recognized professional academic conventions."}]'::jsonb,
   'D',
   'Addressing the committee title ("Dear Admissions Committee") or using the formal default ("To Whom It May Concern") are both recognized professional conventions.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 1 · Chapter 4: Synthesis & Review
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000010-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004', 1, 'MULTIPLE_CHOICE',
   'Which element is essential when synthesizing multiple scholarly sources in a literature review?',
   '[{"id":"A","text":"Comparing and contrasting key arguments rather than summarizing each paper in isolation","textLatex":"Comparing and contrasting key arguments rather than summarizing each paper in isolation"},{"id":"B","text":"Quoting every sentence verbatim without commentary","textLatex":"Quoting every sentence verbatim without commentary"},{"id":"C","text":"Arranging paragraphs solely by publication date without thematic grouping","textLatex":"Arranging paragraphs solely by publication date without thematic grouping"},{"id":"D","text":"Omitting contradictory viewpoints to make the paper appear unanimous","textLatex":"Omitting contradictory viewpoints to make the paper appear unanimous"}]'::jsonb,
   'A',
   'Synthesis integrates multiple studies to identify patterns, agreements, and controversies across literature themes.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 2 · Chapter 4: Synthesis & Review
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000011-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000004', 1, 'MULTIPLE_CHOICE',
   'When critically reviewing a research study, which question best evaluates the validity of the conclusions?',
   '[{"id":"A","text":"Do the empirical findings logically justify the conclusions reached by the researchers?","textLatex":"Do the empirical findings logically justify the conclusions reached by the researchers?"},{"id":"B","text":"Is the paper printed in a large font size?","textLatex":"Is the paper printed in a large font size?"},{"id":"C","text":"Does the paper have more than fifty references?","textLatex":"Does the paper have more than fifty references?"},{"id":"D","text":"Was the paper submitted on the exact deadline date?","textLatex":"Was the paper submitted on the exact deadline date?"}]'::jsonb,
   'A',
   'Critical evaluation assesses whether conclusions are logically supported by the methodology and evidentiary data.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();

-- Questions for Quiz 3 · Chapter 4: Synthesis & Review
INSERT INTO question (id, quiz_chapter_id, display_number, question_type, prompt_latex, options_json, correct_option_id, explanation_latex, status, authored_by, updated_at)
VALUES
  ('e0000012-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000004', 1, 'MULTIPLE_CHOICE',
   'What is the primary function of the concluding section in an academic analytical paper?',
   '[{"id":"A","text":"To synthesize the main findings, highlight broader implications, and answer the research question","textLatex":"To synthesize the main findings, highlight broader implications, and answer the research question"},{"id":"B","text":"To introduce entirely brand new evidence and unexpected theories not mentioned previously","textLatex":"To introduce entirely brand new evidence and unexpected theories not mentioned previously"},{"id":"C","text":"To copy and paste the abstract word for word","textLatex":"To copy and paste the abstract word for word"},{"id":"D","text":"To apologize for methodological limitations of the project","textLatex":"To apologize for methodological limitations of the project"}]'::jsonb,
   'A',
   'The conclusion synthesizes key insights, addresses significance, and ties the argument back to the core research problem.',
   'PUBLISHED', '8d119c24-7436-4ef8-841c-64c4a9f89302', NOW())
ON CONFLICT (id) DO UPDATE SET prompt_latex = EXCLUDED.prompt_latex, options_json = EXCLUDED.options_json, correct_option_id = EXCLUDED.correct_option_id, explanation_latex = EXCLUDED.explanation_latex, updated_at = NOW();
