import re

# 1. Update SharedNotes.jsx
with open('frontend/src/components/community/SharedNotes.jsx', 'r', encoding='utf-8') as f:
    notes_content = f.read()

# Replace the modal wrapper
# from: <div className="fixed inset-0 ... flex items-center justify-center p-4" onClick={onClose}>
#       <div className="bg-white rounded-md w-full max-w-4xl h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
# to: <div className="w-[450px] bg-white h-full flex flex-col border-l border-slate-200 shrink-0 shadow-sm z-10">
notes_content = re.sub(
    r'<div className="fixed inset-0[^>]+>\s*<div\s+className="[^"]+"\s+onClick=\{[^}]+\}\s*>',
    r'<div className="w-[450px] bg-white h-full flex flex-col border-l border-slate-200 shrink-0 shadow-sm z-10">',
    notes_content
)
notes_content = re.sub(r'</div>\s*</div>\s*\);\s*};\s*export default SharedNotes;', r'</div>\n    );\n};\n\nexport default SharedNotes;', notes_content)

with open('frontend/src/components/community/SharedNotes.jsx', 'w', encoding='utf-8') as f:
    f.write(notes_content)


# 2. Update PeerReview.jsx
with open('frontend/src/components/community/PeerReview.jsx', 'r', encoding='utf-8') as f:
    review_content = f.read()

review_content = re.sub(
    r'<div className="fixed inset-0[^>]+>\s*<div\s+className="[^"]+"\s+onClick=\{[^}]+\}\s*>',
    r'<div className="w-[450px] bg-white h-full flex flex-col border-l border-slate-200 shrink-0 shadow-sm z-10">',
    review_content
)
review_content = re.sub(r'</div>\s*</div>\s*\);\s*};\s*export default PeerReview;', r'</div>\n    );\n};\n\nexport default PeerReview;', review_content)

with open('frontend/src/components/community/PeerReview.jsx', 'w', encoding='utf-8') as f:
    f.write(review_content)


# 3. Update ChatArea.jsx layout
with open('frontend/src/components/community/ChatArea.jsx', 'r', encoding='utf-8') as f:
    chat_content = f.read()

# Make ChatArea a flex-row container where the chat list takes flex-1 and modals go on the side.
# We wrap the main return in a flex-row.
# from: return (\n        <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
# to: return (\n        <div className="flex flex-row h-full w-full overflow-hidden">\n            <div className="flex flex-1 flex-col h-full bg-slate-50 overflow-hidden relative">
chat_content = chat_content.replace(
    'return (\n        <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">',
    'return (\n        <div className="flex flex-row h-full w-full overflow-hidden">\n            <div className="flex flex-1 flex-col h-full bg-slate-50 overflow-hidden relative">'
)

# And close it properly
chat_content = chat_content.replace(
    '            {/* Modals */}\n            {showNotes && <SharedNotes onClose={() => setShowNotes(false)} />}\n            {showReviews && <PeerReview onClose={() => setShowReviews(false)} />}\n        </div>\n    );\n};',
    '            </div>\n\n            {/* Side Panels */}\n            {showNotes && <SharedNotes onClose={() => setShowNotes(false)} />}\n            {showReviews && <PeerReview onClose={() => setShowReviews(false)} />}\n        </div>\n    );\n};'
)

with open('frontend/src/components/community/ChatArea.jsx', 'w', encoding='utf-8') as f:
    f.write(chat_content)

print("Restructured modals to side panels!")
