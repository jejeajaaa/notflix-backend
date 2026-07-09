import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const Detail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk mengontrol buka-tutup modal video player
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Mengambil data film spesifik dari Backend saat halaman dimuat
  useEffect(() => {
    fetch(`http://localhost:8000/api/movies/${id}`)
      .then(response => {
        if (!response.ok) throw new Error("Film tidak ditemukan");
        return response.json();
      })
      .then(data => {
        setMovie(data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }, [id]);

  // Fungsi untuk mengirim data film ke database Watchlist (Daftar Tonton)
  const handleAddToWatchlist = () => {
    fetch('http://localhost:8000/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movie_id: movie.id,
        title: movie.title,
        poster: movie.poster
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.detail) {
        alert(data.detail); // Muncul jika film sudah ada di DB
      } else {
        alert(data.message); // Muncul jika berhasil disimpan ke DB
      }
    })
    .catch(err => {
      console.error("Gagal menyimpan ke watchlist:", err);
      alert("Gagal terhubung ke server database.");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex justify-center items-center text-white text-2xl font-sans">
        Memuat data...
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex flex-col justify-center items-center text-white p-8 text-center font-sans">
        <h1 className="text-4xl font-bold mb-4">Yah, Film Tidak Ditemukan 😢</h1>
        <Link to="/" className="text-red-500 hover:text-red-400 underline">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0c10] min-h-screen text-white font-sans overflow-x-hidden relative">
      
      {/* Tombol Back ke Beranda */}
      <Link to="/" className="absolute top-6 left-6 z-40 bg-black/60 hover:bg-black/80 p-3 rounded-full backdrop-blur-sm transition-colors text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>

      {/* Bagian Atas: Gambar Latar Belakang (Backdrop) */}
      <div 
        className="relative w-full h-[60vh] md:h-[70vh] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${movie.backdrop})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/60 to-transparent"></div>
      </div>

      {/* Bagian Bawah: Informasi Detail Film */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10 -mt-32 md:-mt-48 flex flex-col md:flex-row gap-8 pb-20">
        
        {/* Poster Mini Sebelah Kiri */}
        <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0 shadow-2xl rounded-lg overflow-hidden border-2 border-gray-800">
          <img 
            src={movie.poster} 
            alt={movie.title} 
            className="w-full h-auto object-cover"
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop"; 
            }}
          />
        </div>

        {/* Deskripsi & Tombol Sebelah Kanan */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left pt-4">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 uppercase tracking-wide">
            {movie.title}
          </h1>
          
          <div className="flex items-center gap-4 text-gray-300 font-semibold mb-6">
            <span className="bg-gray-800 px-3 py-1 rounded-md text-sm">{movie.genre}</span>
            <span className="flex items-center text-yellow-400">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {movie.rating} / 10
            </span>
          </div>

          <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mb-8">
            {movie.description}
          </p>

          {/* Grup Tombol Interaksi */}
          <div className="flex flex-wrap gap-4 w-full justify-center md:justify-start">
            {/* Tombol Mulai Menonton */}
            <button 
              onClick={() => setIsVideoOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-md flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-red-600/30 active:scale-95"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Mulai Menonton
            </button>

            {/* Tombol Simpan ke Database Watchlist */}
            <button 
              onClick={handleAddToWatchlist}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-md transition-all active:scale-95"
            >
              + Daftar Tonton
            </button>
          </div>
        </div>
      </div>

      {/* MODAL POP-UP VIDEO PLAYER (Muncul jika isVideoOpen bernilai true) */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
            
            {/* Tombol Silang (X) untuk Tutup Player */}
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-50 bg-black/70 hover:bg-red-600 p-2 rounded-full text-white transition-colors shadow-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Konten Video Embed Youtube */}
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
              title="Video Player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>

          </div>
        </div>
      )}

    </div>
  );
};

export default Detail;