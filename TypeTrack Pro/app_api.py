import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from postgrest import SyncPostgrestClient
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'typetrack-super-secret-key')
jwt = JWTManager(app)

# Supabase Connection
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase credentials not found in .env. API will likely fail.")
    db = None
else:
    try:
        # We use a SyncPostgrestClient for standard synchronous Flask
        db = SyncPostgrestClient(
            f"{SUPABASE_URL}/rest/v1",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            }
        )
        print("Connected to Supabase successfully!")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        db = None

# --- AUTH ROUTES ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    if db is None:
        return jsonify({"error": "Database not initialized"}), 500
    
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    # Check if user already exists
    existing = db.table("users").select("*").or_(f"username.eq.{username},email.eq.{email}").execute()
    if existing.data and len(existing.data) > 0:
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Insert new user
    new_user = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": "user"
    }
    
    res = db.table("users").insert(new_user).execute()
    if not res.data:
        return jsonify({"error": "Registration failed"}), 500
    
    user_id = res.data[0]['id']
    access_token = create_access_token(identity=str(user_id))
    return jsonify({"message": "User registered successfully", "token": access_token}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    if db is None:
        return jsonify({"error": "Database not initialized"}), 500

    data = request.json
    username = data.get('username')
    password = data.get('password')

    res = db.table("users").select("*").eq("username", username).execute()
    if res.data and len(res.data) > 0:
        user = res.data[0]
        if bcrypt.check_password_hash(user['password'], password):
            access_token = create_access_token(identity=str(user['id']))
            return jsonify({
                "token": access_token,
                "username": user['username'],
                "role": user.get('role', 'user')
            }), 200

    return jsonify({"error": "Invalid credentials"}), 401

# --- DATA ROUTES ---

@app.route('/api/sessions', methods=['POST'])
@jwt_required()
def save_session():
    if db is None:
        return jsonify({"error": "Database not initialized"}), 500

    user_id = get_jwt_identity()
    session_data = request.json
    
    # Map frontend fields to Supabase schema
    supabase_session = {
        "user_id": user_id,
        "date": session_data.get('date'),
        "duration": session_data.get('duration'),
        "wpm": session_data.get('wpm'),
        "raw_wpm": session_data.get('rawWpm'),
        "accuracy": session_data.get('accuracy'),
        "errors": session_data.get('errors'),
        "characters": session_data.get('characters'),
        "difficulty": session_data.get('difficulty'),
        "time_limit": session_data.get('timeLimit')
    }

    db.table("sessions").insert(supabase_session).execute()
    return jsonify({"message": "Session saved"}), 201

@app.route('/api/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    if db is None:
        return jsonify({"error": "Database not initialized"}), 500

    user_id = get_jwt_identity()
    res = db.table("sessions").select("*").eq("user_id", user_id).order("date", desc=True).execute()
    
    # Map back to camelCase for frontend compatibility
    mapped_data = []
    for s in res.data:
        s['rawWpm'] = s.pop('raw_wpm', 0)
        s['timeLimit'] = s.pop('time_limit', 0)
        mapped_data.append(s)
    
    return jsonify(mapped_data), 200

@app.route('/api/scores', methods=['POST'])
@jwt_required()
def save_score():
    if db is None:
        return jsonify({"error": "Database not initialized"}), 500

    user_id = get_jwt_identity()
    score_data = request.json
    
    supabase_score = {
        "user_id": user_id,
        "game": score_data.get('game'),
        "score": score_data.get('score'),
        "level": score_data.get('level'),
        "date": score_data.get('date')
    }

    db.table("scores").insert(supabase_score).execute()
    return jsonify({"message": "Score saved"}), 201

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    if db is None:
        return jsonify({"error": "Database not initialized"}), 500

    game = request.args.get('game', 'all')
    
    # We select scores and join users(username)
    query = db.table("scores").select("*, users(username)")
    
    if game != 'all':
        query = query.eq("game", game)
    
    res = query.order("score", desc=True).limit(50).execute()
    
    # Flatten the result structure for frontend (users -> username)
    flattened = []
    for s in res.data:
        s['username'] = s['users']['username'] if s.get('users') else 'Unknown'
        flattened.append(s)

    return jsonify(flattened), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
