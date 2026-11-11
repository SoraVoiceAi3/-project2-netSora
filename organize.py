import os
import shutil

base_dir = 'd:/SoraVoiceAi3'

# Create directories
os.makedirs(os.path.join(base_dir, 'assets', 'css'), exist_ok=True)
os.makedirs(os.path.join(base_dir, 'assets', 'js'), exist_ok=True)
os.makedirs(os.path.join(base_dir, 'backend'), exist_ok=True)

# 1. Move server.py
if os.path.exists(os.path.join(base_dir, 'server.py')):
    shutil.move(os.path.join(base_dir, 'server.py'), os.path.join(base_dir, 'backend', 'server.py'))

# 2. Extract script from index.html
html_path = os.path.join(base_dir, 'index.html')
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The user's JS is inside <script> tags at the bottom.
# There are two script tags, one for Tailwind, one for logic.
script_start = content.rfind('<script>')
script_end = content.rfind('</script>')

if script_start != -1 and script_end != -1:
    js_content = content[script_start + len('<script>'):script_end].strip()
    
    # Save to assets/js/script.js
    with open(os.path.join(base_dir, 'assets', 'js', 'script.js'), 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    # Replace in HTML
    html_content = content[:script_start] + '<script src="assets/js/script.js"></script>\n' + content[script_end + len('</script>'):]
else:
    html_content = content

# 3. Update CSS links in HTML
html_content = html_content.replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="assets/css/style.css">\n    <link rel="stylesheet" href="assets/css/slider.css">')

# 4. Save HTML
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

# 5. Move CSS files
if os.path.exists(os.path.join(base_dir, 'style.css')):
    shutil.move(os.path.join(base_dir, 'style.css'), os.path.join(base_dir, 'assets', 'css', 'style.css'))
if os.path.exists(os.path.join(base_dir, 'slider.css')):
    shutil.move(os.path.join(base_dir, 'slider.css'), os.path.join(base_dir, 'assets', 'css', 'slider.css'))

# Cleanup old files
if os.path.exists(os.path.join(base_dir, 'script.js')):
    os.remove(os.path.join(base_dir, 'script.js'))
if os.path.exists(os.path.join(base_dir, 'split_files.py')):
    os.remove(os.path.join(base_dir, 'split_files.py'))

print("✅ Project organized successfully!")
