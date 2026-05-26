// API Configuration
const API_URL = 'http://localhost:5000/predict';

// DOM Elements
const form = document.getElementById('predictionForm');
const resetBtn = document.getElementById('resetBtn');
const testBtn = document.getElementById('testBtn');
const resultCard = document.getElementById('resultCard');
const loadingSpinner = document.getElementById('loadingSpinner');

// Test data samples
const testSamples = [
    { // Diabetic case
        Pregnancies: 6, Glucose: 148, BloodPressure: 72, SkinThickness: 35,
        Insulin: 0, BMI: 33.6, DiabetesPedigreeFunction: 0.627, Age: 50
    },
    { // Non-diabetic case
        Pregnancies: 1, Glucose: 85, BloodPressure: 66, SkinThickness: 29,
        Insulin: 0, BMI: 26.6, DiabetesPedigreeFunction: 0.351, Age: 31
    },
    { // Borderline case
        Pregnancies: 2, Glucose: 120, BloodPressure: 70, SkinThickness: 30,
        Insulin: 100, BMI: 28.5, DiabetesPedigreeFunction: 0.450, Age: 35
    }
];

let testIndex = 0;

// Add event listeners
form.addEventListener('submit', handleSubmit);
resetBtn.addEventListener('click', resetForm);
if (testBtn) testBtn.addEventListener('click', loadTestSample);

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();

    // Show loading spinner
    loadingSpinner.style.display = 'block';
    resultCard.style.display = 'none';

    // Get form values
    const formData = {
        Pregnancies: parseFloat(document.getElementById('pregnancies').value),
        Glucose: parseFloat(document.getElementById('glucose').value),
        BloodPressure: parseFloat(document.getElementById('bloodPressure').value),
        SkinThickness: parseFloat(document.getElementById('skinThickness').value),
        Insulin: parseFloat(document.getElementById('insulin').value),
        BMI: parseFloat(document.getElementById('bmi').value),
        DiabetesPedigreeFunction: parseFloat(document.getElementById('dpf').value),
        Age: parseFloat(document.getElementById('age').value)
    };

    // Validate inputs
    if (!validateInputs(formData)) {
        loadingSpinner.style.display = 'none';
        return;
    }

    try {
        // Make API call
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();

        // Display results
        displayResults(result, formData);

    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to get prediction. Please check if the backend server is running.', 'error');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Validate form inputs
function validateInputs(data) {
    for (const [key, value] of Object.entries(data)) {
        if (isNaN(value) || value < 0) {
            showToast(`Please enter a valid value for ${key}`, 'error');
            return false;
        }
    }

    // Additional validation
    if (data.Glucose < 0 || data.Glucose > 300) {
        showToast('Glucose level should be between 0 and 300 mg/dL', 'error');
        return false;
    }

    if (data.BloodPressure < 0 || data.BloodPressure > 200) {
        showToast('Blood pressure should be between 0 and 200 mm Hg', 'error');
        return false;
    }

    if (data.BMI < 0 || data.BMI > 70) {
        showToast('BMI should be between 0 and 70 kg/m²', 'error');
        return false;
    }

    if (data.Age < 0 || data.Age > 120) {
        showToast('Age should be between 0 and 120 years', 'error');
        return false;
    }

    return true;
}

// Display prediction results
function displayResults(result, formData) {
    const isDiabetic = result.prediction === 1;
    const probability = (result.probability * 100).toFixed(1);

    // Set date
    const resultDate = document.getElementById('resultDate');
    resultDate.textContent = new Date().toLocaleString();

    // Set status with clear message
    const resultStatus = document.getElementById('resultStatus');
    if (isDiabetic) {
        resultStatus.className = 'result-status diabetic';
        resultStatus.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            ⚠️ DIABETIC - High Risk Detected
            <br>
            <small style="font-size: 0.8rem;">Please consult a healthcare provider immediately</small>
        `;
    } else {
        resultStatus.className = 'result-status non-diabetic';
        resultStatus.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ✅ NON-DIABETIC - Low Risk
            <br>
            <small style="font-size: 0.8rem;">Maintain healthy lifestyle habits</small>
        `;
    }

    // Set probability with interpretation
    const resultProbability = document.getElementById('resultProbability');
    let riskLevel = '';
    if (probability < 30) riskLevel = 'Low Risk';
    else if (probability < 70) riskLevel = 'Moderate Risk';
    else riskLevel = 'High Risk';

    resultProbability.innerHTML = `
        <strong>Confidence Level:</strong> ${probability}% probability of being ${isDiabetic ? 'diabetic' : 'non-diabetic'}
        <br>
        <span style="font-size: 0.9rem; color: ${getRiskColor(probability)}">Risk Category: ${riskLevel}</span>
    `;

    // Set detailed message
    const resultMessage = document.getElementById('resultMessage');
    if (isDiabetic) {
        resultMessage.innerHTML = `
            <strong>⚠️ IMPORTANT MEDICAL ALERT:</strong><br><br>
            Based on our AI analysis of your health parameters, there is a <strong>${probability}% probability</strong>
            that you may have diabetes or be at high risk of developing it.<br><br>

            <strong>What this means:</strong> Your glucose metabolism shows patterns consistent with diabetes.
            This is a serious health condition that requires immediate medical attention.<br><br>

            <strong>Next Steps:</strong> Please schedule an appointment with a healthcare provider within the next
            1-2 weeks for proper diagnostic testing (Fasting Blood Glucose, HbA1c, or Oral Glucose Tolerance Test).
        `;
    } else {
        resultMessage.innerHTML = `
            <strong>✅ GOOD NEWS:</strong><br><br>
            Based on our AI analysis of your health parameters, you show <strong>${probability}% probability</strong>
            of being non-diabetic, which means your current health metrics are within normal ranges.<br><br>

            <strong>What this means:</strong> Your glucose metabolism appears to be functioning normally.
            However, prevention is always better than cure.<br><br>

            <strong>Next Steps:</strong> Continue maintaining a healthy lifestyle with proper diet and regular exercise.
            Annual check-ups are recommended for monitoring.
        `;
    }

    // Update risk meter
    updateRiskMeter(probability);

    // Set recommendations
    const recommendations = document.getElementById('recommendations');
    recommendations.innerHTML = getRecommendations(isDiabetic, probability, formData);

    // Show result card
    resultCard.style.display = 'block';

    // Scroll to results
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Show toast notification
    showToast(isDiabetic ? '⚠️ Diabetic Risk Detected! Please consult a doctor.' : '✅ Non-Diabetic. Maintain healthy habits!', isDiabetic ? 'error' : 'success');
}

// Get risk color
function getRiskColor(probability) {
    if (probability < 30) return '#27ae60';
    if (probability < 70) return '#f39c12';
    return '#e74c3c';
}

// Update risk meter
function updateRiskMeter(probability) {
    const riskFill = document.getElementById('riskFill');
    if (riskFill) {
        riskFill.style.width = `${probability}%`;
        riskFill.textContent = `${probability}%`;

        // Change color based on probability
        if (probability < 30) {
            riskFill.style.background = 'rgba(39, 174, 96, 0.5)';
        } else if (probability < 70) {
            riskFill.style.background = 'rgba(243, 156, 18, 0.5)';
        } else {
            riskFill.style.background = 'rgba(231, 76, 60, 0.5)';
        }
    }
}

// Get personalized recommendations
function getRecommendations(isDiabetic, probability, formData) {
    const bmi = formData.BMI;
    const glucose = formData.Glucose;
    const age = formData.Age;
    const bp = formData.BloodPressure;

    let recommendations = '<h4><i class="fas fa-lightbulb"></i> Personalized Health Recommendations:</h4><ul>';

    if (isDiabetic) {
        recommendations += '<li><i class="fas fa-stethoscope"></i> <strong>URGENT:</strong> Schedule a doctor\'s appointment immediately</li>';
        recommendations += '<li><i class="fas fa-chart-line"></i> Get your HbA1c, Fasting Blood Sugar, and Glucose Tolerance tested</li>';
        recommendations += '<li><i class="fas fa-pills"></i> Discuss medication options (Metformin, Insulin, etc.) with your doctor</li>';
        recommendations += '<li><i class="fas fa-apple-alt"></i> Start a diabetic diet plan - reduce sugar and refined carbs</li>';
        recommendations += '<li><i class="fas fa-running"></i> Exercise 30-45 minutes daily (walking, swimming, or cycling)</li>';
        recommendations += '<li><i class="fas fa-weight-scale"></i> Monitor blood glucose levels daily at home</li>';
    } else {
        recommendations += '<li><i class="fas fa-heartbeat"></i> Maintain regular health check-ups annually</li>';
        recommendations += '<li><i class="fas fa-apple-alt"></i> Eat balanced meals with plenty of vegetables and fiber</li>';
        recommendations += '<li><i class="fas fa-running"></i> Exercise for at least 30 minutes, 5 days a week</li>';
        recommendations += '<li><i class="fas fa-weight-scale"></i> Maintain healthy BMI (18.5-24.9)</li>';
        recommendations += '<li><i class="fas fa-smoking-ban"></i> Avoid smoking and limit alcohol consumption</li>';
    }

    // Specific recommendations based on metrics
    if (bmi > 25) {
        recommendations += `<li><i class="fas fa-weight-scale"></i> <strong>Weight Management:</strong> Your BMI is ${bmi.toFixed(1)} (Overweight).
        Losing 5-10% of body weight can significantly reduce diabetes risk.</li>`;
    } else if (bmi < 18.5) {
        recommendations += `<li><i class="fas fa-weight-scale"></i> <strong>Weight Management:</strong> Your BMI is ${bmi.toFixed(1)} (Underweight).
        Consult a nutritionist for healthy weight gain.</li>`;
    }

    if (glucose > 140) {
        recommendations += `<li><i class="fas fa-tint"></i> <strong>High Glucose Alert:</strong> Your glucose level is ${glucose} mg/dL.
        Reduce sugar intake, avoid sweetened beverages, and monitor carbohydrate consumption.</li>`;
    } else if (glucose > 100 && glucose <= 140) {
        recommendations += `<li><i class="fas fa-chart-line"></i> <strong>Borderline Glucose:</strong> Your glucose is ${glucose} mg/dL (Prediabetes range).
        Lifestyle modifications are crucial to prevent progression to diabetes.</li>`;
    }

    if (bp > 80) {
        recommendations += `<li><i class="fas fa-heart"></i> <strong>Blood Pressure:</strong> Your BP is ${bp} mm Hg.
        Reduce salt intake, manage stress, and monitor regularly.</li>`;
    }

    if (age > 45) {
        recommendations += '<li><i class="fas fa-calendar-check"></i> <strong>Age Factor:</strong> Being over 45 increases diabetes risk. Regular screening is highly recommended.</li>';
    }

    recommendations += '</ul>';

    // Add prevention tips
    recommendations += '<div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 10px;">';
    recommendations += '<strong><i class="fas fa-info-circle"></i> Prevention Tips:</strong><br>';
    recommendations += '• Eat more whole grains, fruits, and vegetables<br>';
    recommendations += '• Stay hydrated with water instead of sugary drinks<br>';
    recommendations += '• Get 7-8 hours of quality sleep daily<br>';
    recommendations += '• Manage stress through meditation or yoga<br>';
    recommendations += '</div>';

    return recommendations;
}

// Load test sample
function loadTestSample() {
    const sample = testSamples[testIndex % testSamples.length];

    document.getElementById('pregnancies').value = sample.Pregnancies;
    document.getElementById('glucose').value = sample.Glucose;
    document.getElementById('bloodPressure').value = sample.BloodPressure;
    document.getElementById('skinThickness').value = sample.SkinThickness;
    document.getElementById('insulin').value = sample.Insulin;
    document.getElementById('bmi').value = sample.BMI;
    document.getElementById('dpf').value = sample.DiabetesPedigreeFunction;
    document.getElementById('age').value = sample.Age;

    const sampleType = testIndex % 2 === 0 ? 'diabetic' : 'non-diabetic';
    showToast(`Loaded ${sampleType} test sample. Click "Analyze" to see prediction.`, 'info');

    testIndex++;
}

// Reset form
function resetForm() {
    form.reset();
    resultCard.style.display = 'none';

    // Clear all inputs
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
    });

    showToast('Form has been reset!', 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `${icon} ${message}`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Share results
if (document.getElementById('shareBtn')) {
    document.getElementById('shareBtn').addEventListener('click', async () => {
        const resultStatus = document.getElementById('resultStatus').innerText;
        const shareData = {
            title: 'Diabetes Risk Assessment Result',
            text: `My diabetes risk assessment result: ${resultStatus}`,
            url: window.location.href
        };

        try {
            await navigator.share(shareData);
            showToast('Shared successfully!', 'success');
        } catch (err) {
            // Copy to clipboard as fallback
            const tempText = `${shareData.title}\n${shareData.text}`;
            await navigator.clipboard.writeText(tempText);
            showToast('Results copied to clipboard!', 'success');
        }
    });
}

// Add input validation on blur
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value && (parseFloat(input.value) < 0 || isNaN(parseFloat(input.value)))) {
            input.style.borderColor = '#e74c3c';
            setTimeout(() => {
                input.style.borderColor = '#e0e0e0';
            }, 2000);
        } else {
            input.style.borderColor = '#e0e0e0';
        }
    });
});

// Check API health on page load
async function checkAPIHealth() {
    try {
        const response = await fetch('http://localhost:5000/health');
        if (response.ok) {
            console.log('API is healthy');
            showToast('Connected to AI Prediction Service', 'success');
        }
    } catch (error) {
        console.warn('API server may not be running. Please start the backend server.');
        showToast('Backend server not connected. Please start the server.', 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAPIHealth();
    console.log('Diabetes Prediction App loaded successfully');

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.form-card, .info-card, .health-tips').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
});