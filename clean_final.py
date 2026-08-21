import os

def final_cleanup(directory):
    common_chars = set('—–’‘“”•°×÷π²³½¼¾©®™…✓✔✗✘←↑→↓↔↕↵⇐⇑⇒⇓⇔⇕∀∂∃∅∇∈∉∋∏∑−∗√∝∞∠∧∨∩∪∫∴∼≅≈≠≡≤≥⊂⊃⊄⊆⊇⊕⊗⊥⋅⌈⌉⌊⌋⟨⟩◊♠♣♥♦₦')
    
    for root, _, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.js', '.jsx', '.ts', '.tsx', '.html', '.css')):
                continue
            path = os.path.join(root, file)
            
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue
                
            orig_content = content
            
            final_content = []
            for c in content:
                if ord(c) > 127 and c not in common_chars:
                    pass # remove
                else:
                    final_content.append(c)
                    
            content = "".join(final_content)
            
            if content != orig_content:
                try:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f'Cleaned final artifacts in: {path}')
                except Exception as e:
                    print(f"Could not save {path}: {e}")

final_cleanup('frontend/src')
final_cleanup('backend/app')
