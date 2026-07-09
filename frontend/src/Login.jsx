import React, { useState } from 'react';

// URL Backend Vercel milikmu
const API_URL = "https://domain-utama-kamu.vercel.app";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || data.message || "Terjadi kesalahan pada server");
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.access_token);
        alert("Login berhasil!");
        window.location.reload(); 
      } else {
        alert("Registrasi berhasil! Silakan login.");
        setIsLogin(true); 
      }
      
    } catch (error) {
      console.error(error);
      alert("Gagal terhubung ke server Vercel. Coba periksa koneksi internet.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b0c10] text-white">
      <form onSubmit={handleAuth} className="bg-[#141519] p-8 rounded-lg shadow-xl w-96 border border-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-red-600">{isLogin ? 'Login' : 'Daftar Akun'}</h2>
        
        <input 
          type="text" placeholder="Username" className="w-full p-3 mb-4 bg-black rounded border border-gray-600"
          value={username} onChange={(e) => setUsername(e.target.value)} required
        />
        <input 
          type="password" placeholder="Password" className="w-full p-3 mb-6 bg-black rounded border border-gray-600"
          value={password} onChange={(e) => setPassword(e.target.value)} required
        />
        
        <button className="w-full bg-red-600 hover:bg-red-700 p-3 rounded font-bold transition-all">
          {isLogin ? 'Login' : 'Daftar'}
        </button>

        <p className="mt-4 text-sm text-gray-400 text-center cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Login di sini'}
        </p>
      </form>
    </div>
  );
};

export default Login;