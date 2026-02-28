// Page Navigation
// Utility functions
// Fisher-Yates shuffle for randomizing arrays (used extensively by quiz logic)
function shuffleArray(array) {
    // In-place shuffle
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showPage(pageId) {
    // If leaving the quiz page, make sure the quiz timer is stopped to avoid multiple timers running
    if (pageId !== 'quizPage' && quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
        // reset display to configured quiz time
        const t = currentQuiz && currentQuiz.timeLimit ? currentQuiz.timeLimit : 60;
        document.getElementById('timeDisplay').textContent = formatTime(t);
    }

    // Hide sidebar on public pages (landing, login, register). Show sidebar on internal pages when logged in.
    const sidebar = document.getElementById('sidebar');
    if (pageId === 'frontPage' || pageId === 'loginPage' || pageId === 'registerPage') {
        sidebar.style.display = 'none';
        document.querySelector('.main-content').style.marginLeft = '0';
    } else {
        // show sidebar only if the user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            sidebar.style.display = 'flex';
            document.querySelector('.main-content').style.marginLeft = '280px';
        } else {
            sidebar.style.display = 'none';
            document.querySelector('.main-content').style.marginLeft = '0';
        }
    }

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    updateSidebarMenu(pageId);
}

function updateSidebarMenu(pageId) {
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => item.classList.remove('active'));

    // nav order: Home(0), Start(1), Stats(2), Profile(3), About(4), Contact(5), Data(6), Logout(7)
    if (pageId === 'homePage') {
        if (items[0]) items[0].classList.add('active');
    } else if (pageId === 'quizSelectionPage' || pageId === 'gameTypeSelectionPage') {
        if (items[1]) items[1].classList.add('active');
    } else if (pageId === 'statisticsPage') {
        if (items[2]) items[2].classList.add('active');
    } else if (pageId === 'profilePage') {
        if (items[3]) items[3].classList.add('active');
    } else if (pageId === 'aboutPage') {
        if (items[4]) items[4].classList.add('active');
    } else if (pageId === 'contactPage') {
        if (items[5]) items[5].classList.add('active');
    } else if (pageId === 'dataPage') {
        if (items[6]) items[6].classList.add('active');
    }
}

function showFrontPage() {
    showPage('frontPage');
}

function showLoginPage() {
    showPage('loginPage');
}

function showRegisterPage() {
    showPage('registerPage');
}

// navigateToHome is defined earlier; keep single definition near top

function showQuizSelection() {
    showPage('quizSelectionPage');
}

function showStatistics() {
    loadStatistics();
    showPage('statisticsPage');
}

function showProfile() {
    loadProfile();
    showPage('profilePage');
}

function showAbout() {
    showPage('aboutPage');
}

function showContact() {
    showPage('contactPage');
}

// configuration for GitHub-hosted CSV
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/mrDevStudent/QuizPrototype2.0/refs/heads/main/data.csv";
const GITHUB_API_URL = "https://api.github.com/repos/YOUR_USER/YOUR_REPO/contents/data.csv";

// new data visualization page
function showDataPage() {
    loadDataVisualization();
    // also fetch table from remote repo, if available
    loadTable().catch(err => console.warn('loadTable failed', err));
    showPage('dataPage');
}

function handleContactSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        alert('Please fill in name, email and message.');
        return;
    }

    const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    messages.push({ name, email, phone, message, date: new Date().toISOString() });
    localStorage.setItem('contactMessages', JSON.stringify(messages));

    // simple confirmation
    alert('Thanks — your message was saved. We will get back to you.');

    // clear form
    document.getElementById('contactForm').reset();
    
}

// Uploads are managed on the backend; frontend will probe Uploads/ for expected filenames and apply images if present.

function loadAssetsConfig(forceLocalOnly = false) {
    // Priority: localStorage config if exists, otherwise try Fetch icons.json from Uploads/
    const local = localStorage.getItem('uploadsConfig');
    if (local && !forceLocalOnly) {
        try {
            applyAssetsFromConfig(JSON.parse(local));
            return;
        } catch (e) { console.warn('Invalid local uploadsConfig'); }
    }

    if (!forceLocalOnly) {
        fetch('Uploads/icons.json')
            .then(r => {
                if (!r.ok) throw new Error('no icons.json');
                return r.json();
            })
            .then(cfg => applyAssetsFromConfig(cfg))
            .catch(() => {
                // no remote config found; fall back to local only or probe defaults
                if (local) applyAssetsFromConfig(JSON.parse(local));
                else probeAndApplyDefaults();
            });
    } else if (local) {
        applyAssetsFromConfig(JSON.parse(local));
    }
}

function applyAssetsFromConfig(cfg) {
    // Textures
    if (cfg.textures && cfg.textures.body) {
        const url = `Uploads/${cfg.textures.body}`;
        // Try to load image quickly
        const img = new Image();
        img.onload = () => {
            document.body.style.backgroundImage = `url('${url}'), linear-gradient(135deg, #667eea 0%, #764ba2 100%)`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundRepeat = 'no-repeat';
        };
        img.onerror = () => console.warn('Body texture not found:', url);
        img.src = url;
    }

    // Icons
    if (cfg.icons) {
        const setIcon = (selector, filename, size='24px') => {
            const url = `Uploads/${filename}`;
            document.querySelectorAll(selector).forEach(el => {
                el.style.backgroundImage = `url('${url}')`;
                el.style.backgroundSize = size + ' ' + size;
                el.style.backgroundRepeat = 'no-repeat';
                el.style.backgroundPosition = 'center';
                // remove emoji/text so image shows
                el.textContent = '';
            });
        };

        if (cfg.icons.easy) setIcon('.quick-easy .btn-icon', cfg.icons.easy, '28px');
        if (cfg.icons.medium) setIcon('.quick-medium .btn-icon', cfg.icons.medium, '28px');
        if (cfg.icons.hard) setIcon('.quick-hard .btn-icon', cfg.icons.hard, '28px');

        if (cfg.icons.logo) {
            const url = `Uploads/${cfg.icons.logo}`;
            const headerH2 = document.querySelector('.sidebar-header h2');
            if (headerH2) {
                headerH2.style.backgroundImage = `url('${url}')`;
                headerH2.style.backgroundRepeat = 'no-repeat';
                headerH2.style.backgroundSize = '28px 28px';
                headerH2.style.paddingLeft = '36px';
                headerH2.style.backgroundPosition = 'left center';
                // remove emoji so logo shows
                headerH2.textContent = ' Math Quiz';
            }
        }

        // nav icons mapping: home,start,stats,profile,uploads,logout
        if (cfg.icons.home) setIcon('.nav-icon.nav-home', cfg.icons.home, '22px');
        if (cfg.icons.start) setIcon('.nav-icon.nav-start', cfg.icons.start, '22px');
        if (cfg.icons.stats) setIcon('.nav-icon.nav-stats', cfg.icons.stats, '22px');
        if (cfg.icons.profile) setIcon('.nav-icon.nav-profile', cfg.icons.profile, '22px');
        if (cfg.icons.uploads) setIcon('.nav-icon.nav-uploads', cfg.icons.uploads, '22px');
        if (cfg.icons.logout) setIcon('.nav-item.logout-btn .nav-icon', cfg.icons.logout, '22px');
    }
}

