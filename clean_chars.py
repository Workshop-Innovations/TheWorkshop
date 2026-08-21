import os
import re

def clean_weird_chars(directory):
    # Replacements dictionary
    # The keys are unicode strings or regex patterns that match the broken text
    replacements = [
        # Loading dots
        (r'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦', '...'),
        (r'Ã¢â‚¬Â¦', '...'),
        (r'â€¦', '...'),
        
        # Dashes
        (r'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â\x9d', '-'),
        (r'â€\x9d', '-'),
        (r'ÃƒÂ¢Ã¢â‚¬Â\x9dÃ¢â€šÂ¬', ''),
        (r'â€”', '-'),
        (r'â€', ''),
        
        # Separators
        (r'â\x9d€', '-'),
        (r'Â·', '•'),
        (r'â€¢', '•'),
        
        # Emojis and other artifacts
        (r'âš ï¸ ?', ''),
        (r'✨\s*', ''),
        (r'', ''), # replacement char
        (r'\x8f', ''),
        (r'\x9d', ''),
        (r'\xa0', ' '), # replace non-breaking space with normal space
    ]
    
    for root, _, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.md')):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                for old, new in replacements:
                    content = re.sub(old, new, content)
                
                if content != original_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f'Cleaned: {path}')
            except Exception as e:
                print(f"Error on {path}: {e}")

clean_weird_chars('frontend/src')
