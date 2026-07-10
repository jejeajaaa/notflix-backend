import { useState, useEffect } from 'react';
import Login from './Login';

// UBAH KE LOCALHOST DULU UNTUK NGETES!
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
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");

  // STATE BARU: Untuk Filter Navigasi
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchMovies();
    }
  }, []);

  // FUNGSI BARU: Fetch Film Berdasarkan Filter
  useEffect(() => {
    if (selectedGenre || selectedYear) {
      fetchFilteredMovies();
    } else {
      // Jika filter kosong, kembali ke daftar populer
      if (token && !searchQuery && !showWatchlist) fetchMovies();
    }
  }, [selectedGenre, selectedYear]);

  const showNotification = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/movies`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setMovies(data);
        if (!selectedGenre && !selectedYear && !searchQuery) setFeaturedMovie(data[0]); 
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
    setLoading(true);
    setShowWatchlist(false);
    setSearchQuery("");
    try {
      let url = `${API_URL}/api/discover?`;
      if (selectedGenre) url += `genre=${selectedGenre}&`;
      if (selectedYear) url += `year=${selectedYear}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setMovies(Array.isArray(data) ? data : []);
    } catch (error) {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchMovies();
      return;
    }
    setLoading(true);
    setSelectedGenre("");
    setSelectedYear("");
    try {
      const response = await fetch(`${API_URL}/api/search?query=${searchQuery}`);
      const data = await response.json();
      setMovies(Array.isArray(data) ? data : []);
      setShowWatchlist(false);
    } catch (error) {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

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
        showNotification("Maaf, video trailer tidak tersedia untuk film ini.", true);
      }
    } catch (error) {
      showNotification("Gagal memuat trailer film.", true);
    } finally {
      setLoading(false);
    }
  };

  const closeTrailer = () => {
    setShowTrailer(false);
    setTrailerUrl("");
  };

  const truncateText = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  const resetHome = () => {
    setShowWatchlist(false);
    setSearchQuery("");
    setSelectedGenre("");
    setSelectedYear("");
    fetchMovies();
  };

  if (!token) return <Login />;

  const displayedMovies = showWatchlist ? watchlist : movies;

  return (
    <div style={{ backgroundColor: '#0b0c10', color: 'white', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
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
      `}</style>

      {/* POP-UP TRAILER (YOUTUBE EMBED) */}
      {showTrailer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }} onClick={closeTrailer}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeTrailer} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
            <iframe width="100%" height="100%" src={trailerUrl} title="Movie Trailer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
          </div>
        </div>
      )}

      {/* NAVBAR PRO DINAMIS */}
      <nav className="glass-nav">
        <h1 style={{ color: '#E50914', fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '1px', cursor: 'pointer' }} onClick={resetHome}>NOTFLIX</h1>
        <div style={{ display: 'flex', gap: '25px', flexGrow: 1, marginLeft: '20px' }}>
          <span className="nav-link" onClick={resetHome} style={{ color: (!showWatchlist && !searchQuery && !selectedGenre && !selectedYear) ? '#fff' : '#a9a9a9' }}>Beranda</span>
          
          <div className="nav-link">
            <select className="filter-select" value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
              <option value="">Genre ▾</option>
              <option value="28">Action</option>
              <option value="35">Comedy</option>
              <option value="27">Horror</option>
              <option value="10749">Romance</option>
              <option value="878">Sci-Fi</option>
              <option value="16">Animation</option>
            </select>
          </div>

          <div className="nav-link">
            <select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="">Tahun ▾</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#a9a9a9' }}>🔍</span>
            <input type="text" placeholder="Cari judul..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
          </form>
          <span className="nav-link" onClick={() => setShowWatchlist(true)} style={{ color: showWatchlist ? '#fff' : '#a9a9a9' }}>Watchlist</span>
          <div className="nav-link" onClick={handleLogout} style={{ fontWeight: 'bold' }}>Akun ▾</div>
        </div>
      </nav>

      {/* HERO SECTION DINAMIS */}
      {!showWatchlist && !searchQuery && !selectedGenre && !selectedYear && featuredMovie && (
        <div style={{ height: '80vh', background: `linear-gradient(to right, rgba(11, 12, 16, 1) 10%, rgba(11, 12, 16, 0.6) 50%, rgba(11, 12, 16, 0) 100%), linear-gradient(to top, rgba(11, 12, 16, 1) 0%, rgba(11, 12, 16, 0) 20%), url(https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path})`, backgroundSize: 'cover', backgroundPosition: 'center top', display: 'flex', alignItems: 'center', padding: '0 60px' }}>
          <div style={{ maxWidth: '600px', animation: 'fadeIn 1s ease-in' }}>
            <span style={{ background: '#E50914', padding: '4px 10px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>TERPOPULER HARI INI</span>
            <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '15px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', lineHeight: '1.1' }}>{featuredMovie.title}</h1>
            <p style={{ fontSize: '16px', color: '#e0e0e0', lineHeight: '1.6', marginBottom: '30px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{truncateText(featuredMovie.overview, 180)}</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn-play" onClick={() => openTrailer(featuredMovie)}>▶ Putar Trailer</button>
              <button onClick={() => setSelectedMovie(featuredMovie)} style={{ background: 'rgba(109, 109, 110, 0.7)', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>ℹ Selengkapnya</button>
            </div>
          </div>
        </div>
      )}

      {/* KONTEN GRID */}
      <main style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto', marginTop: (!showWatchlist && !searchQuery && !selectedGenre && !selectedYear) ? '-80px' : '0', position: 'relative', zIndex: 10 }}>
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

      {/* MODAL DETAIL */}
      {selectedMovie && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setSelectedMovie(null)}>
          <div style={{ backgroundColor: '#141519', padding: '30px', borderRadius: '15px', maxWidth: '650px', width: '100%', border: '1px solid #333' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 10px 0' }}>{selectedMovie.title}</h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>{selectedMovie.overview || "Sinopsis tidak tersedia."}</p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button className="btn-play" onClick={() => openTrailer(selectedMovie)}>▶ Putar Trailer</button>
              <button onClick={() => setSelectedMovie(null)} style={{ padding: '10px 20px', background: 'transparent', color: 'white', border: '1px solid #555', borderRadius: '5px', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;