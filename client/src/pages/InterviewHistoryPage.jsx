import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BrainCircuit,
  Plus,
  Search,
  X,
  RefreshCw,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import InterviewCard from "../components/interview/InterviewCard";
import useInterviewStore from "../store/useInterviewStore";
import usePageTitle from "../hooks/usePageTitle";

// ─── Filter / sort constants ──────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "all",         label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
  { value: "draft",       label: "Draft" },
  { value: "abandoned",   label: "Abandoned" },
];

const TYPE_FILTERS = [
  { value: "all",        label: "All Types" },
  { value: "technical",  label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "hr",         label: "HR" },
  { value: "mixed",      label: "Mixed" },
];

const DIFFICULTY_FILTERS = [
  { value: "all",    label: "All Levels" },
  { value: "easy",   label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard",   label: "Hard" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const applyFilters = (sessions, { status, type, difficulty, search, sort }) => {
  let result = [...sessions];

  if (status !== "all") {
    result = result.filter((s) => s.status === status);
  }
  if (type !== "all") {
    result = result.filter((s) => s.interviewType === type);
  }
  if (difficulty !== "all") {
    result = result.filter((s) => s.difficulty === difficulty);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter((s) =>
      s.targetRole.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => {
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return sort === "newest" ? db - da : da - db;
  });

  return result;
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const HistorySkeleton = () => (
  <div
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    aria-busy="true"
    aria-label="Loading interviews"
  >
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5 h-48"
      />
    ))}
  </div>
);

// ─── Filter pill button ───────────────────────────────────────────────────────

