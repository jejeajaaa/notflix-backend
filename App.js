import React, { useState, useEffect } from 'react';

const App = () => {
  // State untuk menyimpan data film
  const [movies, setMovies] = useState([]);

  // Mengambil data dari Backend saat halaman pertama kali dimuat
  useEffect(() => {
    fetch('http://localhost:8000/api/movies')
      .then(response => response.json())
      .then(data => setMovies(data))
      .catch(error => console.error("Gagal mengambil data:", error));
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8 font-sans">
      {/* Bagian Header / Navigasi */}
      <h1 className="text-4xl font-black text-red-600 mb-8 tracking-wider">
        NOTFLIX
      </h1>

      {/* Bagian Grid Katalog Film */}
      <h2 className="text-2xl font-semibold mb-4">Trending Now</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {movies.map(movie => (
          <div 
            key={movie.id} 
            className="bg-gray-800 rounded-md overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer hover:ring-2 hover:ring-white"
          >
            <img 
              src={movie.poster} 
              alt={movie.title} 
              className="w-full h-72 object-cover" 
            />
            <div className="p-4">
              <h3 className="font-bold text-lg truncate">{movie.title}</h3>
              <p className="text-sm text-gray-400">{movie.genre}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;