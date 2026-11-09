import { Client } from 'pg';

async function seedQuizzes() {
  const client = new Client({
    connectionString:
      'postgresql://mastera:mastera_dev_password@localhost:5432/mastera_db',
  });
  await client.connect();

  const adminId = '8d119c24-7436-4ef8-841c-64c4a9f89302';
  const eng101Id = 'a2661b0d-9021-4730-a457-94287163f682';

  console.log('Seeding Quiz Book Groups and Chapters for ENG101...');

  // 1. Insert or ensure Quiz 1, Quiz 2, Quiz 3 book groups
  const quizTargets: Array<{ target: 'QUIZ_1' | 'QUIZ_2' | 'QUIZ_3'; title: string; code: string; id: string }> = [
    { target: 'QUIZ_1', title: 'Communicative English — Quiz 1', code: 'Q1', id: 'b0000000-0000-0000-0000-000000000001' },
    { target: 'QUIZ_2', title: 'Communicative English — Quiz 2', code: 'Q2', id: 'b0000000-0000-0000-0000-000000000002' },
    { target: 'QUIZ_3', title: 'Communicative English — Quiz 3', code: 'Q3', id: 'b0000000-0000-0000-0000-000000000003' },
  ];

  for (const qb of quizTargets) {
    await client.query(
      `INSERT INTO book_group (id, course_id, category, code, title, subtitle, order_index, version)
       VALUES ($1, $2, $3, $4, $5, $6, 1, 1)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category;`,
      [qb.id, eng101Id, qb.target, qb.code, qb.title, 'Quiz Series for Freshman Students']
    );
  }

  // 2. Chapters data for each Quiz target matching the user's screenshot
  const chaptersData = [
    { order: 1, title: 'Chapter 1', subtitle: 'Fundamentals' },
    { order: 2, title: 'Chapter 2', subtitle: 'Core Methods' },
    { order: 3, title: 'Chapter 3', subtitle: 'Applications' },
    { order: 4, title: 'Chapter 4', subtitle: 'Review & Synthesis' },
  ];

  const chapterIdsByTarget: Record<string, string[]> = {};

  for (let tIdx = 0; tIdx < quizTargets.length; tIdx++) {
    const qb = quizTargets[tIdx]!;
    chapterIdsByTarget[qb.target] = [];

    for (let cIdx = 0; cIdx < chaptersData.length; cIdx++) {
      const ch = chaptersData[cIdx]!;
      const chapterId = `c000000${tIdx + 1}-0000-0000-0000-00000000000${cIdx + 1}`;
      chapterIdsByTarget[qb.target]!.push(chapterId);

      await client.query(
        `INSERT INTO content (id, course_id, book_group_id, category, order_index, title, body_markdown_latex, is_free, status, authored_by, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'PUBLISHED', $8, 1)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, book_group_id = EXCLUDED.book_group_id, category = EXCLUDED.category, status = 'PUBLISHED';`,
        [
          chapterId,
          eng101Id,
          qb.id,
          qb.target,
          ch.order,
          `${ch.title}: ${ch.subtitle}`,
          `# ${ch.title}: ${ch.subtitle}\nPractice exercises and conceptual review.`,
          adminId,
        ]
      );
    }
  }

  // 3. Real Ethiopian university communicative english questions
  const quizQuestions: Array<{
    quizChapterId: string;
    displayNumber: number;
    promptLatex: string;
    options: Array<{ id: string; textLatex: string }>;
    correctOptionId: string;
    explanationLatex: string;
  }> = [
    // --- Quiz 1 · Chapter 1: Fundamentals ---
    {
      quizChapterId: 'c0000001-0000-0000-0000-000000000001',
      displayNumber: 1,
      promptLatex: 'Which word in the following list functions as an abstract noun?',
      options: [
        { id: 'A', textLatex: 'quickly' },
        { id: 'B', textLatex: 'happiness' },
        { id: 'C', textLatex: 'run' },
        { id: 'D', textLatex: 'blue' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'An abstract noun denotes an idea, emotion, state of being, or quality such as "happiness", whereas "quickly" is an adverb and "run" is a verb.',
    },
    {
      quizChapterId: 'c0000001-0000-0000-0000-000000000001',
      displayNumber: 2,
      promptLatex: 'Identify the complete subject in the sentence: "The newly built university library opens at 8:00 AM daily."',
      options: [
        { id: 'A', textLatex: 'library' },
        { id: 'B', textLatex: 'The newly built university library' },
        { id: 'C', textLatex: 'opens at 8:00 AM' },
        { id: 'D', textLatex: 'daily' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'The complete subject includes the head noun "library" along with all its determiners and modifiers: "The newly built university library".',
    },
    {
      quizChapterId: 'c0000001-0000-0000-0000-000000000001',
      displayNumber: 3,
      promptLatex: 'Choose the sentence that demonstrates correct subject-verb agreement:',
      options: [
        { id: 'A', textLatex: 'The list of freshman courses are updated on the portal.' },
        { id: 'B', textLatex: 'The list of freshman courses is updated on the portal.' },
        { id: 'C', textLatex: 'Neither of the professors have arrived yet.' },
        { id: 'D', textLatex: 'The students along with their advisor was awarded.' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'The head noun of the prepositional phrase subject is "list" (singular), requiring the singular verb "is".',
    },

    // --- Quiz 1 · Chapter 2: Core Methods ---
    {
      quizChapterId: 'c0000001-0000-0000-0000-000000000002',
      displayNumber: 1,
      promptLatex: 'In academic reading, which technique is most effective for locating a specific numerical statistic or historical year?',
      options: [
        { id: 'A', textLatex: 'Skimming' },
        { id: 'B', textLatex: 'Scanning' },
        { id: 'C', textLatex: 'Close intensive reading' },
        { id: 'D', textLatex: 'Extensive reading' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'Scanning is rapid reading focused on searching for a specific keyword, date, or figure without reading the entire text.',
    },
    {
      quizChapterId: 'c0000001-0000-0000-0000-000000000002',
      displayNumber: 2,
      promptLatex: 'What is the primary function of a topic sentence in an academic paragraph?',
      options: [
        { id: 'A', textLatex: 'To provide statistical citations and empirical data' },
        { id: 'B', textLatex: 'To introduce the main controlling idea of the paragraph' },
        { id: 'C', textLatex: 'To restate the conclusion of the entire essay' },
        { id: 'D', textLatex: 'To present a counterargument without analysis' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'The topic sentence establishes the central point and scope that the subsequent supporting sentences elaborate upon.',
    },

    // --- Quiz 1 · Chapter 3: Applications ---
    {
      quizChapterId: 'c0000001-0000-0000-0000-000000000003',
      displayNumber: 1,
      promptLatex: 'Which of the following in-text citations adheres strictly to APA 7th edition guidelines for a single author?',
      options: [
        { id: 'A', textLatex: 'According to Kebede (2023), academic writing requires precision.' },
        { id: 'B', textLatex: 'According to (Kebede, 2023), academic writing requires precision.' },
        { id: 'C', textLatex: 'According to Kebede [2023], academic writing requires precision.' },
        { id: 'D', textLatex: 'According to Dr. Kebede (2023), academic writing requires precision.' },
      ],
      correctOptionId: 'A',
      explanationLatex: 'APA style uses the author\'s surname followed immediately by the year of publication in parentheses: Kebede (2023).',
    },
    {
      quizChapterId: 'c0000001-0000-0000-0000-000000000003',
      displayNumber: 2,
      promptLatex: 'Which cohesive device best expresses contrast between two independent clauses?',
      options: [
        { id: 'A', textLatex: 'Furthermore' },
        { id: 'B', textLatex: 'However' },
        { id: 'C', textLatex: 'Consequently' },
        { id: 'D', textLatex: 'Similarly' },
      ],
      correctOptionId: 'B',
      explanationLatex: '"However" is an adversative conjunctive adverb used to introduce contrast or contradiction.',
    },

    // --- Quiz 2 · Chapter 1: Fundamentals ---
    {
      quizChapterId: 'c0000002-0000-0000-0000-000000000001',
      displayNumber: 1,
      promptLatex: 'Which sentence correctly avoids a comma splice error?',
      options: [
        { id: 'A', textLatex: 'The library was closed, we went to the cafeteria to study.' },
        { id: 'B', textLatex: 'The library was closed; therefore, we went to the cafeteria to study.' },
        { id: 'C', textLatex: 'The library was closed, therefore we went to the cafeteria to study.' },
        { id: 'D', textLatex: 'The library was closed we went to the cafeteria to study.' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'Joining two independent clauses requires a semicolon before the conjunctive adverb "therefore" and a comma after it.',
    },

    // --- Quiz 2 · Chapter 2: Core Methods ---
    {
      quizChapterId: 'c0000002-0000-0000-0000-000000000002',
      displayNumber: 1,
      promptLatex: 'In persuasive speaking, which rhetorical appeal relies on logic, empirical facts, and reasoned evidence?',
      options: [
        { id: 'A', textLatex: 'Pathos' },
        { id: 'B', textLatex: 'Logos' },
        { id: 'C', textLatex: 'Ethos' },
        { id: 'D', textLatex: 'Kairos' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'Logos appeals to intellect and logical reasoning through data, rational arguments, and factual evidence.',
    },

    // --- Quiz 2 · Chapter 3: Applications ---
    {
      quizChapterId: 'c0000002-0000-0000-0000-000000000003',
      displayNumber: 1,
      promptLatex: 'When summarizing an academic source, what must a student do to avoid plagiarism?',
      options: [
        { id: 'A', textLatex: 'Change every third word using a thesaurus' },
        { id: 'B', textLatex: 'Restate the core ideas in original words and cite the source' },
        { id: 'C', textLatex: 'Omit citation if the summary is shorter than 50 words' },
        { id: 'D', textLatex: 'Copy the author\'s exact sentences without quotation marks' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'A legitimate academic summary requires faithful paraphrase in your own voice together with proper attribution to the original author.',
    },

    // --- Quiz 3 · Chapter 1: Fundamentals ---
    {
      quizChapterId: 'c0000003-0000-0000-0000-000000000001',
      displayNumber: 1,
      promptLatex: 'Which of the following contains a dangling modifier?',
      options: [
        { id: 'A', textLatex: 'Walking across campus, the rain began to fall heavily.' },
        { id: 'B', textLatex: 'Walking across campus, the students noticed the rain beginning to fall.' },
        { id: 'C', textLatex: 'As the students walked across campus, rain began to fall.' },
        { id: 'D', textLatex: 'The students were walking across campus when rain fell.' },
      ],
      correctOptionId: 'A',
      explanationLatex: 'In option A, the participial phrase "Walking across campus" illogically modifies "the rain", which cannot walk.',
    },

    // --- Quiz 3 · Chapter 2: Core Methods ---
    {
      quizChapterId: 'c0000003-0000-0000-0000-000000000002',
      displayNumber: 1,
      promptLatex: 'What distinguishes an argumentative thesis statement from an explanatory thesis statement?',
      options: [
        { id: 'A', textLatex: 'It simply defines the topic without taking a stance.' },
        { id: 'B', textLatex: 'It makes a debatable claim supported by evidence and reasoning.' },
        { id: 'C', textLatex: 'It consists of a rhetorical question.' },
        { id: 'D', textLatex: 'It lists historical dates chronologically.' },
      ],
      correctOptionId: 'B',
      explanationLatex: 'An argumentative thesis articulates a clear, debatable position that requires persuasive support and rational defense.',
    },

    // --- Quiz 3 · Chapter 3: Applications ---
    {
      quizChapterId: 'c0000003-0000-0000-0000-000000000003',
      displayNumber: 1,
      promptLatex: 'In formal business communication, which salutation is most appropriate when the recipient\'s name is unknown?',
      options: [
        { id: 'A', textLatex: 'Hey there,' },
        { id: 'B', textLatex: 'Dear Hiring Committee / Department Head,' },
        { id: 'C', textLatex: 'To Whom It May Concern (or relevant functional title)' },
        { id: 'D', textLatex: 'Both B and C are professional standards' },
      ],
      correctOptionId: 'D',
      explanationLatex: 'Both "Dear [Department/Committee]" and "To Whom It May Concern" represent established formal salutations in academic and business correspondence.',
    },
  ];

  for (const q of quizQuestions) {
    const questionId = `q-${q.quizChapterId.slice(-6)}-${q.displayNumber}`;
    const optionsJson = JSON.stringify(q.options.map(opt => ({
      id: opt.id,
      text: opt.textLatex,
      textLatex: opt.textLatex,
      label: opt.id,
    })));

    await client.query(
      `INSERT INTO question (
         id, quiz_chapter_id, display_number, question_type,
         prompt_latex, options_json, correct_option_id, explanation_latex,
         status, authored_by
       ) VALUES ($1, $2, $3, 'MULTIPLE_CHOICE', $4, $5::jsonb, $6, $7, 'PUBLISHED', $8)
       ON CONFLICT (id) DO UPDATE SET
         prompt_latex = EXCLUDED.prompt_latex,
         options_json = EXCLUDED.options_json,
         correct_option_id = EXCLUDED.correct_option_id,
         explanation_latex = EXCLUDED.explanation_latex;`,
      [
        questionId,
        q.quizChapterId,
        q.displayNumber,
        q.promptLatex,
        optionsJson,
        q.correctOptionId,
        q.explanationLatex,
        adminId,
      ]
    );
  }

  console.log('Quiz data successfully inserted!');
  await client.end();
}

seedQuizzes().catch((err) => {
  console.error(err);
  process.exit(1);
});
