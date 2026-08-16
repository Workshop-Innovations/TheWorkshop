import os
import re

FRONTEND_DIR = 'frontend/src/components/community'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Add import if missing and resolveImageUrl is needed
    needs_import = False
    
    # 1. Replace src={something.profile_pic} with src={resolveImageUrl(something.profile_pic)}
    # We need to be careful. The regex should match src={x} where x contains profile_pic
    # e.g., src={msg.user_profile_pic} -> src={resolveImageUrl(msg.user_profile_pic)}
    # or src={member.user_profile_pic} -> src={resolveImageUrl(member.user_profile_pic)}
    # or src={entry.profile_pic} -> src={resolveImageUrl(entry.profile_pic)}
    # or src={myEntry.profile_pic} -> src={resolveImageUrl(myEntry.profile_pic)}
    
    def repl_src(m):
        nonlocal needs_import
        val = m.group(1)
        if 'resolveImageUrl' not in val:
            needs_import = True
            return f"src={{resolveImageUrl({val})}}"
        return m.group(0)

    content = re.sub(r'src=\{([^}]*profile_pic[^}]*)\}', repl_src, content)
    
    # Replace overly rounded corners
    content = re.sub(r'\brounded-full\b', 'rounded-sm', content)
    content = re.sub(r'\brounded-2xl\b', 'rounded-md', content)
    content = re.sub(r'\brounded-3xl\b', 'rounded-md', content)
    content = re.sub(r'\brounded-xl\b', 'rounded-md', content)
    content = re.sub(r'\brounded-lg\b', 'rounded-sm', content)

    # 2. Add import for resolveImageUrl if needed
    if needs_import and 'resolveImageUrl' not in original_content:
        # find the last import
        import_match = list(re.finditer(r'^import .*;?$', content, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            insert_pos = last_import.end()
            
            # calculate relative path to utils/imageUtils
            # since we are in src/components/community, utils is at ../../utils/imageUtils
            import_stmt = "\nimport { resolveImageUrl } from '../../utils/imageUtils';"
            content = content[:insert_pos] + import_stmt + content[insert_pos:]
        else:
            content = "import { resolveImageUrl } from '../../utils/imageUtils';\n" + content

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for filename in os.listdir(FRONTEND_DIR):
    if filename.endswith('.jsx'):
        process_file(os.path.join(FRONTEND_DIR, filename))
