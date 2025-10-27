"""
Add must_change_password column to users table in PostgreSQL
"""

from sqlalchemy import text, create_engine
from app.core.config import settings

def add_column():
    """Add must_change_password column to users table"""
    try:
        # Create engine using the DATABASE_URL
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if column already exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='must_change_password'
            """)
            result = conn.execute(check_query)
            exists = result.fetchone() is not None
            
            if exists:
                print("✅ Column 'must_change_password' already exists in users table")
                return
            
            # Add the column
            print("Adding must_change_password column to users table...")
            alter_query = text("""
                ALTER TABLE users 
                ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE
            """)
            
            conn.execute(alter_query)
            conn.commit()
            
            print("✅ Successfully added must_change_password column to users table")
            
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        raise

if __name__ == "__main__":
    add_column()

