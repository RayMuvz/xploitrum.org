"""
Create member_requests table if it doesn't exist
"""

from sqlalchemy import text, create_engine, inspect
from app.core.config import settings

def create_member_requests_table():
    """Create member_requests table if it doesn't exist"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            if 'member_requests' in tables:
                print("✅ Table 'member_requests' already exists")
                return
            
            print("Creating member_requests table...")
            
            # Create the table
            create_table_query = text("""
                CREATE TABLE IF NOT EXISTS member_requests (
                    id VARCHAR PRIMARY KEY,
                    first_name VARCHAR(255) NOT NULL,
                    last_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    phone VARCHAR(50),
                    student_number VARCHAR(100),
                    status VARCHAR NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    reviewed_by VARCHAR(255),
                    reviewed_at TIMESTAMP,
                    notes TEXT
                )
            """)
            
            conn.execute(create_table_query)
            conn.commit()
            
            print("✅ Successfully created member_requests table")
            
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    create_member_requests_table()

