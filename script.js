// HELPER: Pick emoji based on slider value
function getEmoji(value) {
    if (value < 20) return "😢";
    if (value < 40) return "🙁";
    if (value < 60) return "😐";
    if (value < 80) return "🙂";
    return "😄";
}

// ACTION: Save data from check-in page
function logCheckIn() {
    const moodValue = document.querySelector('input[type="range"]').value;
    const selectedTags = [];
    
    document.querySelectorAll('.pill-input:checked').forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`).innerText;
        selectedTags.push(label);
    });

    // Save Today's Data
    localStorage.setItem('userMood', moodValue);
    localStorage.setItem('userTags', JSON.stringify(selectedTags));

    // Manage Weekly History Array
    let weeklyMoods = JSON.parse(localStorage.getItem('weeklyMoods') || "[]");
    weeklyMoods.push(moodValue);
    if (weeklyMoods.length > 7) weeklyMoods.shift(); // Keep last 7 days
    localStorage.setItem('weeklyMoods', JSON.stringify(weeklyMoods));

    window.location.href = "userWeek.html";
}

// INITIALIZE: Run when any page loads
window.onload = function() {
    const slider = document.getElementById('mood-slider');
    const emojiDisplay = document.getElementById('mood-emoji');
    const bars = document.querySelectorAll('.bar');
    const patternBox = document.getElementById('user-pattern');
    const feedbackBox = document.getElementById('dynamic-feedback');
    const actionBox = document.getElementById('action-item');

    const savedMood = localStorage.getItem('userMood');
    const savedTags = JSON.parse(localStorage.getItem('userTags') || "[]");
    const weeklyMoods = JSON.parse(localStorage.getItem('weeklyMoods') || "[]");

    // 1. Emoji Slider Logic (checkIn.html)
    if (slider && emojiDisplay) {
        slider.addEventListener('input', function() {
            emojiDisplay.innerText = getEmoji(this.value);
        });
    }

    // 2. Weekly Chart Logic (userWeek.html)
    if (bars.length > 0 && weeklyMoods.length > 0) {
        let barIndex = bars.length - 1;
        for (let i = weeklyMoods.length - 1; i >= 0 && barIndex >= 0; i--) {
            bars[barIndex].style.height = weeklyMoods[i] + "%";
            if (i === weeklyMoods.length - 1) bars[barIndex].classList.add('highlight');
            barIndex--;
        }
    }

    // 3. Pattern Logic (userWeek.html)
    if (patternBox) {
        patternBox.innerHTML = savedTags.length > 0 
            ? `🟠 <b>${savedTags.join(", ")}</b> had the most impact on your mood today.`
            : `⚪️ No specific factors were tagged today.`;
    }

    // 4. Feedback Logic (userNextSteps.html)
    if (feedbackBox && savedMood) {
        feedbackBox.innerText = savedMood < 40 
            ? "You've had a heavy day. Focus on gentle rest." 
            : "You're feeling resilient. Keep these positive habits going!";
    }

    // 5. Specific Action Conclusions (userNextSteps.html)
    if (actionBox) {
        if (savedTags.includes("Sleep")) {
            actionBox.innerText = "Since sleep is a factor, try winding down 30 minutes earlier tonight without screens.";
        } else if (savedTags.includes("Stress")) {
            actionBox.innerText = "To help with stress, take 2 minutes right now to practice deep belly breathing.";
        } else if (savedTags.includes("Diet")) {
            actionBox.innerText = "Nourish your body today. Try drinking a full glass of water and reaching for a healthy snack.";
        } else if (savedTags.includes("Body")) {
            actionBox.innerText = "Listen to your body. Some gentle stretching or a warm shower might relieve tension.";
        } else if (savedTags.includes("Work")) {
            actionBox.innerText = "Work is weighing on you. Set a hard 'log-off' time today to protect your peace.";
        } else if (savedTags.includes("Social")) {
            actionBox.innerText = "Social energy is impacting you. It's okay to decline an invitation to recharge.";
        } else {
            actionBox.innerText = "Try stepping outside for 5 minutes without your phone to reset your focus.";
        }
    }
};