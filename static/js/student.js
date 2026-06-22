document.addEventListener('DOMContentLoaded', () => {
    const predictorForm = document.getElementById('studentPredictorForm');
    const emptyState = document.getElementById('predictionEmptyState');
    const resultDisplay = document.getElementById('predictionResultDisplay');
    
    // Result elements
    const predictedMathValue = document.getElementById('predictedMathValue');
    const scoreGradeLabel = document.getElementById('scoreGradeLabel');
    const predictionAnalysisText = document.getElementById('predictionAnalysisText');
    const scoreDialOuter = document.getElementById('scoreDialOuter');
    
    // Drivers elements
    const driverTestPrepText = document.getElementById('driverTestPrepText');
    const driverLunchText = document.getElementById('driverLunchText');
    const driverParentEduText = document.getElementById('driverParentEduText');
    
    // Load history on startup
    fetchHistory();

    // Form submit listener
    if (predictorForm) {
        predictorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collect form data
            const gender = document.getElementById('gender').value;
            const race_ethnicity = document.getElementById('race_ethnicity').value;
            const parental_education = document.getElementById('parental_education').value;
            const lunch = document.getElementById('lunch').value;
            const test_prep = document.getElementById('test_prep').value;
            const reading_score = parseInt(document.getElementById('reading_score').value);
            const writing_score = parseInt(document.getElementById('writing_score').value);
            
            // Calculate average score as proxy for input
            const average_score = (reading_score + writing_score) / 2;

            try {
                // Show loading state
                const submitBtn = predictorForm.querySelector('button[type="submit"]');
                const originalHtml = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Running Algorithm...";

                const response = await fetch('/api/predict_student', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        gender,
                        race_ethnicity,
                        parental_education,
                        lunch,
                        test_prep,
                        reading_score,
                        writing_score,
                        average_score
                    })
                });

                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHtml;

                const result = await response.json();
                
                if (response.ok && result.success) {
                    displayResult(result);
                    fetchHistory(); // refresh history table
                    showToast('Analysis completed successfully!', 'success');
                } else {
                    showToast(result.error || 'Prediction failed.', 'error');
                }
            } catch (err) {
                console.error("API Error:", err);
                showToast('Failed to connect to the prediction engine.', 'error');
            }
        });
    }

    // Display prediction result on UI
    function displayResult(result) {
        const score = result.predicted_math_score;
        const details = result.prediction;
        
        // Toggle empty/result views
        emptyState.classList.add('hidden');
        resultDisplay.classList.remove('hidden');
        
        // Set values
        predictedMathValue.innerText = score.toFixed(1);
        
        // Grade categorizations
        let gradeClass = 'grade-excellent';
        let gradeLabel = 'Excellent Standings';
        let analysisText = '';
        let gradeColor = '#2ecc71'; // Green
        
        if (score >= 85) {
            gradeLabel = 'Excellent Standings';
            analysisText = `The student is predicted to achieve an elite score of ${score.toFixed(1)}%. They exhibit superior academic capabilities, strongly backed by stellar reading (${details.reading_score}) and writing (${details.writing_score}) foundations.`;
            gradeColor = '#2ecc71';
        } else if (score >= 70) {
            gradeLabel = 'Good Standings';
            analysisText = `The model projects a solid mathematical score of ${score.toFixed(1)}%. The student has strong literacy competencies which will serve them well in logical and numerical reasoning.`;
            gradeColor = '#f1c40f'; // Golden Yellow
        } else if (score >= 50) {
            gradeLabel = 'Satisfactory';
            analysisText = `The student is projected to score ${score.toFixed(1)}% (Pass). While they are meeting basic requirements, extra tutoring in mathematical problem solving is recommended to strengthen overall logical foundations.`;
            gradeColor = '#e67e22'; // Orange
        } else {
            gradeLabel = 'Needs Attention';
            analysisText = `Critical score projection of ${score.toFixed(1)}%. Immediate educational intervention, additional mathematics preparation, and targeted literacy support are recommended to bridge gaps.`;
            gradeColor = '#e74c3c'; // Red
        }
        
        scoreGradeLabel.innerText = gradeLabel;
        scoreGradeLabel.style.backgroundColor = gradeColor;
        scoreGradeLabel.style.color = '#000';
        predictionAnalysisText.innerText = analysisText;
        
        // Dynamic circular gauge using conic gradient
        // Conic gradient mapping 0-100% score to 360deg
        const degrees = (score / 100) * 360;
        scoreDialOuter.style.background = `conic-gradient(${gradeColor} 0deg, ${gradeColor} ${degrees}deg, rgba(255, 255, 255, 0.05) ${degrees}deg, rgba(255, 255, 255, 0.05) 360deg)`;
        
        // Set drivers text
        driverTestPrepText.innerText = details.test_prep === 'completed' ? 'Completed (Boost Factor)' : 'None (Baseline)';
        driverTestPrepText.style.color = details.test_prep === 'completed' ? '#2ecc71' : '#ffdd59';
        
        driverLunchText.innerText = details.lunch === 'standard' ? 'Standard (Stable)' : 'Free/Reduced (Vulnerable)';
        driverLunchText.style.color = details.lunch === 'standard' ? '#2ecc71' : '#ff9f43';
        
        driverParentEduText.innerText = capitalizeWords(details.parental_education);
    }

    // Fetch and populate prediction history table
    async function fetchHistory() {
        try {
            const response = await fetch('/api/predict_student/history');
            if (response.ok) {
                const history = await response.json();
                const historyList = document.getElementById('historyList');
                const historyCountBadge = document.getElementById('historyCountBadge');
                
                if (historyList) {
                    historyCountBadge.innerText = `${history.length} Logs`;
                    
                    if (history.length === 0) {
                        historyList.innerHTML = `
                            <tr>
                                <td colspan="9" style="padding: 2rem; text-align: center; color: var(--text-dark);">
                                    <i class='bx bx-info-circle'></i> No calculations run yet in this session.
                                </td>
                            </tr>
                        `;
                        return;
                    }
                    
                    historyList.innerHTML = '';
                    history.forEach(item => {
                        const date = new Date(item.created_at);
                        const dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        
                        const row = document.createElement('tr');
                        row.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
                        row.innerHTML = `
                            <td style="padding: 0.8rem; color: var(--text-dark);">${dateStr}</td>
                            <td style="padding: 0.8rem; text-transform: capitalize;">${item.gender}</td>
                            <td style="padding: 0.8rem; text-transform: capitalize;">${item.race_ethnicity}</td>
                            <td style="padding: 0.8rem; text-transform: capitalize;">${item.parental_education}</td>
                            <td style="padding: 0.8rem; text-transform: capitalize;">${item.lunch}</td>
                            <td style="padding: 0.8rem; text-transform: capitalize;">${item.test_prep}</td>
                            <td style="padding: 0.8rem; text-align: center;">${item.reading_score}</td>
                            <td style="padding: 0.8rem; text-align: center;">${item.writing_score}</td>
                            <td style="padding: 0.8rem; text-align: center; font-weight: 700; color: var(--color-primary);">${item.predicted_math_score.toFixed(1)}</td>
                        `;
                        historyList.appendChild(row);
                    });
                }
            }
        } catch (err) {
            console.error("Failed to load history:", err);
        }
    }

    // Helper functions
    function capitalizeWords(str) {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'bx-check-circle' : 'bx-error-alt';
        const color = type === 'success' ? '#D4AF37' : '#e74c3c';
        
        toast.innerHTML = `
            <i class='bx ${icon}' style='color: ${color}; font-size: 1.25rem; margin-right: 8px; vertical-align: middle;'></i>
            <span style='vertical-align: middle;'>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 50);
        
        // Remove toast after 4s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
});
