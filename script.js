// Game State
let soalAktif = null;
let jawabanBenar = null;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let helpCount = 5;
let revealedLetters = [];
let totalLetters = 0;

// DOM Elements
const soalElement = document.getElementById('soal');
const jawabanInput = document.getElementById('jawaban');
const submitBtn = document.getElementById('submit-btn');
const newBtn = document.getElementById('new-btn');
const resultPanel = document.getElementById('result-panel');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const resultCorrectAnswer = document.getElementById('result-correct-answer');
const scoreElement = document.getElementById('score');
const correctElement = document.getElementById('correct');
const wrongElement = document.getElementById('wrong');
const helpCountElement = document.getElementById('help-count');
const lettersGrid = document.getElementById('letters-grid');
const headerHelpBtn = document.getElementById('header-help-btn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    ambilSoal();
    
    // Prevent zoom on mobile
    document.addEventListener('touchmove', function(e) {
        if(e.scale !== 1) e.preventDefault();
    }, { passive: false });
});

// Setup event listeners
function setupEventListeners() {
    jawabanInput.addEventListener('input', function() {
        submitBtn.disabled = !this.value.trim();
    });

    jawabanInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            submitJawaban();
        }
    });

    headerHelpBtn.addEventListener('click', bukaHuruf);
    submitBtn.addEventListener('click', submitJawaban);
    newBtn.addEventListener('click', ambilSoal);
}

