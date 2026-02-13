// Fun cat facts to display
const catFacts = [
    "😸 Fun fact: Cats spend 70% of their lives sleeping. Maybe we should nap together?",
    "😺 Did you know? A group of cats is called a 'clowder'. We could start our own!",
    "😻 Cat fact: Cats have over 20 vocalizations. I only need one: I love you!",
    "😽 Meow fact: Cats can rotate their ears 180 degrees. Mine are pointed at you!",
    "😼 Purr-fect fact: A cat's purr vibrates at a frequency that promotes healing!",
    "🐱 Cat wisdom: Cats choose their favorite humans. You're definitely mine!"
];

// Get elements
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const mainContainer = document.getElementById('mainContainer');
const celebration = document.getElementById('celebration');
const catFact = document.getElementById('catFact');

// Display a random cat fact on page load
window.addEventListener('load', () => {
    const randomFact = catFacts[Math.floor(Math.random() * catFacts.length)];
    catFact.textContent = randomFact;
});

// YES button - Show celebration
yesBtn.addEventListener('click', () => {
    mainContainer.style.display = 'none';
    celebration.style.display = 'block';
    createConfetti();
    playSound();
});

// NO button - Move random and make YES button MASSIVE
let noBtnClickCount = 0;
let yesBtnScale = 1;

noBtn.addEventListener('click', () => {
    noBtnClickCount++;
    
    // --- 1. Make YES button grow EXPONENTIALLY ---
    // Increase the scale factor more aggressively
    const growthFactor = 0.5 + (noBtnClickCount * 0.2);
    yesBtnScale += growthFactor;
    
    // Apply the transform
    yesBtn.style.transform = `scale(${yesBtnScale})`;
    
    // FORCE Z-index to be extremely high so it covers the card, the text, and the gifs
    // The card usually has z-index 1, so 5000 is plenty to cover it.
    yesBtn.style.zIndex = '5000'; 
    
    // --- 2. Move NO button (Smart Logic) ---
    noBtn.style.position = 'fixed';
    
    // Set No button Z-Index HIGHER than Yes button so it's never unclickable
    noBtn.style.zIndex = '10000';
    
    // Get the current size/position of the growing YES button
    const yesRect = yesBtn.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();
    
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    
    let newLeft, newTop;
    let isOverlapping = true;
    let attempts = 0;
    
    // Try to find a spot that doesn't overlap with the YES button
    // We increased attempts to 100 to try harder to find a free spot
    while (isOverlapping && attempts < 100) {
        // Generate random coordinates within the window
        newLeft = Math.random() * (winWidth - noRect.width - 20) + 10;
        newTop = Math.random() * (winHeight - noRect.height - 20) + 10;
        
        // Define the edges of the potential new "No" button position
        const noLeft = newLeft;
        const noRight = newLeft + noRect.width;
        const noTop = newTop;
        const noBottom = newTop + noRect.height;
        
        // Define the edges of the "Yes" button (with a buffer)
        const buffer = 10;
        const yesLeft = yesRect.left - buffer;
        const yesRight = yesRect.right + buffer;
        const yesTop = yesRect.top - buffer;
        const yesBottom = yesRect.bottom + buffer;
        
        // Check intersection
        const overlaps = !(noRight < yesLeft || 
                          noLeft > yesRight || 
                          noBottom < yesTop || 
                          noTop > yesBottom);
                          
        if (!overlaps) {
            isOverlapping = false;
        }
        attempts++;
    }
    
    // If we couldn't find a non-overlapping spot (because Yes is huge), 
    // just place it randomly. The z-index 10000 ensures it's still clickable!
    if (isOverlapping) {
        newLeft = Math.random() * (winWidth - noRect.width - 20) + 10;
        newTop = Math.random() * (winHeight - noRect.height - 20) + 10;
    }
    
    // Apply the new coordinates
    noBtn.style.left = newLeft + 'px';
    noBtn.style.top = newTop + 'px';


    // --- 3. Change cat fact/text based on clicks ---
    const sadCatFacts = [
        "😿 The cats are sad... Please reconsider?",
        "😾 The cats are getting upset! Look at the YES growing!",
        "😼 You can't escape! The YES is getting BIGGER!",
        "🙀 THE YES IS TAKING OVER THE SCREEN!",
        "😹 YES IS BECOMING MASSIVE!",
        "😱 YOU CAN'T EVEN SEE ANYTHING BUT YES NOW!",
        "🤯 JUST CLICK THE GIANT YES ALREADY!"
    ];

    if (noBtnClickCount <= sadCatFacts.length) {
        catFact.textContent = sadCatFacts[noBtnClickCount - 1];
    } else {
        catFact.textContent = sadCatFacts[sadCatFacts.length - 1];
    }
});

// Confetti effect
function createConfetti() {
    const colors = ['#ff1493', '#ff69b4', '#ffc0cb', '#ff69b4', '#d63384'];
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.opacity = '1';
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '1000';
            confetti.style.pointerEvents = 'none';
            
            document.body.appendChild(confetti);
            
            const fallDuration = Math.random() * 3 + 2;
            const fallDistance = window.innerHeight + 20;
            const drift = (Math.random() - 0.5) * 100;
            
            confetti.animate([
                { transform: 'translateY(0px) translateX(0px) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${fallDistance}px) translateX(${drift}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: fallDuration * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            setTimeout(() => { confetti.remove(); }, fallDuration * 1000);
        }, i * 20);
    }
}

function playSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}