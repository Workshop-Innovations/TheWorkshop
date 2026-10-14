import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { motion } from 'framer-motion'
import { ClipboardCheck, FileDown, ExternalLink } from 'lucide-react'

const CURRICULUMS = [
  { id: 'igcse', name: 'IGCSE (Cambridge)' },
  { id: 'alevels', name: 'A-Levels (Cambridge)' },
]

const SUBJECTS = [
  { id: 'biology', name: 'Biology' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'physics', name: 'Physics' },
  { id: 'accounting', name: 'Accounting' },
  { id: 'economics', name: 'Economics' },
  { id: 'mathematics', name: 'Mathematics' },
]

const TYPES = [
  { id: 'past_papers', name: 'Past Papers (PQs)' },
  { id: 'marking_guides', name: 'Marking Guides' },
  { id: 'resources', name: 'Resources' },
]

const YEARS = [2024, 2023, 2022, 2021, 2020]

function createDefaultLinks() {
  const subjectIds = SUBJECTS.map(s => s.id)
  const initYear = () => {
    const m = {}
    for (const y of YEARS) {
      m[y] = { items: [
        { name: 'Resource 1', url: '' },
        { name: 'Resource 2', url: '' },
      ]}
    }
    return m
  }
  const baseBySubject = () => {
    const o = {}
    for (const subj of subjectIds) {
      o[subj] = {
        resources: { url: '' },
        past_papers: initYear(),
        marking_guides: initYear(),
      }
    }
    return o
  }
  return {
    igcse: baseBySubject(),
    alevels: baseBySubject(),
  }
}

const LINKS = createDefaultLinks()

const chipBase = "px-4 py-2 rounded-md border text-sm font-bold transition-colors duration-200"
const cardBase = "bg-white border border-slate-100/50 rounded-md shadow-sm"

function SelectorGroup({ title, items, selectedId, onSelect }) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            className={`${chipBase} ${
              selectedId === it.id
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
            }`}
          >
            {it.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function TypeSelector({ selectedId, onSelect }) {
  const types = TYPES
  const iconFor = (id) => {
    if (id === 'past_papers') return <FileDown className="w-4 h-4 mr-2" />
    if (id === 'marking_guides') return <ClipboardCheck className="w-4 h-4 mr-2" />
    return <ExternalLink className="w-4 h-4 mr-2" />
  }
  return (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Material Type</h3>
      <div className="flex flex-wrap gap-3">
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`${chipBase} ${
              selectedId === t.id
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
            } flex items-center`}
          >
            {iconFor(t.id)}
            {t.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function YearSelector({ years, selectedYear, onSelect }) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Year</h3>
      <div className="flex flex-wrap gap-3">
        {years.length === 0 && (
          <span className="text-sm text-slate-400">No years available.</span>
        )}
        {years.map((y) => (
          <button
            key={y}
            onClick={() => onSelect(y)}
            className={`${chipBase} ${
              selectedYear === y
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
            }`}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Materials() {
  const [curriculumId, setCurriculumId] = useState(null)
  const [subjectId, setSubjectId] = useState(null)
  const [typeId, setTypeId] = useState(null)
  const [year, setYear] = useState(null)

  const curriculums = useMemo(() => CURRICULUMS, [])
  const subjects = useMemo(() => SUBJECTS, [])
  const years = useMemo(() => (curriculumId && subjectId && typeId && typeId !== 'resources' ? YEARS : []), [curriculumId, subjectId, typeId])

  const selectionComplete = curriculumId && subjectId && typeId && (typeId === 'resources' || year)
  const { items, resourceUrl } = useMemo(() => {
    if (!selectionComplete) return { items: [], resourceUrl: '' }
    if (typeId === 'resources') {
      const url = LINKS?.[curriculumId]?.[subjectId]?.resources?.url || ''
      return { items: [], resourceUrl: url }
    }
    const subset = LINKS?.[curriculumId]?.[subjectId]?.[typeId]?.[year]?.items || []
    return { items: subset, resourceUrl: '' }
  }, [selectionComplete, curriculumId, subjectId, typeId, year])

  const resetAfter = (level) => {
    if (level === 'curriculum') {
      setSubjectId(null)
      setTypeId(null)
      setYear(null)
    } else if (level === 'subject') {
      setTypeId(null)
      setYear(null)
    } else if (level === 'type') {
      setYear(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">Materials</h1>
            <p className="text-slate-500 text-lg font-medium">Browse resources from curricula like Cambridge (IGCSE, A-Levels).</p>
          </div>

          <div
            className={`${cardBase} p-8 mb-12`}
          >
            <SelectorGroup
              title="Curriculum"
              items={curriculums}
              selectedId={curriculumId}
              onSelect={(id) => { setCurriculumId(id); resetAfter('curriculum') }}
            />
            {curriculumId && (
              <SelectorGroup
                title="Subject"
                items={subjects}
                selectedId={subjectId}
                onSelect={(id) => { setSubjectId(id); resetAfter('subject') }}
              />
            )}
            {curriculumId && subjectId && (
              <TypeSelector
                selectedId={typeId}
                onSelect={(id) => { setTypeId(id); resetAfter('type') }}
              />
            )}
            {curriculumId && subjectId && typeId && typeId !== 'resources' && (
              <YearSelector
                years={years}
                selectedYear={year}
                onSelect={(y) => setYear(y)}
              />
            )}
          </div>

          {selectionComplete && (
          <div
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Files</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeId === 'resources' ? (
                  <>
                    <motion.div
                      className={`${cardBase} p-5 flex items-center justify-between card hover:shadow-md`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div>
                        <p className="font-bold text-slate-800">Subject Resources</p>
                        <p className="text-xs font-medium text-slate-400 capitalize">{curriculumId?.toUpperCase?.()} • {subjectId} • resources</p>
                      </div>
                      <button
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold border ${resourceUrl ? 'bg-primary text-white border-transparent hover:bg-primary-dark shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed'}`}
                        disabled={!resourceUrl}
                        onClick={() => { if (resourceUrl) window.open(resourceUrl, '_blank') }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit
                      </button>
                    </motion.div>
                    {!resourceUrl && (
                      <div className="col-span-full text-center py-12 text-slate-400 font-medium">
                        No resource link set.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {items.map((f, idx) => (
                      <motion.div
                        key={`${f.name}-${idx}`}
                        className={`${cardBase} p-5 flex items-center justify-between card hover:shadow-md`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div>
                          <p className="font-bold text-slate-800">{f.name}</p>
                          <p className="text-xs font-medium text-slate-400 capitalize">{curriculumId?.toUpperCase?.()} • {subjectId} • {typeId.replace('_', ' ')} • {year}</p>
                        </div>
                        <button
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold border ${f.url ? 'bg-primary text-white border-transparent hover:bg-primary-dark shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed'}`}
                          disabled={!f.url}
                          onClick={() => { if (f.url) window.open(f.url, '_blank') }}
                        >
                          <FileDown className="w-4 h-4" />
                          Download
                        </button>
                      </motion.div>
                    ))}
                    {items.length === 0 && (
                      <div className="col-span-full text-center py-12 text-slate-400 font-medium">
                        No files available.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
