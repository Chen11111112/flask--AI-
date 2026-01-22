import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import google.generativeai as genai
from dotenv import load_dotenv

# 1. 初始化與配置
load_dotenv()
app = Flask(__name__)

# 資料庫設定：在當前目錄建立投訴信資料庫
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///complaints.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 設定 Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 2. 資料模型定義
class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

# 初始化資料庫表格
with app.app_context():
    db.create_all()

# 3. 路由設定 - 頁面渲染
@app.route('/')
def index():
    return render_template('index.html')

# 4. 路由設定 - 客訴 API (CRUD)
@app.route('/api/complaints', methods=['POST'])
def add_complaint():
    """提交客訴"""
    data = request.json
    content = data.get('content')
    if not content:
        return jsonify({'error': '內容不能為空'}), 400
    
    new_complaint = Complaint(content=content)
    db.session.add(new_complaint)
    db.session.commit()
    return jsonify({'message': '提交成功', 'id': new_complaint.id}), 201

@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    """獲取所有客訴"""
    complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    output = [{
        'id': c.id,
        'content': c.content,
        'timestamp': c.created_at.strftime('%Y-%m-%d %H:%M:%S')
    } for c in complaints]
    return jsonify(output)

@app.route('/api/complaints/<int:id>', methods=['DELETE'])
def delete_complaint(id):
    """刪除特定客訴"""
    complaint = Complaint.query.get_or_404(id)
    db.session.delete(complaint)
    db.session.commit()
    return jsonify({'message': '已刪除'})

# 5. 路由設定 - AI 聊天 API
@app.route('/chat', methods=['POST'])
def chat():
    """Gemini AI 對話接口"""
    try:
        user_message = request.json.get('message')
        if not user_message:
            return jsonify({'error': '沒有收到訊息'}), 400

        # 呼叫 Gemini 模型
        model = genai.GenerativeModel('gemini-3-flash-preview') # 建議使用正式版型號
        response = model.generate_content(user_message)
        
        return jsonify({'response': response.text})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 6. 啟動程式
if __name__ == '__main__':
    app.run(debug=True, port=5000)