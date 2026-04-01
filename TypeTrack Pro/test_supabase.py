import os
from dotenv import load_dotenv
from postgrest import SyncPostgrestClient

# Load environment variables from .env
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def test_connection():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL or SUPABASE_KEY not found in .env")
        return

    print(f"Testing connection to: {SUPABASE_URL}")
    
    try:
        # Initialize client
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        client = SyncPostgrestClient(f"{SUPABASE_URL}/rest/v1", headers=headers)
        
        # Try to select from users table
        print("Fetching users table...")
        res = client.table("users").select("count").execute()
        
        print("SUCCESS! Connected to Supabase and queried 'users' table.")
        print(f"Current user count: {res.data[0]['count'] if res.data else 0}")
        
    except Exception as e:
        print(f"CONNECTION FAILED: {e}")
        print("\nMake sure you have:")
        print("1. Updated your .env file with correct credentials.")
        print("2. Run the SQL script in the Supabase SQL Editor.")

if __name__ == "__main__":
    test_connection()
