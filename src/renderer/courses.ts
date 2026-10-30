export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  paragraphs: string[];
  takeaways: string[];
  practice: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  outcome: string;
  lessons: Lesson[];
}

export const courses: Course[] = [
  {
    id: 'ai-essentials',
    title: 'AI essentials',
    description:
      'Understand what an AI assistant can do, where it falls short, and how to begin.',
    outcome: 'Choose a useful first task and give AI the right information.',
    lessons: [
      {
        id: 'strengths-and-limits',
        title: 'What AI can—and cannot—do',
        minutes: 3,
        paragraphs: [
          'An AI assistant generates a response from your instructions and the context available to it. It can help draft, explain, organize, and explore ideas. A clear answer is a useful starting point, but it is not proof that the answer is correct.',
          'The assistant can invent facts, miss a constraint, or misunderstand your intent. It does not automatically know your files, current events, or personal situation. Give it the relevant information and review what it produces.',
        ],
        takeaways: [
          'Start with a task you can review, such as rewriting a short paragraph.',
          'Ask the assistant to identify assumptions and missing information.',
          'Check important claims before acting on them.',
        ],
        practice:
          'Explain what an AI assistant can help me do in my daily work. Give three small tasks I can try today, and one thing I should check in each result.',
        question: 'Which is the best way to treat an AI-generated answer?',
        options: [
          'As a draft to review and verify',
          'As a guaranteed fact if it sounds confident',
          'As proof that the assistant searched the web',
        ],
        answer: 0,
        explanation:
          'Fluent answers can still be wrong. Review the output and verify claims that matter.',
      },
      {
        id: 'choose-a-task',
        title: 'Choose a useful first task',
        minutes: 3,
        paragraphs: [
          'Make your first task small enough to judge. “Improve my work” is vague; “Turn these notes into a five-item meeting agenda” gives the assistant a clear job and gives you a clear way to evaluate the result.',
          'Supply the material the assistant should work from. Explain who the output is for and what a good result looks like. You can then compare the response against those requirements.',
        ],
        takeaways: [
          'Choose one task at a time.',
          'Provide the notes or text the task depends on.',
          'Name the audience, length, and desired format.',
        ],
        practice:
          'Turn these notes into a five-item meeting agenda for a 30-minute team meeting. Keep each item under 15 words. Do not invent decisions. Notes: [paste non-sensitive notes].',
        question: 'Which request gives the assistant the clearest task?',
        options: [
          'Help with everything',
          'Make this better',
          'Rewrite this paragraph for beginners in under 100 words',
        ],
        answer: 2,
        explanation:
          'A specific input, audience, and length make the result easier to produce and evaluate.',
      },
      {
        id: 'share-context-carefully',
        title: 'Share context carefully',
        minutes: 3,
        paragraphs: [
          'Context helps, but more information is not always better. Share only what the task needs. Replace real names, contact details, and confidential values with placeholders where possible.',
          'Check your organization’s rules and the service’s data controls before sharing sensitive material. A chat interface can send your text to an external provider. Removing a name alone may not make a document anonymous.',
        ],
        takeaways: [
          'Keep passwords, access keys, and private account details out of prompts.',
          'Use fictional examples or placeholders when they are enough.',
          'Review both the prompt and the output before sharing them.',
        ],
        practice:
          'Help me make a reusable customer-support reply template. Use [customer name], [order number], and [delivery date] as placeholders. Do not ask for real customer records.',
        question: 'What should you do before pasting a confidential document?',
        options: [
          'Paste it first and remove it later',
          'Check the sharing rules and minimize sensitive information',
          'Only change the file name',
        ],
        answer: 1,
        explanation:
          'Review the applicable rules and provide the minimum information needed before sharing anything sensitive.',
      },
    ],
  },
  {
    id: 'better-prompts',
    title: 'Write better prompts',
    description:
      'Turn a vague request into clear instructions, then improve the result with feedback.',
    outcome:
      'Build prompts with a goal, context, constraints, and output format.',
    lessons: [
      {
        id: 'a-clear-brief',
        title: 'Build a clear brief',
        minutes: 4,
        paragraphs: [
          'A useful prompt explains the goal, supplies relevant context, and describes the output you want. You do not need special phrases. Plain instructions usually give you a better starting point than a long list of impressive-sounding roles.',
          'Separate requirements from background. If something must be included or excluded, say so directly. Ask the assistant to clarify missing details when they could change the answer.',
        ],
        takeaways: [
          'Goal: what should the assistant produce?',
          'Context: what facts or source material should it use?',
          'Constraints and format: what limits and structure should it follow?',
        ],
        practice:
          'Draft a friendly email asking a teammate to review a proposal by Friday. Context: they already agreed to help. Keep it under 100 words. Include a clear request and a thank-you. Leave names as placeholders.',
        question: 'What is missing from “Write something about our project”?',
        options: [
          'More technical jargon',
          'A clear goal, audience, and relevant context',
          'A demand to be absolutely certain',
        ],
        answer: 1,
        explanation:
          'The assistant needs to know the job, the intended reader, and the facts it should work from.',
      },
      {
        id: 'examples-and-format',
        title: 'Show the format you want',
        minutes: 3,
        paragraphs: [
          'An example can explain a desired format more clearly than a description. Show one or two representative examples and tell the assistant which parts to imitate, such as the tone, fields, or level of detail.',
          'Examples are instructions, not verified evidence. Check that the assistant follows the structure without copying incorrect details or inventing missing information.',
        ],
        takeaways: [
          'Provide a small example of the desired output.',
          'Use headings, bullet points, or table columns explicitly.',
          'Tell the assistant how to handle unknown values.',
        ],
        practice:
          'Extract action items from these notes as a table with Task, Owner, and Due date. Use “Not specified” when an owner or date is missing. Notes: [paste notes].',
        question:
          'If a source does not name an owner, what should the assistant do?',
        options: [
          'Guess a likely person',
          'Omit the whole task',
          'Mark the owner as not specified',
        ],
        answer: 2,
        explanation:
          'Explicitly marking missing information prevents a useful-looking table from quietly inventing facts.',
      },
      {
        id: 'iterate-with-feedback',
        title: 'Improve an answer with feedback',
        minutes: 3,
        paragraphs: [
          'Treat the first response as a draft. Name what works and what needs to change. “Keep the structure, simplify the language, and add one example” is more actionable than “Try harder.”',
          'A follow-up can use earlier context when conversation memory is enabled. Start a new chat or reset memory when changing topics so old instructions do not influence an unrelated task.',
        ],
        takeaways: [
          'Change one or two things at a time.',
          'Explain the problem with a concrete example.',
          'Use a fresh conversation for a substantially different task.',
        ],
        practice:
          'Revise your previous answer. Keep the three headings, replace jargon with plain language, and add a short example under each heading. Preserve the original facts.',
        question: 'Which feedback is most useful?',
        options: [
          'Keep the outline, shorten the sentences, and add a concrete example',
          'Wrong',
          'Make it amazing',
        ],
        answer: 0,
        explanation:
          'Specific feedback tells the assistant which parts to preserve and which parts to change.',
      },
    ],
  },
  {
    id: 'check-ai-answers',
    title: 'Check AI answers',
    description:
      'Spot unsupported claims, inspect sources, and decide when a human check is needed.',
    outcome:
      'Use a repeatable review process before trusting or sharing AI output.',
    lessons: [
      {
        id: 'confidence-is-not-evidence',
        title: 'Confidence is not evidence',
        minutes: 3,
        paragraphs: [
          'An answer can be polished and still be inaccurate. Look closely at names, dates, numbers, quotations, and claims that affect a decision. Asking the same assistant whether it is correct is not an independent check.',
          'Separate facts from suggestions. For a summary, compare key statements with the original material. For calculations, recompute the result. For code, inspect it and test it in an appropriate environment.',
        ],
        takeaways: [
          'Identify the claims that matter most.',
          'Verify against original material or independent evidence.',
          'Keep uncertainty visible instead of turning guesses into facts.',
        ],
        practice:
          'Review this draft. List factual claims that need verification, assumptions that are not stated, and questions a reviewer should ask. Do not invent supporting evidence. Draft: [paste text].',
        question: 'What is the strongest check on a summary?',
        options: [
          'The summary uses professional language',
          'The assistant says it is certain',
          'Its key claims match the original material',
        ],
        answer: 2,
        explanation:
          'Comparison with the source checks whether the summary actually preserves the underlying information.',
      },
      {
        id: 'verify-sources',
        title: 'Inspect the source yourself',
        minutes: 4,
        paragraphs: [
          'A citation is a starting point for checking a claim. Open the source, confirm it exists, and find the passage that supports the statement. A real link can still point to a page that says something different.',
          'Check the publication date and the date of the event or data. Prefer the original document, official guidance, or research paper when it fits the question. If the assistant cannot access sources, do not assume it has verified them.',
        ],
        takeaways: [
          'Confirm the source exists and supports the exact claim.',
          'Check whether the information is current enough for your task.',
          'Distinguish a direct quotation from an interpretation.',
        ],
        practice:
          'For each factual claim in this paragraph, identify the kind of primary source needed to verify it. If you cannot access a source, say so. Paragraph: [paste text].',
        question: 'A response includes a real link. What should you do next?',
        options: [
          'Assume every claim is verified',
          'Read it and confirm it supports the specific claim',
          'Only check whether the title looks relevant',
        ],
        answer: 1,
        explanation:
          'A source must support the specific statement, not simply discuss the same general topic.',
      },
      {
        id: 'keep-human-judgment',
        title: 'Keep human judgment in the loop',
        minutes: 3,
        paragraphs: [
          'AI suggestions can reflect incomplete information and biases. Ask whose perspective is missing, which assumptions affect the result, and what evidence would change the recommendation.',
          'Match the review effort to the consequences. A brainstorming list needs a different review from advice that could affect someone’s health, rights, or finances. Use qualified people and authoritative information for consequential decisions.',
        ],
        takeaways: [
          'Compare alternatives using criteria you choose.',
          'Look for missing perspectives and unsupported assumptions.',
          'Keep responsibility for consequential decisions with an appropriate human.',
        ],
        practice:
          'Compare these two project approaches using cost, maintenance, and ease of use. State assumptions, describe tradeoffs, and list missing information that could change the comparison. Approaches: [describe them].',
        question:
          'What should happen when a suggestion has serious consequences?',
        options: [
          'Use appropriate expert review and authoritative information',
          'Act immediately because AI is fast',
          'Ask for a more confident tone',
        ],
        answer: 0,
        explanation:
          'Higher consequences call for stronger evidence and appropriate human expertise.',
      },
    ],
  },
  {
    id: 'everyday-ai',
    title: 'AI for everyday work',
    description:
      'Practice drafting, learning, and planning with tasks you can use right away.',
    outcome:
      'Create reusable workflows while staying in control of the final result.',
    lessons: [
      {
        id: 'draft-and-edit',
        title: 'Draft and edit with intention',
        minutes: 3,
        paragraphs: [
          'Give the assistant the purpose, audience, and essential facts before asking for a draft. If you already have a rough version, ask for targeted edits so you can preserve your voice.',
          'Read the result before sending it. Check names, commitments, tone, and any facts the assistant added. A draft should not make promises on your behalf that you did not intend.',
        ],
        takeaways: [
          'Supply the facts the draft must preserve.',
          'Name the audience and desired tone.',
          'Review and send the final version yourself.',
        ],
        practice:
          'Rewrite this update to be clear and friendly. Keep every factual detail, do not add promises, and limit it to 120 words. Draft: [paste your update].',
        question: 'Before sending an AI-drafted email, what should you check?',
        options: [
          'Only the spelling',
          'Nothing if the tone is friendly',
          'The facts, tone, and commitments',
        ],
        answer: 2,
        explanation:
          'A well-written email can still add an incorrect detail or a commitment you never intended to make.',
      },
      {
        id: 'learn-actively',
        title: 'Use AI as a study partner',
        minutes: 3,
        paragraphs: [
          'Ask for an explanation matched to what you already know, then test your understanding. You can request an analogy, a worked example, and a short question to answer yourself.',
          'Learning works better when you actively attempt the task. Ask the assistant to wait for your answer before giving a solution. Check unfamiliar claims against reliable learning materials.',
        ],
        takeaways: [
          'Describe your current level and learning goal.',
          'Ask for one question at a time.',
          'Explain the idea back in your own words.',
        ],
        practice:
          'Help me understand [topic] as a beginner. Explain the main idea with a simple example, then ask me one question. Wait for my answer before giving feedback.',
        question: 'Which activity helps you check your own understanding?',
        options: [
          'Copying the explanation without reading it',
          'Attempting a question before seeing the solution',
          'Asking for a longer explanation every time',
        ],
        answer: 1,
        explanation:
          'Trying the question yourself reveals what you understand and where you need more practice.',
      },
      {
        id: 'plan-and-organize',
        title: 'Turn ideas into an actionable plan',
        minutes: 3,
        paragraphs: [
          'AI can help turn a rough goal into steps, but it needs real constraints. Tell it your available time, resources, deadline, and what you have already done. Ask it to mark estimates as estimates.',
          'Check whether the sequence is realistic and whether any dependencies are missing. Pick a next step you can actually take, then revise the plan as you learn more.',
        ],
        takeaways: [
          'State your goal and practical constraints.',
          'Ask for dependencies and assumptions alongside the steps.',
          'Choose the next action and keep the plan up to date.',
        ],
        practice:
          'Help me plan [goal]. I have [time] each week and [resources]. Suggest five steps, label time estimates, list dependencies, and identify one action I can take today.',
        question: 'What makes an AI-generated plan useful?',
        options: [
          'It fits your real constraints and has reviewable next steps',
          'It has as many steps as possible',
          'It treats every estimate as certain',
        ],
        answer: 0,
        explanation:
          'A useful plan fits the situation, exposes assumptions, and helps you decide what to do next.',
      },
    ],
  },
  {
    id: 'ai-ready-website',
    title: 'Make your site AI-ready',
    description:
      'Help AI search and assistants find your pages, read them correctly, and quote them in answers.',
    outcome:
      'Decide what AI crawlers may read, publish a clear map, and write pages that answer questions directly.',
    lessons: [
      {
        id: 'welcome-the-crawlers',
        title: 'Decide what AI crawlers may read',
        minutes: 4,
        paragraphs: [
          'AI search tools and assistants fetch pages with crawlers of their own, often under names such as GPTBot, ClaudeBot, or PerplexityBot. A robots.txt file at the root of your site states which of them may fetch which parts. Search crawlers and AI crawlers can be allowed or blocked separately, so a site can be visible in search results while staying invisible to AI answers.',
          'Blocking an AI crawler is a policy choice, not a technical shield. Well-behaved crawlers follow robots.txt; others may not. If your pages should be cited in AI answers, the crawlers behind those answers have to be able to reach them. Check each provider’s documentation, keep the rules short enough to audit, and revisit them when your priorities change.',
        ],
        takeaways: [
          'Read your robots.txt as an outside crawler would.',
          'Decide separately whether AI search, AI training, and AI browsing are welcome.',
          'Keep pages you want cited reachable by the crawlers that answer questions.',
        ],
        practice:
          'Explain what this robots.txt says about AI crawlers, and list which user agents it allows or blocks. Then suggest the smallest change that would let AI search read the public articles while keeping account pages out. robots.txt: [paste the file].',
        question:
          'You want your public articles quoted in AI answers. What matters most?',
        options: [
          'Allowing the crawlers that fetch pages for AI answers to reach those articles',
          'Adding the word AI to every heading',
          'Blocking every bot except traditional search engines',
        ],
        answer: 0,
        explanation:
          'An assistant can only quote a page that its crawler was able to fetch. Access comes first; wording comes later.',
      },
      {
        id: 'machine-readable-map',
        title: 'Give AI a clear map of your site',
        minutes: 4,
        paragraphs: [
          'Crawlers work better with a guide. A sitemap.xml lists your canonical URLs. A short llms.txt at the root can summarize what the site is and link to the pages worth reading, in plain text. A few lines of JSON-LD structured data can describe the organization, product, or article so key facts do not have to be guessed from the layout.',
          'Every map has to match the site. Remove dead links, keep descriptions factual, and leave out pages that are private or marked noindex. If you publish an API or an agent endpoint, document it in the same spirit: stable URLs, an honest scope, and machine-readable details instead of marketing language.',
        ],
        takeaways: [
          'Start with a correct sitemap and plain descriptions of your pages.',
          'Use llms.txt for a short overview and curated links, not a second copy of the site.',
          'Describe key entities with structured data, and keep every pointer working.',
        ],
        practice:
          'Draft an llms.txt for this website. Include a one-sentence summary, then list up to eight public pages with a short note on what each one answers. Leave out private and sign-in pages. Site outline: [paste your pages].',
        question: 'What makes an llms.txt useful to an AI system?',
        options: [
          'A brief summary plus working links to pages worth reading',
          'Every page of the site reproduced in full',
          'As many keywords as fit in one file',
        ],
        answer: 0,
        explanation:
          'A short, accurate overview with working links helps a system choose where to look; a copy of the site only adds noise.',
      },
      {
        id: 'answer-engine-ready',
        title: 'Write pages AI can quote',
        minutes: 4,
        paragraphs: [
          'AI answers are assembled from passages. A page that states its answer early, uses headings that match real questions, and defines its terms is easier to select and quote. Put the conclusion first, then the supporting detail. Use lists and tables where they clarify, and give every fact a date.',
          'Accuracy beats persuasion. Invented statistics, vague superlatives, and claims without context give an assistant little reliable material. Say who you are, what you offer, and what has changed. Keep pricing and availability current, and make the same facts visible in the HTML rather than only inside images or scripts.',
        ],
        takeaways: [
          'Answer the main question in the first paragraph.',
          'Use descriptive headings, dated facts, and concrete details.',
          'Keep the text readable without JavaScript, images, or decoration.',
        ],
        practice:
          'Rewrite this page section so an AI assistant can quote it in one sentence. Lead with the direct answer, keep the facts and dates, drop vague claims, and use a short heading that matches the question a customer would ask. Section: [paste text].',
        question:
          'Which page is easiest for an AI assistant to cite accurately?',
        options: [
          'A clear answer up front with dated, specific facts',
          'A long introduction that builds suspense before the answer',
          'Key facts shown only inside a promotional image',
        ],
        answer: 0,
        explanation:
          'Assistants select passages that answer the question directly. Specific, dated text is easier to quote without distortion.',
      },
    ],
  },
];
