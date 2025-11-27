// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCuIJN_dMJyutgBM-WjSRtHvGcqECfd73E",
    authDomain: "uzima-healthcare.firebaseapp.com",
    projectId: "uzima-healthcare",
    storageBucket: "uzima-healthcare.firebasestorage.app",
    messagingSenderId: "7640251385",
    appId: "1:7640251385:web:f40a7d601e68b7aa255b28"
};

// Initialize Firebase
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('✅ Firebase initialized');
} catch (error) {
    console.error('❌ Firebase error:', error);
}

// Navigation Functions
function showChatInterface() {
    document.getElementById('choice-screen').classList.add('hidden');
    document.getElementById('chat-interface').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
    
    addAIMessage("Hello! I'm your AI health assistant. I'm here to help assess your symptoms and guide you to the right care. Let's start - what brings you here today?");
}

function showFormInterface() {
    document.getElementById('choice-screen').classList.add('hidden');
    document.getElementById('chat-interface').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
}

function backToChoice() {
    document.getElementById('choice-screen').classList.remove('hidden');
    document.getElementById('chat-interface').classList.add('hidden');
    document.getElementById('main-content').classList.add('hidden');
    
    document.getElementById('chat-messages').innerHTML = '';
    chatConversation = [];
    collectedData = {};
}

// Chat Variables
let chatConversation = [];
let collectedData = {};
let chatStage = 'initial';

// Chat Functions
function addUserMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message mb-4 flex justify-end';
    messageDiv.innerHTML = `
        <div class="bg-purple-500 text-white px-4 py-3 rounded-lg max-w-xs md:max-w-md">
            <p class="text-sm">${escapeHtml(message)}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addAIMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message mb-4 flex justify-start';
    messageDiv.innerHTML = `
        <div class="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg max-w-xs md:max-w-md">
            <div class="flex items-start">
                <span class="text-xl mr-2">🤖</span>
                <p class="text-sm">${escapeHtml(message)}</p>
            </div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addAITyping() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'ai-typing';
    typingDiv.className = 'chat-message mb-4 flex justify-start';
    typingDiv.innerHTML = `
        <div class="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg">
            <div class="flex items-center">
                <span class="text-xl mr-2">🤖</span>
                <span class="text-sm">Thinking...</span>
                <span class="ml-2 animate-pulse">●●●</span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeAITyping() {
    const typingDiv = document.getElementById('ai-typing');
    if (typingDiv) typingDiv.remove();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addUserMessage(message);
    input.value = '';
    
    input.disabled = true;
    document.getElementById('send-btn').disabled = true;
    
    chatConversation.push({
        role: 'user',
        content: message
    });
    
    addAITyping();
    
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: `You are a medical triage AI assistant for Uzima Healthcare in Kenya. Your job is to:

1. Have a natural, empathetic conversation with the patient
2. Ask relevant follow-up questions about their symptoms
3. Collect key information: name, age, phone, main complaint, duration, severity
4. Assess urgency and provide triage recommendation

Current conversation:
${chatConversation.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond naturally and helpfully. If you've gathered enough information, provide a triage assessment (EMERGENCY, URGENT, STANDARD, or SELF-CARE) with clear next steps.`
                    }
                ]
            })
        });
        
        const data = await response.json();
        
        removeAITyping();
        
        if (data.content && data.content[0]) {
            const aiResponse = data.content[0].text;
            addAIMessage(aiResponse);
            
            chatConversation.push({
                role: 'assistant',
                content: aiResponse
            });
            
            if (aiResponse.toLowerCase().includes('emergency') || 
                aiResponse.toLowerCase().includes('urgent') ||
                aiResponse.toLowerCase().includes('standard') ||
                aiResponse.toLowerCase().includes('self-care')) {
                
                setTimeout(() => {
                    addAIMessage("Would you like me to save this assessment and generate your queue number? Type 'yes' to save or 'no' to continue chatting.");
                }, 1000);
            }
        } else {
            addAIMessage("I'm sorry, I'm having trouble processing that. Could you try rephrasing?");
        }
        
    } catch (error) {
        console.error('Chat error:', error);
        removeAITyping();
        addAIMessage("I'm having technical difficulties. Please try the form option instead, or try again in a moment.");
    }
    
    input.disabled = false;
    document.getElementById('send-btn').disabled = false;
    input.focus();
}

