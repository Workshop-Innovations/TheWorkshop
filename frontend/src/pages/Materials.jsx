import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { motion } from 'framer-motion'
import { FaClipboardCheck, FaFileDownload, FaExternalLinkAlt } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom';

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

const chipBase = "px-4 py-2 rounded-md border transition-colors duration-200"
const cardBase = "bg-[#1A1A1A] hover:bg-[#242424] border border-white/10 rounded-lg"

function SelectorGroup({ title, items, selectedId, onSelect }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-white/90">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            className={`${chipBase} ${
              selectedId === it.id
                ? 'bg-white text-black border-transparent'
                : 'bg-[#1A1A1A] text-white border-white/20 hover:bg-white/10'
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
    if (id === 'past_papers') return <FaFileDownload className="mr-2" />
    if (id === 'marking_guides') return <FaClipboardCheck className="mr-2" />
    return <FaExternalLinkAlt className="mr-2" />
  }
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-white/90">Material Type</h3>
      <div className="flex flex-wrap gap-3">
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`${chipBase} ${
              selectedId === t.id
                ? 'bg-white text-black border-transparent'
                : 'bg-[#1A1A1A] text-white border-white/20 hover:bg-white/10'
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
      <h3 className="text-lg font-semibold mb-4 text-white/90">Year</h3>
      <div className="flex flex-wrap gap-3">
        {years.length === 0 && (
          <span className="text-sm text-gray-400">No years available.</span>
        )}
        {years.map((y) => (
          <button
            key={y}
            onClick={() => onSelect(y)}
            className={`${chipBase} ${
              selectedYear === y
                ? 'bg-white text-black border-transparent'
                : 'bg-[#1A1A1A] text-white border-white/20 hover:bg-white/10'
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
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">Materials</h1>
            <p className="text-gray-400">Browse resources from curricula like Cambridge (IGCSE, A-Levels).</p>
          </div>

          <motion.div
            className={`${cardBase} p-6 mb-8`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
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
          </motion.div>

          {selectionComplete && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Files</h2>
                <div className="text-sm text-gray-400"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeId === 'resources' ? (
                  <>
                    <motion.div
                      className={`${cardBase} p-5 flex items-center justify-between`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div>
                        <p className="font-semibold">Subject Resources</p>
                        <p className="text-xs text-gray-400">{curriculumId?.toUpperCase?.()} · {subjectId} · resources</p>
                      </div>
                      <button
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold border ${resourceUrl ? 'bg-white text-black border-transparent hover:bg-gray-200' : 'bg-gray-700 text-gray-400 border-transparent cursor-not-allowed'}`}
                        disabled={!resourceUrl}
                        onClick={() => { if (resourceUrl) window.open(resourceUrl, '_blank') }}
                      >
                        <FaExternalLinkAlt />
                        Visit
                      </button>
                    </motion.div>
                    {!resourceUrl && (
                      <div className="col-span-full text-center py-12 text-gray-400">
                        No resource link set.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {items.map((f, idx) => (
                      <motion.div
                        key={`${f.name}-${idx}`}
                        className={`${cardBase} p-5 flex items-center justify-between`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div>
                          <p className="font-semibold">{f.name}</p>
                          <p className="text-xs text-gray-400">{curriculumId?.toUpperCase?.()} · {subjectId} · {typeId.replace('_', ' ')} · {year}</p>
                        </div>
                        <button
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold border ${f.url ? 'bg-white text-black border-transparent hover:bg-gray-200' : 'bg-gray-700 text-gray-400 border-transparent cursor-not-allowed'}`}
                          disabled={!f.url}
                          onClick={() => { if (f.url) window.open(f.url, '_blank') }}
                        >
                          <FaFileDownload />
                          Download
                        </button>
                      </motion.div>
                    ))}
                    {items.length === 0 && (
                      <div className="col-span-full text-center py-12 text-gray-400">
                        No files available.
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