// Fetch question from API
async function ambilSoal() {
    // Reset state
    resetGameState();
    
    // Show loading
    soalElement.innerHTML = `
        <div class="loading">
            <div class="loading-text">Memuat...</div>
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    try {
        const res = await fetch("https://api.siputzx.my.id/api/games/asahotak", {
            cache: "no-store",
            headers: { 'Accept': '*/*' }
        });

        const json = await res.json();

        // Parse data
        const data = json.data || json.result || json;
        soalAktif = data.soal || data.question;
        jawabanBenar = data.jawaban || data.answer || data.kunci;

        if (!soalAktif || !jawabanBenar) {
            throw new Error("Format data tidak valid");
        }

        // Update UI
        soalElement.innerHTML = `<div class="question-text">${soalAktif}</div>`;
        jawabanInput.focus();
        
        // Initialize letter grid
        initLetterGrid();
        
        // Update button states
        newBtn.disabled = false;
        submitBtn.disabled = true;

        // Reset result panel
        resetResultPanel();

    } catch (err) {
        console.error("Error:", err);
        soalElement.innerHTML = `
            <div style="text-align: center; padding: 10px;">
                <div style="margin-bottom: 8px; font-size: 14px; color: #e74c3c; font-weight: 700;">⚠️ Gagal</div>
                <button onclick="ambilSoal()" style="background: #000; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-family: 'Poppins'; cursor: pointer; font-size: 12px; font-weight: 700; border: 2px solid #000;">
                    Coba Lagi
                </button>
            </div>
        `;
        jawabanInput.disabled = true;
        submitBtn.disabled = true;
        updateHelpButtons();
    }
}

// Initialize letter grid
function initLetterGrid() {
    if (!jawabanBenar) return;
    
    const answer = jawabanBenar.trim().toUpperCase();
    totalLetters = answer.replace(/\s/g, '').length;
    revealedLetters = Array(totalLetters).fill(false);
    
    lettersGrid.innerHTML = '';
    
    // Limit max letters for display
    const maxLetters = Math.min(totalLetters, 15);
    
    // Create letter boxes
    for (let i = 0; i < maxLetters; i++) {
        const letterBox = document.createElement('div');
        letterBox.className = 'letter-box empty';
        letterBox.id = `letter-${i}`;
        letterBox.textContent = '';
        lettersGrid.appendChild(letterBox);
    }
    
    // Reset help count
    helpCount = 5;
    updateHelpCount();
}

// Reset result panel
function resetResultPanel() {
    resultTitle.textContent = '⏳ MENUNGGU';
    resultMessage.textContent = 'Submit jawaban untuk melihat hasil';
    resultCorrectAnswer.textContent = '';
    resultPanel.style.borderColor = '#000';
}

// Open random letter hint
function bukaHuruf() {
    if (helpCount <= 0 || !jawabanBenar) {
        showTemporaryMessage('Bantuan habis!', 1500);
        return;
    }
    
    const answer = jawabanBenar.trim().toUpperCase().replace(/\s/g, '');
    const maxLetters = Math.min(totalLetters, 15);
    const unrevealedIndices = [];
    
    // Find unrevealed letters
    for (let i = 0; i < maxLetters; i++) {
        if (!revealedLetters[i]) {
            unrevealedIndices.push(i);
        }
    }
    
    if (unrevealedIndices.length === 0) {
        showTemporaryMessage('Semua huruf terbuka!', 1500);
        return;
    }
    
    // Pick random unrevealed letter
    const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    const letter = answer[randomIndex];
    
    // Reveal the letter
    revealedLetters[randomIndex] = true;
    const letterBox = document.getElementById(`letter-${randomIndex}`);
    if (letterBox) {
        letterBox.textContent = letter;
        letterBox.className = 'letter-box revealed';
    }
    
    // Decrement help count
    helpCount--;
    updateHelpCount();
    
    // Show which letter was revealed
    showTemporaryMessage(`Huruf "${letter}" terbuka!`, 1200);
}

// Show temporary message
function showTemporaryMessage(message, duration) {
    // Remove existing message
    const existingMsg = document.querySelector('.temp-message');
    if (existingMsg) existingMsg.remove();
    
    const tempMsg = document.createElement('div');
    tempMsg.className = 'temp-message';
    tempMsg.textContent = message;
    tempMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
        z-index: 1000;
        pointer-events: none;
        animation: fadeInOut ${duration}ms ease;
        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        border: 2px solid #fff;
        text-align: center;
        max-width: 80%;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(tempMsg);
    
    setTimeout(() => {
        if (tempMsg.parentNode) {
            document.body.removeChild(tempMsg);
        }
    }, duration);
}

// Update help count display
function updateHelpCount() {
    helpCountElement.textContent = helpCount;
    updateHelpButtons();
}

// Update help buttons state
function updateHelpButtons() {
    const disabled = helpCount <= 0;
    
    if (headerHelpBtn) {
        headerHelpBtn.disabled = disabled;
        headerHelpBtn.style.opacity = disabled ? '0.6' : '1';
        headerHelpBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        headerHelpBtn.style.pointerEvents = disabled ? 'none' : 'auto';
    }
}

// Submit answer
function submitJawaban() {
    if (!jawabanBenar || !jawabanInput.value.trim()) {
        showTemporaryMessage('Masukkan jawaban!', 1200);
        return;
    }

    const userAnswer = jawabanInput.value.trim().toLowerCase();
    const correctAnswer = jawabanBenar.trim().toLowerCase();

    // Disable controls
    jawabanInput.disabled = true;
    submitBtn.disabled = true;
    newBtn.disabled = false;

    // Check answer
    const isCorrect = userAnswer === correctAnswer;
    
    // Update stats
    if (isCorrect) {
        score += 10;
        correctCount++;
        showResult('✅ BENAR!', 'Jawaban tepat!');
        resultPanel.style.borderColor = '#000';
    } else {
        wrongCount++;
        showResult('❌ SALAH!', 'Jawaban benar:');
        resultPanel.style.borderColor = '#000';
    }

    // Reveal all letters
    revealAllLetters();
    
    // Update displays
    scoreElement.textContent = score;
    correctElement.textContent = correctCount;
    wrongElement.textContent = wrongCount;
    
    // Focus on new question button
    newBtn.focus();
}

// Show result
function showResult(title, message) {
    resultTitle.textContent = title;
    resultMessage.textContent = message;
    resultCorrectAnswer.textContent = jawabanBenar.toUpperCase();
}

// Reveal all letters
function revealAllLetters() {
    if (!jawabanBenar) return;
    
    const answer = jawabanBenar.trim().toUpperCase().replace(/\s/g, '');
    const maxLetters = Math.min(totalLetters, 15);
    
    for (let i = 0; i < maxLetters; i++) {
        const letterBox = document.getElementById(`letter-${i}`);
        if (letterBox && !revealedLetters[i]) {
            setTimeout(() => {
                letterBox.textContent = answer[i];
                letterBox.className = 'letter-box revealed';
            }, i * 80);
        }
    }
}

// Reset game state for new question
function resetGameState() {
    jawabanBenar = null;
    jawabanInput.value = '';
    jawabanInput.disabled = false;
    jawabanInput.placeholder = 'Ketik jawaban...';
    submitBtn.disabled = true;
    newBtn.disabled = true;
    
    lettersGrid.innerHTML = '';
    revealedLetters = [];
    totalLetters = 0;
    
    resetResultPanel();
}
