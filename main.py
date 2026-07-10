from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import requests
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import bcrypt  
from datetime import datetime, timedelta
from jose import jwt, JWTError

# --- KONFIGURASI ---
TMDB_API_KEY = "a5ba2a3bd501b1c5d77da07766390701"
TMDB_BASE_URL = "https://api.themoviedb.org/3"
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_Z34rSaCQMfTJ@ep-mute-grass-aoh6z9wv.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
SECRET_KEY = "rahasia_banget" 
ALGORITHM = "HS256"

# --- SETUP DATABASE & SECURITY ---
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Izinkan semua origin
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# --- HELPER FUNCTIONS ---
def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token tidak valid")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Sesi telah berakhir, silakan login ulang")

# --- MODEL DATABASE ---
class WatchlistDB(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True) 
    movie_id = Column(Integer, index=True) 
    title = Column(String)
    poster = Column(String)

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)

Base.metadata.create_all(bind=engine)

# --- SCHEMAS ---
class UserCreate(BaseModel):
    username: str
    password: str

class WatchlistItem(BaseModel):
    movie_id: int
    title: str
    poster: str

# --- ENDPOINTS ---
@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username sudah terpakai")
    
    new_user = UserDB(username=user.username, password=get_password_hash(user.password))
    db.add(new_user)
    db.commit()
    return {"message": "Registrasi berhasil!"}

@app.post("/api/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Username atau password salah")
    return {"access_token": create_access_token(data={"sub": db_user.username}), "token_type": "bearer"}

@app.get("/api/movies")
def get_movies():
    response = requests.get(f"{TMDB_BASE_URL}/movie/popular?api_key={TMDB_API_KEY}")
    return response.json().get("results", [])

@app.get("/api/search")
def search_movies(query: str):
    response = requests.get(f"{TMDB_BASE_URL}/search/movie?api_key={TMDB_API_KEY}&query={query}")
    return response.json().get("results", [])

@app.post("/api/watchlist")
def add_to_watchlist(item: WatchlistItem, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(WatchlistDB).filter(WatchlistDB.username == current_user, WatchlistDB.movie_id == item.movie_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Film ini sudah ada di watchlist kamu")

    db.add(WatchlistDB(username=current_user, movie_id=item.movie_id, title=item.title, poster=item.poster))
    db.commit()
    return {"message": "Berhasil!"}

@app.get("/api/watchlist")
def get_watchlist(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(WatchlistDB).filter(WatchlistDB.username == current_user).all()

@app.delete("/api/watchlist/{movie_id}")
def delete_from_watchlist(movie_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(WatchlistDB).filter(WatchlistDB.username == current_user, WatchlistDB.movie_id == movie_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan")
    
    db.delete(item)
    db.commit()
    return {"message": "Berhasil dihapus"}


# ==========================================
# ENDPOINT BARU: AMBIL DATA TRAILER YOUTUBE
# ==========================================
@app.get("/api/movies/{movie_id}/trailer")
def get_movie_trailer(movie_id: int):
    # Mengambil video spesifik untuk film ini dari TMDB
    tmdb_url = f"{TMDB_BASE_URL}/movie/{movie_id}/videos?api_key={TMDB_API_KEY}&language=en-US"
    
    try:
        response = requests.get(tmdb_url)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Trailer tidak ditemukan di TMDB")
            
        data = response.json()
        videos = data.get("results", [])
        
        # 1. Cari video yang spesifik bertipe 'Trailer' dan bersumber dari 'YouTube'
        for video in videos:
            if video.get("site") == "YouTube" and video.get("type") == "Trailer":
                return {"trailer_key": video.get("key")}
                
        # 2. Alternatif: Jika tipe 'Trailer' tidak ada, ambil video YouTube apa saja yang tersedia (misal: Teaser)
        for video in videos:
            if video.get("site") == "YouTube":
                return {"trailer_key": video.get("key")}
                
        # Jika benar-benar kosong
        return {"trailer_key": None}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi TMDB: {str(e)}")

# ==========================================
# ENDPOINT BARU: FILTER GENRE & TAHUN
# ==========================================
@app.get("/api/discover")
def discover_movies(genre: str = None, year: str = None):
    url = f"{TMDB_BASE_URL}/discover/movie?api_key={TMDB_API_KEY}&language=en-US&sort_by=popularity.desc"
    
    if genre:
        url += f"&with_genres={genre}"
    if year:
        url += f"&primary_release_year={year}"
        
    try:
        response = requests.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Gagal filter film")
        return response.json().get("results", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi TMDB: {str(e)}")