// Load assets on page load
// (initial page setup consolidated at end of file)

// Probe Uploads/ for default filenames and apply any images found automatically
function probeAndApplyDefaults() {
    const expected = {
        easy: '.quick-easy .btn-icon',
        medium: '.quick-medium .btn-icon',
        hard: '.quick-hard .btn-icon',
        logo: '.sidebar-header h2',
        home: '.nav-icon.nav-home',
        start: '.nav-icon.nav-start',
        stats: '.nav-icon.nav-stats',
        profile: '.nav-icon.nav-profile',
        uploads: '.nav-icon.nav-uploads',
        logout: '.nav-item.logout-btn .nav-icon',
        'my-texture': 'body'
    };
    const exts = ['png','jpg','jpeg','svg'];

    Object.keys(expected).forEach(key => {
        for (const ext of exts) {
            const url = `Uploads/${key}.${ext}`;
            const img = new Image();
            img.onload = (() => {
                // apply when loaded
                if (key === 'my-texture') {
                    document.body.style.backgroundImage = `url('${url}'), linear-gradient(135deg, #667eea 0%, #764ba2 100%)`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundRepeat = 'no-repeat';
                } else if (key === 'logo') {
                    const headerH2 = document.querySelector('.sidebar-header h2');
                    if (headerH2) {
                        headerH2.style.backgroundImage = `url('${url}')`;
                        headerH2.style.backgroundRepeat = 'no-repeat';
                        headerH2.style.backgroundSize = '28px 28px';
                        headerH2.style.paddingLeft = '36px';
                        headerH2.style.backgroundPosition = 'left center';
                        headerH2.textContent = ' Math Quiz';
                    }
                } else {
                    const selector = expected[key];
                    document.querySelectorAll(selector).forEach(el => {
                        el.style.backgroundImage = `url('${url}')`;
                        el.style.backgroundSize = '22px 22px';
                        el.style.backgroundRepeat = 'no-repeat';
                        el.style.backgroundPosition = 'center';
                        el.textContent = '';
                    });
                }
            }).bind(null);
            img.onerror = () => {};
            img.src = url;
        }
    });
}


function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// User Management
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const min = parseInt(document.getElementById('registerPassword').dataset.min) || 8;
    
    // Validate inputs
    if (!name || !email || !password) {
        alert('Please fill in all fields!');
        return;
    }

    if (password.length < min) {
        alert(`Password must be at least ${min} characters.`);
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.email === email)) {
        alert('Email already registered!');
        return;
    }
    
    const user = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        quizzes: []
    };
    
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Registration successful! Please login.');
    
    // Clear form
    const registerForm = document.getElementById('registerPage').querySelector('form');
    if (registerForm) {
        registerForm.reset();
    }
    
    // Clear input fields
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    
    showLoginPage();
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validate inputs
    if (!email || !password) {
        alert('Please fill in all fields!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('userNameDisplay').textContent = user.name;
        
        // Clear login form
        const loginForm = document.getElementById('loginPage').querySelector('form');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Clear input fields
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        
        // Navigate to home (showPage will decide whether to display sidebar based on login state)
        navigateToHome();
    } else {
        alert('Invalid email or password!');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        document.getElementById('sidebar').style.display = 'none';
        showFrontPage();
    }
}

// Hide sidebar on initial load
// (consolidated initial DOMContentLoaded below)

