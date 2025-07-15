import { tsParticles } from "tsparticles";
import "bootstrap";

document.addEventListener('DOMContentLoaded', () => {

    let audioContext;
    let currentlyPlaying = null;

    // --- Particle Effects ---
    const particlesConfig = {
        fullScreen: { enable: false },
        particles: {
            number: { value: 0 },
            color: { value: "#ffd700" },
            shape: { type: "circle" },
            opacity: { value: {min: 0.1, max: 0.8}, animation: { enable: true, speed: 1, sync: false } },
            size: { value: { min: 1, max: 3 } },
            move: {
                enable: true,
                speed: 2,
                direction: "top",
                straight: true,
                outModes: { default: "destroy" }
            }
        },
        detectRetina: true,
    };
    
    tsParticles.load("tsparticles", particlesConfig);

    function triggerAchievementParticles(x, y) {
        tsParticles.domItem(0).emitter.addEmitter({
            position: { x: x * 100, y: y * 100 },
            rate: { quantity: 15, delay: 0.1 },
            life: { duration: 0.5, count: 1},
            particles: {
                 move: {
                    direction: "top",
                    speed: {min: 1, max: 3}
                }
            }
        });
    }

    // --- Sound Effects ---
    const achievementSound = new Audio('achievement.mp3');
    achievementSound.volume = 0.5;

    // --- Audio Guides ---
    const initAudioContext = () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    };
    
    document.querySelectorAll('.audio-guide-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            initAudioContext();
            const btn = e.currentTarget;
            const icon = btn.querySelector('i');

            if (currentlyPlaying && currentlyPlaying.button === btn) {
                // Stop the currently playing audio
                currentlyPlaying.source.stop();
                currentlyPlaying.source.disconnect();
                currentlyPlaying = null;
                icon.classList.remove('bi-stop-circle');
                icon.classList.add('bi-earbuds');
            } else {
                 // Stop any other audio that might be playing
                if (currentlyPlaying) {
                    currentlyPlaying.source.stop();
                    currentlyPlaying.source.disconnect();
                    const oldIcon = currentlyPlaying.button.querySelector('i');
                    oldIcon.classList.remove('bi-stop-circle');
                    oldIcon.classList.add('bi-earbuds');
                }

                // Start new audio
                const audioSrc = btn.dataset.src;
                try {
                    const response = await fetch(audioSrc);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.loop = true;
                    source.connect(audioContext.destination);
                    source.start();
                    
                    currentlyPlaying = { source, button: btn };
                    icon.classList.remove('bi-earbuds');
                    icon.classList.add('bi-stop-circle');
                    
                    source.onended = () => {
                        if (currentlyPlaying && currentlyPlaying.button === btn) {
                            icon.classList.remove('bi-stop-circle');
                            icon.classList.add('bi-earbuds');
                            currentlyPlaying = null;
                        }
                    };

                } catch (error) {
                    console.error('Error playing audio:', error);
                }
            }
        });
    });


    // --- Gamification & Local Storage ---
    const levelEl = document.getElementById('level');
    const streakEl = document.getElementById('streak');
    const mantrasEl = document.getElementById('mantras');
    const logForm = document.getElementById('consciousLogForm');

    const levels = ['Initiate', 'Adept', 'Sage', 'Master'];
    const mantras = {
        'Adept': '"The space between thoughts is where freedom lives."',
        'Sage': '"I am the silent observer, not the storm of my mind."',
        'Master': '"My consciousness shapes my reality."'
    };
    
    let stats = {
        levelIndex: 0,
        streak: 0,
        lastPracticeDate: null,
        totalPracticeDays: 0
    };

    function loadStats() {
        const savedStats = JSON.parse(localStorage.getItem('consciousStats'));
        if (savedStats) {
            stats = savedStats;
            // Check if streak is broken
            if (stats.lastPracticeDate) {
                const lastDate = new Date(stats.lastPracticeDate);
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);

                const isSameDay = lastDate.toDateString() === today.toDateString();
                const isYesterday = lastDate.toDateString() === yesterday.toDateString();

                if (!isSameDay && !isYesterday) {
                    stats.streak = 0; // Reset streak if more than a day has passed
                }
            }
        }
        updateUI();
    }

    function saveStats() {
        localStorage.setItem('consciousStats', JSON.stringify(stats));
    }

    function updateUI() {
        levelEl.textContent = levels[stats.levelIndex];
        streakEl.textContent = `${stats.streak} Days`;
        
        let unlockedMantras = '';
        for (let i = 1; i <= stats.levelIndex; i++) {
            if (levels[i] && mantras[levels[i]]) {
                unlockedMantras += `<p class="mb-1">${mantras[levels[i]]}</p>`;
            }
        }
        mantrasEl.innerHTML = unlockedMantras || 'None yet. Keep practicing!';
    }

    logForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const today = new Date();
        const lastDate = stats.lastPracticeDate ? new Date(stats.lastPracticeDate) : null;

        if (!lastDate || lastDate.toDateString() !== today.toDateString()) {
             if (lastDate) {
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                if (lastDate.toDateString() === yesterday.toDateString()) {
                    stats.streak++;
                } else {
                    stats.streak = 1;
                }
            } else {
                stats.streak = 1;
            }
            stats.totalPracticeDays++;
        }

        stats.lastPracticeDate = today.toISOString();
        
        // Level up logic
        const oldLevelIndex = stats.levelIndex;
        if (stats.totalPracticeDays > 30 && stats.levelIndex < 3) stats.levelIndex = 3; // Master
        else if (stats.totalPracticeDays > 14 && stats.levelIndex < 2) stats.levelIndex = 2; // Sage
        else if (stats.totalPracticeDays > 5 && stats.levelIndex < 1) stats.levelIndex = 1; // Adept
        
        saveStats();
        updateUI();

        // Neuromarketing stimuli
        achievementSound.play();
        const rect = e.submitter.getBoundingClientRect();
        const x = rect.left / window.innerWidth;
        const y = rect.top / window.innerHeight;
        triggerAchievementParticles(x, y);

        e.target.reset();
        
        // Show a confirmation
        const confirmation = document.createElement('div');
        confirmation.className = 'alert alert-success mt-3';
        confirmation.textContent = 'Practice logged. Your inner master thanks you.';
        logForm.appendChild(confirmation);
        setTimeout(() => confirmation.remove(), 4000);
    });

    loadStats();
});

