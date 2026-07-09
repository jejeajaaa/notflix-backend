import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const heroData = {
    title: "HOUSE OF THE DRAGON",
    rating: "8.3",
    year: "2022",
    duration: "3 Seasons • 20 Episodes",
    status: "ONGOING",
    description: "The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires crumble from such heights. In the case of the Targaryens, their slow fall begins when King Viserys breaks with a century of tradition...",
    backdrop: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?q=80&w=1920&auto=format&fit=crop"
  };

  useEffect(() => {
    if (searchTerm === '') {
      fetch('http://localhost:8000/api/movies')
        .then(response => response.json())
        .then(data => {
          // Memastikan data yang diterima adalah array sebelum disimpan
          setMovies(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          console.error(error);
          setMovies([]); // Set jadi array kosong jika error
        });
    } else {
      fetch(`http://localhost:8000/api/search?query=${searchTerm}`)
        .then(response => response.json())
        .then(data => {
          setMovies(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          console.error(error);
          setMovies([]);
        });
    }
  }, [searchTerm]);

  return (
    <div className="bg-[#0b0c10] min-h-screen text-white font-sans overflow-x-hidden">
      
      <nav className="absolute top-0 w-full z-50 flex flex-col md:flex-row justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-3xl font-black text-red-600 tracking-widest cursor-pointer mb-4 md:mb-0">
          NOTFLIX
        </h1>
        
        <div className="w-full md:w-auto flex gap-4 mt-4 md:mt-0 justify-center">
          <input
            type="text"
            placeholder="Cari ratusan ribu film..."
            className="w-full md:w-64 p-2 rounded-full bg-black/50 text-white border border-gray-600 focus:outline-none focus:border-red-600 transition-colors backdrop-blur-sm px-4 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Link 
            to="/watchlist" 
            className="bg-gray-800 hover:bg-gray-700 p-2 px-4 rounded-full flex items-center justify-center transition-colors text-sm font-bold border border-gray-600 whitespace-nowrap"
          >
            Daftar Tonton
          </Link>
        </div>
      </nav>

      <div 
        className="relative w-full h-[80vh] md:h-[90vh] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroData.backdrop})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent"></div>

        <div className="absolute bottom-[15%] left-[5%] md:left-[8%] w-[90%] md:w-[50%] z-10 flex flex-col items-start gap-4">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-sm">TV SERIES</span>
          <h2 className="text-4xl md:text-6xl font-serif text-yellow-500 font-bold leading-tight uppercase">
            {heroData.title}
          </h2>
          
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-300">
            <span className="flex items-center text-yellow-400">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {heroData.rating}
            </span>
            <span>{heroData.year}</span>
            <span>{heroData.duration}</span>
            <span className="border border-gray-500 px-1 rounded-sm text-xs">{heroData.status}</span>
          </div>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3">
            {heroData.description}
          </p>

          <button className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded flex items-center gap-2 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            Tonton
          </button>
        </div>
      </div>

      <div className="p-8 md:px-12 -mt-10 relative z-20">
        <h2 className="text-2xl font-semibold mb-6">
          {searchTerm === '' ? "Trending Saat Ini" : `Hasil Pencarian: ${searchTerm}`}
        </h2>
        
        {/* Penjaga (Safety Check): Menambahkan pengecekan apakah movies ada dan array */}
        {movies && movies.length > 0 ? (
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start">
            {movies.map(movie => (
              <Link 
                to={`/movie/${movie.id}`}
                key={movie.id} 
                className="w-36 md:w-44 bg-[#141519] rounded-md overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer hover:ring-2 hover:ring-red-600 group flex-shrink-0 block"
              >
                <div className="relative aspect-[2/3] bg-gray-800">
                  <img 
                    src={movie.poster} 
                    alt={movie.title} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop";
                    }}
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-bold text-sm md:text-base truncate">{movie.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{movie.genre}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-16 pb-20">
            <p className="text-xl">Tidak ada film ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;