// Quiz Questions Database - Multiple Choice
const multipleChoiceQuizzes = {
    easy: [
        { question: 'What is 5 + 3?', options: ['8', '7', '9', '6'], correct: 0 },
        { question: 'What is 12 - 4?', options: ['8', '6', '7', '9'], correct: 0 },
        { question: 'What is 3 × 4?', options: ['12', '11', '13', '10'], correct: 0 },
        { question: 'What is 20 ÷ 4?', options: ['5', '4', '6', '3'], correct: 0 },
        { question: 'What is 7 + 8?', options: ['15', '14', '16', '13'], correct: 0 },
        { question: 'What is 25 - 10?', options: ['15', '14', '16', '13'], correct: 0 },
        { question: 'What is 6 × 2?', options: ['12', '11', '13', '10'], correct: 0 },
        { question: 'What is 18 ÷ 3?', options: ['6', '5', '7', '4'], correct: 0 },
        { question: 'What is 9 + 6?', options: ['15', '14', '16', '13'], correct: 0 },
        { question: 'What is 30 ÷ 5?', options: ['6', '5', '7', '4'], correct: 0 },
        { question: 'What is 11 + 9?', options: ['20', '19', '21', '18'], correct: 0 },
        { question: 'What is 16 - 7?', options: ['9', '8', '10', '7'], correct: 0 },
        { question: 'What is 4 × 5?', options: ['20', '19', '21', '22'], correct: 0 },
        { question: 'What is 24 ÷ 6?', options: ['4', '3', '5', '6'], correct: 0 },
        { question: 'What is 13 + 7?', options: ['20', '19', '21', '18'], correct: 0 }
    ],
    medium: [
        { question: 'What is 25 + 17?', options: ['42', '41', '43', '40'], correct: 0 },
        { question: 'What is 56 - 23?', options: ['33', '32', '34', '35'], correct: 0 },
        { question: 'What is 12 × 5?', options: ['60', '59', '61', '58'], correct: 0 },
        { question: 'What is 144 ÷ 12?', options: ['12', '11', '13', '10'], correct: 0 },
        { question: 'What is 7² (7 squared)?', options: ['49', '48', '50', '47'], correct: 0 },
        { question: 'What is 15 × 8?', options: ['120', '119', '121', '118'], correct: 0 },
        { question: 'What is 98 - 45?', options: ['53', '52', '54', '51'], correct: 0 },
        { question: 'What is 8 × 9?', options: ['72', '71', '73', '70'], correct: 0 },
        { question: 'What is 100 ÷ 4?', options: ['25', '24', '26', '23'], correct: 0 },
        { question: 'What is √64?', options: ['8', '7', '9', '6'], correct: 0 },
        { question: 'What is 37 + 28?', options: ['65', '64', '66', '63'], correct: 0 },
        { question: 'What is 85 - 32?', options: ['53', '52', '54', '51'], correct: 0 },
        { question: 'What is 6² (6 squared)?', options: ['36', '35', '37', '34'], correct: 0 },
        { question: 'What is √121?', options: ['11', '10', '12', '9'], correct: 0 },
        { question: 'What is 18 × 4?', options: ['72', '71', '73', '70'], correct: 0 }
    ],
    hard: [
        { question: 'What is 234 + 567?', options: ['801', '800', '802', '799'], correct: 0 },
        { question: 'What is 1000 - 342?', options: ['658', '657', '659', '656'], correct: 0 },
        { question: 'What is 23 × 17?', options: ['391', '390', '392', '389'], correct: 0 },
        { question: 'What is 144 ÷ 12?', options: ['12', '11', '13', '10'], correct: 0 },
        { question: 'What is 9³ (9 cubed)?', options: ['729', '728', '730', '727'], correct: 0 },
        { question: 'What is 15% of 200?', options: ['30', '29', '31', '28'], correct: 0 },
        { question: 'What is √196?', options: ['14', '13', '15', '12'], correct: 0 },
        { question: 'What is 45 × 12?', options: ['540', '539', '541', '538'], correct: 0 },
        { question: 'What is 256 ÷ 16?', options: ['16', '15', '17', '14'], correct: 0 },
        { question: 'What is 2⁸ (2 to the 8th power)?', options: ['256', '255', '257', '254'], correct: 0 },
        { question: 'What is 456 + 789?', options: ['1245', '1244', '1246', '1243'], correct: 0 },
        { question: 'What is 2000 - 567?', options: ['1433', '1432', '1434', '1431'], correct: 0 },
        { question: 'What is 32 × 25?', options: ['800', '799', '801', '798'], correct: 0 },
        { question: 'What is 5⁴ (5 to the 4th)?', options: ['625', '624', '626', '623'], correct: 0 },
        { question: 'What is √289?', options: ['17', '16', '18', '15'], correct: 0 }
    ]
};

// Quiz Questions Database - True or False
const trueOrFalseQuizzes = {
    easy: [
        { question: '5 + 3 = 8', correct: true },
        { question: '12 - 4 = 9', correct: false },
        { question: '3 × 4 = 12', correct: true },
        { question: '20 ÷ 4 = 4', correct: false },
        { question: '7 + 8 = 15', correct: true },
        { question: '25 - 10 = 14', correct: false },
        { question: '6 × 2 = 12', correct: true },
        { question: '18 ÷ 3 = 5', correct: false },
        { question: '9 + 6 = 15', correct: true },
        { question: '30 ÷ 5 = 6', correct: true },
        { question: '11 + 9 = 20', correct: true },
        { question: '16 - 7 = 8', correct: false },
        { question: '4 × 5 = 20', correct: true },
        { question: '24 ÷ 6 = 4', correct: true },
        { question: '13 + 7 = 19', correct: false }
    ],
    medium: [
        { question: '25 + 17 = 42', correct: true },
        { question: '56 - 23 = 32', correct: false },
        { question: '12 × 5 = 60', correct: true },
        { question: '144 ÷ 12 = 11', correct: false },
        { question: '7² = 49', correct: true },
        { question: '15 × 8 = 121', correct: false },
        { question: '98 - 45 = 53', correct: true },
        { question: '8 × 9 = 71', correct: false },
        { question: '100 ÷ 4 = 25', correct: true },
        { question: '√64 = 8', correct: true },
        { question: '37 + 28 = 65', correct: true },
        { question: '85 - 32 = 54', correct: false },
        { question: '6² = 36', correct: true },
        { question: '√121 = 11', correct: true },
        { question: '18 × 4 = 72', correct: true }
    ],
    hard: [
        { question: '234 + 567 = 801', correct: true },
        { question: '1000 - 342 = 657', correct: false },
        { question: '23 × 17 = 391', correct: true },
        { question: '144 ÷ 12 = 12', correct: true },
        { question: '9³ = 729', correct: true },
        { question: '15% of 200 = 40', correct: false },
        { question: '√196 = 14', correct: true },
        { question: '45 × 12 = 540', correct: true },
        { question: '256 ÷ 16 = 16', correct: true },
        { question: '2⁸ = 256', correct: true },
        { question: '456 + 789 = 1245', correct: true },
        { question: '2000 - 567 = 1432', correct: false },
        { question: '32 × 25 = 800', correct: true },
        { question: '5⁴ = 625', correct: true },
        { question: '√289 = 17', correct: true }
    ]
};

