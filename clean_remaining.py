import os

# Files to fix
files_to_fix = [
    r'frontend/src/pages/PaperViewer_backup.jsx',
    r'frontend/src/pages/PaperViewer.jsx',
    r'frontend/src/pages/Pomodoro.jsx',
    r'frontend/src/pages/Pricing.jsx',
    r'frontend/src/pages/Store.jsx',
    r'frontend/src/pages/Tasks.jsx',
    r'frontend/src/components/community/FindFriendsModal.jsx',
    r'frontend/src/components/community/PeerReview.jsx',
    r'frontend/src/components/community/SharedNotes.jsx'
]

# Mapping of exact corrupted sequences to their intended meaning
replacements = {
    # Store / Tasks sparkles
    'âœ¨': '',
    
    # Pricing Naira sign corruption
    'â‚¦': '₦',
    'Ã‚Â¦': '₦',
    
    # PaperViewer ellipsis and dashes
    'Ã¢â‚¬Â¦': '...',
    'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦': '...',
    'â€¦': '...',
    'â€”': '-',
    
    # Pomodoro quotes
    'â€': '-',
    'â€': '',
    'Â·': '•',
    'â€¢': '•',
    
    # Remove replacement chars and other weird stuff
    '': '',
    '\x8f': '',
    '\x9d': '',
    '\xa0': ' '
}

for path in files_to_fix:
    path = os.path.normpath(path)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        orig_content = content
        
        # apply all replacements
        for k, v in replacements.items():
            content = content.replace(k, v)
            
        # also strip any remaining non-ascii that isn't common
        common_chars = set('—–’‘“”•°×÷π²³½¼¾©®™…✓✔✗✘←↑→↓↔↕↵⇐⇑⇒⇓⇔⇕∀∂∃∅∇∈∉∋∏∑−∗√∝∞∠∧∨∩∪∫∴∼≅≈≠≡≤≥⊂⊃⊄⊆⊇⊕⊗⊥⋅⌈⌉⌊⌋⟨⟩◊♠♣♥♦₦')
        final_content = []
        for c in content:
            if ord(c) > 127 and c not in common_chars:
                # ignore it (remove)
                pass
            else:
                final_content.append(c)
                
        content = "".join(final_content)
        
        if content != orig_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed: {path}')