// Demo Data
const demoPatients = [
    {
        phone: "+254712345678", name: "Grace Wanjiru", age: "28", gender: "female",
        weight: "65", height: "165", location: "Nairobi", allergies: "None",
        medications: "None", travel: "no",
        chiefComplaint: "Burning sensation when urinating, frequent urge to urinate, lower abdominal discomfort",
        bodyLocation: "abdomen", duration: "1-7-days", severity: "moderate", redFlags: ["none"]
    },
    {
        phone: "+254723456789", name: "John Kamau", age: "65", gender: "male",
        weight: "78", height: "172", location: "Nairobi", allergies: "None",
        medications: "Aspirin daily", travel: "no",
        chiefComplaint: "Severe chest pain radiating to left arm, shortness of breath, heavy sweating, nausea",
        bodyLocation: "chest", duration: "less-than-1-hour", severity: "severe", redFlags: ["chest-pain", "breathing"]
    },
    {
        phone: "+254734567890", name: "Mary Achieng", age: "32", gender: "female",
        weight: "60", height: "160", location: "Kisumu", allergies: "Peanuts",
        medications: "None", travel: "no",
        chiefComplaint: "Mild headache, runny nose, slight cough, feeling tired",
        bodyLocation: "head", duration: "1-24-hours", severity: "mild", redFlags: ["none"]
    },
    {
        phone: "+254745678901", name: "Peter Ochieng", age: "45", gender: "male",
        weight: "72", height: "175", location: "Mombasa", allergies: "None",
        medications: "None", travel: "international",
        chiefComplaint: "Persistent cough for 3 weeks, night sweats, unexplained weight loss, fatigue",
        bodyLocation: "chest", duration: "1-4-weeks", severity: "moderate", redFlags: ["none"]
    }
];

function loadDemo(index) {
    const p = demoPatients[index];
    document.getElementById('phone').value = p.phone;
    document.getElementById('patient-name').value = p.name;
    document.getElementById('patient-age').value = p.age;
    document.getElementById('chief-complaint').value = p.chiefComplaint;
    document.getElementById('duration').value = p.duration;
    document.querySelector(`input[name="severity"][value="${p.severity}"]`).checked = true;
    
    if (p.gender) document.getElementById('gender').value = p.gender;
    if (p.weight) document.getElementById('weight').value = p.weight;
    if (p.height) document.getElementById('height').value = p.height;
    if (p.location) document.getElementById('location').value = p.location;
    if (p.allergies) document.getElementById('allergies').value = p.allergies;
    if (p.medications) document.getElementById('medications').value = p.medications;
    document.querySelector(`input[name="travel"][value="${p.travel}"]`).checked = true;
    if (p.bodyLocation) document.getElementById('body-location').value = p.bodyLocation;
    
    document.querySelectorAll('input[name="red-flags"]').forEach(cb => cb.checked = false);
    p.redFlags.forEach(flag => {
        const checkbox = document.querySelector(`input[name="red-flags"][value="${flag}"]`);
        if (checkbox) checkbox.checked = true;
    });

    document.getElementById('triage-form-container').scrollIntoView({ behavior: 'smooth' });
}

async function loadUserProfile() {
    const phone = document.getElementById('returning-phone').value;
    if (!phone) {
        alert('Please enter your phone number');
        return;
    }

    try {
        const snapshot = await db.collection('user_profiles').where('phone', '==', phone).limit(1).get();
        if (snapshot.empty) {
            alert('No profile found for this number. Please fill the form below to create one!');
            return;
        }

        const profile = snapshot.docs[0].data();
        
        document.getElementById('phone').value = profile.phone;
        document.getElementById('patient-name').value = profile.name;
        document.getElementById('patient-age').value = profile.age;
        if (profile.gender) document.getElementById('gender').value = profile.gender;
        if (profile.weight) document.getElementById('weight').value = profile.weight;
        if (profile.height) document.getElementById('height').value = profile.height;
        if (profile.location) document.getElementById('location').value = profile.location;
        if (profile.allergies) document.getElementById('allergies').value = profile.allergies;
        if (profile.medications) document.getElementById('medications').value = profile.medications;
        
        document.getElementById('triage-form-container').scrollIntoView({ behavior: 'smooth' });
        alert('✅ Profile loaded! Just fill in your current symptoms and submit.');
        
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile. Please try again.');
    }
}

