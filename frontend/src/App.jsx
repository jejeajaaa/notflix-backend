import { useState, useEffect } from 'react';
import Login from './Login';

// Ganti ke localhost kalau mau ngetes lokal!
const API_URL = "https://notflix-backend.vercel.app";

function App() {
  const [token, setToken] = useState(null);
  const [movies, setMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });
  
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");

  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  
  const [showProfile, setShowProfile] = useState(false);

  // STATE BARU UNTUK CAROUSEL TOP 10 HERO SECTION
  const [top10Movies, setTop10Movies] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [heroTrailerKey, setHeroTrailerKey] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchMovies();
      fetchWatchlist(savedToken);
    }
  }, []);

  useEffect(() => {
    if (selectedGenre || selectedYear) {
      fetchFilteredMovies();
    } else {
      if (token && !searchQuery && !showWatchlist) fetchMovies();
    }
  }, [selectedGenre, selectedYear]);

  // EFEK BARU: Timer untuk ganti film otomatis setiap 10 detik
  useEffect(() => {
    if (top10Movies.length === 0 || showWatchlist || searchQuery || selectedGenre || selectedYear) return;
    
    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % top10Movies.length;
        loadHeroData(top10Movies[nextIndex]);
        return nextIndex;
      });
    }, 10000); // 10000 ms = 10 detik

    return () => clearInterval(interval);
  }, [top10Movies, showWatchlist, searchQuery, selectedGenre, selectedYear]);

  // FUNGSI BARU: Mengambil kunci YouTube untuk background Hero Section
  const loadHeroData = async (movie) => {
    setFeaturedMovie(movie);
    try {
      const response = await fetch(`${API_URL}/api/movies/${movie.id || movie.movie_id}/trailer`);
      const data = await response.json();
      if (data.trailer_key) {
        setHeroTrailerKey(data.trailer_key);
      } else {
        setHeroTrailerKey(""); // Kembali ke gambar jika tidak ada trailer
      }
    } catch (error) {
      setHeroTrailerKey("");
    }
  };

  const showNotification = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
  };

  const fetchWatchlist = async (currentToken = token) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, { headers: { Authorization: `Bearer ${currentToken}` } });
      const data = await response.json();
      setWatchlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil watchlist");
    }
  };

  const toggleWatchlist = async (movie) => {
    const movieId = movie.id || movie.movie_id;
    const isSaved = watchlist.find(item => item.movie_id === movieId);
    try {
      if (isSaved) {
        await fetch(`${API_URL}/api/watchlist/${movieId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        showNotification("Film dihapus dari Watchlist.");
      } else {
        await fetch(`${API_URL}/api/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ movie_id: movieId, title: movie.title, poster: movie.poster_path || movie.poster })
        });
        showNotification("Film ditambahkan ke Watchlist!");
      }
      fetchWatchlist();
    } catch (error) {
      showNotification("Terjadi kesalahan pada server.", true);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/movies`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setMovies(data);
        if (!selectedGenre && !selectedYear && !searchQuery) {
          const top10 = data.slice(0, 10);
          setTop10Movies(top10);
          setCurrentHeroIndex(0);
          loadHeroData(top10[0]);
        }
      } else {
        setMovies([]);
      }
    } catch (error) {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredMovies = async () => {
    setLoading(true); setShowWatchlist(false); setSearchQuery("");
    try {
      let url = `${API_URL}/api/discover?`;
      if (selectedGenre) url += `genre=${selectedGenre}&`;
      if (selectedYear) url += `year=${selectedYear}`;
      const response = await fetch(url);
      const data = await response.json();
      setMovies(Array.isArray(data) ? data : []);
    } catch (error) { setMovies([]); } finally { setLoading(false); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { fetchMovies(); return; }
    setLoading(true); setSelectedGenre(""); setSelectedYear("");
    try {
      const response = await fetch(`${API_URL}/api/search?query=${searchQuery}`);
      const data = await response.json();
      setMovies(Array.isArray(data) ? data : []);
      setShowWatchlist(false);
    } catch (error) { setMovies([]); } finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); setToken(null); };

  const openTrailer = async (movie) => {
    const movieId = movie.id || movie.movie_id;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/movies/${movieId}/trailer`);
      if (!response.ok) throw new Error("Gagal mengambil data");
      const data = await response.json();
      if (data.trailer_key) {
        setTrailerUrl(`https://www.youtube.com/embed/${data.trailer_key}?autoplay=1&rel=0&modestbranding=1`);
        setShowTrailer(true);
      } else {
        showNotification("Maaf, video trailer tidak tersedia.", true);
      }
    } catch (error) { showNotification("Gagal memuat trailer film.", true); } finally { setLoading(false); }
  };

  const closeTrailer = () => { setShowTrailer(false); setTrailerUrl(""); };
  const truncateText = (str, n) => { return str?.length > n ? str.substr(0, n - 1) + "..." : str; };

  const resetHome = () => {
    setShowWatchlist(false); setSearchQuery(""); setSelectedGenre(""); setSelectedYear(""); fetchMovies();
  };

  if (!token) return <Login />;
  const displayedMovies = showWatchlist ? watchlist : movies;

  return (
    <div style={{ backgroundColor: '#0b0c10', color: 'white', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      
      <style>{`
        .glass-nav { position: sticky; top: 0; z-index: 1000; background: rgba(11, 12, 16, 0.7); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; padding: 15px 40px; gap: 30px; transition: all 0.3s ease; }
        .nav-link { cursor: pointer; font-size: 14px; font-weight: 500; color: #a9a9a9; transition: color 0.3s; display: flex; align-items: center; gap: 5px; }
        .nav-link:hover { color: #ffffff; }
        .filter-select { background: transparent; color: #a9a9a9; border: none; font-size: 14px; font-weight: 500; cursor: pointer; outline: none; appearance: none; -webkit-appearance: none; padding-right: 15px; }
        .filter-select option { background: #141519; color: white; }
        .search-input { padding: 8px 15px 8px 35px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 14px; outline: none; transition: border-color 0.3s; width: 200px; }
        .search-input:focus { border-color: #E50914; }
        .movie-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; }
        .movie-card:hover { transform: translateY(-8px) scale(1.03); box-shadow: 0 15px 30px rgba(229, 9, 20, 0.2); border-color: rgba(229, 9, 20, 0.5); z-index: 10; }
        .btn-play { background: #E50914; color: white; padding: 12px 30px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
        .btn-play:hover { background: #B20710; transform: scale(1.05); }
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; font-weight: 500; z-index: 9999; animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        /* CSS KHUSUS UNTUK BACKGROUND VIDEO HERO */
        .hero-container { position: relative; height: 85vh; width: 100%; overflow: hidden; display: flex; alignItems: center; padding: 0 60px; }
        .hero-video-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; background-color: #000; }
        .hero-video-wrapper iframe { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100vw; height: 56.25vw; min-height: 100vh; min-width: 177.77vh; pointer-events: none; }
        .hero-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to right, rgba(11, 12, 16, 1) 15%, rgba(11, 12, 16, 0.6) 50%, rgba(11, 12, 16, 0) 100%), linear-gradient(to top, rgba(11, 12, 16, 1) 0%, rgba(11, 12, 16, 0) 25%); z-index: 1; }
        .hero-content { position: relative; z-index: 2; max-width: 600px; animation: fadeIn 1s ease-in; }
        .carousel-indicators { position: absolute; bottom: 40px; right: 60px; z-index: 2; display: flex; gap: 8px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.3); cursor: pointer; transition: 0.3s; }
        .dot.active { background: #E50914; transform: scale(1.3); }
      `}</style>

      {/* TOAST & POPUPS DI SINI (Diringkas agar fokus ke Hero) */}
      {toast.show && <div className="toast" style={{ backgroundColor: toast.isError ? '#E50914' : '#4CAF50', color: 'white' }}>{toast.message}</div>}
      
      {showProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowProfile(false)}>
          <div style={{ backgroundColor: '#141519', padding: '40px', borderRadius: '15px', maxWidth: '350px', width: '100%', border: '1px solid #333', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#E50914', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>👤</div>
            <h2 style={{ margin: '0 0 5px 0' }}>Profil Akun</h2>
            <p style={{ color: '#a9a9a9', marginBottom: '25px', fontSize: '15px' }}>Total Watchlist: <strong>{watchlist.length} Film</strong></p>
            <button onClick={() => showNotification("⚙️ Fitur Pengaturan akan segera hadir di update selanjutnya!")} style={{ width: '100%', padding: '12px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '10px' }} onMouseOver={(e) => {e.target.style.background = '#444';}} onMouseOut={(e) => {e.target.style.background = '#222';}}>⚙️ Pengaturan</button>
            <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#E50914', border: '1px solid #E50914', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '10px' }} onMouseOver={(e) => {e.target.style.background = '#E50914'; e.target.style.color = 'white';}} onMouseOut={(e) => {e.target.style.background = 'transparent'; e.target.style.color = '#E50914';}}>🚪 Keluar (Logout)</button>
            <button onClick={() => setShowProfile(false)} style={{ width: '100%', padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => e.target.style.background = '#444'} onMouseOut={(e) => e.target.style.background = '#333'}>Tutup</button>
          </div>
        </div>
      )}

      {showTrailer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }} onClick={closeTrailer}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeTrailer} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
            <iframe width="100%" height="100%" src={trailerUrl} title="Movie Trailer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
          </div>
        </div>
      )}

      <nav className="glass-nav">
        <h1 style={{ color: '#E50914', fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '1px', cursor: 'pointer' }} onClick={resetHome}>NOTFLIX</h1>
        <div style={{ display: 'flex', gap: '25px', flexGrow: 1, marginLeft: '20px' }}>
          <span className="nav-link" onClick={resetHome} style={{ color: (!showWatchlist && !searchQuery && !selectedGenre && !selectedYear) ? '#fff' : '#a9a9a9' }}>Beranda</span>
          <div className="nav-link"><select className="filter-select" value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}><option value="">Genre ▾</option><option value="28">Action</option><option value="35">Comedy</option><option value="27">Horror</option><option value="10749">Romance</option><option value="878">Sci-Fi</option><option value="16">Animation</option></select></div>
          <div className="nav-link"><select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}><option value="">Tahun ▾</option><option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option></select></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#a9a9a9' }}>🔍</span><input type="text" placeholder="Cari judul..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" /></form>
          <span className="nav-link" onClick={() => setShowWatchlist(true)} style={{ color: showWatchlist ? '#fff' : '#a9a9a9' }}>Watchlist</span>
          <div className="nav-link" onClick={() => setShowProfile(true)} style={{ fontWeight: 'bold' }}>Akun ▾</div>
        </div>
      </nav>

      {/* --- HERO SECTION CAROUSEL VIDEO BACKGROUND --- */}
      {!showWatchlist && !searchQuery && !selectedGenre && !selectedYear && featuredMovie && (
        <div className="hero-container">
          {/* Latar Belakang Video (Atau Gambar Jika Video Kosong) */}
          <div className="hero-video-wrapper" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {heroTrailerKey && (
              <iframe 
                src={`https://www.youtube.com/embed/${heroTrailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${heroTrailerKey}`}
                frameBorder="0" 
                allow="autoplay; encrypted-media" 
                allowFullScreen
              ></iframe>
            )}
            <div className="hero-overlay"></div>
          </div>

          <div className="hero-content">
            <span style={{ background: '#E50914', padding: '4px 10px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>TOP 10 VIRAL #{currentHeroIndex + 1}</span>
            <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '15px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', lineHeight: '1' }}>{featuredMovie.title}</h1>
            <p style={{ fontSize: '16px', color: '#e0e0e0', lineHeight: '1.6', marginBottom: '30px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{truncateText(featuredMovie.overview, 180)}</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn-play" onClick={() => openTrailer(featuredMovie)}>▶ Putar Trailer</button>
              <button onClick={() => setSelectedMovie(featuredMovie)} style={{ background: 'rgba(109, 109, 110, 0.7)', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>ℹ Selengkapnya</button>
            </div>
          </div>

          {/* Navigasi Titik-Titik Carousel */}
          <div className="carousel-indicators">
            {top10Movies.map((_, idx) => (
              <div 
                key={idx} 
                className={`dot ${idx === currentHeroIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentHeroIndex(idx);
                  loadHeroData(top10Movies[idx]);
                }}
              ></div>
            ))}
          </div>
        </div>
      )}

      <main style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto', marginTop: (!showWatchlist && !searchQuery && !selectedGenre && !selectedYear) ? '0px' : '0', position: 'relative', zIndex: 10 }}>
        <h2 style={{ marginBottom: '30px', fontWeight: '600', fontSize: '22px', borderLeft: '4px solid #E50914', paddingLeft: '15px' }}>
          {showWatchlist ? '🎬 Daftar Tontonan Saya' : searchQuery ? `🔍 Hasil Pencarian: "${searchQuery}"` : (selectedGenre || selectedYear) ? '🎯 Hasil Filter Kategori' : '🔥 Sedang Trending'}
        </h2>
        {loading ? (
           <p style={{textAlign: 'center', padding: '50px', color: '#888'}}>Memuat data film...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' }}>
            {displayedMovies.map((movie) => (
              (movie.poster_path || movie.poster) && (
                <div key={movie.id || movie.movie_id} onClick={() => setSelectedMovie(movie)} className="movie-card" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#141519', borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path || movie.poster}`} alt={movie.title} style={{ width: '100%', height: '330px', objectFit: 'cover' }} />
                </div>
              )
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETAIL FILM */}
      {selectedMovie && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setSelectedMovie(null)}>
          <div style={{ backgroundColor: '#141519', padding: '30px', borderRadius: '15px', maxWidth: '650px', width: '100%', border: '1px solid #333' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 10px 0' }}>{selectedMovie.title}</h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>{selectedMovie.overview || "Sinopsis tidak tersedia."}</p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button className="btn-play" onClick={() => openTrailer(selectedMovie)}>▶ Putar Trailer</button>
              <button onClick={() => toggleWatchlist(selectedMovie)} style={{ padding: '12px 25px', background: watchlist.find(item => item.movie_id === (selectedMovie.id || selectedMovie.movie_id)) ? '#4CAF50' : '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                {watchlist.find(item => item.movie_id === (selectedMovie.id || selectedMovie.movie_id)) ? '✔ Di Watchlist' : '+ Watchlist'}
              </button>
              <button onClick={() => setSelectedMovie(null)} style={{ padding: '10px 20px', background: 'transparent', color: 'white', border: '1px solid #555', borderRadius: '5px', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;