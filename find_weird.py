import os
import re

def find_weird_chars(directory):
    weird_char_pattern = re.compile(r'[^\x00-\x7F]+')
    common_chars = set('—–’‘“”•°×÷π²³½¼¾©®™…✓✔✗✘←↑→↓↔↕↵⇐⇑⇒⇓⇔⇕∀∂∃∅∇∈∉∋∏∑−∗√∝∞∠∧∨∩∪∫∴∼≅≈≠≡≤≥⊂⊃⊄⊆⊇⊕⊗⊥⋅⌈⌉⌊⌋⟨⟩◊♠♣♥♦')
    for root, _, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.js', '.jsx', '.ts', '.tsx', '.html', '.css')):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = weird_char_pattern.findall(content)
                    if matches:
                        # flatten the matches and check character by character
                        found_weird = set()
                        for match in matches:
                            for char in match:
                                if char not in common_chars:
                                    found_weird.add(char)
                        if found_weird:
                            print(f'File: {path}')
                            print(f'  Found chars (repr): {[repr(c) for c in found_weird]}')
            except Exception as e:
                pass

find_weird_chars('frontend/src')
