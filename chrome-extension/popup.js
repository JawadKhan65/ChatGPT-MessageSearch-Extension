// popup.js: Handles UI/UX for the extension popup
function isChatGPTTab(tab) {
    return tab && tab.url && tab.url.includes('chatgpt.com');
}


let allMessages = [];
let lastFilter = '';

function renderMessages(messages) {
    const list = document.getElementById('message-list');
    list.innerHTML = '';
    if (!messages.length) {
        list.innerHTML = '<div style="color:#00bfae;text-align:center;margin-top:40px;">No user messages found.</div>';
        return;
    }
    messages.forEach((msg) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-item-wrapper';

        const item = document.createElement('div');
        item.className = 'message-item';
        item.tabIndex = 0;

        const preview = document.createElement('div');
        preview.className = 'message-preview';
        const isTrimmed = msg.text.length > 180;
        preview.textContent = isTrimmed ? msg.text.slice(0, 180) + '…' : msg.text;

        const full = document.createElement('div');
        full.className = 'message-full';
        full.textContent = msg.text;
        full.style.display = 'none';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="#00bfae" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
        toggleBtn.title = 'Expand/collapse';

        let expanded = false;
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            expanded = !expanded;
            full.style.display = expanded ? 'block' : 'none';
            preview.style.display = expanded ? 'none' : 'block';
            toggleBtn.classList.toggle('expanded', expanded);
        };

        item.onclick = (e) => {
            if (e.target !== toggleBtn) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'SCROLL_TO_MESSAGE', index: msg.index }, (resp) => {
                        window.close();
                    });
                });
            }
        };

        item.appendChild(preview);
        item.appendChild(full);
        if (isTrimmed) item.appendChild(toggleBtn);
        wrapper.appendChild(item);
        list.appendChild(wrapper);
    });
}

function filterMessages(filter) {
    filter = filter.trim().toLowerCase();
    lastFilter = filter;
    if (!filter) {
        renderMessages(allMessages);
    } else {
        renderMessages(allMessages.filter(m => m.text.toLowerCase().includes(filter)));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (isChatGPTTab(tab)) {
            document.getElementById('not-on-chatgpt').style.display = 'none';
            document.getElementById('message-list').style.display = 'block';
            chrome.tabs.sendMessage(tab.id, { type: 'GET_USER_MESSAGES' }, (resp) => {
                if (chrome.runtime.lastError || !resp) {
                    allMessages = [];
                    renderMessages([]);
                } else {
                    allMessages = resp.messages;
                    filterMessages(document.getElementById('search-input').value || '');
                }
            });
            const searchInput = document.getElementById('search-input');
            searchInput.addEventListener('input', (e) => {
                filterMessages(e.target.value);
            });
        } else {
            document.getElementById('not-on-chatgpt').style.display = 'block';
            document.getElementById('message-list').style.display = 'none';
        }
    });
});