// Quiz Questions Database - Matching
const matchingQuizzes = {
    easy: [
        { pairs: [{ left: '5 + 3', right: '8' }, { left: '12 - 4', right: '8' }, { left: '3 × 4', right: '12' }, { left: '20 ÷ 4', right: '5' }, { left: '7 + 8', right: '15' }, { left: '25 - 10', right: '15' }, { left: '6 × 2', right: '12' }, { left: '18 ÷ 3', right: '6' }, { left: '9 + 6', right: '15' }, { left: '30 ÷ 5', right: '6' }] },
        { pairs: [{ left: '11 + 9', right: '20' }, { left: '16 - 7', right: '9' }, { left: '4 × 5', right: '20' }, { left: '24 ÷ 6', right: '4' }, { left: '13 + 7', right: '20' }, { left: '8 + 5', right: '13' }, { left: '14 - 6', right: '8' }, { left: '3 × 3', right: '9' }, { left: '15 ÷ 3', right: '5' }, { left: '10 + 10', right: '20' }] }
    ],
    medium: [
        { pairs: [{ left: '25 + 17', right: '42' }, { left: '56 - 23', right: '33' }, { left: '12 × 5', right: '60' }, { left: '144 ÷ 12', right: '12' }, { left: '7²', right: '49' }, { left: '15 × 8', right: '120' }, { left: '98 - 45', right: '53' }, { left: '8 × 9', right: '72' }, { left: '100 ÷ 4', right: '25' }, { left: '√64', right: '8' }] },
        { pairs: [{ left: '37 + 28', right: '65' }, { left: '85 - 32', right: '53' }, { left: '6²', right: '36' }, { left: '√121', right: '11' }, { left: '18 × 4', right: '72' }, { left: '50 + 30', right: '80' }, { left: '100 - 45', right: '55' }, { left: '9 × 7', right: '63' }, { left: '200 ÷ 8', right: '25' }, { left: '√144', right: '12' }] }
    ],
    hard: [
        { pairs: [{ left: '234 + 567', right: '801' }, { left: '1000 - 342', right: '658' }, { left: '23 × 17', right: '391' }, { left: '144 ÷ 12', right: '12' }, { left: '9³', right: '729' }, { left: '15% of 200', right: '30' }, { left: '√196', right: '14' }, { left: '45 × 12', right: '540' }, { left: '256 ÷ 16', right: '16' }, { left: '2⁸', right: '256' }] },
        { pairs: [{ left: '456 + 789', right: '1245' }, { left: '2000 - 567', right: '1433' }, { left: '32 × 25', right: '800' }, { left: '5⁴', right: '625' }, { left: '√289', right: '17' }, { left: '111 + 222', right: '333' }, { left: '500 - 123', right: '377' }, { left: '25 × 20', right: '500' }, { left: '1000 ÷ 8', right: '125' }, { left: '3⁵', right: '243' }] }
    ]
};

// Quiz State
let currentQuiz = {
    level: '',
    gameType: 'multipleChoice',
    questions: [],
    currentQuestion: 0,
    score: 0,
    selectedAnswers: [],
    startTime: 0,
    timeLimit: 60 // 1 minute
};

let quizTimer = null;
let selectedQuizLevel = '';

function selectQuizLevel(level) {
    selectedQuizLevel = level;
    showPage('gameTypeSelectionPage');
}

function startQuiz(level, gameType) {
    // If level is null, use the selected level from the previous step
    if (level === null) {
        level = selectedQuizLevel;
    }
    
    currentQuiz.level = level;
    currentQuiz.gameType = gameType;
    
    // Get questions based on game type
    let quizzesDB;
    if (gameType === 'multipleChoice') {
        quizzesDB = multipleChoiceQuizzes;
    } else if (gameType === 'trueOrFalse') {
        quizzesDB = trueOrFalseQuizzes;
    } else if (gameType === 'matching') {
        quizzesDB = matchingQuizzes;
    }
    
    // Deep copy questions and shuffle
    let allQuestions = JSON.parse(JSON.stringify(quizzesDB[level]));
    
    if (gameType === 'multipleChoice') {
        // Shuffle answer options for each question
        allQuestions = allQuestions.map(q => {
            const indices = [0, 1, 2, 3];
            const shuffledIndices = shuffleArray(indices);
            const newCorrectIndex = shuffledIndices.indexOf(q.correct);
            const shuffledOptions = shuffledIndices.map(i => q.options[i]);
            
            return {
                question: q.question,
                options: shuffledOptions,
                correct: newCorrectIndex
            };
        });
    } else if (gameType === 'trueOrFalse') {
        // Shuffle answer order for true/false
        allQuestions = allQuestions.map(q => ({
            question: q.question,
            correct: q.correct
        }));
    } else if (gameType === 'matching') {
        // For matching, pick one random set and shuffle its pairs
        const sets = allQuestions;
        const chosenSet = shuffleArray(sets)[0];
        const shuffledPairs = shuffleArray(chosenSet.pairs.map(pair => ({ left: pair.left, right: pair.right })));
        // Store as a single matching set (10 pairs)
        allQuestions = [{ pairs: shuffledPairs }];
    }
    
    // Shuffle question order
    allQuestions = shuffleArray(allQuestions);
    if (gameType !== 'matching') {
        allQuestions = allQuestions.slice(0, 10);
    }
    
    currentQuiz.questions = allQuestions;
    currentQuiz.currentQuestion = 0;
    currentQuiz.score = 0;
    currentQuiz.selectedAnswers = [];
    currentQuiz.startTime = Date.now();
    currentQuiz.timeLimit = 60;
    
    const typeLabel = gameType === 'multipleChoice' ? 'Multiple Choice' : gameType === 'trueOrFalse' ? 'True or False' : 'Matching';
    document.getElementById('quizTitle').textContent = `${level.charAt(0).toUpperCase() + level.slice(1)} - ${typeLabel}`;
    
    showPage('quizPage');
    displayQuestion();
    startTimer();
}

