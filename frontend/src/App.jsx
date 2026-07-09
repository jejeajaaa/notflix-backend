import { useState, useEffect } from 'react';
import Login from './Login';

// Ganti dengan domain Vercel utama kamu jika berbeda
const API_URL = "https://notflix-backend-jejeajaa.vercel.app";

function App() {
  const [token, setToken] = useState(null);
  const [movies, setMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchMovies();
    }
  }, []);

  const showNotification = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/movies`);
      const data = await response.json();
      if (Array.isArray(data)) setMovies(data);
      else setMovies([]);
    } catch (error) {
      console.error("Gagal mengambil data film:", error);
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
    try {
      const response = await fetch(`${API_URL}/api/search?query=${searchQuery}`);
      const data = await response.json();
      if (Array.isArray(data)) setMovies(data);
      else setMovies([]);
      setShowWatchlist(false);
    } catch (error) {
      console.error("Gagal mencari film:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) setWatchlist(data);
      else setWatchlist([]);
    } catch (error) {
      console.error("Gagal mengambil watchlist:", error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (movie) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movie_id: movie.id || movie.movie_id,
          title: movie.title,
          poster: movie.poster_path || movie.poster
        }),
      });

      if (response.ok) {
        showNotification(`🎬 "${movie.title}" ditambahkan ke Watchlist!`);
        if (showWatchlist) fetchWatchlist();
      } else {
        const errorData = await response.json();
        showNotification(errorData.detail || "Gagal menambahkan ke watchlist.", true);
      }
    } catch (error) {
      showNotification("Terjadi kesalahan koneksi.", true);
    }
  };

  const removeFromWatchlist = async (movieId, title) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${movieId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showNotification(`❌ "${title}" dihapus dari daftar.`, false);
        fetchWatchlist();
      } else {
        showNotification("Gagal menghapus film.", true);
      }
    } catch (error) {
      showNotification("Terjadi kesalahan koneksi.", true);
    }
  };

  const toggleView = (viewWatchlist) => {
    setShowWatchlist(viewWatchlist);
    if (viewWatchlist) fetchWatchlist();
    else if (!searchQuery) fetchMovies();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) return <Login />;

  const displayedMovies = showWatchlist ? watchlist : movies;

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#141414', minHeight: '100vh', fontFamily: 'sans-serif', position: 'relative' }}>
      <style>{`
        .movie-card { transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease; }
        .movie-card:hover { transform: scale(1.04); box-shadow: 0 10px 20px rgba(229, 9, 20, 0.3); }
        @keyframes fadeInOut { 0% { opacity: 0; transform: translateY(20px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(20px); } }
        .spinner { border: 4px solid rgba(255, 255, 255, 0.1); width: 40px; height: 40px; border-radius: 50%; border-left-color: #E50914; animation: spin 1s linear infinite; margin: 40px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      {toast.show && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', backgroundColor: toast.isError ? '#ff4d4d' : '#2ecc71', color: 'white', padding: '15px 25px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', zIndex: 1000, animation: 'fadeInOut 3s forwards', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {toast.message}
        </div>
      )}

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ color: '#E50914', margin: 0, letterSpacing: '1px' }}>🎬 NOTFLIX</h1>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexGrow: 1, maxWidth: '400px' }}>
          <input type="text" placeholder="Cari film favoritmu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '5px', border: 'none', backgroundColor: '#333', color: 'white', fontSize: '14px' }} />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#E50914', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>Cari</button>
        </form>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => toggleView(false)} style={{ padding: '10px 20px', backgroundColor: showWatchlist ? 'transparent' : '#fff', color: showWatchlist ? '#fff' : '#000', border: '1px solid #fff', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Beranda</button>
          <button onClick={() => toggleView(true)} style={{ padding: '10px 20px', backgroundColor: showWatchlist ? '#fff' : 'transparent', color: showWatchlist ? '#000' : '#fff', border: '1px solid #fff', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>My Watchlist</button>
          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}>Logout</button>
        </div>
      </nav>

      <main>
        <h2 style={{ marginBottom: '30px', fontWeight: 'normal' }}>
          {showWatchlist ? '🚀 Daftar Tontonan Saya' : searchQuery ? `🔍 Hasil Pencarian: "${searchQuery}"` : '🔥 Film Populer Saat Ini'}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}><div className="spinner"></div><p style={{ color: '#aaa', fontSize: '14px' }}>Memuat data dari server...</p></div>
        ) : (
          <>
            {showWatchlist && watchlist.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', marginTop: '40px' }}>Belum ada film di daftar tontonanmu. Jelajahi Beranda!</p>}
            {!showWatchlist && movies.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', marginTop: '40px' }}>Film tidak ditemukan. Coba kata kunci lain.</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px' }}>
              {displayedMovies.map((movie) => (
                (movie.poster_path || movie.poster) && (
                  <div key={movie.id || movie.movie_id} className="movie-card" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#181818', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                    <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path || movie.poster}`} alt={movie.title} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
                    <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '15px', margin: '0 0 15px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>{movie.title}</h3>
                      {showWatchlist ? (
                        <button onClick={() => removeFromWatchlist(movie.movie_id, movie.title)} style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>❌ Hapus List</button>
                      ) : (
                        <button onClick={() => addToWatchlist(movie)} style={{ width: '100%', padding: '10px', backgroundColor: '#E50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>+ Watchlist</button>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;