import { useState, useMemo, useEffect } from 'react';
import { StudentDashboard } from './components/isbl/StudentDashboard';
import { StudentHome } from './components/isbl/StudentHome';
import { ProductionPlanningGame } from './components/isbl/ProductionPlanningGame';
import { InstructorDashboard } from './components/isbl/InstructorDashboard';
import { Users, GraduationCap } from 'lucide-react';
import { loadInstructorClasses } from './types/classes';
import type { StudentJoinedEntry } from './types/classes';
import type { Lab } from './types/classes';

function useResolvedLab(entry: StudentJoinedEntry | null): { classConfig: { id: string; name: string; templateId: string; createdAt: string; status: string; scenario: import('./types/classes').ScenarioDefinition }; lab: Lab } | null {
  const classes = useMemo(() => loadInstructorClasses(), []);
  return useMemo(() => {
    if (!entry) return null;
    const cls = classes.find((c) => c.id === entry.classId);
    const lab = cls?.labs.find((l) => l.id === entry.labId);
    if (!cls || !lab) return null;
    return {
      classConfig: {
        id: lab.id,
        name: entry.className,
        templateId: lab.templateId,
        createdAt: lab.createdAt,
        status: lab.status,
        scenario: lab.scenario,
      },
      lab,
    };
  }, [entry, classes]);
}

export default function App() {
  const [view, setView] = useState<'student' | 'instructor'>('student');
  const [studentScreen, setStudentScreen] = useState<'dashboard' | 'game'>('dashboard');
  const [selectedLabEntry, setSelectedLabEntry] = useState<StudentJoinedEntry | null>(null);
  const resolved = useResolvedLab(selectedLabEntry);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('join=')) setView('student');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="bg-slate-900 border-b border-slate-800 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-600 via-cyan-600 to-emerald-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">SIMU-LAB</h1>
                <p className="text-xs text-slate-400">Strategy & supply chain simulation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('student')}
                className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
                  view === 'student'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student
              </button>
              <button
                onClick={() => setView('instructor')}
                className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
                  view === 'instructor'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Instructor
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'student' ? (
        studentScreen === 'dashboard' ? (
          <StudentHome
            onPlayLab={(entry) => {
              setSelectedLabEntry(entry);
              setStudentScreen('game');
            }}
          />
        ) : resolved?.lab.templateId === 'production-planning' && resolved.lab.productionPlanning ? (
          <ProductionPlanningGame
            scenario={resolved.lab.scenario}
            productionPlanning={resolved.lab.productionPlanning}
            onLeave={() => { setStudentScreen('dashboard'); setSelectedLabEntry(null); }}
          />
        ) : (
          <StudentDashboard
            initialClass={resolved?.classConfig ?? undefined}
            onLeave={() => {
              setStudentScreen('dashboard');
              setSelectedLabEntry(null);
            }}
          />
        )
      ) : (
        <InstructorDashboard />
      )}
    </div>
  );
}
