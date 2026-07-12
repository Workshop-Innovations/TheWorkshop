const fs = require('fs');
const path = require('path');

const iconMap = {
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
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes('react-icons')) return;

    content = content.replace(/from\s+['"]react-icons\/[^'"]+['"]/g, "from 'lucide-react'");
    
    for (const [faIcon, lucideIcon] of Object.entries(iconMap)) {
        const regex = new RegExp(`\\b${faIcon}\\b`, 'g');
        content = content.replace(regex, lucideIcon);
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done.');
