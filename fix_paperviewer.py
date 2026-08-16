import re

with open('frontend/src/pages/PaperViewer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ────────────────────────────────────────────────────
# FIX 1:  Move useMemo(contextValue) BEFORE early returns.
#         Also move remarkPlugins / rehypePlugins to stable constants
#         outside the component so they are never recreated.
# ────────────────────────────────────────────────────

# Step A: remove the block that currently declares remarkPlugins and
#         rehypePlugins inside the component (they appear after the
#         early-return guards, so this is doubly wrong).
content = re.sub(
    r"\n    const remarkPlugins = \[\n.*?\n    \];\n    const rehypePlugins = \[\n.*?\n    \];\n",
    "\n",
    content,
    flags=re.DOTALL
)

# Step B: insert static constants right before the PaperViewer component
#         definition so they are created once per module.
static_plugins = (
    "// Remark / rehype plugins are module-level constants so they are never\n"
    "// recreated on every render (e.g. on every timer tick in practice mode).\n"
    "const REMARK_PLUGINS = [\n"
    "    [remarkMath, { singleDollarTextMath: true }],\n"
    "    remarkGfm,\n"
    "];\n"
    "const REHYPE_PLUGINS = [\n"
    "    [rehypeKatex, { throwOnError: false, strict: false, trust: true }],\n"
    "];\n\n"
)
content = content.replace("const PaperViewer = () => {", static_plugins + "const PaperViewer = () => {")

# Step C: update JSX to use the new constant names
content = content.replace(
    "remarkPlugins={remarkPlugins}",
    "remarkPlugins={REMARK_PLUGINS}"
)
content = content.replace(
    "rehypePlugins={rehypePlugins}",
    "rehypePlugins={REHYPE_PLUGINS}"
)

# Step D: move contextValue useMemo before the early returns.
#         Find the current (misplaced) declaration and remove it.
content = re.sub(
    r"\n        const contextValue = useMemo\(\(\) => \(\{[^}]+\}\), \[.*?\]\);\n",
    "\n",
    content,
    flags=re.DOTALL
)

# ────────────────────────────────────────────────────
# FIX 2:  Add auth token to paper fetch
# ────────────────────────────────────────────────────
content = content.replace(
    "    const submitRef = useRef(null);",
    "    const submitRef = useRef(null);\n    const token = localStorage.getItem('accessToken');"
)

content = content.replace(
    "                const response = await fetch(\n"
    "                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/papers/${paperId}`\n"
    "                );\n"
    "                if (!response.ok) throw new Error('Failed to fetch paper');",
    "                const response = await fetch(\n"
    "                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/papers/${paperId}`,\n"
    "                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }\n"
    "                );\n"
    "                if (!response.ok) throw new Error('Failed to fetch paper');"
)

# ────────────────────────────────────────────────────
# FIX 3: Add submitError state & replace alert() with it
# ────────────────────────────────────────────────────
content = content.replace(
    "    const [testResult, setTestResult]     = useState(null);",
    "    const [testResult, setTestResult]     = useState(null);\n"
    "    const [submitError, setSubmitError]   = useState(null);\n"
    "    const [showExitConfirm, setShowExitConfirm] = useState(false);"
)

# Replace alert() calls with state setter
content = content.replace(
    "                alert(`Failed to submit: ${errorData.detail || response.statusText}`);",
    "                setSubmitError(errorData.detail || response.statusText || 'Submission failed. Please try again.');"
)
content = content.replace(
    "            alert('Network error while submitting test.');",
    "            setSubmitError('Network error. Please check your connection and try again.');"
)

# ────────────────────────────────────────────────────
# FIX 4: Replace window.confirm() with state-based dialog
# ────────────────────────────────────────────────────
content = content.replace(
    "    const exitPractice = useCallback(() => {\n"
    "        if (window.confirm('Exit practice mode? Your answers will be lost.')) {\n"
    "            setMode('read');\n"
    "            setUserAnswers({});\n"
    "            setTimeRemaining((paper?.duration_minutes ?? 60) * 60);\n"
    "        }\n"
    "    }, [paper?.duration_minutes]);",
    "    const exitPractice = useCallback(() => {\n"
    "        setShowExitConfirm(true);\n"
    "    }, []);\n\n"
    "    const confirmExit = useCallback(() => {\n"
    "        setShowExitConfirm(false);\n"
    "        setMode('read');\n"
    "        setUserAnswers({});\n"
    "        setTimeRemaining((paper?.duration_minutes ?? 60) * 60);\n"
    "    }, [paper?.duration_minutes]);"
)

# ────────────────────────────────────────────────────
# FIX 5: Move contextValue useMemo + add it right before early returns.
#         Insert after formatTime and before early-return guards.
# ────────────────────────────────────────────────────
insert_before = "    if (loading) return ("
new_block = (
    "    // contextValue MUST be declared here (before any early returns)\n"
    "    // so that useContext in PaperLink always has access to the context.\n"
    "    // Moving this after an early-return would violate the Rules of Hooks.\n"
    "    const contextValue = useMemo(() => ({\n"
    "        mode,\n"
    "        userAnswers,\n"
    "        handleAnswerChange\n"
    "    }), [mode, userAnswers, handleAnswerChange]);\n\n"
)
content = content.replace(insert_before, new_block + insert_before, 1)

# ────────────────────────────────────────────────────
# FIX 6: Better error state with back link
# ────────────────────────────────────────────────────
content = content.replace(
    "    if (error) return (\n"
    "        <div className=\"min-h-screen bg-slate-50 flex items-center justify-center text-red-500\">\n"
    "            Error: {error}\n"
    "        </div>\n"
    "    );",
    "    if (error) return (\n"
    "        <div className=\"min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8\">\n"
    "            <div style={{ maxWidth: 480, width:'100%', background:'#fff', border:'1px solid #fee2e2', borderRadius:4, padding:'2rem', textAlign:'center' }}>\n"
    "                <p style={{ color:'#ef4444', fontWeight:700, fontSize:'1.1rem', marginBottom:'0.5rem' }}>Failed to load paper</p>\n"
    "                <p style={{ color:'#64748b', fontSize:'0.9rem', marginBottom:'1.5rem' }}>{error}</p>\n"
    "                <Link to=\"/past-papers\" style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', color:'#6366f1', fontWeight:600, textDecoration:'none' }}>\n"
    "                    <ArrowLeft size={16} /> Back to Past Papers\n"
    "                </Link>\n"
    "            </div>\n"
    "        </div>\n"
    "    );"
)

with open('frontend/src/pages/PaperViewer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("PaperViewer.jsx patched successfully")
