'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Student } from '@/lib/types';
import { searchStudentsApi } from '@/lib/api';
import { SEVERITY_COLORS } from '@/lib/constants';

interface StudentSelectorProps {
  selectedStudent: Student | null;
  recentStudents: Student[];
  onSelectStudent: (student: Student) => void;
  onClearStudent: () => void;
}

export function StudentSelector({
  selectedStudent,
  recentStudents,
  onSelectStudent,
  onClearStudent,
}: StudentSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search
  const searchStudents = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const matches = await searchStudentsApi(searchQuery);
      setResults(matches);
      setHighlightedIndex(matches.length > 0 ? 0 : -1);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Search error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search on query change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStudents(query);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, searchStudents]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      onSelectStudent(results[highlightedIndex]);
      setQuery('');
      setResults([]);
    } else if (e.key === 'Escape') {
      if (selectedStudent) {
        onClearStudent();
      } else {
        setQuery('');
        setResults([]);
        inputRef.current?.blur();
      }
    }
  };

  // If student is selected, show minimal header
  if (selectedStudent) {
    return (
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onClearStudent}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            title="Clear student (Esc)"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <span className="font-medium">
            {selectedStudent.firstName} {selectedStudent.lastName}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Grade {selectedStudent.grade} &middot; Room {selectedStudent.room}
          </span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 rounded">
          Esc to clear
        </kbd>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoading ? (
              <svg className="h-5 w-5 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search student by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="input pl-10 pr-10"
            autoFocus
          />

          {/* Search Results Dropdown */}
          {results.length > 0 && isSearchFocused && (
            <div
              ref={resultsRef}
              className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {results.map((student, index) => (
                <button
                  key={student.id}
                  onClick={() => {
                    onSelectStudent(student);
                    setQuery('');
                    setResults([]);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    index === highlightedIndex ? 'bg-slate-50 dark:bg-slate-700' : ''
                  }`}
                >
                  <div>
                    <span className="font-medium">
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                      Grade {student.grade}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {student.conditions.slice(0, 2).map((c) => (
                      <span key={c.id} className={SEVERITY_COLORS[c.severity]}>
                        {c.name.split(' ')[0]}
                      </span>
                    ))}
                    {student.allergies.length > 0 && (
                      <span className="badge-high">
                        {student.allergies.length} allergy
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Students */}
        {recentStudents.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
              Recent
            </p>
            <div className="flex flex-wrap gap-2">
              {recentStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="chip"
                >
                  <span className="font-medium">{student.firstName}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {student.lastName.charAt(0)}.
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentStudents.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            Start typing to search for a student
          </p>
        )}
      </div>
    </div>
  );
}