function displayQuestion() {
    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    
    if (currentQuiz.gameType === 'multipleChoice') {
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('questionCounter').textContent = `${currentQuiz.currentQuestion + 1}/10`;
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = option;
            button.onclick = () => selectAnswer(index);
            answersContainer.appendChild(button);
        });
    } else if (currentQuiz.gameType === 'trueOrFalse') {
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('questionCounter').textContent = `${currentQuiz.currentQuestion + 1}/10`;
        answersContainer.className = 'true-false-grid';
        
        const trueBtn = document.createElement('button');
        trueBtn.className = 'answer-btn true-false-btn';
        trueBtn.textContent = 'True';
        trueBtn.onclick = () => selectAnswer(true);
        answersContainer.appendChild(trueBtn);
        
        const falseBtn = document.createElement('button');
        falseBtn.className = 'answer-btn true-false-btn';
        falseBtn.textContent = 'False';
        falseBtn.onclick = () => selectAnswer(false);
        answersContainer.appendChild(falseBtn);
    } else if (currentQuiz.gameType === 'matching') {
        // Matching UI: left items numbered 1..N, right items lettered A..J
        const matchingPairs = question.pairs;
        const totalPairs = matchingPairs.length;
        document.getElementById('questionText').textContent = `Match the following math expressions with their answers (1-${totalPairs} / A-${String.fromCharCode(64 + totalPairs)})`;
        document.getElementById('questionCounter').textContent = `1/${totalPairs}`;
        answersContainer.className = 'matching-container';
        
        // Prepare letters A..J
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, totalPairs);
        const shuffledRights = shuffleArray(matchingPairs.map(p => p.right));
        
        // Ensure selectedAnswers map exists and is empty for this matching set
        currentQuiz.selectedAnswers[currentQuiz.currentQuestion] = new Array(totalPairs).fill(null); // stores chosen letter
        currentQuiz.matchingPairs = matchingPairs; // keep reference for scoring
        
        // Track which right items are used
        currentQuiz._rightUsed = {};
        currentQuiz._selectedLeft = null; // index of currently selected left item
        currentQuiz._letterMap = {};
        
        const leftColumn = document.createElement('div');
        leftColumn.className = 'matching-column left-column';
        
        const rightColumn = document.createElement('div');
        rightColumn.className = 'matching-column right-column';
        
        matchingPairs.forEach((pair, index) => {
            const leftItem = document.createElement('div');
            leftItem.className = 'matching-item left-item';
            leftItem.textContent = `${index + 1}) ${pair.left}`;
            leftItem.dataset.index = index;
            leftItem.onclick = () => {
                // select this left
                currentQuiz._selectedLeft = index;
                document.querySelectorAll('.left-item').forEach(li => li.classList.remove('selected'));
                leftItem.classList.add('selected');
            };
            leftColumn.appendChild(leftItem);
        });
        
        shuffledRights.forEach((rightValue, i) => {
            const rightItem = document.createElement('div');
            rightItem.className = 'matching-item right-item';
            rightItem.dataset.letter = letters[i];
            rightItem.dataset.value = rightValue;
            rightItem.textContent = `${letters[i]}) ${rightValue}`;
            // store letter->value mapping for review
            currentQuiz._letterMap[letters[i]] = rightValue;
            rightItem.onclick = () => handleMatchingSelection(letters[i], rightValue, rightItem);
            rightColumn.appendChild(rightItem);
        });
        
        answersContainer.appendChild(leftColumn);
        answersContainer.appendChild(rightColumn);
    }
    
    document.getElementById('nextBtn').style.display = 'none';
}

function selectAnswer(answer) {
    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    
    if (currentQuiz.gameType === 'multipleChoice') {
        currentQuiz.selectedAnswers[currentQuiz.currentQuestion] = answer;
        
        // Check if answer is correct
        if (answer === question.correct) {
            currentQuiz.score++;
        }
        
        // Highlight selected answer
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach((btn, i) => {
            btn.classList.remove('selected');
            if (i === answer) {
                btn.classList.add('selected');
            }
        });
    } else if (currentQuiz.gameType === 'trueOrFalse') {
        currentQuiz.selectedAnswers[currentQuiz.currentQuestion] = answer;
        
        // Check if answer is correct
        if (answer === question.correct) {
            currentQuiz.score++;
        }
        
        // Highlight selected answer
        const buttons = document.querySelectorAll('.true-false-btn');
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            if ((btn.textContent === 'True' && answer === true) || (btn.textContent === 'False' && answer === false)) {
                btn.classList.add('selected');
            }
        });
    }
    
    // Show next button
    document.getElementById('nextBtn').style.display = 'block';
}

