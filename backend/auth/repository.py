import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'cold_storage.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_auth_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            is_used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def store_otp(phone_number: str, otp_code: str, expiry_minutes: int = 5):
    conn = get_db_connection()
    c = conn.cursor()
    
    # Invalidate previous OTPs for this number
    c.execute('''
        UPDATE otp_codes 
        SET is_used = 1 
        WHERE phone_number = ? AND is_used = 0
    ''', (phone_number,))
    
    expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    
    c.execute('''
        INSERT INTO otp_codes (phone_number, otp_code, expires_at, is_used)
        VALUES (?, ?, ?, 0)
    ''', (phone_number, otp_code, expires_at.isoformat()))
    
    conn.commit()
    conn.close()

def get_active_otp(phone_number: str):
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute('''
        SELECT * FROM otp_codes 
        WHERE phone_number = ? AND is_used = 0 
        ORDER BY created_at DESC LIMIT 1
    ''', (phone_number,))
    
    row = c.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None

def mark_otp_used(otp_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('UPDATE otp_codes SET is_used = 1 WHERE id = ?', (otp_id,))
    conn.commit()
    conn.close()

# Initialize table on import
init_auth_db()
