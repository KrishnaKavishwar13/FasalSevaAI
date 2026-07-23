import os
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    # Fetch connection string from environment, fallback to None
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL environment variable is not set")
    # psycopg2 can parse the URI directly
    conn = psycopg2.connect(url, cursor_factory=DictCursor)
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()

    # Drop old table to recreate with proper postgres schema (or keep if you want to preserve data)
    # Since we are migrating from SQLite, we'll recreate it clean.
    c.execute('DROP TABLE IF EXISTS cold_storages CASCADE')

    c.execute('''CREATE TABLE cold_storages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255),
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        price_per_crate_day DOUBLE PRECISION DEFAULT 2.0,
        capacity_crates INTEGER DEFAULT 500,
        available_crates INTEGER DEFAULT 500,
        verified INTEGER DEFAULT 0,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Pre-verified partner storages
    storages = [
        ('Shivam Cold Store',    'Ramesh Sharma',  22.7196, 75.8577, 'Dewas Naka, Indore', '9876543210', 2.0, 500,  400, 1),
        ('Rajdhani Cold Storage','Suresh Patel',   22.9676, 76.0534, 'Dewas, MP',          '9765432109', 1.8, 300,  250, 1),
        ('Krishi Bhandar FPO',   'Mahesh Verma',   23.1765, 76.5784, 'Shajapur, MP',       '9654321098', 1.5, 800,  600, 1),
        ('Kisan Cold Store',     'Dinesh Yadav',   22.6022, 75.5022, 'Mhow, Indore',       '9543210987', 2.2, 400,  300, 1),
        ('AgroFreeze Ujjain',    'Prakash Joshi',  23.1793, 75.7849, 'Ujjain, MP',         '9432109876', 1.6, 600,  500, 1),
        ('MP Agri Storage',      'Vijay Singh',    23.2599, 77.4126, 'Bhopal, MP',         '9321098765', 2.0, 1000, 800, 1),
        ('Narmada Cold Chain',   'Anil Gupta',     22.3072, 75.0434, 'Barwani, MP',        '9210987654', 1.9, 450,  350, 1),
    ]

    c.executemany('''INSERT INTO cold_storages
        (name, owner_name, lat, lng, address, phone,
         price_per_crate_day, capacity_crates, available_crates, verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING''', storages)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")
