import re

with open('backend/app/routes/community.py', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
for i, line in enumerate(lines):
    if 'user_email=' in line and 'MessageResponse' in '\n'.join(lines[max(0, i-10):i]):
        if 'user_profile_pic' not in lines[i+1]:
            m = re.search(r'user_email=([a-zA-Z0-9_]+)\.email', line)
            if m:
                var_name = m.group(1)
                indent = line[:len(line) - len(line.lstrip())]
                if 'if' in line:
                    new_line = f"{indent}user_profile_pic={var_name}.profile_pic if {var_name} else None,"
                else:
                    new_line = f"{indent}user_profile_pic={var_name}.profile_pic,"
                lines.insert(i+1, new_line)

with open('backend/app/routes/community.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
