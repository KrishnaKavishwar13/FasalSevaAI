import os
from datetime import datetime, timedelta
from database import get_db_connection

def init_auth_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS otp_codes (
            id SERIAL PRIMARY KEY,
            phone_number VARCHAR(20) NOT NULL,
            otp_code VARCHAR(10) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_used INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            phone_number VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'farmer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
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
        WHERE phone_number = %s AND is_used = 0
    ''', (phone_number,))
    
    expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    
    c.execute('''
        INSERT INTO otp_codes (phone_number, otp_code, expires_at, is_used)
        VALUES (%s, %s, %s, 0)
    ''', (phone_number, otp_code, expires_at.isoformat()))
    
    conn.commit()
    conn.close()

def get_active_otp(phone_number: str):
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute('''
        SELECT * FROM otp_codes 
        WHERE phone_number = %s AND is_used = 0 
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
    c.execute('UPDATE otp_codes SET is_used = 1 WHERE id = %s', (otp_id,))
    conn.commit()
    conn.close()

def get_user_by_phone(phone_number: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE phone_number = %s', (phone_number,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(phone_number: str, name: str, role: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO users (phone_number, name, role)
        VALUES (%s, %s, %s)
        ON CONFLICT (phone_number) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
        RETURNING *
    ''', (phone_number, name, role))
    row = c.fetchone()
    conn.commit()
    conn.close()
    return dict(row) if row else None

