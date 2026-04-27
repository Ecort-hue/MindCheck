// Triggered on checkIn.html
function logCheckIn() {
    const moodValue = document.querySelector('input[type="range"]').value;
    const selectedTags = [];
    
    document.querySelectorAll('.pill-input:checked').forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`).innerText;
        selectedTags.push(label);
    });

    // 1. Save today's specific info
    localStorage.setItem('userMood', moodValue);
    localStorage.setItem('userTags', JSON.stringify(selectedTags));

    // 2. Manage the Weekly History Array
    // Get existing history or start a new empty list
    let weeklyMoods = JSON.parse(localStorage.getItem('weeklyMoods') || "[]");
    
    // Add today's mood to the list
    weeklyMoods.push(moodValue);
    
    // Ensure we only keep the last 7 days (rolling week)
    if (weeklyMoods.length > 7) {
        weeklyMoods.shift(); // removes the oldest entry
    }
    
    // Save the updated list back to local storage
    localStorage.setItem('weeklyMoods', JSON.stringify(weeklyMoods));

    // Move to the next page
    window.location.href = "userWeek.html";
}

// Triggered when a page loads
window.onload = function() {
    const bars = document.querySelectorAll('.bar');
    const savedMood = localStorage.getItem('userMood');
    const savedTags = JSON.parse(localStorage.getItem('userTags') || "[]");
    const weeklyMoods = JSON.parse(localStorage.getItem('weeklyMoods') || "[]");
    
    // 1. Update Chart (on userWeek.html) using the 7-day history
    if (bars.length > 0 && weeklyMoods.length > 0) {
        // We fill the bars from right to left so the newest is always at the end
        let barIndex = bars.length - 1;
        
        for (let i = weeklyMoods.length - 1; i >= 0 && barIndex >= 0; i--) {
            // Set the height based on history
            bars[barIndex].style.height = weeklyMoods[i] + "%";
            
            // Highlight only the most recent submission
            if (i === weeklyMoods.length - 1) {
                bars[barIndex].classList.add('highlight');
            } else {
                bars[barIndex].classList.remove('highlight');
            }
            barIndex--;
        }
    }

    // 2. Update Patterns (on userWeek.html)
    const patternBox = document.getElementById('user-pattern');
    if (patternBox) {
        if (savedTags.length > 0) {
            patternBox.innerHTML = `🟠 <b>${savedTags.join(", ")}</b> had the most impact on your mood today.`;
        } else {
            patternBox.innerHTML = `⚪️ You didn't select any specific factors today.`;
        }
    }

    // 3. Update Mood Feedback (on userNextSteps.html)
    const feedbackBox = document.getElementById('dynamic-feedback');
    if (feedbackBox && savedMood) {
        feedbackBox.innerText = savedMood < 40 
            ? "You've had a heavy day. Focus on gentle rest." 
            : "You're feeling resilient. Keep these positive habits going!";
    }

    // 4. Specific Action Item Conclusions (on userNextSteps.html)
    const actionBox = document.getElementById('action-item');
    if (actionBox) {
        if (savedTags.includes("Sleep")) {
            actionBox.innerText = "Since sleep is affecting you, try winding down 30 minutes earlier tonight without screens.";
        } else if (savedTags.includes("Stress")) {
            actionBox.innerText = "To help lower your stress, take 2 minutes right now to practice deep breathing.";
        } else if (savedTags.includes("Diet")) {
            actionBox.innerText = "Nourish your body today. Try drinking a glass of water and eating a healthy snack.";
        } else if (savedTags.includes("Body")) {
            actionBox.innerText = "Listen to your body. Some gentle stretching might help relieve physical tension.";
        } else if (savedTags.includes("Work")) {
            actionBox.innerText = "Work is weighing on you. Remember to step away from your desk for short mental breaks.";
        } else if (savedTags.includes("Social")) {
            actionBox.innerText = "Social energy is impacting you. Take time for yourself if you need a recharge.";
        } else {
            actionBox.innerText = "Step outside for 5 minutes without your phone to clear your head.";
        }
    }
};