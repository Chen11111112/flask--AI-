document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    // 監聽表單送出事件
    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // 1. 阻止表單預設的跳頁行為

        const message = userInput.value.trim();
        if (!message) return;

        // 2. 顯示使用者的訊息在畫面上
        appendMessage(message, 'user-message');
        userInput.value = ''; // 清空輸入框
        
        // 顯示「思考中...」的提示 (UIUX 優化)
        const loadingId = showLoading();

        try {
            // 3. 發送請求給後端 (Flask)
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            // 移除讀取提示
            removeLoading(loadingId);

            if (response.ok) {
                // 4. 顯示 AI 回傳的訊息
                appendMessage(data.response, 'ai-message');
            } else {
                appendMessage('錯誤: ' + data.error, 'ai-message text-danger');
            }

        } catch (error) {
            removeLoading(loadingId);
            appendMessage('發生連線錯誤，請稍後再試。', 'ai-message text-danger');
            console.error('Error:', error);
        }
    });

    // 輔助函式：將訊息加入聊天視窗
    function appendMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        // 為了安全，這裡使用 textContent，若要支援 Markdown 需用其他套件
        messageDiv.textContent = text; 
        chatBox.appendChild(messageDiv);
        
        // 自動捲動到底部
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // UIUX: 顯示思考中
    function showLoading() {
        const id = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = id;
        loadingDiv.className = 'message ai-message text-muted fst-italic';
        loadingDiv.textContent = 'Gemini 正在思考...';
        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return id;
    }

    function removeLoading(id) {
        const element = document.getElementById(id);
        if (element) element.remove();
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const complaintBtn = document.getElementById('submit-complaint');
    const complaintInput = document.getElementById('complaint-text');
    const complaintList = document.getElementById('complaint-list');

    // 初始化：獲取所有客訴
    loadComplaints();

    // 提交客訴
    complaintBtn.addEventListener('click', async () => {
        const content = complaintInput.value.trim();
        if (!content) return alert('請輸入內容');

        const response = await fetch('/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });

        if (response.ok) {
            complaintInput.value = '';
            loadComplaints(); // 重新讀取列表
        }
    });

    // 獲取列表函式
    async function loadComplaints() {
        const response = await fetch('/api/complaints');
        const data = await response.json();
        
        complaintList.innerHTML = ''; // 清空舊內容
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'list-group-item d-flex justify-content-between align-items-center';
            div.innerHTML = `
                <div>
                    <p class="mb-1">${item.content}</p>
                    <small class="text-muted">${item.timestamp}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteComplaint(${item.id})">刪除</button>
            `;
            complaintList.appendChild(div);
        });
    }

    // 刪除函式 (掛載到 window 以便 onclick 呼叫)
    window.deleteComplaint = async (id) => {
        if (!confirm('確定要刪除這封信嗎？')) return;
        
        const response = await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadComplaints();
        }
    };
});
