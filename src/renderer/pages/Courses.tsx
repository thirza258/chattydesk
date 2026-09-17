import { ReactNode, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courses, Course, Lesson } from '../courses';
import { readStored, writeStored } from '../storage';
import { usePageMeta } from '../pageMeta';
import { webChatURL } from '../../constant';
import { IconArrowRight, IconCheck, IconLogo } from '../components/icons';

const PROGRESS_KEY = 'chattydesk.courses.completed.v1';
const lessonKey = (courseId: string, lessonId: string) =>
  `${courseId}/${lessonId}`;
const validLessons = new Set(
  courses.flatMap((course) =>
    course.lessons.map((lesson) => lessonKey(course.id, lesson.id)),
  ),
);
const actionClass =
  'inline-flex min-h-11 items-center justify-center gap-2 bg-ink px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-rust focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust disabled:cursor-not-allowed disabled:opacity-50';

function useCourseProgress() {
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(readStored(PROGRESS_KEY) || '[]');
      return Array.isArray(saved)
        ? [
            ...new Set(
              saved.filter(
                (id): id is string =>
                  typeof id === 'string' && validLessons.has(id),
              ),
            ),
          ]
        : [];
    } catch {
      return [];
    }
  });
  const complete = (id: string) => {
    if (completed.includes(id)) return;
    const next = [...completed, id];
    setCompleted(next);
    writeStored(PROGRESS_KEY, JSON.stringify(next));
  };
  return { completed, complete };
}

function CourseShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b-2 border-ink bg-paper-raised">
        <nav
          aria-label="Learning navigation"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8"
        >
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
          >
            <IconLogo className="h-6 w-6" />
            ChattyDesk
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/courses"
              className="py-2 text-ink-soft hover:text-rust-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
            >
              All courses
            </Link>
            {webChatURL ? (
              <a href={webChatURL} className={actionClass}>
                Open chat
              </a>
            ) : (
              <Link to="/chat" className={actionClass}>
                Open chat
              </Link>
            )}
          </div>
        </nav>
      </header>
      {children}
      <footer className="mx-auto max-w-6xl border-t border-hairline px-5 py-6 text-xs leading-relaxed text-ink-soft sm:px-8">
        Free lessons by ChattyDesk. Progress is saved in this browser. No
        account required.
      </footer>
    </div>
  );
}

