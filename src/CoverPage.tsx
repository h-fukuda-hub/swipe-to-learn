import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function CoverPage() {
  const handleLogin = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Login error:', error.message);
      alert('ログインに失敗しました。詳細: ' + error.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #111 0%, #333 100%)',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '-1px' }}>
          Swipe to Learn
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '3rem', maxWidth: '400px', lineHeight: 1.5 }}>
          クリエイターの直感を言語化する、<br/>
          AI特化型クリエイティブ審査ツール
        </p>

        <button 
          onClick={handleLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '0 auto',
            padding: '16px 32px',
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '30px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <LogIn size={24} />
          Googleアカウントでログイン
        </button>
      </motion.div>
    </div>
  );
}
