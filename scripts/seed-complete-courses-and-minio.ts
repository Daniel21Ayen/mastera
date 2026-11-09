import { PrismaClient, ContentCategory, ExamCategory, ContentStatus, QuestionType } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as zlib from 'zlib';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'mastera_s3_admin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'mastera_s3_password_123',
  },
  forcePathStyle: true,
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'mastera-private-assets';

interface CourseCurriculumDef {
  code: string;
  title: string;
  modules: {
    title: string;
    chapters: {
      title: string;
      body: string;
      latex: string;
      keyIdea: string;
    }[];
  };
  notes: {
    title: string;
    chapters: {
      title: string;
      body: string;
      latex: string;
      keyIdea: string;
    }[];
  };
  amharic: {
    title: string;
    chapters: {
      title: string;
      body: string;
      latex: string;
      keyIdea: string;
    }[];
  };
  sampleQuestions: {
    prompt: string;
    options: { id: string; textLatex: string }[];
    correct: string;
    explanation: string;
  }[];
}

const CURRICULUM_DATA: Record<string, CourseCurriculumDef> = {
  ENG101: {
    code: 'ENG101',
    title: 'Communicative English Language Skills',
    modules: {
      title: 'Communicative English Skills Core Module',
      chapters: [
        {
          title: 'Unit 1: Study Skills & Reading Strategies',
          body: 'Developing academic reading strategies such as skimming, scanning, critical reading, and vocabulary building through context clues in academic discourse.',
          latex: '\\text{Reading Speed} = \\frac{\\text{Words Count}}{\\text{Time in Minutes}} \\times \\text{Comprehension Rate}',
          keyIdea: 'Skimming gives the gist; scanning locates specific data points.',
        },
        {
          title: 'Unit 2: Paragraph Development & Cohesion',
          body: 'Structural mechanics of standard paragraphs: topic sentence, supporting arguments, cohesive transitional markers, and concluding summary.',
          latex: '\\text{Cohesion} = \\sum_{i=1}^n \\text{Transition Marker}_i + \\text{Pronoun Reference}',
          keyIdea: 'Unity and coherence are the pillars of persuasive academic prose.',
        },
        {
          title: 'Unit 3: Argumentative Essay & Academic Debate',
          body: 'Formulating thesis statements, synthesizing contradictory viewpoints, refuting counterarguments, and adhering to APA/MLA citation standards.',
          latex: '\\text{Argument Strength} = \\text{Claim} + \\text{Evidence} - \\text{Fallacy Risk}',
          keyIdea: 'A thesis statement must be debateable, narrow, and provable.',
        },
      ],
    },
    notes: {
      title: 'Grammar & Essay Mechanics Note',
      chapters: [
        {
          title: 'Note 1: Tenses, Concord & Subject-Verb Agreement',
          body: 'Rules governing compound subjects, collective nouns, indefinite pronouns, and complex subordinate clauses.',
          latex: '\\text{Singular Subject} \\implies \\text{Verb}_{\\text{-s}}',
          keyIdea: 'Neither/nor takes the verb agreeing with the closest subject.',
        },
        {
          title: 'Note 2: Active vs Passive Voice in Scientific Reports',
          body: 'Transformational grammar rules for passive construction when emphasizing procedural methodology rather than the agent.',
          latex: '\\text{Passive Structure} = \\text{Object} + \\text{Auxiliary Be} + \\text{Past Participle} + \\text{by Agent}',
          keyIdea: 'Use passive voice to maintain objective scientific detachment.',
        },
      ],
    },
    amharic: {
      title: 'የእንግሊዝኛ ቋንቋ ማጠቃለያ ማስታወሻ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የንባብ ክህሎት እና የቃላት ትርጉም',
          body: 'በአካዳሚክ ንባብ ወቅት ዋና ሃሳብን በፍጥነት የመለየት ዘዴዎች እና አዳዲስ ቃላትን ከአረፍተ-ነገር አውድ የመረዳት ስልቶች።',
          latex: '\\text{መረዳት} = \\text{የአውድ ትንተና} + \\text{የቃላት ትስስር}',
          keyIdea: 'ዋናውን ሃሳብ በመጀመሪያው እና በመጨረሻው አረፍተ ነገር ላይ መፈለግ።',
        },
        {
          title: 'ምዕራፍ 2: የፅሁፍ መዋቅር እና ሰዋሰው',
          body: 'ትክክለኛ አንቀፅ አፃፃፍ፣ የሃሳብ ቅደም ተከተል እና የሰዋሰው ህጎችን በአግባቡ የመጠቀም መርሆዎች።',
          latex: '\\text{ሙሉ አረፍተ-ነገር} = \\text{ባለቤት} + \\text{ማሰሪያ አንቀጽ}',
          keyIdea: 'አንድ አንቀፅ በአንድ ማዕከላዊ ሃሳብ ዙሪያ ብቻ መገንባት አለበት።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'Identify the sentence with correct subject-verb agreement:',
        options: [
          { id: 'A', textLatex: 'Neither the teacher nor the students were present in the hall.' },
          { id: 'B', textLatex: 'Neither the teacher nor the students was present in the hall.' },
          { id: 'C', textLatex: 'Neither the students nor the teacher were present in the hall.' },
          { id: 'D', textLatex: 'Neither the students or the teacher are present in the hall.' },
        ],
        correct: 'A',
        explanation: 'In correlative conjunctions (neither...nor), the verb agrees with the subject closer to it ("students" is plural, requiring "were").',
      },
      {
        prompt: 'Which reading strategy is best suited for quickly locating a student\'s ID number in a list?',
        options: [
          { id: 'A', textLatex: 'Skimming' },
          { id: 'B', textLatex: 'Scanning' },
          { id: 'C', textLatex: 'Intensive reading' },
          { id: 'D', textLatex: 'Extensive reading' },
        ],
        correct: 'B',
        explanation: 'Scanning is the rapid search for specific, predetermined pieces of information like numbers, dates, or names.',
      },
      {
        prompt: 'What constitutes the backbone of an academic argumentative essay?',
        options: [
          { id: 'A', textLatex: 'A rhetorical question in the conclusion' },
          { id: 'B', textLatex: 'A clear, debatable thesis statement' },
          { id: 'C', textLatex: 'A lengthy emotional anecdote' },
          { id: 'D', textLatex: 'Quoting only dictionary definitions' },
        ],
        correct: 'B',
        explanation: 'An academic argumentative essay requires a debatable, defensible thesis statement supported by synthesized evidence.',
      },
      {
        prompt: 'Select the sentence written in the passive voice:',
        options: [
          { id: 'A', textLatex: 'The researchers observed significant cell growth.' },
          { id: 'B', textLatex: 'Significant cell growth was observed by the researchers.' },
          { id: 'C', textLatex: 'Researchers will observe significant cell growth.' },
          { id: 'D', textLatex: 'The team has published the observation.' },
        ],
        correct: 'B',
        explanation: '"was observed" uses the auxiliary verb "be" followed by the past participle, placing the action receiver in subject position.',
      },
    ],
  },
  PHYS101: {
    code: 'PHYS101',
    title: 'General Physics',
    modules: {
      title: 'University Physics: Mechanics & Waves',
      chapters: [
        {
          title: 'Chapter 1: Vectors, Kinematics & Projectile Motion',
          body: 'Vector calculus, dot and cross products, 2D motion with constant acceleration, and parabolic trajectory analysis in conservative gravity fields.',
          latex: '\\vec{r}(t) = \\vec{r}_0 + \\vec{v}_0 t + \\frac{1}{2} \\vec{a} t^2, \\quad R = \\frac{v_0^2 \\sin(2\\theta)}{g}',
          keyIdea: 'Horizontal and vertical motions in projectile trajectories are completely decoupled.',
        },
        {
          title: 'Chapter 2: Newton\'s Laws & Rotational Dynamics',
          body: 'Inertial frames of reference, non-conservative frictional forces, torque, moment of inertia, and conservation of angular momentum.',
          latex: '\\sum \\vec{\\tau} = I \\vec{\\alpha} = \\frac{d\\vec{L}}{dt}, \\quad L = I\\omega',
          keyIdea: 'Net external torque equals the time rate of change of total angular momentum.',
        },
        {
          title: 'Chapter 3: Work, Energy & Conservation Theorems',
          body: 'Line integrals of force fields, work-kinetic energy theorem, conservative potential energy wells, and harmonic oscillations.',
          latex: 'W = \\int_{r_1}^{r_2} \\vec{F} \\cdot d\\vec{r} = \\Delta K, \\quad E = K + U = \\text{constant}',
          keyIdea: 'Total mechanical energy is strictly conserved in the presence of only conservative forces.',
        },
      ],
    },
    notes: {
      title: 'Physics Formula Sheet & Summary Notes',
      chapters: [
        {
          title: 'Note 1: Classical Mechanics Essential Formulae',
          body: 'Quick reference sheet covering linear and rotational kinematics, friction coefficients, and center of mass calculations.',
          latex: 'I_{\\text{disk}} = \\frac{1}{2}MR^2, \\quad a_c = \\frac{v^2}{R} = \\omega^2 R',
          keyIdea: 'Parallel axis theorem: $I = I_{\\text{cm}} + Md^2$.',
        },
        {
          title: 'Note 2: Oscillations, Waves & Thermodynamics Basics',
          body: 'Simple harmonic motion equations, wave speed in media, first and second laws of thermodynamics, and Carnot cycle efficiency.',
          latex: 'T = 2\\pi\\sqrt{\\frac{m}{k}}, \\quad \\eta_{\\text{Carnot}} = 1 - \\frac{T_C}{T_H}',
          keyIdea: 'Carnot efficiency represents the theoretical maximum limit for any heat engine.',
        },
      ],
    },
    amharic: {
      title: 'የአጠቃላይ ፊዚክስ ማጠቃለያ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የቬክተር ስሌት እና የመካኒክስ ህጎች',
          body: 'የኒውተን ሶስቱ የእንቅስቃሴ ህጎች፣ ጉልበት እና የፍጥነት ለውጥ እንዲሁም የሀይል ጥበቃ መርሆዎች ትንተና።',
          latex: '\\vec{F}_{\\text{net}} = m \\vec{a}, \\quad \\vec{p} = m \\vec{v}',
          keyIdea: 'ጉልበት በቁስ አካል ላይ የፍጥነት ለውጥ (acceleration) ያመጣል።',
        },
        {
          title: 'ምዕራፍ 2: ስራ፣ ሀይል እና የጉልበት ጥበቃ',
          body: 'ሜካኒካል ስራ፣ ኪነቲክ እና ፖቴንሻል ሀይል እንዲሁም የሀይል አለመጥፋት ሁለንተናዊ ህግ።',
          latex: 'W = \\vec{F} \\cdot \\vec{d} = F d \\cos(\\theta)',
          keyIdea: 'ሀይል አይፈጠርም አይጠፋም፤ ከአንዱ ቅርፅ ወደ ሌላው ይለወጣል እንጂ።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'A projectile is launched with velocity $v_0$ at angle $\\theta$ above the horizontal. What is its velocity at the peak of its trajectory?',
        options: [
          { id: 'A', textLatex: '$v_0 \\cos(\\theta)$' },
          { id: 'B', textLatex: '$0$' },
          { id: 'C', textLatex: '$v_0 \\sin(\\theta)$' },
          { id: 'D', textLatex: '$v_0$' },
        ],
        correct: 'A',
        explanation: 'At maximum altitude, vertical velocity $v_y = 0$, while the horizontal velocity component remains constant at $v_0 \\cos(\\theta)$.',
      },
      {
        prompt: 'A solid cylinder and a hoop of identical mass $M$ and radius $R$ roll down an incline without slipping. Which reaches the bottom first?',
        options: [
          { id: 'A', textLatex: 'The solid cylinder' },
          { id: 'B', textLatex: 'The hoop' },
          { id: 'C', textLatex: 'They reach simultaneously' },
          { id: 'D', textLatex: 'Depends on the incline angle' },
        ],
        correct: 'A',
        explanation: 'The solid cylinder has smaller rotational inertia ($I = \\frac{1}{2}MR^2 < MR^2$), converting less potential energy into rotational kinetic energy and more into translational acceleration.',
      },
      {
        prompt: 'What is the maximum theoretical efficiency of a Carnot engine operating between $600\\text{ K}$ and $300\\text{ K}$?',
        options: [
          { id: 'A', textLatex: '$50\\%$' },
          { id: 'B', textLatex: '$100\\%$' },
          { id: 'C', textLatex: '$33.3\\%$' },
          { id: 'D', textLatex: '$66.7\\%$' },
        ],
        correct: 'A',
        explanation: 'Carnot efficiency $\\eta = 1 - \\frac{T_C}{T_H} = 1 - \\frac{300}{600} = 0.50 = 50\\%$.',
      },
      {
        prompt: 'If the net work done on a particle is zero, which statement must be true?',
        options: [
          { id: 'A', textLatex: 'Its speed is constant' },
          { id: 'B', textLatex: 'Its velocity is constant' },
          { id: 'C', textLatex: 'Its acceleration is zero' },
          { id: 'D', textLatex: 'Its displacement is zero' },
        ],
        correct: 'A',
        explanation: 'By the Work-Kinetic Energy theorem, $W_{\\text{net}} = \\Delta K = \\frac{1}{2}m(v_f^2 - v_i^2) = 0 \\implies v_f = v_i$ (constant speed).',
      },
    ],
  },
  CALC101: {
    code: 'CALC101',
    title: 'Calculus I (Applied Mathematics I)',
    modules: {
      title: 'Differential & Integral Calculus Core Module',
      chapters: [
        {
          title: 'Chapter 1: Limits, Continuity & Derivative Foundations',
          body: 'Rigorous $\\epsilon$-$\\delta$ limit definitions, intermediate value theorem, differentiability, chain rule, and implicit differentiation.',
          latex: 'f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}, \\quad \\frac{d}{dx}[f(g(x))] = f\'(g(x))g\'(x)',
          keyIdea: 'Differentiability implies continuity, but continuity does not guarantee differentiability.',
        },
        {
          title: 'Chapter 2: Mean Value Theorem & Curve Sketching',
          body: 'Rolle\'s theorem, Cauchy mean value theorem, concavity, points of inflection, and optimization of multivariable constraints.',
          latex: 'f\'(c) = \\frac{f(b) - f(a)}{b - a}, \\quad f\'\'(x) > 0 \\implies \\text{Concave Upward}',
          keyIdea: 'Local extrema occur where the derivative is zero or undefined (critical points).',
        },
        {
          title: 'Chapter 3: Definite Integrals & Fundamental Theorem',
          body: 'Riemann sums, evaluation of definite integrals, integration by parts, trigonometric substitutions, and improper integral convergence.',
          latex: '\\int_a^b f(x)\\,dx = F(b) - F(a), \\quad \\int u\\,dv = uv - \\int v\\,du',
          keyIdea: 'Differentiation and integration are reciprocal inverse linear operations.',
        },
      ],
    },
    notes: {
      title: 'Calculus Theorems & Rapid Reference Notes',
      chapters: [
        {
          title: 'Note 1: Standard Derivatives & Integration Table',
          body: 'Comprehensive table of trigonometric, exponential, logarithmic, and hyperbolic derivative and integral pairings.',
          latex: '\\frac{d}{dx}[\\ln|x|] = \\frac{1}{x}, \\quad \\int \\frac{dx}{x^2 + a^2} = \\frac{1}{a} \\arctan\\left(\\frac{x}{a}\\right) + C',
          keyIdea: 'Substitution simplifies composite function integrals into elementary forms.',
        },
        {
          title: 'Note 2: L\'Hôpital\'s Rule & Series Expansions',
          body: 'Indeterminate forms ($0/0$, $\\infty/\\infty$), Taylor and Maclaurin polynomial series approximations with Lagrange error bounds.',
          latex: '\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f\'(x)}{g\'(x)}, \\quad e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}',
          keyIdea: 'Always verify indeterminacy before applying L\'Hôpital\'s rule.',
        },
      ],
    },
    amharic: {
      title: 'የካልኩለስ 1 ማጠቃለያ ማስታወሻ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የሊሚት እና የዴሪቬቲቭ መሰረታዊ ህጎች',
          body: 'የሊሚት ፅንሰ ሃሳብ፣ የተግባር ቀጣይነት (continuity) እና የተዋፅኦ (derivative) ህጎች አተገባበር።',
          latex: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1',
          keyIdea: 'ተዋፅኦ የአንድን መጠን የቅጽበት ለውጥ ፍጥነት (instantaneous rate of change) ይለካል።',
        },
        {
          title: 'ምዕራፍ 2: ኢንቴግሬሽን እና ተግባራዊ አጠቃቀሙ',
          body: 'ኢንቴግራልን በመጠቀም ከርቭ ስር ያለን ስፋት (area under curve) እና መጠን (volume) የማስላት ዘዴዎች።',
          latex: 'A = \\int_a^b [f(x) - g(x)]\\,dx',
          keyIdea: 'ኢንቴግሬሽን የተዋፅኦ ተቃራኒ ስሌት (antiderivative) ነው።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'Evaluate the limit: $\\lim_{x \\to 0} \\frac{\\sin(5x)}{2x}$',
        options: [
          { id: 'A', textLatex: '$\\frac{5}{2}$' },
          { id: 'B', textLatex: '$0$' },
          { id: 'C', textLatex: '$\\frac{2}{5}$' },
          { id: 'D', textLatex: '$1$' },
        ],
        correct: 'A',
        explanation: 'Using the fundamental limit $\\lim_{u \\to 0} \\frac{\\sin(u)}{u} = 1$, we rewrite as $\\frac{5}{2} \\lim_{5x \\to 0} \\frac{\\sin(5x)}{5x} = \\frac{5}{2}$.',
      },
      {
        prompt: 'If $f(x) = x^3 - 3x^2 + 2$, what are the coordinates of the inflection point?',
        options: [
          { id: 'A', textLatex: '$(1, 0)$' },
          { id: 'B', textLatex: '$(0, 2)$' },
          { id: 'C', textLatex: '$(2, -2)$' },
          { id: 'D', textLatex: '$(1, 2)$' },
        ],
        correct: 'A',
        explanation: '$f\'(x) = 3x^2 - 6x$, $f\'\'(x) = 6x - 6 = 0 \\implies x = 1$. $f(1) = 1 - 3 + 2 = 0$. Hence the inflection point is $(1, 0)$.',
      },
      {
        prompt: 'Evaluate the integral: $\\int_0^1 (3x^2 + 2x)\\,dx$',
        options: [
          { id: 'A', textLatex: '$2$' },
          { id: 'B', textLatex: '$1$' },
          { id: 'C', textLatex: '$5$' },
          { id: 'D', textLatex: '$3$' },
        ],
        correct: 'A',
        explanation: 'Antiderivative is $[x^3 + x^2]_0^1 = (1^3 + 1^2) - 0 = 2$.',
      },
      {
        prompt: 'Which theorem guarantees a value $c \\in (a, b)$ such that $f\'(c) = \\frac{f(b) - f(a)}{b - a}$ for continuous and differentiable functions?',
        options: [
          { id: 'A', textLatex: 'Mean Value Theorem' },
          { id: 'B', textLatex: 'Intermediate Value Theorem' },
          { id: 'C', textLatex: 'Extreme Value Theorem' },
          { id: 'D', textLatex: 'Squeeze Theorem' },
        ],
        correct: 'A',
        explanation: 'The Mean Value Theorem states that there exists at least one point where the instantaneous rate of change equals the average rate of change.',
      },
    ],
  },
  PHIL101: {
    code: 'PHIL101',
    title: 'Logic and Critical Thinking',
    modules: {
      title: 'Formal Logic & Critical Thinking Core Module',
      chapters: [
        {
          title: 'Chapter 1: Logic, Arguments & Propositions',
          body: 'Foundations of logic: declarative statements, premises, inferences, deductive validity vs sound arguments, inductive strength and cogency.',
          latex: 'P \\to Q, \\quad P \\vdash Q \\quad (\\text{Modus Ponens})',
          keyIdea: 'A valid argument guarantees true conclusions if all premises are true.',
        },
        {
          title: 'Chapter 2: Informal Fallacies in Reasoning',
          body: 'Systematic classification of fallacies of relevance (ad hominem, straw man), weak induction (hasty generalization), and presumption (begging the question).',
          latex: '\\text{Fallacy} = \\text{Invalid Inference masquerading as Valid Logic}',
          keyIdea: 'Ad hominem attacks the speaker rather than dissecting the premise logic.',
        },
        {
          title: 'Chapter 3: Categorical Syllogisms & Truth Tables',
          body: 'Standard form categorical propositions (A, E, I, O), Venn diagrams for validity testing, truth-functional propositional operators and tautologies.',
          latex: 'A: \\text{All } S \\text{ are } P, \\quad E: \\text{No } S \\text{ is } P, \\quad I: \\text{Some } S \\text{ are } P, \\quad O: \\text{Some } S \\text{ are not } P',
          keyIdea: 'Venn diagrams provide visual, unambiguous verification of syllogistic validity.',
        },
      ],
    },
    notes: {
      title: 'Logic Rules & Argument Analysis Notes',
      chapters: [
        {
          title: 'Note 1: Rules of Inference & Equivalence',
          body: 'Modus Tollens, Disjunctive Syllogism, Hypothetical Syllogism, De Morgan\'s Laws, Contraposition, and Material Implication.',
          latex: '\\neg(P \\land Q) \\equiv (\\neg P \\lor \\neg Q), \\quad (P \\to Q) \\equiv (\\neg Q \\to \\neg P)',
          keyIdea: 'De Morgan\'s laws translate conjunction into disjunction under negation.',
        },
        {
          title: 'Note 2: Fallacy Identification Quick Guide',
          body: 'Diagnostic flowchart for identifying appeal to pity, appeal to ignorance, circular reasoning, and false dilemma.',
          latex: '\\text{False Dichotomy}: \\text{Premise asserts } P \\lor Q \\text{ while ignoring } R',
          keyIdea: 'A false dilemma unjustly restricts the spectrum of possible answers.',
        },
      ],
    },
    amharic: {
      title: 'የሎጂክ እና ሂሳዊ አስተሳሰብ ማጠቃለያ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የሎጂክ መሰረታዊ መርሆዎች እና መከራከሪያዎች',
          body: 'ትክክለኛ ምክንያታዊ ድምዳሜ ላይ የመድረስ ስልቶች እና የዲዳክቲቭ እንዲሁም ኢንዳክቲቭ መከራከሪያዎች ልዩነት።',
          latex: '\\text{ትክክለኛ መከራከሪያ} = \\text{እውነተኛ መነሻ} + \\text{ትክክለኛ ስነ-አመክንዮ}',
          keyIdea: 'ምክንያታዊ አስተሳሰብ ከስሜታዊ ድምዳሜዎች የፀዳ መሆን አለበት።',
        },
        {
          title: 'ምዕራፍ 2: የተሳሳቱ የክርክር ስልቶች (Fallacies)',
          body: 'በዕለት ተዕለት ውይይቶች እና ክርክሮች ውስጥ የሚከሰቱ የተለመዱ የስነ-አመክንዮ ስህተቶች እና አወዛጋቢ አካሄዶች።',
          latex: '\\text{የስህተት ስልት} \\ne \\text{ትክክለኛ ምክንያት}',
          keyIdea: 'የግለሰቡን ማንነት መተቸት የሃሳቡን ስህተትነት አያረጋግጥም።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'Identify the fallacy: "You should not believe Dr. Abebe\'s research on economic policy because he drives an expensive foreign car."',
        options: [
          { id: 'A', textLatex: 'Argumentum ad Hominem' },
          { id: 'B', textLatex: 'Straw Man' },
          { id: 'C', textLatex: 'Appeal to Ignorance' },
          { id: 'D', textLatex: 'Begging the Question' },
        ],
        correct: 'A',
        explanation: 'Ad hominem attacks the character or personal traits of the arguer rather than critically evaluating the validity of their evidence.',
      },
      {
        prompt: 'Which argument form is demonstrated: If it rains, the ground is wet. It rained. Therefore, the ground is wet.',
        options: [
          { id: 'A', textLatex: 'Modus Ponens' },
          { id: 'B', textLatex: 'Modus Tollens' },
          { id: 'C', textLatex: 'Affirming the Consequent' },
          { id: 'D', textLatex: 'Denying the Antecedent' },
        ],
        correct: 'A',
        explanation: 'Modus Ponens has the valid deductive structure: If P then Q; P; Therefore Q.',
      },
      {
        prompt: 'A deductive argument that is both valid and has all true premises is described as:',
        options: [
          { id: 'A', textLatex: 'Sound' },
          { id: 'B', textLatex: 'Cogent' },
          { id: 'C', textLatex: 'Strong' },
          { id: 'D', textLatex: 'Inductive' },
        ],
        correct: 'A',
        explanation: 'A sound argument is defined as a deductively valid argument possessing strictly true premises.',
      },
      {
        prompt: 'According to categorical logic, the proposition "No squares are circles" is classified as:',
        options: [
          { id: 'A', textLatex: 'Universal Negative (E)' },
          { id: 'B', textLatex: 'Universal Affirmative (A)' },
          { id: 'C', textLatex: 'Particular Affirmative (I)' },
          { id: 'D', textLatex: 'Particular Negative (O)' },
        ],
        correct: 'A',
        explanation: '"No S is P" is standard form for a Universal Negative (E) categorical proposition.',
      },
    ],
  },
  CHEM101: {
    code: 'CHEM101',
    title: 'General Chemistry',
    modules: {
      title: 'General Chemistry Core Curriculum',
      chapters: [
        {
          title: 'Chapter 1: Atomic Structure & Quantum Numbers',
          body: 'Bohr model limitations, Schrödinger wave equation, Pauli exclusion principle, Hund\'s rule, and electron orbital configurations.',
          latex: 'E_n = -\\frac{2.18 \\times 10^{-18}\\,\\text{J}}{n^2}, \\quad \\lambda = \\frac{h}{p} = \\frac{h}{mv}',
          keyIdea: 'No two electrons in an atom can share identical sets of all four quantum numbers.',
        },
        {
          title: 'Chapter 2: Chemical Bonding & Molecular Geometry',
          body: 'Lewis dot structures, VSEPR theory, hybridization ($sp, sp^2, sp^3$), dipole moments, and intermolecular forces.',
          latex: '\\text{Formal Charge} = V - N - \\frac{B}{2}',
          keyIdea: 'VSEPR geometry minimizes electrostatic electron pair repulsion around the central atom.',
        },
        {
          title: 'Chapter 3: Chemical Equilibrium & Acid-Base Equilibria',
          body: 'Law of mass action, Le Chatelier\'s principle, Brønsted-Lowry and Lewis acid-base models, pH calculations, and buffer systems.',
          latex: 'K_c = \\frac{[C]^c [D]^d}{[A]^a [B]^b}, \\quad \\text{pH} = \\text{p}K_a + \\log\\left(\\frac{[A^-]}{[HA]}\\right)',
          keyIdea: 'Buffers resist sudden pH fluctuations when moderate amounts of acid or base are introduced.',
        },
      ],
    },
    notes: {
      title: 'Chemistry Thermodynamics & Reaction Summary',
      chapters: [
        {
          title: 'Note 1: Chemical Kinetics & Rate Laws',
          body: 'Reaction orders, integrated rate laws, half-life formulas, and Arrhenius activation energy calculations.',
          latex: 'k = A e^{-\\frac{E_a}{RT}}, \\quad \\ln\\left(\\frac{k_2}{k_1}\\right) = -\\frac{E_a}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)',
          keyIdea: 'Catalysts increase reaction rates by providing an alternative pathway with lower activation energy.',
        },
        {
          title: 'Note 2: Thermochemistry & Gibbs Free Energy',
          body: 'Enthalpy of formation, Hess\'s law, entropy changes, and spontaneity conditions determined by Gibbs free energy.',
          latex: '\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ = -RT \\ln(K)',
          keyIdea: 'A reaction is spontaneous at constant temperature and pressure if $\\Delta G < 0$.',
        },
      ],
    },
    amharic: {
      title: 'የአጠቃላይ ኬሚስትሪ ማጠቃለያ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የአተሞች አወቃቀር እና ኬሚካላዊ ትስስር',
          body: 'የኤሌክትሮን ሽክርክሪት፣ የፔሪዮዲክ ቴብል ህጎች እና ኮቫለንት እንዲሁም አዮኒክ ትስስር ባህሪያት።',
          latex: '\\text{ትስስር} = \\text{ኤሌክትሮን መጋራት ወይንም መለዋወጥ}',
          keyIdea: 'አተሞች የተረጋጋ የኦክቴት (octet) ኤሌክትሮን ቅርፅ ለመያዝ እርስ በርስ ይተሳሰራሉ።',
        },
        {
          title: 'ምዕራፍ 2: የኬሚካል ግብረ-መልስ እና ሚዛናዊነት',
          body: 'የኬሚካል ሚዛናዊነት (chemical equilibrium) መርሆዎች እና የአሲድ-ቤዝ ባህሪያት ትንተና።',
          latex: '\\text{pH} = -\\log[H^+]',
          keyIdea: 'የግብረ-መልሱ ፍጥነት ወደ ፊት እና ወደ ኋላ እኩል ሲሆን ኬሚካላዊ ሚዛን ይፈጠራል።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'What is the molecular geometry of a water molecule ($H_2O$) according to VSEPR theory?',
        options: [
          { id: 'A', textLatex: 'Bent (angular)' },
          { id: 'B', textLatex: 'Linear' },
          { id: 'C', textLatex: 'Tetrahedral' },
          { id: 'D', textLatex: 'Trigonal planar' },
        ],
        correct: 'A',
        explanation: 'Water possesses 2 bonding pairs and 2 lone pairs on oxygen, giving a tetrahedral electron geometry and a bent molecular geometry (~104.5°).',
      },
      {
        prompt: 'For a spontaneous chemical process at constant temperature and pressure, which condition is required?',
        options: [
          { id: 'A', textLatex: '$\\Delta G < 0$' },
          { id: 'B', textLatex: '$\\Delta H > 0$' },
          { id: 'C', textLatex: '$\\Delta S < 0$' },
          { id: 'D', textLatex: '$\\Delta G > 0$' },
        ],
        correct: 'A',
        explanation: 'Thermodynamic spontaneity requires the change in Gibbs free energy to be strictly negative ($\\Delta G < 0$).',
      },
      {
        prompt: 'What is the pH of a $0.001\\text{ M } HCl$ aqueous solution at $25^\\circ\\text{C}$?',
        options: [
          { id: 'A', textLatex: '$3$' },
          { id: 'B', textLatex: '$1$' },
          { id: 'C', textLatex: '$11$' },
          { id: 'D', textLatex: '$7$' },
        ],
        correct: 'A',
        explanation: '$HCl$ is a strong acid, dissociating completely: $[H^+] = 10^{-3}\\text{ M}$. $\\text{pH} = -\\log(10^{-3}) = 3$.',
      },
      {
        prompt: 'According to Le Chatelier\'s principle, adding heat to an exothermic reaction at equilibrium will:',
        options: [
          { id: 'A', textLatex: 'Shift equilibrium toward reactants' },
          { id: 'B', textLatex: 'Shift equilibrium toward products' },
          { id: 'C', textLatex: 'Have no effect on equilibrium' },
          { id: 'D', textLatex: 'Increase the equilibrium constant' },
        ],
        correct: 'A',
        explanation: 'In exothermic reactions, heat is a product. Adding heat shifts the system toward the left (reactants) to absorb the excess energy.',
      },
    ],
  },
  MATH101: {
    code: 'MATH101',
    title: 'Applied Mathematics I',
    modules: {
      title: 'Applied Engineering Mathematics Core Module',
      chapters: [
        {
          title: 'Chapter 1: Matrices, Determinants & Linear Systems',
          body: 'Gaussian elimination, matrix rank, Cramer\'s rule, eigenvalues and eigenvectors, and matrix inversion techniques.',
          latex: 'A\\vec{x} = \\vec{b}, \\quad \\det(A - \\lambda I) = 0',
          keyIdea: 'A square matrix is invertible if and only if its determinant is non-zero.',
        },
        {
          title: 'Chapter 2: Vector Spaces & Linear Transformations',
          body: 'Subspaces, linear independence, spanning sets, basis and dimension, inner product spaces, and Gram-Schmidt orthogonalization.',
          latex: '\\vec{u}_k = \\vec{v}_k - \\sum_{j=1}^{k-1} \\frac{\\langle \\vec{v}_k, \\vec{u}_j \\rangle}{\\|\\vec{u}_j\\|^2} \\vec{u}_j',
          keyIdea: 'The dimension of a vector space is the number of vectors in any of its bases.',
        },
      ],
    },
    notes: {
      title: 'Linear Algebra Formula & Method Sheet',
      chapters: [
        {
          title: 'Note 1: Eigenvalues, Diagonalization & Cayley-Hamilton',
          body: 'Algorithms for calculating characteristic polynomials, algebraic vs geometric multiplicity, and matrix powers.',
          latex: 'A = PDP^{-1} \\implies A^k = PD^k P^{-1}',
          keyIdea: 'Diagonalization decouples higher powers of coupled linear systems.',
        },
      ],
    },
    amharic: {
      title: 'የተግባራዊ ሂሳብ ማጠቃለያ',
      chapters: [
        {
          title: 'ምዕራፍ 1: ማትሪክስ እና ሊኒየር እኩልታዎች',
          body: 'የማትሪክስ ህጎች፣ የዲተርሚናንት ስሌት እና በጋውሲያን ኤሊሚኔሽን እኩልታዎችን የመፍታት ዘዴዎች።',
          latex: 'A^{-1} = \\frac{1}{\\det(A)} \\text{adj}(A)',
          keyIdea: 'ዲተርሚናንት ዜሮ ካልሆነ ማትሪክሱ ሁልጊዜ ግልባጭ (inverse) አለው።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'What is the determinant of the $2 \\times 2$ matrix $\\begin{pmatrix} 4 & 2 \\\\ 3 & 5 \\end{pmatrix}$?',
        options: [
          { id: 'A', textLatex: '$14$' },
          { id: 'B', textLatex: '$26$' },
          { id: 'C', textLatex: '$10$' },
          { id: 'D', textLatex: '$20$' },
        ],
        correct: 'A',
        explanation: '$\\det(A) = (4)(5) - (2)(3) = 20 - 6 = 14$.',
      },
      {
        prompt: 'What are the eigenvalues of the matrix $\\begin{pmatrix} 3 & 0 \\\\ 0 & 7 \\end{pmatrix}$?',
        options: [
          { id: 'A', textLatex: '$\\lambda_1 = 3, \\lambda_2 = 7$' },
          { id: 'B', textLatex: '$\\lambda_1 = 0, \\lambda_2 = 10$' },
          { id: 'C', textLatex: '$\\lambda_1 = -3, \\lambda_2 = -7$' },
          { id: 'D', textLatex: '$\\lambda_1 = 21, \\lambda_2 = 1$' },
        ],
        correct: 'A',
        explanation: 'For any diagonal matrix, the eigenvalues are simply the entries along the main diagonal.',
      },
    ],
  },
  MAT123: {
    code: 'MAT123',
    title: 'mathematics',
    modules: {
      title: 'General Mathematics Core Module',
      chapters: [
        {
          title: 'Chapter 1: Sets, Relations & Real Number System',
          body: 'Set theory, functions (injective, surjective, bijective), domain and range, mathematical induction, and complex numbers.',
          latex: 'f: A \\to B \\text{ is bijective} \\iff f \\text{ is injective and surjective}',
          keyIdea: 'A function has an inverse if and only if it is a bijection.',
        },
        {
          title: 'Chapter 2: Sequences, Series & Financial Mathematics',
          body: 'Arithmetic and geometric progressions, infinite series convergence, compound interest, and annuities.',
          latex: 'S_n = \\frac{a(1 - r^n)}{1 - r}, \\quad A = P\\left(1 + \\frac{r}{n}\\right)^{nt}',
          keyIdea: 'Geometric series converge if and only if the absolute common ratio $|r| < 1$.',
        },
      ],
    },
    notes: {
      title: 'Mathematical Proofs & Formulas',
      chapters: [
        {
          title: 'Note 1: Principle of Mathematical Induction',
          body: 'Base case verification, inductive hypothesis formulation, and inductive step proof execution.',
          latex: 'P(1) \\land [\\forall k \\ge 1: P(k) \\to P(k+1)] \\implies \\forall n \\in \\mathbb{N}: P(n)',
          keyIdea: 'Induction bridges finite verification to universal integer truth.',
        },
      ],
    },
    amharic: {
      title: 'የአጠቃላይ ሂሳብ ማጠቃለያ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የቁጥሮች እና የሴት ህጎች',
          body: 'የተፈጥሮ ቁጥሮች፣ ሪል ቁጥሮች እና የሴት ቲዎሪ ህጎች አጠቃቀም።',
          latex: 'A \\cup B = \\{x: x \\in A \\lor x \\in B\\}',
          keyIdea: 'ሴቶች የሂሳብ አወቃቀር የመጀመሪያ መሰረቶች ናቸው።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'Find the sum of the first 10 terms of the arithmetic sequence $3, 7, 11, 15, \\dots$:',
        options: [
          { id: 'A', textLatex: '$210$' },
          { id: 'B', textLatex: '$190$' },
          { id: 'C', textLatex: '$220$' },
          { id: 'D', textLatex: '$180$' },
        ],
        correct: 'A',
        explanation: '$a = 3$, $d = 4$, $n = 10$. $S_{10} = \\frac{10}{2}[2(3) + 9(4)] = 5[6 + 36] = 5(42) = 210$.',
      },
      {
        prompt: 'What is the sum of the infinite geometric series $1 + \\frac{1}{2} + \\frac{1}{4} + \\frac{1}{8} + \\dots$?',
        options: [
          { id: 'A', textLatex: '$2$' },
          { id: 'B', textLatex: '$1.5$' },
          { id: 'C', textLatex: '$4$' },
          { id: 'D', textLatex: '$\\infty$' },
        ],
        correct: 'A',
        explanation: '$a = 1$, $r = 1/2$. Sum $S = \\frac{a}{1 - r} = \\frac{1}{1 - 0.5} = 2$.',
      },
    ],
  },
  BIO102: {
    code: 'BIO102',
    title: 'General Biology',
    modules: {
      title: 'General Biology Core Curriculum',
      chapters: [
        {
          title: 'Chapter 1: Cell Biology & Membrane Transport',
          body: 'Prokaryotic vs eukaryotic cell architecture, phospholipid bilayer fluid mosaic model, passive diffusion, osmosis, and active transport ATP pumps.',
          latex: '\\Psi = \\Psi_s + \\Psi_p, \\quad \\Delta G = RT \\ln\\left(\\frac{C_2}{C_1}\\right) + zF\\Delta V',
          keyIdea: 'Passive transport proceeds down concentration gradients without metabolic energy input.',
        },
        {
          title: 'Chapter 2: Cellular Respiration & Photosynthesis',
          body: 'Glycolysis, Krebs cycle, mitochondrial electron transport chain, oxidative phosphorylation, and Calvin cycle light-independent reactions.',
          latex: 'C_6H_{12}O_6 + 6O_2 \\to 6CO_2 + 6H_2O + \\approx 32\\,\\text{ATP}',
          keyIdea: 'Chemiosmosis couples proton motive force to ATP synthesis via ATP synthase.',
        },
      ],
    },
    notes: {
      title: 'Biology Diagrams & Concept Sheets',
      chapters: [
        {
          title: 'Note 1: Mendelian Genetics & Molecular Heredity',
          body: 'Monohybrid and dihybrid crosses, law of segregation, independent assortment, DNA replication mechanics, and transcription/translation.',
          latex: '\\text{Phenotypic Ratio (Dihybrid)} = 9 : 3 : 3 : 1',
          keyIdea: 'DNA polymerase synthesizes complementary strands exclusively in the 5\' to 3\' direction.',
        },
      ],
    },
    amharic: {
      title: 'የአጠቃላይ ባዮሎጂ ማጠቃለያ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የህዋስ (Cell) አወቃቀር እና ተግባራት',
          body: 'የሴል ክፍሎች፣ የሴል ሜምብሬን እና ንጥረ-ነገሮችን የማስተላለፍ ስልቶች።',
          latex: '\\text{ህዋስ} = \\text{የህይወት መሰረታዊ አሀድ}',
          keyIdea: 'ሁሉም ህይወት ያላቸው ፍጥረታት ከአንድ ወይም ከበርካታ ህዋሶች የተገነቡ ናቸው።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'In eukaryotic cells, where does the Krebs (citric acid) cycle take place?',
        options: [
          { id: 'A', textLatex: 'Mitochondrial matrix' },
          { id: 'B', textLatex: 'Cytoplasm' },
          { id: 'C', textLatex: 'Mitochondrial inner membrane' },
          { id: 'D', textLatex: 'Endoplasmic reticulum' },
        ],
        correct: 'A',
        explanation: 'The Krebs cycle enzymes reside in the mitochondrial matrix, whereas glycolysis occurs in the cytoplasm.',
      },
      {
        prompt: 'What is the expected phenotypic ratio in the F2 generation of a classic Mendelian dihybrid cross?',
        options: [
          { id: 'A', textLatex: '$9:3:3:1$' },
          { id: 'B', textLatex: '$3:1$' },
          { id: 'C', textLatex: '$1:2:1$' },
          { id: 'D', textLatex: '$1:1:1:1$' },
        ],
        correct: 'A',
        explanation: 'Two heterozygous traits ($AaBb \\times AaBb$) yield the classic $9:3:3:1$ phenotypic ratio assuming independent assortment.',
      },
    ],
  },
  ANTH101: {
    code: 'ANTH101',
    title: 'Social Anthropology',
    modules: {
      title: 'Social Anthropology Core Module',
      chapters: [
        {
          title: 'Chapter 1: Nature of Anthropology & Sub-disciplines',
          body: 'Four-field approach: cultural anthropology, linguistic anthropology, biological/physical anthropology, and archaeological anthropology.',
          latex: '\\text{Holistic Perspective} = \\text{Biology} + \\text{Culture} + \\text{History} + \\text{Language}',
          keyIdea: 'Anthropology approaches human societies through comparative cross-cultural analysis.',
        },
        {
          title: 'Chapter 2: Culture, Relativism & Ethnocentrism',
          body: 'Characteristics of culture, symbolic communication, enculturation, cultural relativism vs moral relativism, and combating ethnocentrism.',
          latex: '\\text{Cultural Competence} = 1 - \\text{Ethnocentrism Index}',
          keyIdea: 'Cultural relativism requires understanding customs within their own indigenous context.',
        },
      ],
    },
    notes: {
      title: 'Anthropology Theories & Fieldwork Methods',
      chapters: [
        {
          title: 'Note 1: Ethnographic Research & Kinship Systems',
          body: 'Participant observation, genealogical method, lineage, clan, unilineal descent (patrilineal vs matrilineal), and marriage rules.',
          latex: '\\text{Descent Rule} \\in \\{\\text{Patrilineal}, \\text{Matrilineal}, \\text{Bilateral}\\}',
          keyIdea: 'Participant observation is the gold standard of anthropological empirical fieldwork.',
        },
      ],
    },
    amharic: {
      title: 'የማህበራዊ አንትሮፖሎጂ ማጠቃለያ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የአንትሮፖሎጂ ፅንሰ ሃሳብ እና ባህል',
          body: 'የሰው ልጅ አመጣጥ፣ የባህል እድገት እና የተለያዩ ህብረተሰቦች ባህላዊ እሴቶች ንፅፅራዊ ጥናት።',
          latex: '\\text{ባህል} = \\text{የተማርነው የህይወት ዘይቤ}',
          keyIdea: 'ባህል በማህበረሰቡ ውስጥ በመማር እና በመለማመድ ከአንዱ ትውልድ ወደ ቀጣዩ የሚተላለፍ ነው።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'Evaluating other cultures using the standards and customs of one\'s own culture is called:',
        options: [
          { id: 'A', textLatex: 'Ethnocentrism' },
          { id: 'B', textLatex: 'Cultural relativism' },
          { id: 'C', textLatex: 'Acculturation' },
          { id: 'D', textLatex: 'Assimilation' },
        ],
        correct: 'A',
        explanation: 'Ethnocentrism is the belief in the inherent superiority of one\'s own ethnic group or culture and using it as a benchmark.',
      },
      {
        prompt: 'The primary data collection method in sociocultural anthropology is:',
        options: [
          { id: 'A', textLatex: 'Participant observation' },
          { id: 'B', textLatex: 'Double-blind laboratory experiment' },
          { id: 'C', textLatex: 'Random telephone survey' },
          { id: 'D', textLatex: 'Computer simulation' },
        ],
        correct: 'A',
        explanation: 'Participant observation involves immersion in a community\'s daily life to record observations from an insider perspective.',
      },
    ],
  },
  ECON101: {
    code: 'ECON101',
    title: 'Introduction to Economics',
    modules: {
      title: 'Principles of Micro & Macroeconomics',
      chapters: [
        {
          title: 'Chapter 1: Scarcity, Opportunity Cost & PPF',
          body: 'Fundamental economic problem of unlimited wants versus scarce resources, production possibilities frontier, and marginal analysis.',
          latex: '\\text{Opportunity Cost} = \\frac{\\Delta \\text{Good } Y}{\\Delta \\text{Good } X}, \\quad \\text{Marginal Benefit} \\ge \\text{Marginal Cost}',
          keyIdea: 'Opportunity cost represents the next best alternative forgone when making an economic decision.',
        },
        {
          title: 'Chapter 2: Demand, Supply & Market Equilibrium',
          body: 'Laws of demand and supply, price elasticity ($E_d, E_s$), consumer and producer surplus, price ceilings, and deadweight loss.',
          latex: 'E_d = \\frac{\\%\\Delta Q_d}{\\%\\Delta P} = \\frac{\\Delta Q / Q}{\\Delta P / P}, \\quad Q_d(P^*) = Q_s(P^*)',
          keyIdea: 'Market equilibrium coordinates decentralized decisions without central planning.',
        },
      ],
    },
    notes: {
      title: 'Economics Formulae & Graph Summaries',
      chapters: [
        {
          title: 'Note 1: National Income & Macroeconomic Indicators',
          body: 'GDP expenditure approach ($C + I + G + NX$), inflation measurement via CPI, unemployment rate calculations, and monetary policy.',
          latex: 'Y = C + I + G + (X - M), \\quad \\text{CPI} = \\frac{\\text{Cost of Basket}_t}{\\text{Cost of Basket}_0} \\times 100',
          keyIdea: 'Real GDP adjusts nominal output for price inflation.',
        },
      ],
    },
    amharic: {
      title: 'የኢኮኖሚክስ መግቢያ ማጠቃለያ',
      chapters: [
        {
          title: 'ምዕራፍ 1: የፍላጎት እና የአቅርቦት ህጎች',
          body: 'የገበያ ሚዛን፣ የዋጋ ተፅዕኖ እና የሸማቾች ምርጫ በኢኮኖሚ ውስጥ ያላቸው ሚና።',
          latex: '\\text{ሚዛን} = \\text{ፍላጎት} == \\text{አቅርቦት}',
          keyIdea: 'ዋጋ በገበያ ውስጥ የአቅርቦት እና የፍላጎት መገናኛ ነጥብ ላይ ይወሰናል።',
        },
      ],
    },
    sampleQuestions: [
      {
        prompt: 'If the price elasticity of demand for a product is $-2.5$, demand is considered:',
        options: [
          { id: 'A', textLatex: 'Elastic' },
          { id: 'B', textLatex: 'Inelastic' },
          { id: 'C', textLatex: 'Unit elastic' },
          { id: 'D', textLatex: 'Perfectively inelastic' },
        ],
        correct: 'A',
        explanation: 'When $|E_d| > 1$, percentage change in quantity demanded exceeds percentage change in price, indicating price elastic demand.',
      },
      {
        prompt: 'In the national income identity $Y = C + I + G + NX$, what does $NX$ represent?',
        options: [
          { id: 'A', textLatex: 'Net Exports (Exports minus Imports)' },
          { id: 'B', textLatex: 'National Taxes' },
          { id: 'C', textLatex: 'Next Year Expansion' },
          { id: 'D', textLatex: 'Non-taxable income' },
        ],
        correct: 'A',
        explanation: '$NX$ represents Net Exports, calculated as total exports minus total imports ($X - M$).',
      },
    ],
  },
};

