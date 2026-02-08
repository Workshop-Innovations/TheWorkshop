import sys
import os

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

print("Testing imports...")
try:
    from app.routes import flashcards
    print("Successfully imported app.routes.flashcards")
except Exception as e:
    print(f"Failed to import app.routes.flashcards: {e}")
    sys.exit(1)

try:
    from app.routes import tutor
    print("Successfully imported app.routes.tutor")
except Exception as e:
    print(f"Failed to import app.routes.tutor: {e}")
    sys.exit(1)

print("All imports successful!")