const FilterPill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 whitespace-nowrap ${
      active
        ? "bg-indigo-600 text-white border-indigo-600"
        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
    }`}
  >
    {children}
  </button>
);

// ─── Select dropdown ──────────────────────────────────────────────────────────

const FilterSelect = ({ value, onChange, options, label }) => (
  <div className="relative">
    <label className="sr-only">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-600 hover:border-indigo-300 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
      aria-label={label}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown
      className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"
      aria-hidden="true"
    />
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ filtered, onClear }) => {
  if (filtered) {
    return (
      <div className="flex flex-col items-center py-16 gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <Search className="w-7 h-7 text-gray-300" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">No matching interviews</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your filters or search term.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
        <BrainCircuit className="w-7 h-7 text-indigo-300" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">No interviews yet</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Start your first mock interview to begin building your history.
        </p>
      </div>
      <Link to="/interview/setup">
        <Button className="gap-2">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Start Interview
        </Button>
      </Link>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const InterviewHistoryPage = () => {
  usePageTitle("Interview History");
  const {
    sessions,
    fetching,
    deleting,
    error,
    fetchSessions,
    deleteSession,
    clearError,
  } = useInterviewStore();

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [statusFilter,     setStatusFilter]     = useState("all");
  const [typeFilter,       setTypeFilter]       = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchQuery,      setSearchQuery]      = useState("");
  const [sortOrder,        setSortOrder]        = useState("newest");
  const [deletingId,       setDeletingId]       = useState(null);
  const [showFilters,      setShowFilters]      = useState(false);

  /**
   * fetchError holds the last load-error message for the inline error block.
   * It is separate from the Zustand `error` field because the toast useEffect
   * calls clearError() immediately — which resets error to null before the
   * next render, making {!fetching && error && …} permanently falsy.
   * fetchError persists until the user triggers a successful retry.
   */
  const [fetchError, setFetchError] = useState(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Capture errors for inline display, then clear from the store ──────────
  useEffect(() => {
    if (error) {
      toast.error(error);
      setFetchError(error); // keep a local copy for the inline error block
      clearError();
    }
  }, [error, clearError]);

  // ── Clear fetchError when a successful load completes ────────────────────
  useEffect(() => {
    if (!fetching && sessions.length > 0) {
      setFetchError(null);
    }
  }, [fetching, sessions.length]);

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    const result = await deleteSession(id);
    setDeletingId(null);
    if (result.success) {
      toast.success("Interview deleted.");
    }
    // errors are surfaced via the error store field → toast above
  };

  // ── Clear all filters ─────────────────────────────────────────────────────
  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setDifficultyFilter("all");
    setSearchQuery("");
    setSortOrder("newest");
  };

  // ── Computed filtered list ────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      applyFilters(sessions, {
        status:     statusFilter,
        type:       typeFilter,
        difficulty: difficultyFilter,
        search:     searchQuery,
        sort:       sortOrder,
      }),
    [sessions, statusFilter, typeFilter, difficultyFilter, searchQuery, sortOrder]
  );

  const isFiltered =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    difficultyFilter !== "all" ||
    searchQuery.trim() !== "" ||
    sortOrder !== "newest";

  // ── Status counts for filter pills ───────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: sessions.length, in_progress: 0, completed: 0, draft: 0, abandoned: 0 };
    sessions.forEach((s) => { if (c[s.status] !== undefined) c[s.status]++; });
    return c;
  }, [sessions]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {sessions.length > 0
                ? `${sessions.length} session${sessions.length !== 1 ? "s" : ""} total`
                : "All your mock interview sessions in one place."}
            </p>
          </div>
          <Link to="/interview/setup">
            <Button className="shrink-0 gap-2">
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Interview
            </Button>
          </Link>
        </div>

        {/* ── Search + filter toggle (always visible) ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by role…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              aria-label="Search interviews by target role"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <FilterSelect
              value={sortOrder}
              onChange={setSortOrder}
              options={SORT_OPTIONS}
              label="Sort order"
            />

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                showFilters || isFiltered
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              Filters
              {isFiltered && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchSessions}
              disabled={fetching}
              className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
              aria-label="Refresh interview list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* ── Collapsible filter panel ── */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-3">
            {/* Status pills */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Status
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                {STATUS_FILTERS.map((f) => (
                  <FilterPill
                    key={f.value}
                    active={statusFilter === f.value}
                    onClick={() => setStatusFilter(f.value)}
                  >
                    {f.label}
                    {counts[f.value] !== undefined && (
                      <span className="ml-1 opacity-70">({counts[f.value]})</span>
                    )}
                  </FilterPill>
                ))}
              </div>
            </div>

            {/* Type + Difficulty in a row */}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Type
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
                  {TYPE_FILTERS.map((f) => (
                    <FilterPill
                      key={f.value}
                      active={typeFilter === f.value}
                      onClick={() => setTypeFilter(f.value)}
                    >
                      {f.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Difficulty
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by difficulty">
                  {DIFFICULTY_FILTERS.map((f) => (
                    <FilterPill
                      key={f.value}
                      active={difficultyFilter === f.value}
                      onClick={() => setDifficultyFilter(f.value)}
                    >
                      {f.label}
                    </FilterPill>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear */}
            {isFiltered && (
              <div className="pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Results count strip ── */}
        {!fetching && sessions.length > 0 && (
          <p className="text-xs text-gray-500 mb-4">
            Showing{" "}
            <span className="font-semibold text-gray-700">{filtered.length}</span>
            {" "}of{" "}
            <span className="font-semibold text-gray-700">{sessions.length}</span>
            {" "}interview{sessions.length !== 1 ? "s" : ""}
            {isFiltered && " (filtered)"}
          </p>
        )}

        {/* ── Loading ── */}
        {fetching && sessions.length === 0 && <HistorySkeleton />}

        {/* ── Error (initial load failure) ── */}
        {!fetching && fetchError && sessions.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <p className="text-sm text-gray-500">{fetchError}</p>
            <Button
              variant="secondary"
              onClick={() => { setFetchError(null); fetchSessions(); }}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </Button>
          </div>
        )}

        {/* ── Empty states ── */}
        {!fetching && sessions.length === 0 && !fetchError && (
          <EmptyState filtered={false} onClear={clearFilters} />
        )}
        {!fetching && sessions.length > 0 && filtered.length === 0 && (
          <EmptyState filtered={true} onClear={clearFilters} />
        )}

        {/* ── Interview grid ── */}
        {!fetching && filtered.length > 0 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            aria-label="Interview sessions"
          >
            {filtered.map((session) => (
              <InterviewCard
                key={session._id}
                session={session}
                onDelete={handleDelete}
                deleting={deleting && deletingId === session._id}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default InterviewHistoryPage;