async function saveUserProfile(formData) {
    try {
        const profileData = {
            phone: formData.phone,
            name: formData.name,
            age: formData.age,
            gender: formData.gender || null,
            weight: formData.weight || null,
            height: formData.height || null,
            location: formData.location || null,
            allergies: formData.allergies || 'None',
            medications: formData.medications || 'None',
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        const existing = await db.collection('user_profiles').where('phone', '==', formData.phone).limit(1).get();
        
        if (existing.empty) {
            await db.collection('user_profiles').add(profileData);
            console.log('✅ Profile created');
            return true;
        } else {
            await db.collection('user_profiles').doc(existing.docs[0].id).update(profileData);
            console.log('✅ Profile updated');
            return false;
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        return null;
    }
}

function triagePatient(formData) {
    const { chiefComplaint, duration, severity, redFlags } = formData;
    const complaint = chiefComplaint.toLowerCase();
    
    const dangerousFlags = redFlags.filter(flag => flag !== 'none');
    if (dangerousFlags.length > 0) {
        return {
            level: 'EMERGENCY', priority: 1, color: 'RED', icon: '🚨',
            action: 'Go to Emergency Department IMMEDIATELY', waitTime: 'IMMEDIATE',
            provider: 'Emergency Physician',
            reasoning: 'Life-threatening symptoms detected.',
            instructions: ['Call 999 or go to Emergency NOW', 'Do NOT wait', 'Inform staff immediately']
        };
    }
    
    const nurseKeywords = ['uti', 'urinary', 'burning', 'refill', 'blood pressure', 'diabetes'];
    if (nurseKeywords.some(k => complaint.includes(k)) && (severity === 'mild' || severity === 'moderate')) {
        return {
            level: 'NURSE CONSULTATION', priority: 3, color: 'GREEN', icon: '👩‍⚕️',
            action: 'See nurse or clinical officer', waitTime: '15-20 minutes',
            provider: 'Clinical Nurse/Officer',
            reasoning: 'Your condition can be managed by nursing staff.',
            instructions: ['Check in at nurse station', 'Show your reference number', 'Nurse will assess and treat']
        };
    }
    
    const selfCareKeywords = ['cold', 'runny nose', 'mild headache', 'slight cough'];
    const isRecent = duration === '1-24-hours' || duration === 'less-than-1-hour';
    if (selfCareKeywords.some(k => complaint.includes(k)) && severity === 'mild' && isRecent) {
        return {
            level: 'SELF-CARE', priority: 4, color: 'BLUE', icon: '🏠',
            action: 'Home care recommended', waitTime: 'No clinic visit needed',
            provider: 'Self-management',
            reasoning: 'Symptoms are mild and recent. Try home care first.',
            instructions: ['Get plenty of rest', 'Stay hydrated', 'Over-the-counter pain relief if needed', 'Call clinic if symptoms worsen']
        };
    }
    
    return {
        level: 'PHYSICIAN CONSULTATION', priority: 2, color: 'YELLOW', icon: '👨‍⚕️',
        action: 'See medical doctor', waitTime: '30-40 minutes',
        provider: 'Medical Doctor',
        reasoning: 'Your symptoms require physician evaluation.',
        instructions: ['Check in at reception', 'Doctor will examine you', 'Tests may be ordered', 'Treatment plan will be provided']
    };
}

document.getElementById('triage-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="flex items-center justify-center"><span class="animate-spin mr-3">⏳</span><span>Processing...</span></span>';
    
    const formData = {
        phone: document.getElementById('phone').value,
        name: document.getElementById('patient-name').value,
        age: document.getElementById('patient-age').value,
        gender: document.getElementById('gender').value || null,
        weight: document.getElementById('weight').value || null,
        height: document.getElementById('height').value || null,
        location: document.getElementById('location').value || null,
        allergies: document.getElementById('allergies').value || 'None',
        medications: document.getElementById('medications').value || 'None',
        travel: document.querySelector('input[name="travel"]:checked').value,
        chiefComplaint: document.getElementById('chief-complaint').value,
        bodyLocation: document.getElementById('body-location').value || 'Not specified',
        duration: document.getElementById('duration').value,
        severity: document.querySelector('input[name="severity"]:checked').value,
        redFlags: Array.from(document.querySelectorAll('input[name="red-flags"]:checked')).map(cb => cb.value),
        source: 'web-form',
        timestamp: new Date().toISOString()
    };
    
    const triageResult = triagePatient(formData);
    
    try {
        const refId = 'WEB' + Date.now().toString().slice(-8);
        
        if (db !== null) {
            await db.collection('assessments').add({
                ...formData,
                triageLevel: triageResult.level,
                triageAction: triageResult.action,
                triagePriority: triageResult.priority,
                triageColor: triageResult.color,
                expectedWait: triageResult.waitTime,
                provider: triageResult.provider,
                reasoning: triageResult.reasoning,
                instructions: triageResult.instructions,
                status: 'waiting',
                queueNumber: generateQueueNumber(triageResult.priority),
                refId: refId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Assessment saved');
            
            const isNewProfile = await saveUserProfile(formData);
            formData.isNewProfile = isNewProfile;
        }
        
        displayResult(triageResult, formData, refId);
        
    } catch (error) {
        console.error('❌ Error:', error);
        const refId = 'WEB' + Date.now().toString().slice(-8);
        displayResult(triageResult, formData, refId);
    }
});

function generateQueueNumber(priority) {
    const prefix = { 1: 'E', 2: 'D', 3: 'N', 4: 'S' };
    const number = Math.floor(Math.random() * 999) + 1;
    return `${prefix[priority]}${number.toString().padStart(3, '0')}`;
}

function displayResult(result, formData, refId) {
    const resultsDiv = document.getElementById('results');
    const formDiv = document.getElementById('triage-form-container');
    const demoButtons = document.getElementById('demo-buttons');
    const returningSection = document.getElementById('returning-patient');
    
    formDiv.classList.add('hidden');
    demoButtons.classList.add('hidden');
    returningSection.classList.add('hidden');
    resultsDiv.classList.remove('hidden');
    resultsDiv.classList.add('fade-in');
    
    const colorMap = {
        'RED': { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-900', badge: 'bg-red-600' },
        'YELLOW': { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-900', badge: 'bg-yellow-600' },
        'GREEN': { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-900', badge: 'bg-green-600' },
        'BLUE': { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900', badge: 'bg-blue-600' }
    };
    
    const colors = colorMap[result.color];
    const queueNum = generateQueueNumber(result.priority);
    
    let profileNotification = '';
    if (formData.isNewProfile === true) {
        profileNotification = `
            <div class="bg-green-100 border-2 border-green-500 p-4 rounded-lg mb-6 text-center">
                <p class="text-green-900 font-bold">✅ Profile Saved!</p>
                <p class="text-sm text-green-700">Next time, just enter your phone number to load your info instantly!</p>
            </div>
        `;
    } else if (formData.isNewProfile === false) {
        profileNotification = `
            <div class="bg-blue-100 border-2 border-blue-500 p-4 rounded-lg mb-6 text-center">
                <p class="text-blue-900 font-bold">🔄 Profile Updated!</p>
                <p class="text-sm text-blue-700">Your information has been updated in our system.</p>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl p-8 mb-6 border-t-8 ${colors.border}">
            
            ${profileNotification}
            
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl mb-6 text-center">
                <div class="text-sm font-semibold mb-2">YOUR QUEUE POSITION</div>
                <div class="text-5xl font-bold mb-2">${queueNum}</div>
                <div class="text-lg font-semibold mt-2">Estimated wait: ${result.waitTime}</div>
            </div>

            <div class="${colors.bg} p-6 rounded-xl mb-6 border-2 ${colors.border}">
                <div class="flex items-center mb-4">
                    <span class="text-6xl mr-4">${result.icon}</span>
                    <div>
                        <h2 class="text-3xl font-bold ${colors.text}">${result.action}</h2>
                        <span class="${colors.badge} text-white px-4 py-2 rounded-full text-sm font-bold inline-block mt-2">
                            ${result.level}
                        </span>
                    </div>
                </div>
                <p class="text-lg ${colors.text} mb-4">${result.reasoning}</p>
            </div>

            <div class="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg mb-6">
                <h3 class="text-2xl font-bold text-red-900 mb-4 flex items-center">
                    <span class="text-3xl mr-3">🚨</span>
                    Emergency Resources
                </h3>
                
                <div class="bg-white p-4 rounded-lg mb-4">
                    <h4 class="font-bold text-lg mb-3 text-gray-800">📞 Kenya Emergency Hotlines</h4>
                    <div class="grid md:grid-cols-2 gap-3">
                        <a href="tel:999" class="flex items-center justify-between bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition">
                            <span class="font-semibold">🚨 Emergency</span>
                            <span class="text-xl font-bold">999</span>
                        </a>
                        <a href="tel:+254202272763" class="flex items-center justify-between bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition">
                            <span class="font-semibold text-sm">🚑 Ambulance</span>
                            <span class="text-sm font-bold">0202272763</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-lg">
                    <h4 class="font-bold text-lg mb-3 text-gray-800">🏥 Major Nairobi Hospitals</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between items-center p-2 bg-teal-50 rounded">
                            <span class="font-semibold">Kenyatta National Hospital</span>
                            <a href="tel:+254202726300" class="bg-teal-600 text-white px-3 py-1 rounded text-xs hover:bg-teal-700">Call</a>
                        </div>
                        <div class="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span class="font-semibold">Nairobi Hospital</span>
                            <a href="tel:+254202845000" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Call</a>
                        </div>
                        <div class="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span class="font-semibold">Aga Khan Hospital</span>
                            <a href="tel:+254203662000" class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">Call</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-indigo-50 p-6 rounded-xl mb-6">
                <h3 class="text-xl font-bold mb-4">📋 Next Steps</h3>
                <ul class="space-y-2">
                    ${result.instructions.map(step => `
                        <li class="flex items-start">
                            <span class="text-indigo-600 mr-2">→</span>
                            <span>${step}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="bg-gray-50 p-6 rounded-xl mb-6">
                <h3 class="text-xl font-bold mb-4">📊 Assessment Summary</h3>
                <div class="grid md:grid-cols-2 gap-3 text-sm">
                    <div><strong>Reference:</strong> ${refId}</div>
                    <div><strong>Queue:</strong> ${queueNum}</div>
                    <div><strong>Name:</strong> ${formData.name}</div>
                    <div><strong>Age:</strong> ${formData.age}</div>
                    <div><strong>Phone:</strong> ${formData.phone}</div>
                    ${formData.gender ? `<div><strong>Gender:</strong> ${formData.gender}</div>` : ''}
                    ${formData.location ? `<div><strong>Location:</strong> ${formData.location}</div>` : ''}
                    <div class="md:col-span-2"><strong>Symptoms:</strong> ${formData.chiefComplaint}</div>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
                <button onclick="resetForm()" class="bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition">
                    ← Assess Another Patient
                </button>
                <button onclick="window.print()" class="bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition">
                    🖨️ Print Summary
                </button>
            </div>
        </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('triage-form-container').classList.remove('hidden');
    document.getElementById('demo-buttons').classList.remove('hidden');
    document.getElementById('returning-patient').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('triage-form').reset();
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('submit-btn').innerHTML = '<span class="flex items-center justify-center"><span class="text-2xl mr-3">🔍</span><span>Get Care Recommendation</span></span>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('input[name="red-flags"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        if (this.value === 'none' && this.checked) {
            document.querySelectorAll('input[name="red-flags"]').forEach(cb => {
                if (cb.value !== 'none') cb.checked = false;
            });
        } else if (this.value !== 'none' && this.checked) {
            document.querySelector('input[name="red-flags"][value="none"]').checked = false;
        }
    });
});
