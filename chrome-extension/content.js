// Content script: Extracts user messages and listens for popup requests
function getUserMessages() {
    // For chatgpt.com
    let bubbles = Array.from(document.querySelectorAll('div.user-message-bubble-color'));
    // For gemini.google.com
    if (bubbles.length === 0 && window.location.hostname.includes('gemini.google.com')) {
        bubbles = Array.from(document.querySelectorAll('user-query'));
    }
    return bubbles.map((el, idx) => ({
        text: el.innerText.trim(),
        index: idx
    }));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_USER_MESSAGES') {
        sendResponse({ messages: getUserMessages() });
    } else if (request.type === 'SCROLL_TO_MESSAGE') {
        let bubbles = Array.from(document.querySelectorAll('div.user-message-bubble-color'));
        if (bubbles.length === 0 && window.location.hostname.includes('gemini.google.com')) {
            bubbles = Array.from(document.querySelectorAll('user-query'));
        }
        const el = bubbles[request.index];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('gpt-ext-highlight');
            setTimeout(() => el.classList.remove('gpt-ext-highlight'), 1500);
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false });
        }
    }
    return true;
});

// Add highlight style
const style = document.createElement('style');
style.textContent = `.gpt-ext-highlight { outline: 3px solid #00bfae !important; border-radius: 8px; transition: outline 0.3s; }`;
document.head.appendChild(style);