function handleMatchingSelection(letter, value, rightElem) {
    const totalPairs = currentQuiz.matchingPairs.length;
    const leftIndex = currentQuiz._selectedLeft;

    if (leftIndex === null || leftIndex === undefined) {
        alert('Please select a left item (1-10) first.');
        return;
    }

    // Ensure the selectedAnswers entry exists
    if (!currentQuiz.selectedAnswers[currentQuiz.currentQuestion]) {
        currentQuiz.selectedAnswers[currentQuiz.currentQuestion] = new Array(totalPairs).fill(null);
    }

    const userSelections = currentQuiz.selectedAnswers[currentQuiz.currentQuestion];

    // If this right item is already used by another left, prevent reuse
    if (currentQuiz._rightUsed[letter] !== undefined && currentQuiz._rightUsed[letter] !== leftIndex) {
        alert('That option is already used. Choose another.');
        return;
    }

    // If this left already had a selection, free the previous right item
    const previousLetter = userSelections[leftIndex];
    if (previousLetter) {
        // find previous right elem and unmark
        const prevRightElem = Array.from(document.querySelectorAll('.right-item')).find(e => e.dataset.letter === previousLetter);
        if (prevRightElem) prevRightElem.classList.remove('matched');
        delete currentQuiz._rightUsed[previousLetter];
    }

    // Assign this right to the selected left
    userSelections[leftIndex] = letter; // store letter for review
    currentQuiz._rightUsed[letter] = leftIndex;

    // Update UI: mark this right as matched and show letter next to left
    rightElem.classList.add('matched');
    const leftItem = document.querySelector(`.left-item[data-index='${leftIndex}']`);
    if (leftItem) {
        // Show assigned letter on the left item
        leftItem.querySelector('.assigned-letter')?.remove();
        const span = document.createElement('span');
        span.className = 'assigned-letter';
        span.style.marginLeft = '10px';
        span.style.fontWeight = '700';
        span.textContent = `(${letter})`;
        leftItem.appendChild(span);
        leftItem.classList.remove('selected');
    }

    // Clear selectedLeft so user explicitly selects next left
    currentQuiz._selectedLeft = null;

    // If all lefts have answers, compute score for this matching set and enable Next
    const allAssigned = userSelections.every(s => s !== null);
    if (allAssigned) {
        // count correct matches
        let correctCount = 0;
        userSelections.forEach((chosenLetter, idx) => {
            const chosenRightValue = Array.from(document.querySelectorAll('.right-item')).find(e => e.dataset.letter === chosenLetter).dataset.value;
            if (chosenRightValue === currentQuiz.matchingPairs[idx].right) correctCount++;
        });
        // For matching, we count correct pairs toward the score (0..N)
        currentQuiz.score += correctCount;

        // store number correct for review if needed
        currentQuiz._lastMatchingCorrect = correctCount;

        document.getElementById('nextBtn').style.display = 'block';
    }
}

function nextQuestion() {
    if (currentQuiz.gameType === 'matching') {
        // Matching is a single set of N pairs that were scored per-pair, so finishing the set ends the quiz
        endQuiz();
        return;
    }

    currentQuiz.currentQuestion++;
    const maxQuestions = 10;

    if (currentQuiz.currentQuestion < maxQuestions) {
        displayQuestion();
    } else {
        endQuiz();
    }
}

