import { useState, useEffect } from 'react';
import { GraduationCap, LogIn, MessageSquare, Play, Hash } from 'lucide-react';
import {
  loadStudentJoined,
  saveStudentJoined,
  loadInstructorClasses,
  findLabByPin,
  type StudentJoinedEntry,
  type InstructorClass,
} from '@/app/types/classes';

interface StudentHomeProps {
  onPlayLab: (entry: StudentJoinedEntry) => void;
}

export function StudentHome({ onPlayLab }: StudentHomeProps) {
  const [joined, setJoined] = useState<StudentJoinedEntry[]>([]);
  const [classes, setClasses] = useState<InstructorClass[]>([]);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [feedbackFor, setFeedbackFor] = useState<StudentJoinedEntry | null>(null);

  useEffect(() => {
    const instructorClasses = loadInstructorClasses();
    setClasses(instructorClasses);
    let entries = loadStudentJoined();
    entries = entries.map((e) => {
      const cls = instructorClasses.find((c) => c.id === e.classId);
      const lab = cls?.labs.find((l) => l.id === e.labId);
      return { ...e, feedback: lab?.feedbackFromInstructor ?? e.feedback };
    });
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const joinPin = params?.get('join')?.trim();
    if (joinPin && instructorClasses.length > 0) {
      const found = findLabByPin(instructorClasses, joinPin);
      if (found && !entries.some((j) => j.classId === found.class.id && j.labId === found.lab.id)) {
        const entry: StudentJoinedEntry = {
          classId: found.class.id,
          labId: found.lab.id,
          className: found.class.name,
          labTitle: found.lab.scenario.title,
          templateId: found.lab.templateId,
          joinedAt: new Date().toISOString(),
          feedback: found.lab.feedbackFromInstructor,
        };
        entries = [entry, ...entries];
        saveStudentJoined(entries);
        onPlayLab(entry);
        window.history.replaceState({}, '', window.location.pathname + (window.location.hash || ''));
      }
    }
    setJoined(entries);
    saveStudentJoined(entries);
  }, []);

  const handleJoinWithPin = () => {
    setPinError('');
    const found = findLabByPin(classes, pin);
    if (!found) {
      setPinError('Invalid or expired PIN.');
      return;
    }
    const exists = joined.some((j) => j.classId === found.class.id && j.labId === found.lab.id);
    if (exists) {
      setPinError('You have already joined this lab.');
      return;
    }
    const entry: StudentJoinedEntry = {
      classId: found.class.id,
      labId: found.lab.id,
      className: found.class.name,
      labTitle: found.lab.scenario.title,
      templateId: found.lab.templateId,
      joinedAt: new Date().toISOString(),
      feedback: found.lab.feedbackFromInstructor,
    };
    const next = [entry, ...joined];
    setJoined(next);
    saveStudentJoined(next);
    setPin('');
    onPlayLab(entry);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">My dashboard</h2>
        <p className="text-sm text-slate-400 mt-1">Your classes and labs. Play a game or view instructor feedback.</p>
      </div>

      {/* Join with PIN */}
      <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-white">Join with PIN</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">Enter the 6-digit PIN from your instructor to join a class and lab.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
              setPinError('');
            }}
            placeholder="000000"
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white font-mono text-lg tracking-widest focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            maxLength={6}
          />
          <button
            onClick={handleJoinWithPin}
            disabled={pin.length !== 6}
            className="px-5 py-2.5 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Join
          </button>
        </div>
        {pinError && <p className="text-sm text-red-400 mt-2">{pinError}</p>}
      </div>

      {/* Joined labs */}
      <div>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          My labs
        </h3>
        {joined.length === 0 ? (
          <div className="bg-slate-900/70 border border-dashed border-slate-700 rounded-xl p-8 text-center text-slate-400 text-sm">
            No labs yet. Join a class with a PIN from your instructor, or scan the lab QR code.
          </div>
        ) : (
          <ul className="space-y-3">
            {joined.map((entry) => (
              <li
                key={`${entry.classId}-${entry.labId}`}
                className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-white">{entry.labTitle}</div>
                  <div className="text-xs text-slate-400">Class: {entry.className}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlayLab(entry)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500"
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                  {entry.feedback && (
                    <button
                      onClick={() => setFeedbackFor(entry)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Feedback
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Feedback modal */}
      {feedbackFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80"
          onClick={() => setFeedbackFor(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Instructor feedback — {feedbackFor.labTitle}</h3>
              <button
                onClick={() => setFeedbackFor(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{feedbackFor.feedback}</p>
            <button
              onClick={() => setFeedbackFor(null)}
              className="mt-4 w-full py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
