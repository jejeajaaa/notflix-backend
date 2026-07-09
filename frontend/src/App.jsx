import { useState, useEffect } from 'react';
import Login from './Login';

// Pastikan domain Vercel ini sudah benar sesuai milikmu!
const API_URL = "https://notflix-backend.vercel.app";

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
    <div style={{ color: 'white', backgroundColor: '#0b0c10', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* CSS Terpadu untuk UI/UX yang lebih Polish */}
      <style>{`
        .movie-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .movie-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 15px 30px rgba(229, 9, 20, 0.2);
          border-color: rgba(229, 9, 20, 0.5);
          z-index: 10;
        }
        .glass-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(11, 12, 16, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .btn-primary {
          background: linear-gradient(135deg, #E50914, #B20710);
          box-shadow: 0 4px 15px rgba(229, 9, 20, 0.3);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(229, 9, 20, 0.5);
        }
        .pulse-loader {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #E50914;
          animation: pulse 1.5s infinite ease-in-out;
          margin: 60px auto;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(30px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(30px); }
        }
      `}</style>

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toast.isError ? 'rgba(255, 77, 77, 0.95)' : 'rgba(46, 204, 113, 0.95)',
          color: 'white', padding: '16px 32px', borderRadius: '50px',
          fontWeight: '600', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 1000, animation: 'slideUpFade 3s forwards', backdropFilter: 'blur(5px)'
        }}>
          {toast.message}
        </div>
      )}

      {/* Sticky Glassmorphism Navbar */}
      <nav className="glass-nav" style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ color: '#E50914', margin: 0, letterSpacing: '2px', fontWeight: '900', fontSize: '28px', textShadow: '0 2px 10px rgba(229,9,20,0.3)' }}>
          NOTFLIX
        </h1>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '500px' }}>
          <input 
            type="text" placeholder="Ketik judul film..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '14px 20px', borderRadius: '30px', border: '1px solid #333', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '15px', outline: 'none', transition: 'border 0.3s' }}
            onFocus={(e) => e.target.style.borderColor = '#E50914'}
            onBlur={(e) => e.target.style.borderColor = '#333'}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 25px', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>
            Cari
          </button>
        </form>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => toggleView(false)} style={{ padding: '10px 24px', backgroundColor: showWatchlist ? 'transparent' : 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid', borderColor: showWatchlist ? 'transparent' : 'rgba(255,255,255,0.2)', borderRadius: '30px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s' }}>
            Beranda
          </button>
          <button onClick={() => toggleView(true)} style={{ padding: '10px 24px', backgroundColor: showWatchlist ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff', border: '1px solid', borderColor: showWatchlist ? 'rgba(255,255,255,0.2)' : 'transparent', borderRadius: '30px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s' }}>
            Watchlist
          </button>
          <button onClick={handleLogout} style={{ padding: '10px 24px', backgroundColor: 'rgba(255,0,0,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#ff4d4d'; e.target.style.color = 'white'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'rgba(255,0,0,0.1)'; e.target.style.color = '#ff4d4d'; }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '40px', fontWeight: '300', fontSize: '24px', borderLeft: '4px solid #E50914', paddingLeft: '15px' }}>
          {showWatchlist ? '🎬 Daftar Tontonan Saya' : searchQuery ? `🔍 Hasil Pencarian: "${searchQuery}"` : '🔥 Sedang Trending Hari Ini'}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <div className="pulse-loader"></div>
            <p style={{ color: '#888', letterSpacing: '1px' }}>Sedang menyiapkan film untukmu...</p>
          </div>
        ) : (
          <>
            {showWatchlist && watchlist.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '100px', padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                <h3 style={{ color: '#555', marginBottom: '10px' }}>Watchlist Masih Kosong</h3>
                <p style={{ color: '#777' }}>Jelajahi beranda dan temukan film favoritmu!</p>
              </div>
            )}
            
            {!showWatchlist && movies.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <p style={{ color: '#777', fontSize: '18px' }}>Film tidak ditemukan. Coba gunakan kata kunci lain.</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '35px' }}>
              {displayedMovies.map((movie) => (
                (movie.poster_path || movie.poster) && (
                  <div key={movie.id || movie.movie_id} className="movie-card" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#141519', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                    <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path || movie.poster}`} alt={movie.title} style={{ width: '100%', height: '330px', objectFit: 'cover' }} />
                    <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(to top, #141519 80%, transparent)' }}>
                      <h3 style={{ fontSize: '16px', margin: '0 0 20px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600' }}>
                        {movie.title}
                      </h3>
                      
                      {showWatchlist ? (
                        <button onClick={() => removeFromWatchlist(movie.movie_id, movie.title)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { e.target.style.backgroundColor = '#ff4d4d'; e.target.style.color = 'white'; }}
                          onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#ff4d4d'; }}
                        >
                          Hapus dari List
                        </button>
                      ) : (
                        <button onClick={() => addToWatchlist(movie)} className="btn-primary" style={{ width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                          + Watchlist
                        </button>
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