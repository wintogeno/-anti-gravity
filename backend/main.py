from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from dotenv import load_dotenv
load_dotenv()
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os
import uuid
import datetime

from utils import pdf_tools, auth, email
import models
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./antipdf.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
models.Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to protect routes
async def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    payload = auth.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="User not verified")
        
    return user

# --- AUTH ROUTES ---

@app.post("/auth/google")
async def google_login(token_data: dict, db: Session = Depends(get_db)):
    # In a real app, 'token_data' would be the ID token from Google
    google_token = token_data.get("token")
    user_info = await auth.verify_google_token(google_token)
    
    if not user_info:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    
    email_addr = user_info["email"]
    user = db.query(models.User).filter(models.User.email == email_addr).first()
    
    if not user:
        user = models.User(email=email_addr, google_id=user_info["sub"])
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Generate verification code
    code = email.generate_verification_code()
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    
    verification = models.VerificationCode(user_id=user.id, code=code, expires_at=expires)
    db.add(verification)
    db.commit()
    
    # Send email (mocked in development)
    await email.send_verification_email(email_addr, code)
    
    return {"message": "Verification code sent", "email": email_addr}

@app.post("/auth/verify")
async def verify_code(data: dict, db: Session = Depends(get_db)):
    email_addr = data.get("email")
    code = data.get("code")
    
    user = db.query(models.User).filter(models.User.email == email_addr).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    verification = db.query(models.VerificationCode).filter(
        models.VerificationCode.user_id == user.id,
        models.VerificationCode.code == code,
        models.VerificationCode.is_used == False,
        models.VerificationCode.expires_at > datetime.datetime.utcnow()
    ).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    
    verification.is_used = True
    user.is_verified = True
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- PDF TOOL ROUTES (PROTECTED) ---

@app.post("/merge")
async def merge(files: list[UploadFile] = File(...), current_user: models.User = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    input_paths = []
    for file in files:
        path = os.path.join(session_dir, file.filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        input_paths.append(path)
    
    output_path = os.path.join(session_dir, "merged.pdf")
    pdf_tools.merge_pdfs(input_paths, output_path)
    
    return FileResponse(output_path, filename="merged.pdf")

@app.post("/pdf-to-word")
async def to_word(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    input_path = os.path.join(session_dir, file.filename)
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    output_filename = os.path.splitext(file.filename)[0] + ".docx"
    output_path = os.path.join(session_dir, output_filename)
    
    pdf_tools.pdf_to_word(input_path, output_path)
    
    return FileResponse(output_path, filename=output_filename)

@app.post("/word-to-pdf")
async def from_word(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    input_path = os.path.join(session_dir, file.filename)
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    output_filename = os.path.splitext(file.filename)[0] + ".pdf"
    output_path = os.path.join(session_dir, output_filename)
    
    try:
        pdf_tools.word_to_pdf(input_path, output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return FileResponse(output_path, filename=output_filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
