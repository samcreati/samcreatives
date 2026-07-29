// ======================
// SAM Creatives AI Tools
// ======================

// Configuration
const LEAD_STORAGE_KEY = 'sam_ai_lead';
const HISTORY_PREFIX = 'ai_history_';
const POLLINATIONS_IMAGE_URL = 'https://image.pollinations.ai/prompt/';
const POLLINATIONS_TEXT_URL = 'https://text.pollinations.ai/prompt/';

// State
let currentTool = 'logo';
let leadData = JSON.parse(localStorage.getItem(LEAD_STORAGE_KEY) || 'null');

// ======================
// Lead Management
// ======================
function requireLead() {
    if (!leadData) {
        const modal = new bootstrap.Modal(document.getElementById('leadModal'));
        modal.show();
        return false;
    }
    return true;
}

window.submitLead = function(e) {
    e.preventDefault();
    const name = document.getElementById('leadName').value.trim();
    const email = document.getElementById('leadEmail').value.trim();
    const phone = document.getElementById('leadPhone').value.trim();
    leadData = { name, email, phone, timestamp: new Date().toISOString() };
    localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(leadData));
    bootstrap.Modal.getInstance(document.getElementById('leadModal')).hide();
    // Trigger the generation that was waiting
    if (window._pendingGeneration) {
        window._pendingGeneration();
        window._pendingGeneration = null;
    }
};

// ======================
// Tab Switching
// ======================
window.switchTab = function(tab) {
    document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`).classList.add('active');
    currentTool = tab;
};

// ======================
// History Management
// ======================
function getHistory(type) {
    return JSON.parse(localStorage.getItem(HISTORY_PREFIX + type) || '[]');
}

function addHistory(type, entry) {
    const history = getHistory(type);
    history.unshift(entry);
    if (history.length > 20) history.pop();
    localStorage.setItem(HISTORY_PREFIX + type, JSON.stringify(history));
    renderHistory(type);
}

function renderHistory(type) {
    const container = document.getElementById(`${type}History`);
    const history = getHistory(type);
    if (!container) return;
    if (history.length === 0) {
        container.innerHTML = `<p class="text-muted">No ${type}s generated yet.</p>`;
        return;
    }
    container.innerHTML = history.map(item => {
        if (item.dataUrl) {
            return `<div class="history-item"><img src="${item.dataUrl}" alt="${type}"><div><small class="text-white">${item.prompt.substring(0,40)}...</small></div></div>`;
        } else {
            return `<div class="history-item"><i class="bi bi-chat-quote fs-4 text-gradient"></i><div><small class="text-white">${item.prompt.substring(0,50)}...</small><br><small class="text-muted">${item.result.substring(0,60)}...</small></div></div>`;
        }
    }).join('');
}

// Initialize history displays
['logo', 'image', 'caption', 'hashtag'].forEach(t => renderHistory(t));

// ======================
// Pollinations API Helpers
// ======================
async function generateImageFromPollinations(prompt, width = 512, height = 512) {
    const url = `${POLLINATIONS_IMAGE_URL}${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
    return url; // Pollinations returns the image directly as the response URL; we can use it as src
}

async function generateTextFromPollinations(prompt) {
    const url = `${POLLINATIONS_TEXT_URL}${encodeURIComponent(prompt)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Text generation failed');
        const text = await response.text();
        return text.trim();
    } catch (err) {
        console.error('Pollinations text error:', err);
        return 'Failed to generate text. Please try again.';
    }
}

// ======================
// Utility Functions
// ======================
function showLoading(containerId) {
    document.getElementById(containerId).innerHTML = '<div class="spinner-border" role="status"></div>';
}

function hideDownloadButton(tool) {
    const btn = document.getElementById(`download${tool.charAt(0).toUpperCase()+tool.slice(1)}Btn`);
    if (btn) btn.style.display = 'none';
}

function showDownloadButton(tool) {
    const btn = document.getElementById(`download${tool.charAt(0).toUpperCase()+tool.slice(1)}Btn`);
    if (btn) btn.style.display = 'inline-block';
}

async function downloadResult(tool) {
    const preview = document.getElementById(`${tool}Preview`);
    const img = preview.querySelector('img');
    if (!img) return;
    // Fetch image and convert to blob to allow download
    try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `samcreatives-${tool}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Download failed. Please try again.');
    }
}
window.downloadResult = downloadResult;

async function copyToClipboard(tool) {
    const preview = document.getElementById(`${tool}Preview`);
    const text = preview.innerText;
    try {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    } catch (err) {
        alert('Failed to copy. Please copy manually.');
    }
}
window.copyToClipboard = copyToClipboard;

