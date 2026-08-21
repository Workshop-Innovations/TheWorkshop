import os
import re
from collections import Counter

def gather_weird_sequences(directory):
    weird_char_pattern = re.compile(r'[^\x00-\x7F]+')
    counter = Counter()
    for root, _, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.md', '.txt')):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = weird_char_pattern.findall(content)
                    for match in matches:
                        counter[match] += 1
            except Exception as e:
                pass
    
    for seq, count in counter.most_common():
        print(f"Count: {count}, Sequence: {repr(seq)}")

gather_weird_sequences('frontend/src')