function startTimer() {
    // Ensure no previous timer is running
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }

    let timeLeft = currentQuiz.timeLimit;
    const minutesInit = Math.floor(timeLeft / 60);
    const secondsInit = timeLeft % 60;
    document.getElementById('timeDisplay').textContent = `${minutesInit}:${secondsInit < 10 ? '0' : ''}${secondsInit}`;

    quizTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timeDisplay').textContent = 
            `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            quizTimer = null;
            endQuiz();
        }
    }, 1000);
}

// Format seconds into M:SS
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function endQuiz() {
    clearInterval(quizTimer);
    quizTimer = null;

    const timeTaken = Math.floor((Date.now() - currentQuiz.startTime) / 1000);
    const totalQuestions = currentQuiz.gameType === 'matching' ? (currentQuiz.matchingPairs ? currentQuiz.matchingPairs.length : 0) : 10;
    const percentage = totalQuestions > 0 ? Math.round((currentQuiz.score / totalQuestions) * 100) : 0;
    
    // Save quiz result (only if a current user exists)
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const typeLabel = currentQuiz.gameType === 'multipleChoice' ? 'MC' : currentQuiz.gameType === 'trueOrFalse' ? 'T/F' : 'Match';

        if (currentUser) {
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].quizzes = users[userIndex].quizzes || [];
                users[userIndex].quizzes.push({
                    level: currentQuiz.level,
                    gameType: typeLabel,
                    score: currentQuiz.score,
                    totalQuestions: totalQuestions,
                    percentage: percentage,
                    date: new Date().toLocaleDateString(),
                    time: timeTaken
                });
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
            }
        }
    } catch (e) {
        console.warn('Could not persist quiz result', e);
    }
    
    // Display results
    document.getElementById('finalScore').textContent = currentQuiz.score;
    document.getElementById('resultLevel').textContent = currentQuiz.level.charAt(0).toUpperCase() + currentQuiz.level.slice(1);
    document.getElementById('correctCount').textContent = currentQuiz.score;
    document.getElementById('timeTaken').textContent = timeTaken + 's';
    document.getElementById('resultPercentage').textContent = percentage + '%';
    
    // Build review of questions based on game type
    let reviewHtml = '<h3 style="color: #667eea; margin-bottom: 15px;">Review Your Answers</h3>';
    
    if (currentQuiz.gameType === 'multipleChoice') {
        currentQuiz.questions.forEach((question, index) => {
            const isCorrect = currentQuiz.selectedAnswers[index] === question.correct;
            const selectedAnswer = question.options[currentQuiz.selectedAnswers[index]];
            const correctAnswer = question.options[question.correct];
            
            reviewHtml += `
                <div class="result-item">
                    <div class="result-question">Q${index + 1}: ${question.question}</div>
                    <div class="result-answer">Your answer: <span class="${isCorrect ? 'result-correct' : 'result-incorrect'}">${selectedAnswer}</span></div>
                    ${!isCorrect ? `<div class="result-answer">Correct answer: <span class="result-correct">${correctAnswer}</span></div>` : ''}
                </div>
            `;
        });
    } else if (currentQuiz.gameType === 'trueOrFalse') {
        currentQuiz.questions.forEach((question, index) => {
            const isCorrect = currentQuiz.selectedAnswers[index] === question.correct;
            const selectedAnswer = currentQuiz.selectedAnswers[index] ? 'True' : 'False';
            const correctAnswer = question.correct ? 'True' : 'False';
            
            reviewHtml += `
                <div class="result-item">
                    <div class="result-question">Q${index + 1}: ${question.question}</div>
                    <div class="result-answer">Your answer: <span class="${isCorrect ? 'result-correct' : 'result-incorrect'}">${selectedAnswer}</span></div>
                    ${!isCorrect ? `<div class="result-answer">Correct answer: <span class="result-correct">${correctAnswer}</span></div>` : ''}
                </div>
            `;
        });
    } else if (currentQuiz.gameType === 'matching') {
        const matchingPairs = currentQuiz.matchingPairs || (currentQuiz.questions[0] && currentQuiz.questions[0].pairs) || [];
        const userLetters = (currentQuiz.selectedAnswers && currentQuiz.selectedAnswers[0]) ? currentQuiz.selectedAnswers[0] : [];
        reviewHtml += `<div class="result-item"><div class="result-question">Matching Review</div>`;
        matchingPairs.forEach((pair, pIndex) => {
            const chosenLetter = userLetters[pIndex];
            const chosenValue = chosenLetter ? (currentQuiz._letterMap ? currentQuiz._letterMap[chosenLetter] : 'Unknown') : 'Not answered';
            const isCorrect = chosenValue === pair.right;
            reviewHtml += `
                <div class="result-answer">
                    ${pIndex + 1}) ${pair.left} → ${chosenLetter ? chosenLetter + ') ' + chosenValue : chosenValue}
                    ${isCorrect ? `<span class="result-correct"> (Correct)</span>` : ` <span class="result-incorrect">(Correct: ${pair.right})</span>`}
                </div>
            `;
        });
        reviewHtml += '</div>';
    }
    
    document.getElementById('resultsReview').innerHTML = reviewHtml;
    
    showPage('resultsPage');
}

function quitQuiz() {
    if (confirm('Are you sure you want to quit? Your progress will not be saved.')) {
        clearInterval(quizTimer);
        navigateToHome();
    }
}

function navigateToHome() {
    updateHomeStats();
    showPage('homePage');
}

function retakeQuiz() {
    startQuiz(currentQuiz.level, currentQuiz.gameType);
}

// Update home page stats
function updateHomeStats() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user || !user.quizzes || user.quizzes.length === 0) {
        // legacy elements (if present)
        if (document.getElementById('totalQuizzes')) document.getElementById('totalQuizzes').textContent = '0';
        if (document.getElementById('avgScore')) document.getElementById('avgScore').textContent = '0%';
        if (document.getElementById('bestScore')) document.getElementById('bestScore').textContent = '0';

        // new dashboard elements
        if (document.getElementById('totalQuizzesSmall')) document.getElementById('totalQuizzesSmall').textContent = '0';
        if (document.getElementById('avgScoreSmall')) document.getElementById('avgScoreSmall').textContent = '0%';
        if (document.getElementById('bestScoreSmall')) document.getElementById('bestScoreSmall').textContent = '0/10';
        if (document.getElementById('progressBarFill')) document.getElementById('progressBarFill').style.width = '0%';
        if (document.getElementById('progressPercent')) document.getElementById('progressPercent').textContent = '0%';
        renderHomeDashboard();
        return;
    }
    
    const totalQuizzes = user.quizzes.length;
    const avgScore = Math.round(user.quizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes);
    const bestScore = Math.max(...user.quizzes.map(q => q.score));
    
    // legacy elements
    if (document.getElementById('totalQuizzes')) document.getElementById('totalQuizzes').textContent = totalQuizzes;
    if (document.getElementById('avgScore')) document.getElementById('avgScore').textContent = avgScore + '%';
    if (document.getElementById('bestScore')) document.getElementById('bestScore').textContent = bestScore + '/10';

    // new dashboard elements
    if (document.getElementById('totalQuizzesSmall')) document.getElementById('totalQuizzesSmall').textContent = totalQuizzes;
    if (document.getElementById('avgScoreSmall')) document.getElementById('avgScoreSmall').textContent = avgScore + '%';
    if (document.getElementById('bestScoreSmall')) document.getElementById('bestScoreSmall').textContent = bestScore + '/10';
    if (document.getElementById('progressBarFill')) document.getElementById('progressBarFill').style.width = avgScore + '%';
    if (document.getElementById('progressPercent')) document.getElementById('progressPercent').textContent = avgScore + '%';

    renderHomeDashboard();
}

function renderHomeDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser')) || { name: 'User', email: '', quizzes: [] };

    // Update name and avatar
    if (document.getElementById('dashboardName')) document.getElementById('dashboardName').textContent = user.name;
    if (document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').textContent = user.name;
    if (document.getElementById('dashboardAvatar')) {
        const initials = user.name ? user.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() : 'U';
        document.getElementById('dashboardAvatar').textContent = initials;
    }
    if (document.getElementById('dashboardEmail')) document.getElementById('dashboardEmail').textContent = user.email || '';

    // Recent quizzes
    const recentEl = document.getElementById('recentQuizzes');
    if (recentEl) {
        recentEl.innerHTML = '';
        if (!user.quizzes || user.quizzes.length === 0) {
            recentEl.innerHTML = '<p class="no-recent">No attempts yet. Play a quiz to see results here.</p>';
        } else {
            const recent = user.quizzes.slice(-5).reverse();
            recent.forEach(q => {
                const div = document.createElement('div');
                div.className = 'recent-item';
                const left = document.createElement('div');
                left.innerHTML = `<div><strong>${q.level.charAt(0).toUpperCase() + q.level.slice(1)}</strong> <span class="meta">${q.gameType}</span></div><div class="meta">${q.date}</div>`;
                const right = document.createElement('div');
                right.innerHTML = `<div><strong>${q.percentage}%</strong></div><div class="meta">${q.score}/${q.totalQuestions}</div>`;
                div.appendChild(left);
                div.appendChild(right);
                recentEl.appendChild(div);
            });
        }
    }

    // Leaderboard (top 5 by average percentage)
    const lb = document.getElementById('leaderboard');
    if (lb) {
        lb.innerHTML = '';
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.length === 0) {
            lb.innerHTML = '<p class="no-leaderboard">No leaderboard data yet.</p>';
        } else {
            const ranks = users.map(u => {
                const avg = (u.quizzes && u.quizzes.length) ? Math.round(u.quizzes.reduce((s, q) => s + q.percentage, 0) / u.quizzes.length) : 0;
                return { name: u.name || u.email, avg };
            }).sort((a, b) => b.avg - a.avg).slice(0, 5);

            ranks.forEach((r, i) => {
                const div = document.createElement('div');
                div.className = 'leader-item';
                div.innerHTML = `<div>${i + 1}. ${r.name}</div><div><strong>${r.avg}%</strong></div>`;
                lb.appendChild(div);
            });
        }
    }
}

// Statistics
function loadStatistics() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const statsContainer = document.getElementById('statsContainer');
    
    if (!user.quizzes || user.quizzes.length === 0) {
        statsContainer.innerHTML = '<p class="no-stats">No quiz attempts yet. Start your first quiz!</p>';
        return;
    }
    
    let html = '';
    user.quizzes.forEach((quiz) => {
        const levelColor = quiz.level === 'easy' ? '🟢' : quiz.level === 'medium' ? '🟡' : '🔴';
        html += `
            <div class="stat-card">
                <div class="stat-header">
                    <h4>${levelColor} ${quiz.level.charAt(0).toUpperCase() + quiz.level.slice(1)}</h4>
                    <span class="stat-date">${quiz.date}</span>
                </div>
                <div class="stat-info">
                    <p><strong>Score:</strong> ${quiz.score}/${quiz.totalQuestions}</p>
                    <p><strong>Percentage:</strong> ${quiz.percentage}%</p>
                    <p><strong>Time:</strong> ${quiz.time}s</p>
                </div>
            </div>
        `;
    });
    
    statsContainer.innerHTML = html;
}

// Data visualization helpers
function loadDataVisualization() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const labels = users.map(u => u.email || u.name || 'unknown');
    const totalQuizzes = users.map(u => (u.quizzes ? u.quizzes.length : 0));
    const avgScores = users.map(u => {
        if (!u.quizzes || u.quizzes.length === 0) return 0;
        return Math.round(u.quizzes.reduce((s, q) => s + q.percentage, 0) / u.quizzes.length);
    });

    if (window.dataChartInstance) {
        window.dataChartInstance.destroy();
    }
    const ctx = document.getElementById('dataChart').getContext('2d');
    window.dataChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Total Quizzes',
                    backgroundColor: '#667eea',
                    data: totalQuizzes
                },
                {
                    label: 'Average Score',
                    backgroundColor: '#4ecdc4',
                    data: avgScores
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// exportDataCSV removed per user request; download functionality disabled


// simple CSV loader using PapaParse
async function loadTable() {
    try {
        const response = await fetch(GITHUB_RAW_URL);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true });
        const data = results.data;
        const tableBody = document.getElementById('myTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            data.forEach(row => {
                tableBody.innerHTML += `<tr><td>${row.name}</td><td>${row.averageScore}</td></tr>`;
            });
        }
    } catch (e) {
        console.warn('Could not load remote CSV', e);
    }
}

// saving back to GitHub via API (requires personal token from user input)
async function saveData(newName, newScore) {
    const token = document.getElementById('adminKey')?.value;
    if (!token) {
        alert('Please enter token first');
        return;
    }
    const url = GITHUB_API_URL;
    const fileData = await fetch(url).then(res => res.json());
    const sha = fileData.sha;
    const oldCsv = atob(fileData.content);
    const newCsv = oldCsv + `\n${newName},email@test.com,1,${newScore},${newScore}`;
    await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: "Updating scores",
            content: btoa(newCsv),
            sha: sha
        })
    });
    alert("Database Updated!");
}

// Load Profile
function loadProfile() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    
    if (!user.quizzes || user.quizzes.length === 0) {
        document.getElementById('profileQuizzes').textContent = '0';
        document.getElementById('profileAvg').textContent = '0%';
        document.getElementById('profileBest').textContent = '0/10';
        return;
    }
    
    const totalQuizzes = user.quizzes.length;
    const avgScore = Math.round(user.quizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes);
    const bestScore = Math.max(...user.quizzes.map(q => q.score));
    
    document.getElementById('profileQuizzes').textContent = totalQuizzes;
    document.getElementById('profileAvg').textContent = avgScore + '%';
    document.getElementById('profileBest').textContent = bestScore + '/10';
}

// Password visibility toggles and character limit counters
function setupPasswordControls() {
    const eyeOpen = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeOff = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.16 21.16 0 0 1 5.06-6.94"></path><path d="M1 1l22 22"></path><path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"></path></svg>';

    document.querySelectorAll('.toggle-password').forEach(btn => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (!input) return;
        const max = parseInt(input.dataset.max) || parseInt(input.getAttribute('maxlength')) || 20;
        const min = parseInt(input.dataset.min) || parseInt(input.getAttribute('minlength')) || 8;
        const counter = document.getElementById(targetId + 'Counter');

        const updateCounter = () => {
            if (counter) counter.textContent = `${input.value.length}/${max}`;
            // clear previous classes
            input.classList.remove('invalid', 'valid');
            if (counter) counter.classList.remove('invalid', 'valid');

            // Do not show invalid state before the user begins typing
            if (input.value.length === 0) {
                return;
            }

            if (input.value.length < min) {
                input.classList.add('invalid');
                if (counter) counter.classList.add('invalid');
            } else {
                input.classList.add('valid');
                if (counter) counter.classList.add('valid');
            }
        };

        // initialize
        updateCounter();

        input.addEventListener('input', () => {
            if (input.value.length > max) {
                input.value = input.value.slice(0, max);
            }
            updateCounter();
        });

        // ensure icon present
        if (!btn.innerHTML.trim()) btn.innerHTML = eyeOpen;

        btn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = eyeOff;
                btn.setAttribute('aria-label', 'Hide password');
            } else {
                input.type = 'password';
                btn.innerHTML = eyeOpen;
                btn.setAttribute('aria-label', 'Show password');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // initial UI state
    const sb = document.getElementById('sidebar');
    if (sb) sb.style.display = 'none';
    // setup password controls and other initial assets
    try { setupPasswordControls(); } catch (e) { console.warn('setupPasswordControls failed', e); }
    try { loadAssetsConfig(); } catch (e) { console.warn('loadAssetsConfig failed', e); }
});