function deterministicUuid(seed: string): string {
  const hex = crypto.createHash('md5').update(seed).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function main() {
  console.log('=== Mastera Complete Seeding & MinIO Content Packaging ===');

  // 1. Get Super Admin for author/review IDs
  let superAdmin = await prisma.adminUser.findFirst({
    where: { adminRole: 'SUPER_ADMIN' },
  });
  if (!superAdmin) {
    superAdmin = await prisma.adminUser.create({
      data: {
        name: 'Super Admin',
        email: 'admin@mastara.demo',
        passwordHash: 'dummy_hash_for_cli',
        adminRole: 'SUPER_ADMIN',
        isActive: true,
      },
    });
  }

  // 2. Fetch all courses
  const courses = await prisma.course.findMany({
    where: { deletedAt: null },
  });
  console.log(`Found ${courses.length} courses in database.`);

  // 3. For each course, seed book groups, chapters, exam sets, and questions
  for (const course of courses) {
    const curriculum = CURRICULUM_DATA[course.code] || CURRICULUM_DATA['ENG101']!;
    console.log(`\nProcessing Course: ${course.code} - ${course.title}...`);

    // A. BookGroup 1: MODULES
    const bgModulesId = deterministicUuid(`bg-modules-${course.id}`);
    const bgModules = await prisma.bookGroup.upsert({
      where: { id: bgModulesId },
      update: { title: curriculum.modules.title },
      create: {
        id: bgModulesId,
        courseId: course.id,
        category: ContentCategory.MODULES,
        code: `BG-${course.code}-MOD`,
        title: curriculum.modules.title,
        subtitle: 'Core Curriculum & Modules',
        orderIndex: 1,
        version: 1,
      },
    });

    for (let i = 0; i < curriculum.modules.chapters.length; i++) {
      const ch = curriculum.modules.chapters[i]!;
      const chId = deterministicUuid(`ch-modules-${course.id}-${i}`);
      await prisma.content.upsert({
        where: { id: chId },
        update: {
          title: ch.title,
          bodyMarkdownLatex: `# ${ch.title}\n\n${ch.body}\n\n$$${ch.latex}$$\n\n> **Key Idea**: ${ch.keyIdea}`,
          status: ContentStatus.PUBLISHED,
        },
        create: {
          id: chId,
          courseId: course.id,
          bookGroupId: bgModules.id,
          category: ContentCategory.MODULES,
          orderIndex: i + 1,
          title: ch.title,
          bodyMarkdownLatex: `# ${ch.title}\n\n${ch.body}\n\n$$${ch.latex}$$\n\n> **Key Idea**: ${ch.keyIdea}`,
          isFree: i === 0,
          status: ContentStatus.PUBLISHED,
          authoredById: superAdmin.id,
          reviewedById: superAdmin.id,
          version: 1,
        },
      });
    }

    // B. BookGroup 2: NOTES
    const bgNotesId = deterministicUuid(`bg-notes-${course.id}`);
    const bgNotes = await prisma.bookGroup.upsert({
      where: { id: bgNotesId },
      update: { title: curriculum.notes.title },
      create: {
        id: bgNotesId,
        courseId: course.id,
        category: ContentCategory.NOTES,
        code: `BG-${course.code}-NOT`,
        title: curriculum.notes.title,
        subtitle: 'Lecture Notes & Formula Sheets',
        orderIndex: 2,
        version: 1,
      },
    });

    for (let i = 0; i < curriculum.notes.chapters.length; i++) {
      const ch = curriculum.notes.chapters[i]!;
      const chId = deterministicUuid(`ch-notes-${course.id}-${i}`);
      await prisma.content.upsert({
        where: { id: chId },
        update: {
          title: ch.title,
          bodyMarkdownLatex: `# ${ch.title}\n\n${ch.body}\n\n$$${ch.latex}$$\n\n> **Summary**: ${ch.keyIdea}`,
          status: ContentStatus.PUBLISHED,
        },
        create: {
          id: chId,
          courseId: course.id,
          bookGroupId: bgNotes.id,
          category: ContentCategory.NOTES,
          orderIndex: i + 1,
          title: ch.title,
          bodyMarkdownLatex: `# ${ch.title}\n\n${ch.body}\n\n$$${ch.latex}$$\n\n> **Summary**: ${ch.keyIdea}`,
          isFree: false,
          status: ContentStatus.PUBLISHED,
          authoredById: superAdmin.id,
          reviewedById: superAdmin.id,
          version: 1,
        },
      });
    }

    // C. BookGroup 3: AMHARIC_NOTE
    const bgAmharicId = deterministicUuid(`bg-amharic-${course.id}`);
    const bgAmharic = await prisma.bookGroup.upsert({
      where: { id: bgAmharicId },
      update: { title: curriculum.amharic.title },
      create: {
        id: bgAmharicId,
        courseId: course.id,
        category: ContentCategory.AMHARIC_NOTE,
        code: `BG-${course.code}-AMH`,
        title: curriculum.amharic.title,
        subtitle: 'የአማርኛ ማጠቃለያ ማስታወሻ',
        orderIndex: 3,
        version: 1,
      },
    });

    for (let i = 0; i < curriculum.amharic.chapters.length; i++) {
      const ch = curriculum.amharic.chapters[i]!;
      const chId = deterministicUuid(`ch-amharic-${course.id}-${i}`);
      await prisma.content.upsert({
        where: { id: chId },
        update: {
          title: ch.title,
          bodyMarkdownLatex: `# ${ch.title}\n\n${ch.body}\n\n$$${ch.latex}$$\n\n> **ዋና ሃሳብ**: ${ch.keyIdea}`,
          status: ContentStatus.PUBLISHED,
        },
        create: {
          id: chId,
          courseId: course.id,
          bookGroupId: bgAmharic.id,
          category: ContentCategory.AMHARIC_NOTE,
          orderIndex: i + 1,
          title: ch.title,
          bodyMarkdownLatex: `# ${ch.title}\n\n${ch.body}\n\n$$${ch.latex}$$\n\n> **ዋና ሃሳብ**: ${ch.keyIdea}`,
          isFree: false,
          status: ContentStatus.PUBLISHED,
          authoredById: superAdmin.id,
          reviewedById: superAdmin.id,
          version: 1,
        },
      });
    }

    // D. Exam Sets: MID, FINAL, MOCK, COC
    const examCategories: ExamCategory[] = [
      ExamCategory.MID,
      ExamCategory.FINAL,
      ExamCategory.MOCK,
      ExamCategory.COC,
    ];

    for (let eIdx = 0; eIdx < examCategories.length; eIdx++) {
      const cat = examCategories[eIdx]!;
      const catLabel =
        cat === 'MID'
          ? 'Mid-Semester Examination'
          : cat === 'FINAL'
          ? 'Final Comprehensive Examination'
          : cat === 'MOCK'
          ? 'National Standard Mock Examination'
          : 'National COC Certification Assessment';

      const examSetId = deterministicUuid(`exam-${course.id}-${cat}`);
      const examSet = await prisma.examSet.upsert({
        where: { id: examSetId },
        update: {
          title: `${course.title} · ${catLabel}`,
          status: ContentStatus.PUBLISHED,
        },
        create: {
          id: examSetId,
          courseId: course.id,
          examSetCode: `EXAM-${course.code}-${cat}-2026`,
          category: cat,
          title: `${course.title} · ${catLabel}`,
          semester: 1,
          year: '2026',
          timeAllowedMinutes: cat === 'MID' ? 60 : 90,
          isFreeSample: cat === 'MID',
          status: ContentStatus.PUBLISHED,
          authoredById: superAdmin.id,
          version: 1,
        },
      });

      // Seed questions per exam set
      for (let qIdx = 0; qIdx < curriculum.sampleQuestions.length; qIdx++) {
        const sq = curriculum.sampleQuestions[qIdx]!;
        const qId = deterministicUuid(`q-${examSet.id}-${qIdx}`);
        await prisma.question.upsert({
          where: { id: qId },
          update: {
            promptLatex: sq.prompt,
            optionsJson: sq.options,
            correctOptionId: sq.correct,
            explanationLatex: sq.explanation,
            status: ContentStatus.PUBLISHED,
          },
          create: {
            id: qId,
            examSet: { connect: { id: examSet.id } },
            displayNumber: qIdx + 1,
            questionType: QuestionType.MULTIPLE_CHOICE,
            promptLatex: sq.prompt,
            optionsJson: sq.options,
            correctOptionId: sq.correct,
            explanationLatex: sq.explanation,
            status: ContentStatus.PUBLISHED,
            authoredById: superAdmin.id,
          },
        });
      }
    }

    // E. Assemble, GZIP, and Upload .pkg Archive to MinIO Object Storage
    const allChapters = await prisma.content.findMany({
      where: { courseId: course.id, deletedAt: null },
      include: { bookGroup: true },
      orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
    });

    const allExams = await prisma.examSet.findMany({
      where: { courseId: course.id, deletedAt: null },
      include: { questions: { orderBy: { displayNumber: 'asc' } } },
    });

    const packagePayload = {
      formatVersion: '1.0.0',
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      contentVersion: course.contentVersion || 1,
      universityName: 'Mastera National Curriculum',
      programName: 'Freshman Department',
      semester: course.semester,
      stream: course.stream,
      generatedAt: new Date().toISOString(),
      chapters: allChapters.map((ch) => ({
        id: ch.id,
        bookGroupId: ch.bookGroupId,
        bookGroupTitle: ch.bookGroup?.title ?? '',
        category: ch.category,
        orderIndex: ch.orderIndex,
        title: ch.title,
        bodyMarkdownLatex: ch.bodyMarkdownLatex,
        pdfStorageKey: ch.pdfStorageKey,
        isFree: ch.isFree,
        timeAllowedMinutes: ch.timeAllowedMinutes,
        estimatedSizeBytes: ch.estimatedSizeBytes,
        version: ch.version,
        status: ch.status,
      })),
      exams: allExams.map((ex) => ({
        id: ex.id,
        examSetCode: ex.examSetCode,
        title: ex.title,
        category: ex.category,
        year: ex.year,
        timeAllowedMinutes: ex.timeAllowedMinutes,
        isFreeSample: ex.isFreeSample,
        version: ex.version,
        questions: ex.questions.map((q) => ({
          id: q.id,
          displayNumber: q.displayNumber,
          questionType: q.questionType,
          promptLatex: q.promptLatex,
          optionsJson: q.optionsJson,
          correctOptionId: q.correctOptionId,
          explanationLatex: q.explanationLatex,
        })),
      })),
    };

    const jsonBuffer = Buffer.from(JSON.stringify(packagePayload), 'utf8');
    const gzippedBuffer = zlib.gzipSync(jsonBuffer, { level: 9 });
    const sha256Hex = crypto.createHash('sha256').update(gzippedBuffer).digest('hex');

    const storageKey = `packages/${course.id}/package-v${course.contentVersion || 1}.pkg`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: storageKey,
        Body: gzippedBuffer,
        ContentType: 'application/octet-stream',
      })
    );

    await prisma.courseContentPackage.upsert({
      where: {
        courseId_version: {
          courseId: course.id,
          version: course.contentVersion || 1,
        },
      },
      update: {
        storageKey,
        sha256Hex: sha256Hex,
        sizeBytes: gzippedBuffer.length,
      },
      create: {
        courseId: course.id,
        version: course.contentVersion || 1,
        storageKey,
        sha256Hex: sha256Hex,
        sizeBytes: gzippedBuffer.length,
      },
    });

    console.log(`  ✓ MinIO Package uploaded: ${storageKey} (${gzippedBuffer.length} bytes, SHA256: ${sha256Hex.slice(0, 12)}...)`);
  }

  // 4. Bump Catalog Counter in PostgreSQL
  await prisma.counter.upsert({
    where: { key: 'catalog_version' },
    update: { value: { increment: 1 } },
    create: { key: 'catalog_version', value: 10 },
  });

  console.log('\n=== Seeding and MinIO Package Generation Complete! ===');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