export function Courses() {
  usePageMeta({
    title: 'AI courses · ChattyDesk',
    description:
      'Learn practical AI skills with free beginner lessons, practice prompts, and knowledge checks.',
    path: '/courses',
  });
  const { completed } = useCourseProgress();
  return (
    <CourseShell>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="flex flex-col justify-between gap-8 border-b-2 border-ink pb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-rust">
              The learning desk · Beginner friendly
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              AI, made practical.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Learn how to ask better questions, check the answers, and use AI
              in everyday work. Short lessons. Useful examples. Your own pace.
            </p>
          </div>
          <div className="w-full border-2 border-ink bg-paper-raised p-5 shadow-tactile-sm md:w-64 md:shrink-0">
            <p className="text-sm font-semibold">Your learning progress</p>
            <p className="mt-2 font-mono text-xs text-ink-soft">
              {completed.length} of {validLessons.size} lessons complete
            </p>
            <progress
              aria-label="Total learning progress"
              value={completed.length}
              max={validLessons.size}
              className="course-progress mt-3 h-2 w-full"
            />
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {courses.map((course, index) => {
            const done = course.lessons.filter((lesson) =>
              completed.includes(lessonKey(course.id, lesson.id)),
            ).length;
            const next =
              course.lessons.find(
                (lesson) =>
                  !completed.includes(lessonKey(course.id, lesson.id)),
              ) || course.lessons[0];
            let actionLabel = 'Start course';
            if (done === course.lessons.length) actionLabel = 'Review course';
            else if (done > 0) actionLabel = 'Continue course';
            return (
              <article
                key={course.id}
                className="flex min-w-0 flex-col border-2 border-ink bg-paper-raised p-6 shadow-tactile-sm sm:p-7"
              >
                <div className="flex items-center justify-between font-mono text-xs text-ink-faint">
                  <span className="text-rust">0{index + 1} / COURSE</span>
                  <span>
                    {course.lessons.length} lessons ·{' '}
                    {course.lessons.reduce(
                      (total, lesson) => total + lesson.minutes,
                      0,
                    )}{' '}
                    min
                  </span>
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold">
                  {course.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {course.description}
                </p>
                <ul className="my-5 space-y-2 border-t border-hairline pt-4">
                  {course.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <IconCheck
                        className={`h-4 w-4 shrink-0 ${completed.includes(lessonKey(course.id, lesson.id)) ? 'text-pine' : 'text-hairline-strong'}`}
                      />
                      {lesson.title}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
                  <p className="text-xs text-ink-soft">
                    {done === course.lessons.length
                      ? 'Course complete'
                      : `${done} of ${course.lessons.length} lessons complete`}
                  </p>
                  <Link
                    to={`/courses/${course.id}/${next.id}`}
                    className={actionClass}
                  >
                    {actionLabel}
                    <IconArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </CourseShell>
  );
}

interface LessonContentProps {
  course: Course;
  lesson: Lesson;
  completed: boolean;
  onComplete: () => void;
}

function LessonContent({
  course,
  lesson,
  completed,
  onComplete,
}: LessonContentProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const index = course.lessons.indexOf(lesson);
  const next = course.lessons[index + 1];
  const previous = course.lessons[index - 1];
  const correct = selected === lesson.answer;
  const copyPractice = async () => {
    try {
      await navigator.clipboard.writeText(lesson.practice);
      setCopyStatus('Prompt copied.');
    } catch {
      setCopyStatus('Select the prompt text to copy it manually.');
    }
  };
  return (
    <article className="min-w-0">
      <p className="font-mono text-xs uppercase tracking-wider text-rust">
        Lesson {index + 1} of {course.lessons.length} · {lesson.minutes} min
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {lesson.title}
      </h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-ink-soft">
        {lesson.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <section className="my-7 border-l-4 border-rust bg-rust-soft p-5">
        <h2 className="font-semibold">Take it with you</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
          {lesson.takeaways.map((takeaway) => (
            <li key={takeaway}>{takeaway}</li>
          ))}
        </ul>
      </section>
      <section className="border-2 border-ink bg-paper-raised p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">
            Try this prompt
          </h2>
          <button
            type="button"
            onClick={copyPractice}
            className="min-h-10 border border-hairline-strong px-3 text-xs font-medium hover:border-rust focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
          >
            Copy prompt
          </button>
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-ink-soft">
          {lesson.practice}
        </p>
        {copyStatus && (
          <p role="status" className="mt-3 text-xs text-rust-deep">
            {copyStatus}
          </p>
        )}
      </section>
      <section className="mt-8 border-t-2 border-ink pt-6">
        <h2 className="font-display text-2xl font-semibold">
          Check your understanding
        </h2>
        <fieldset className="mt-4">
          <legend className="mb-3 text-sm font-medium">
            {lesson.question}
          </legend>
          <div className="space-y-2">
            {lesson.options.map((option, optionIndex) => (
              <label
                key={option}
                htmlFor={`answer-${lesson.id}-${optionIndex}`}
                className={`flex cursor-pointer items-start gap-3 border p-4 text-sm leading-relaxed ${selected === optionIndex ? 'border-rust bg-rust-soft' : 'border-hairline-strong bg-paper-raised hover:border-ink'}`}
              >
                <input
                  id={`answer-${lesson.id}-${optionIndex}`}
                  type="radio"
                  name={`answer-${lesson.id}`}
                  checked={selected === optionIndex}
                  onChange={() => {
                    setSelected(optionIndex);
                    setChecked(false);
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-rust"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          disabled={selected === null}
          onClick={() => {
            setChecked(true);
            if (correct) onComplete();
          }}
          className={`${actionClass} mt-4`}
        >
          Check answer
        </button>
        {checked && (
          <p
            role="status"
            className={`mt-4 border-l-4 p-4 text-sm leading-relaxed ${correct ? 'border-pine bg-pine-soft text-pine' : 'border-rust bg-rust-soft text-rust-deep'}`}
          >
            <strong>{correct ? 'Correct. ' : 'Not quite. '}</strong>
            {lesson.explanation}
            {!correct && ' Choose another answer and try again.'}
          </p>
        )}
      </section>
      <nav
        aria-label="Lesson navigation"
        className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6"
      >
        {previous ? (
          <Link
            to={`/courses/${course.id}/${previous.id}`}
            className="py-2 text-sm text-ink-soft underline underline-offset-4"
          >
            ← Previous lesson
          </Link>
        ) : (
          <Link
            to="/courses"
            className="py-2 text-sm text-ink-soft underline underline-offset-4"
          >
            ← All courses
          </Link>
        )}
        {completed &&
          (next ? (
            <Link
              to={`/courses/${course.id}/${next.id}`}
              className={actionClass}
            >
              Next lesson <IconArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link to="/courses" className={actionClass}>
              Course complete <IconCheck className="h-4 w-4" />
            </Link>
          ))}
      </nav>
    </article>
  );
}

export function CourseReader() {
  const { courseId, lessonId } = useParams();
  const course = courses.find((item) => item.id === courseId);
  const lesson =
    course?.lessons.find((item) => item.id === lessonId) ||
    (!lessonId ? course?.lessons[0] : undefined);
  const { completed, complete } = useCourseProgress();
  usePageMeta({
    title: `${lesson?.title || 'Course not found'} · ChattyDesk`,
    description: course?.description,
    path: `/courses/${courseId}${lesson ? `/${lesson.id}` : ''}`,
    noindex: !lesson,
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [courseId, lessonId]);
  if (!course || !lesson)
    return (
      <CourseShell>
        <main className="mx-auto max-w-6xl px-5 py-16">
          <h1 className="font-display text-3xl">Course not found</h1>
          <Link to="/courses" className={`${actionClass} mt-6`}>
            Browse AI courses
          </Link>
        </main>
      </CourseShell>
    );
  return (
    <CourseShell>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <p className="mb-8 flex flex-wrap gap-2 text-sm text-ink-soft">
          <Link to="/courses" className="underline underline-offset-4">
            AI courses
          </Link>
          <span aria-hidden="true">/</span>
          {course.title}
        </p>
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <aside aria-label="Course lessons" className="min-w-0">
            <h2 className="font-display text-xl font-semibold">
              {course.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {course.outcome}
            </p>
            <ol className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {course.lessons.map((item, index) => (
                <li key={item.id}>
                  <Link
                    to={`/courses/${course.id}/${item.id}`}
                    aria-current={item.id === lesson.id ? 'step' : undefined}
                    className={`flex h-full items-start gap-2 border px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust ${item.id === lesson.id ? 'border-ink bg-ink text-paper' : 'border-hairline-strong bg-paper-raised hover:border-rust'}`}
                  >
                    <span className="shrink-0 font-mono text-xs">
                      0{index + 1}
                    </span>
                    <span>
                      {item.title}
                      {completed.includes(lessonKey(course.id, item.id)) && (
                        <span className="mt-1 block text-xs">✓ Completed</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
          <LessonContent
            key={lessonKey(course.id, lesson.id)}
            course={course}
            lesson={lesson}
            completed={completed.includes(lessonKey(course.id, lesson.id))}
            onComplete={() => complete(lessonKey(course.id, lesson.id))}
          />
        </div>
      </main>
    </CourseShell>
  );
}
