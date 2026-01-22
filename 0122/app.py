from flask import Flask, render_template, request, jsonify
import os
import google.generativeai as genai
from dotenv import load_dotenv

# 1. 載入環境變數
load_dotenv()

# 2. 設定 Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

# 首頁路由
@app.route('/')
def index():
    return render_template('index.html')

# 3. 新增聊天接口 (POST 方法)
@app.route('/chat', methods=['POST'])
def chat():
    try:
        # 接收前端傳來的 JSON 資料
        user_message = request.json.get('message')
        
        if not user_message:
            return jsonify({'error': '沒有收到訊息'}), 400

        # 呼叫 Gemini 模型
        model = genai.GenerativeModel('gemini-3-flash-preview')
        response = model.generate_content(user_message)
        
        # 回傳 AI 的回應文字
        return jsonify({'response': response.text})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)