// ======================
// Tool: Logo Generator
// ======================
window.generateLogo = async function() {
    if (!requireLead()) {
        window._pendingGeneration = generateLogo;
        return;
    }

    const businessName = document.getElementById('logoBusinessName').value.trim();
    if (!businessName) return alert('Please enter a business name.');

    const industry = document.getElementById('logoIndustry').value;
    const style = document.getElementById('logoStyle').value;
    const colors = document.getElementById('logoColors').value;

    // Build prompt
    let prompt = `Logo for "${businessName}"`;
    if (industry) prompt += ` in ${industry} industry`;
    if (style) prompt += `, ${style} style`;
    if (colors) prompt += `, colors: ${colors}`;
    prompt += ', professional, high-quality, vector design, on dark background';

    showLoading('logoPreview');
    hideDownloadButton('logo');

    try {
        const imageUrl = await generateImageFromPollinations(prompt, 512, 512);
        const img = new Image();
        img.onload = function() {
            document.getElementById('logoPreview').innerHTML = `<img src="${imageUrl}" alt="Generated Logo">`;
            showDownloadButton('logo');
            addHistory('logo', { prompt, dataUrl: imageUrl });
        };
        img.onerror = function() {
            document.getElementById('logoPreview').innerHTML = '<p class="text-danger">Failed to load image. Try a different prompt.</p>';
        };
        img.src = imageUrl;
    } catch (err) {
        document.getElementById('logoPreview').innerHTML = '<p class="text-danger">Generation failed. Please try again.</p>';
    }
};

// ======================
// Tool: Image Generator
// ======================
window.generateImage = async function() {
    if (!requireLead()) {
        window._pendingGeneration = generateImage;
        return;
    }

    const prompt = document.getElementById('imagePrompt').value.trim();
    if (!prompt) return alert('Please enter an image description.');

    const width = parseInt(document.getElementById('imageWidth').value) || 512;
    const height = parseInt(document.getElementById('imageHeight').value) || 512;

    showLoading('imagePreview');
    hideDownloadButton('image');

    try {
        const imageUrl = await generateImageFromPollinations(prompt, width, height);
        const img = new Image();
        img.onload = function() {
            document.getElementById('imagePreview').innerHTML = `<img src="${imageUrl}" alt="Generated Image">`;
            showDownloadButton('image');
            addHistory('image', { prompt, dataUrl: imageUrl });
        };
        img.onerror = function() {
            document.getElementById('imagePreview').innerHTML = '<p class="text-danger">Failed to load image. Try a different prompt.</p>';
        };
        img.src = imageUrl;
    } catch (err) {
        document.getElementById('imagePreview').innerHTML = '<p class="text-danger">Generation failed. Please try again.</p>';
    }
};

// ======================
// Tool: Caption Generator
// ======================
window.generateCaption = async function() {
    if (!requireLead()) {
        window._pendingGeneration = generateCaption;
        return;
    }

    const businessType = document.getElementById('captionBusinessType').value.trim();
    if (!businessType) return alert('Please enter a business type.');

    const platform = document.getElementById('captionPlatform').value;
    const tone = document.getElementById('captionTone').value;

    const prompt = `Write a ${tone} social media caption for a ${businessType} business, suitable for ${platform}. Include relevant emojis and a call to action. Keep it under 150 words.`;

    showLoading('captionPreview');
    document.getElementById('copyCaptionBtn').style.display = 'none';

    try {
        const caption = await generateTextFromPollinations(prompt);
        document.getElementById('captionPreview').innerHTML = `<p style="white-space:pre-wrap; color:#fff;">${caption}</p>`;
        document.getElementById('copyCaptionBtn').style.display = 'inline-block';
        addHistory('caption', { prompt: businessType, result: caption });
    } catch (err) {
        document.getElementById('captionPreview').innerHTML = '<p class="text-danger">Generation failed. Please try again.</p>';
    }
};

// ======================
// Tool: Hashtag Generator
// ======================
window.generateHashtags = async function() {
    if (!requireLead()) {
        window._pendingGeneration = generateHashtags;
        return;
    }

    const keywords = document.getElementById('hashtagKeywords').value.trim();
    if (!keywords) return alert('Please enter keywords.');

    const prompt = `Generate 20 relevant, high-engagement hashtags for the topic: ${keywords}. Return them as a space-separated list with # symbol.`;

    showLoading('hashtagPreview');
    document.getElementById('copyHashtagBtn').style.display = 'none';

    try {
        const hashtags = await generateTextFromPollinations(prompt);
        document.getElementById('hashtagPreview').innerHTML = `<p style="white-space:pre-wrap; color:#fff;">${hashtags}</p>`;
        document.getElementById('copyHashtagBtn').style.display = 'inline-block';
        addHistory('hashtag', { prompt: keywords, result: hashtags });
    } catch (err) {
        document.getElementById('hashtagPreview').innerHTML = '<p class="text-danger">Generation failed. Please try again.</p>';
    }
};

// ======================
// Init
// ======================
// Show first tab
switchTab('logo');