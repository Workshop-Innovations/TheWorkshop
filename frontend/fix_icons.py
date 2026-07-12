import os
import re

icon_map = {
    'FaArrowLeft': 'ArrowLeft',
    'FaBookOpen': 'BookOpen',
    'FaPlus': 'Plus',
    'FaCalendarAlt': 'Calendar',
    'FaCheck': 'Check',
    'FaFlag': 'Flag',
    'FaTimes': 'X',
    'FaTrashAlt': 'Trash2',
    'FaSpinner': 'Loader2',
    'FaRobot': 'Bot',
    'FaPaperPlane': 'Send',
    'FaUpload': 'Upload',
    'FaLightbulb': 'Lightbulb',
    'FaListAlt': 'List',
    'FaFileAlt': 'FileText',
    'FaUndo': 'Undo',
    'FaArrowRight': 'ArrowRight',
    'FaClock': 'Clock',
    'FaCoins': 'Coins',
    'FaCheckCircle': 'CheckCircle2',
    'FaGift': 'Gift',
    'FaFire': 'Flame',
    'FaCoffee': 'Coffee',
    'FaEye': 'Eye',
    'FaEyeSlash': 'EyeOff',
    'FaUser': 'User',
    'FaEnvelope': 'Mail',
    'FaCalendar': 'Calendar',
    'FaTrash': 'Trash',
    'FaGoogle': 'Chrome',
    'FaPlay': 'Play',
    'FaPause': 'Pause',
    'FaForward': 'Forward',
    'FaRedo': 'RotateCw',
    'FaCog': 'Settings',
    'FaStar': 'Star',
    'FaHome': 'Home',
    'FaSearch': 'Search',
    'FaDownload': 'Download',
    'FaClipboardCheck': 'ClipboardCheck',
    'FaFileDownload': 'FileDown',
    'FaExternalLinkAlt': 'ExternalLink',
    'FaBug': 'Bug',
    'FaTrophy': 'Trophy',
    'FaMedal': 'Medal',
    'FaChartLine': 'LineChart',
    'FaCrown': 'Crown',
    'FaLock': 'Lock',
    'FaBrain': 'Brain',
    'FaUserCircle': 'UserCircle',
    'FaCamera': 'Camera',
    'FaUsers': 'Users',
    'FaBook': 'Book',
    'FaUserShield': 'ShieldAlert',
    'FaEdit': 'Edit',
    'FaLayerGroup': 'Layers',
    'FaExpand': 'Maximize',
    'FaCloudUploadAlt': 'CloudUpload',
    'FaSave': 'Save',
    'FaMinus': 'Minus',
    'FaMarkdown': 'FileType2',
    'HiUserGroup': 'Users'
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'react-icons' not in content:
        return

    # Replace import statements
    content = re.sub(r\"from 'react-icons/[^']+'\", \"from 'lucide-react'\", content)
    content = re.sub(r'from \"react-icons/[^\"]+\"', \"from 'lucide-react'\", content)

    # Replace icon components
    for fa_icon, lucide_icon in icon_map.items():
        content = re.sub(r'\\b' + fa_icon + r'\\b', lucide_icon, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

src_dir = r'c:\Users\HP\Documents\TheWorkshop\TheWorkshop\frontend\src'
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            process_file(os.path.join(root, file))

print('Done rewriting icons.')
