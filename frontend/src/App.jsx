import { useState, useEffect } from 'react';
import Login from './Login';

const API_URL = "https://notflix-backend.vercel.app";
// const API_URL = "http://localhost:8000"; 

function App() {
  const [token, setToken] = useState(null);
  const [movies, setMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });
  
  const [contentType, setContentType] = useState("movie"); 

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");

  const [showFullMovie, setShowFullMovie] = useState(false);
  const [fullMovieUrl, setFullMovieUrl] = useState("");

  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const [top10Movies, setTop10Movies] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [heroTrailerKey, setHeroTrailerKey] = useState("");

  const [continueWatching, setContinueWatching] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

  const [modalTrailerKey, setModalTrailerKey] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchMovies();
      fetchWatchlist(savedToken);
      const savedProgress = localStorage.getItem("continueWatching");
      if (savedProgress) setContinueWatching(JSON.parse(savedProgress));
    }

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (token) {
      setSearchQuery("");
      setSelectedGenre("");
      setSelectedYear("");
      fetchMovies();
    }
  }, [contentType]);

  useEffect(() => {
    if (selectedGenre || selectedYear) {
      fetchFilteredMovies();
    }
  }, [selectedGenre, selectedYear]);

  useEffect(() => {
    if (top10Movies.length === 0 || showWatchlist || searchQuery || selectedGenre || selectedYear) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % top10Movies.length;
        loadHeroData(top10Movies[nextIndex]);
        return nextIndex;
      });
    }, 10000); 
    return () => clearInterval(interval);
  }, [top10Movies, showWatchlist, searchQuery, selectedGenre, selectedYear]);

  const loadHeroData = async (movie) => {
    setFeaturedMovie(movie);
    try {
      const response = await fetch(`${API_URL}/api/movies/${movie.id || movie.movie_id}/trailer?type=${contentType}`);
      const data = await response.json();
      if (data.trailer_key) {
        setHeroTrailerKey(data.trailer_key);
      } else {
        setHeroTrailerKey(""); 
      }
    } catch (error) {
      setHeroTrailerKey("");
    }
  };

  const handleSelectMovie = async (movie) => {
    setSelectedMovie(movie);
    setModalTrailerKey(""); 
    
    try {
      const response = await fetch(`${API_URL}/api/movies/${movie.id || movie.movie_id}/trailer?type=${contentType}`);
      const data = await response.json();
      if (data.trailer_key) {
        setModalTrailerKey(data.trailer_key); 
      }
    } catch (error) {
      console.error("Gagal memuat trailer untuk background modal");
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
        showNotification("Berhasil dihapus dari Watchlist.");
      } else {
        await fetch(`${API_URL}/api/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ movie_id: movieId, title: movie.title || movie.name, poster: movie.poster_path || movie.poster })
        });
        showNotification("Berhasil ditambahkan ke Watchlist!");
      }
      fetchWatchlist();
    } catch (error) {
      showNotification("Terjadi kesalahan pada server.", true);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const endpoint = contentType === "tv" ? `${API_URL}/api/discover?type=tv&language=ko` : `${API_URL}/api/movies`;
      const response = await fetch(endpoint);
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
      let url = `${API_URL}/api/discover?type=${contentType}&`;
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
      const response = await fetch(`${API_URL}/api/search?query=${searchQuery}&type=${contentType}`);
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
      const response = await fetch(`${API_URL}/api/movies/${movieId}/trailer?type=${contentType}`);
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

  const playFullMovie = (movie) => {
    const movieId = movie.id || movie.movie_id;
    const url = contentType === "tv" ? `https://vidsrc.to/embed/tv/${movieId}` : `https://vidsrc.to/embed/movie/${movieId}`;
    setFullMovieUrl(url);
    setShowFullMovie(true);

    setContinueWatching((prev) => {
      const filtered = prev.filter((m) => (m.id || m.movie_id) !== movieId);
      const updated = [movie, ...filtered].slice(0, 6); 
      localStorage.setItem("continueWatching", JSON.stringify(updated));
      return updated;
    });
  };

  const closeFullMovie = () => {
    setShowFullMovie(false);
    setFullMovieUrl("");
  };

  const truncateText = (str, n) => { return str?.length > n ? str.substr(0, n - 1) + "..." : str; };

  const resetHome = () => {
    setShowWatchlist(false); setSearchQuery(""); setSelectedGenre(""); setSelectedYear(""); fetchMovies();
  };

  if (!token) return <Login />;
  const displayedMovies = showWatchlist ? watchlist : movies;

  return (
    <div style={{ backgroundColor: '#0b0c10', color: 'white', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      
      <style>{`
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #0b0c10; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; border: 2px solid #0b0c10; }
        ::-webkit-scrollbar-thumb:hover { background: #E50914; }

        .glass-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; display: flex; align-items: center; padding: 15px 40px; gap: 30px; transition: background-color 0.4s ease, backdrop-filter 0.4s ease; flex-wrap: wrap; }
        .nav-transparent { background: transparent; }
        .nav-solid { background: rgba(11, 12, 16, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .nav-link { cursor: pointer; font-size: 14px; font-weight: 500; color: #a9a9a9; transition: color 0.3s; display: flex; align-items: center; gap: 5px; }
        .nav-link:hover { color: #ffffff; }
        .content-toggle { display: flex; background: rgba(255,255,255,0.05); border-radius: 20px; padding: 4px; gap: 5px; }
        .toggle-btn { padding: 6px 15px; border-radius: 15px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.3s; background: transparent; color: #a9a9a9; }
        .toggle-btn.active { background: #E50914; color: white; }
        .filter-select { background: transparent; color: #a9a9a9; border: none; font-size: 14px; font-weight: 500; cursor: pointer; outline: none; padding-right: 15px; }
        .filter-select option { background: #141519; color: white; }
        .search-input { padding: 8px 15px 8px 35px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 14px; outline: none; width: 200px; }
        
        .movie-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; }
        .movie-card:hover { transform: translateY(-8px) scale(1.03); box-shadow: 0 15px 30px rgba(229, 9, 20, 0.2); border-color: rgba(229, 9, 20, 0.5); z-index: 10; }
        
        .skeleton-card { width: 100%; height: 330px; background: linear-gradient(90deg, #141519 25%, #2a2a2a 50%, #141519 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: 10px; }
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .btn-play-movie { background: white; color: black; padding: 12px 30px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-play-movie:hover { background: #e6e6e6; transform: scale(1.05); }
        .btn-trailer { background: rgba(109, 109, 110, 0.7); color: white; padding: 12px 30px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-trailer:hover { background: rgba(109, 109, 110, 0.9); transform: scale(1.05); }
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; font-weight: 500; z-index: 9999; animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .hero-container { position: relative; height: 85vh; width: 100%; overflow: hidden; display: flex; alignItems: center; padding: 0 60px; }
        .hero-video-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; background-color: #000; }
        .hero-video-wrapper iframe { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100vw; height: 56.25vw; min-height: 100vh; min-width: 177.77vh; pointer-events: none; }
        .hero-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to right, rgba(11, 12, 16, 1) 15%, rgba(11, 12, 16, 0.6) 50%, rgba(11, 12, 16, 0) 100%), linear-gradient(to top, rgba(11, 12, 16, 1) 0%, rgba(11, 12, 16, 0) 25%); z-index: 1; }
        .hero-content { position: relative; z-index: 2; max-width: 600px; }
        .carousel-indicators { position: absolute; bottom: 40px; right: 60px; z-index: 2; display: flex; gap: 8px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.3); cursor: pointer; transition: 0.3s; }
        .dot.active { background: white; transform: scale(1.3); }

        .main-container { padding: 40px 60px; max-width: 1600px; margin: 0 auto; position: relative; z-index: 10; }
        .movies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 25px; }

        /* 🔥 TAMBAHAN MEDIA QUERIES UNTUK TAMPILAN HP (MOBILE RESPONSIVE) 🔥 */
        @media (max-width: 768px) {
          .glass-nav {
            padding: 15px;
            gap: 15px;
            justify-content: center;
          }
          .nav-link { font-size: 13px; }
          .search-input { width: 150px; }
          .hero-container { padding: 0 20px; height: 70vh; }
          .hero-content h1 { font-size: 40px !important; }
          .hero-content p { font-size: 14px !important; }
          .btn-play-movie, .btn-trailer { padding: 10px 15px; font-size: 14px; }
          
          .main-container { padding: 20px 20px !important; }
          .movies-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; }
          .movie-card img { height: 210px !important; }
          .skeleton-card { height: 210px !important; }

          /* Perbaikan pop-up modal di HP */
          .modal-box { max-width: 95vw !important; max-height: 85vh !important; }
          .modal-header-img { height: 250px !important; }
          .modal-body { padding: 0 20px 30px 20px !important; margin-top: -20px !important; }
          .modal-body h2 { font-size: 26px !important; }
          .rekomendasi-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important; }
          .rekomendasi-grid img { height: 150px !important; }
        }
      `}</style>

      {toast.show && <div className="toast" style={{ backgroundColor: toast.isError ? '#E50914' : '#4CAF50', color: 'white' }}>{toast.message}</div>}
      
      {showProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowProfile(false)}>
          <div style={{ backgroundColor: '#141519', padding: '40px', borderRadius: '15px', maxWidth: '350px', width: '100%', border: '1px solid #333', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#E50914', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>👤</div>
            <h2 style={{ margin: '0 0 5px 0' }}>Profil Akun</h2>
            <p style={{ color: '#a9a9a9', marginBottom: '25px', fontSize: '15px' }}>Total Watchlist: <strong>{watchlist.length} Konten</strong></p>
            <button onClick={() => showNotification("⚙️ Fitur Pengaturan akan segera hadir di update selanjutnya!")} style={{ width: '100%', padding: '12px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '10px' }} onMouseOver={(e) => {e.target.style.background = '#444';}} onMouseOut={(e) => {e.target.style.background = '#222';}}>⚙️ Pengaturan</button>
            <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#E50914', border: '1px solid #E50914', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '10px' }} onMouseOver={(e) => {e.target.style.background = '#E50914'; e.target.style.color = 'white';}} onMouseOut={(e) => {e.target.style.background = 'transparent'; e.target.style.color = '#E50914';}}>🚪 Keluar (Logout)</button>
            <button onClick={() => setShowProfile(false)} style={{ width: '100%', padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => e.target.style.background = '#444'} onMouseOut={(e) => e.target.style.background = '#333'}>Tutup</button>
          </div>
        </div>
      )}

      {showTrailer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={closeTrailer}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeTrailer} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
            <iframe width="100%" height="100%" src={trailerUrl} title="Movie Trailer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
          </div>
        </div>
      )}

      {showFullMovie && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={closeFullMovie}>
          <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeFullMovie} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>⬅ Kembali ke NOTFLIX</button>
            <iframe width="100%" height="100%" src={fullMovieUrl} title="Full Movie Player" frameBorder="0" allowFullScreen></iframe>
          </div>
        </div>
      )}

      <nav className={`glass-nav ${isScrolled ? 'nav-solid' : 'nav-transparent'}`}>
        <h1 style={{ color: '#E50914', fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '1px', cursor: 'pointer' }} onClick={resetHome}>NOTFLIX</h1>
        
        <div className="content-toggle">
          <button className={`toggle-btn ${contentType === 'movie' ? 'active' : ''}`} onClick={() => setContentType('movie')}>🎬 Film</button>
          <button className={`toggle-btn ${contentType === 'tv' ? 'active' : ''}`} onClick={() => setContentType('tv')}>🇰🇷 Drakor</button>
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className="nav-link"><select className="filter-select" value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}><option value="">Genre ▾</option><option value="28">Action</option><option value="35">Comedy</option><option value="27">Horror</option><option value="10749">Romance</option><option value="878">Sci-Fi</option><option value="16">Animation</option></select></div>
          <div className="nav-link"><select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}><option value="">Tahun ▾</option><option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option></select></div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#a9a9a9' }}>🔍</span><input type="text" placeholder={`Cari...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" /></form>
          <span className="nav-link" onClick={() => setShowWatchlist(true)} style={{ color: showWatchlist ? '#fff' : '#a9a9a9' }}>Watchlist</span>
          <div className="nav-link" onClick={() => setShowProfile(true)} style={{ fontWeight: 'bold' }}>Akun</div>
        </div>
      </nav>

      {!showWatchlist && !searchQuery && !selectedGenre && !selectedYear && featuredMovie && (
        <div className="hero-container">
          <div className="hero-video-wrapper" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {heroTrailerKey && (
              <iframe src={`https://www.youtube.com/embed/${heroTrailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${heroTrailerKey}`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
            )}
            <div className="hero-overlay"></div>
          </div>

          <div className="hero-content">
            <span style={{ background: '#E50914', padding: '4px 10px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>TOP 10 {contentType === 'tv' ? 'SERIES' : 'MOVIE'} VIRAL #{currentHeroIndex + 1}</span>
            <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '15px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', lineHeight: '1' }}>{featuredMovie.title || featuredMovie.name}</h1>
            <p style={{ fontSize: '16px', color: '#e0e0e0', lineHeight: '1.6', marginBottom: '30px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{truncateText(featuredMovie.overview, 180)}</p>
            
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button className="btn-play-movie" onClick={() => playFullMovie(featuredMovie)}><span style={{ fontSize: '20px' }}>▶</span> Putar {contentType === 'tv' ? 'Eps 1' : 'Film'}</button>
              <button className="btn-trailer" onClick={() => openTrailer(featuredMovie)}>🎬 Trailer</button>
            </div>
          </div>
        </div>
      )}

      {/* Menggunakan kelas 'main-container' agar responsif tanpa diganggu inline style */}
      <main className="main-container" style={{ paddingTop: (!showWatchlist && !searchQuery && !selectedGenre && !selectedYear) ? '40px' : '150px' }}>
        
        {!showWatchlist && !searchQuery && !selectedGenre && !selectedYear && continueWatching.length > 0 && (
          <div style={{ marginBottom: '45px' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: '600', fontSize: '22px', borderLeft: '4px solid #E50914', paddingLeft: '15px', color: '#E50914' }}>🍿 Lanjutkan Menonton</h2>
            <div className="movies-grid">
              {continueWatching.map((movie, index) => (
                <div key={`cw-${index}`} onClick={() => handleSelectMovie(movie)} className="movie-card" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#141519', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                  <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path || movie.poster}`} alt={movie.title || movie.name} style={{ width: '100%', height: '330px', objectFit: 'cover' }} />
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#333' }}><div style={{ width: `${85 - (index * 12)}%`, height: '100%', backgroundColor: '#E50914' }}></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 style={{ marginBottom: '30px', fontWeight: '600', fontSize: '22px', borderLeft: '4px solid #E50914', paddingLeft: '15px' }}>
          {showWatchlist ? '🎬 Daftar Tontonan Saya' : searchQuery ? `🔍 Hasil Pencarian: "${searchQuery}"` : (selectedGenre || selectedYear) ? '🎯 Hasil Filter Kategori' : (contentType === 'tv' ? '🔥 Drakor & Series Trending' : '🔥 Film Trending')}
        </h2>

        {loading ? (
          <div className="movies-grid">
            {[...Array(12)].map((_, i) => (
              <div key={`skeleton-${i}`} className="skeleton-card"></div>
            ))}
          </div>
        ) : (
          <div className="movies-grid">
            {displayedMovies.map((movie) => (
              (movie.poster_path || movie.poster) && (
                <div key={movie.id || movie.movie_id} onClick={() => handleSelectMovie(movie)} className="movie-card" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#141519', borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path || movie.poster}`} alt={movie.title || movie.name} style={{ width: '100%', height: '330px', objectFit: 'cover' }} />
                </div>
              )
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETAIL FILM (SUDAH RESPONSIVE MOBILE) */}
      {selectedMovie && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', overflowY: 'auto' }} onClick={() => { setSelectedMovie(null); setModalTrailerKey(""); }}>
          
          <div className="modal-box" style={{ backgroundColor: '#141519', borderRadius: '15px', maxWidth: '850px', width: '100%', border: '1px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header-img" style={{ width: '100%', height: '400px', backgroundColor: '#000', backgroundImage: `url(https://image.tmdb.org/t/p/original${selectedMovie.backdrop_path || selectedMovie.poster_path})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
               {modalTrailerKey && (
                 <iframe 
                   src={`https://www.youtube.com/embed/${modalTrailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${modalTrailerKey}`} 
                   frameBorder="0" 
                   allow="autoplay; encrypted-media" 
                   style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150%', height: '150%', pointerEvents: 'none', zIndex: 1 }}
                 ></iframe>
               )}
               <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to top, #141519 10%, transparent 100%)', zIndex: 2 }}></div>
               <button onClick={() => { setSelectedMovie(null); setModalTrailerKey(""); }} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(11, 12, 16, 0.7)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: '35px', height: '35px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: '0.2s' }}>✖</button>
            </div>

            <div className="modal-body" style={{ padding: '0px 50px 50px 50px', position: 'relative', zIndex: 3, marginTop: '-40px', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '36px', fontWeight: '900', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  {selectedMovie.title || selectedMovie.name}
                </h2>
                {selectedMovie.vote_average > 0 && (
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold', color: '#4CAF50', display: 'flex', alignItems: 'center', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    ⭐ {selectedMovie.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', color: '#a9a9a9', fontSize: '14px', marginBottom: '20px', fontWeight: '500', flexWrap: 'wrap' }}>
                <span>{selectedMovie.release_date ? selectedMovie.release_date.substring(0, 4) : (selectedMovie.first_air_date ? selectedMovie.first_air_date.substring(0, 4) : 'N/A')}</span>
                {selectedMovie.original_language && (
                  <span style={{ textTransform: 'uppercase', border: '1px solid #555', padding: '0 6px', borderRadius: '4px' }}>
                    {selectedMovie.original_language}
                  </span>
                )}
              </div>

              <p style={{ color: '#e0e0e0', lineHeight: '1.6', marginBottom: '30px', fontSize: '15px' }}>
                {selectedMovie.overview || "Sinopsis tidak tersedia."}
              </p>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn-play-movie" onClick={() => playFullMovie(selectedMovie)} style={{ flexGrow: 1, padding: '12px', fontSize: '16px' }}>
                  ▶ Putar
                </button>
                <button className="btn-trailer" onClick={() => openTrailer(selectedMovie)} style={{ padding: '12px 20px', fontSize: '15px' }}>
                  🎬 Trailer
                </button>
                <button onClick={() => toggleWatchlist(selectedMovie)} style={{ padding: '12px 20px', background: watchlist.find(item => item.movie_id === (selectedMovie.id || selectedMovie.movie_id)) ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.05)', color: watchlist.find(item => item.movie_id === (selectedMovie.id || selectedMovie.movie_id)) ? '#4CAF50' : 'white', border: '1px solid', borderColor: watchlist.find(item => item.movie_id === (selectedMovie.id || selectedMovie.movie_id)) ? '#4CAF50' : 'rgba(255,255,255,0.2)', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                  {watchlist.find(item => item.movie_id === (selectedMovie.id || selectedMovie.movie_id)) ? '✔' : '+'}
                </button>
              </div>

              <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#fff', fontWeight: '600' }}>Rekomendasi Lainnya</h3>
                <div className="rekomendasi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {movies.filter(m => (m.id || m.movie_id) !== (selectedMovie.id || selectedMovie.movie_id)).slice(0, 6).map(rec => (
                    <div key={`rec-${rec.id || rec.movie_id}`} onClick={() => handleSelectMovie(rec)} style={{ cursor: 'pointer', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={`https://image.tmdb.org/t/p/w500${rec.poster_path || rec.poster}`} alt={rec.title || rec.name} style={{ width: '100%', height: '190px', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;