import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  const [savedMovies, setSavedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mengambil data dari SQLite Database saat halaman dimuat
  useEffect(() => {
    fetch('http://localhost:8000/api/watchlist')
      .then(response => response.json())
      .then(data => {
        setSavedMovies(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching watchlist:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-[#0b0c10] min-h-screen text-white font-sans overflow-x-hidden p-8">
      
      {/* Header & Tombol Back */}
      <div className="flex items-center mb-10 mt-4">
        <Link to="/" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors mr-6">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-4xl font-black text-red-600 tracking-widest">DAFTAR TONTON SAYA</h1>
      </div>

      {loading ? (
        <div className="text-xl text-gray-400">Memuat koleksi filmmu...</div>
      ) : savedMovies.length > 0 ? (
        <div className="flex flex-wrap gap-4 md:gap-6">
          {savedMovies.map(movie => (
            <Link 
              to={`/movie/${movie.movie_id}`}
              key={movie.id} 
              className="w-36 md:w-44 bg-[#141519] rounded-md overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer hover:ring-2 hover:ring-red-600 block"
            >
              <div className="relative aspect-[2/3] bg-gray-800">
                <img 
                  src={movie.poster} 
                  alt={movie.title} 
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" 
                />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm md:text-base truncate">{movie.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-20">
          <svg className="w-24 h-24 mx-auto mb-6 opacity-20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
          </svg>
          <p className="text-2xl font-semibold mb-2">Watchlist-mu Masih Kosong</p>
          <p className="text-lg mb-6">Belum ada film yang kamu simpan untuk ditonton nanti.</p>
          <Link to="/" className="text-red-500 hover:text-red-400 font-bold underline">
            Cari Film Sekarang
          </Link>
        </div>
      )}
    </div>
  );
};

export default Watchlist;