import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Settings, LogOut, ChevronLeft, Check, X, Trash2,
  Loader2, AlertCircle, Sparkles, FileText,
  ChevronDown, ChevronUp, Clock, ThumbsUp, ThumbsDown
} from 'lucide-react';
import ProjectRegistration from './ProjectRegistration';

// --- スワイプカードコンポーネント（アスペクト比保持＋Good/Badオーバーレイ） ---
function SwipeCard({ img, onSwipe }: { img: any; onSwipe: (id: string, d: 'Good' | 'Bad') => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const goodOpacity = useTransform(x, [20, 120], [0, 1]);
  const badOpacity  = useTransform(x, [-120, -20], [1, 0]);

  return (
    <motion.div
      style={{
        x, rotate,
        backgroundColor: '#fff',
        borderRadius: '20px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        cursor: 'grab',
        position: 'relative',
        userSelect: 'none',
        // 横スワイプのみ許可、縦スクロールを完全ブロック
        touchAction: 'pan-x',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      whileDrag={{ scale: 1.02 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100)       onSwipe(img.id, 'Good');
        else if (info.offset.x < -100) onSwipe(img.id, 'Bad');
      }}
      exit={{ x: 0, opacity: 0, transition: { duration: 0.2 } }}
    >
      {/* 画像: アスペクト比に合わせてcontain表示 */}
      <div style={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <img
          src={img.image_url}
          alt="クリエイティブ"
          draggable={false}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '65vh',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* GOOD オーバーレイ（右スワイプ） */}
      <motion.div style={{ opacity: goodOpacity, position: 'absolute', top: 20, left: 20, pointerEvents: 'none' }}>
        <div style={{ padding: '8px 20px', border: '4px solid #34c759', borderRadius: '12px', color: '#34c759', fontWeight: 'bold', fontSize: '1.6rem', letterSpacing: '2px', backgroundColor: 'rgba(52,199,89,0.08)', transform: 'rotate(-12deg)' }}>
          GOOD 👍
        </div>
      </motion.div>

      {/* PASS オーバーレイ（左スワイプ） */}
      <motion.div style={{ opacity: badOpacity, position: 'absolute', top: 20, right: 20, pointerEvents: 'none' }}>
        <div style={{ padding: '8px 20px', border: '4px solid #ff3b30', borderRadius: '12px', color: '#ff3b30', fontWeight: 'bold', fontSize: '1.6rem', letterSpacing: '2px', backgroundColor: 'rgba(255,59,48,0.08)', transform: 'rotate(12deg)' }}>
          PASS 👎
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Supabase 初期化 ---
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- シンプルなMarkdownレンダラー ---
function MarkdownReport({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.8, fontSize: '0.95rem', color: '#1c1c1e' }}>
      {lines.map((line, i) => {
        // ### 見出し3
        if (line.startsWith('### ')) {
          return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 'bold', margin: '1.2rem 0 0.4rem', color: '#007aff' }}>{line.slice(4)}</h3>;
        }
        // ## 見出し2
        if (line.startsWith('## ')) {
          return <h2 key={i} style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem', color: '#1c1c1e', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>{line.slice(3)}</h2>;
        }
        // # 見出し1
        if (line.startsWith('# ')) {
          return <h1 key={i} style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem' }}>{line.slice(2)}</h1>;
        }
        // - リスト
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
              <span style={{ color: '#007aff', flexShrink: 0, marginTop: '2px' }}>●</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        // 1. 番号リスト
        const numMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
          return (
            <div key={i} style={{ display: 'flex', gap: '8px', margin: '6px 0', paddingLeft: '8px' }}>
              <span style={{ color: '#007aff', fontWeight: 'bold', flexShrink: 0, minWidth: '20px' }}>{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }
        // 空行
        if (line.trim() === '') {
          return <div key={i} style={{ height: '0.5rem' }} />;
        }
        // 通常テキスト
        return <p key={i} style={{ margin: '4px 0' }}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

// **bold** インライン処理
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} style={{ fontWeight: 'bold', color: '#1c1c1e' }}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'cover' | 'projects' | 'swipe' | 'admin'>('cover');

  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [swipeImages, setSwipeImages] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // AI関連
  const [aiUsage, setAiUsage] = useState({ rpm: 0, rpd: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);

  // 分析履歴
  const [reports, setReports] = useState<any[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) { setView('projects'); fetchAll(); }
        setLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) { setView('projects'); fetchAll(); }
        else setView('cover');
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const checkAiLimits = async () => {
    if (!supabase) return { rpm: 0, rpd: 0 };
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: rpm } = await supabase.from('ai_analysis_logs').select('*', { count: 'exact', head: true }).gt('created_at', oneMinAgo);
    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
    const { count: rpd } = await supabase.from('ai_analysis_logs').select('*', { count: 'exact', head: true }).gt('created_at', todayStart);
    return { rpm: rpm || 0, rpd: rpd || 0 };
  };

  const fetchAll = async () => {
    if (!supabase) return;
    setIsDataLoading(true);
    try {
      const [{ data: projs }, { data: reps }, usage] = await Promise.all([
        supabase.from('projects').select('*, project_images(id)').order('created_at', { ascending: false }),
        supabase.from('analysis_reports').select('*').order('created_at', { ascending: false }),
        checkAiLimits(),
      ]);
      setDbProjects(projs || []);
      setReports(reps || []);
      setAiUsage(usage);
    } catch (err) { console.error(err); }
    finally { setIsDataLoading(false); }
  };

  // --- 案件の削除 ---
  const deleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    // バブリング防止（カードのクリックイベントが発火しないように）
    e.stopPropagation();
    if (!supabase) return;
    if (!window.confirm(`「${projectName}」を削除しますか？\n\n関連する画像・スワイプログ・分析レポートもすべて削除されます。`)) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      // 画面から即削除（楽観的UI）
      setDbProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err: any) {
      alert('削除エラー: ' + err.message);
    }
  };

  const startSwipe = async (project: any) => {
    if (!supabase || !session) return;
    setIsDataLoading(true);
    setSelectedProject(project);
    setView('swipe');
    try {
      const { data: allImages } = await supabase.from('project_images').select('*').eq('project_id', project.id);
      const { data: myLogs } = await supabase.from('swipe_logs').select('image_id').eq('project_id', project.id).eq('user_id', session.user.id);
      const swipedIds = new Set(myLogs?.map(l => l.image_id));
      setSwipeImages(allImages?.filter(img => !swipedIds.has(img.id)) || []);
    } catch (err) { console.error(err); }
    finally { setIsDataLoading(false); }
  };

  const handleSwipe = async (id: string, decision: 'Good' | 'Bad') => {
    if (!supabase || !session || !selectedProject) return;
    setSwipeImages(prev => prev.filter(img => img.id !== id));
    await supabase.from('swipe_logs').insert([{ project_id: selectedProject.id, image_id: id, user_id: session.user.id, decision }]);
  };

  const handleAnalyze = async (project: any) => {
    if (!supabase || !session) return;
    const usage = await checkAiLimits();
    if (usage.rpm >= 2 || usage.rpd >= 50) {
      alert('AIの利用制限に達しました。');
      setAiUsage(usage);
      return;
    }
    setIsAnalyzing(true);
    setLatestAnalysis(null);
    try {
      await supabase.from('ai_analysis_logs').insert([{ user_id: session.user.id }]);
      const { data, error } = await supabase.functions.invoke('analyze-creatives', {
        body: { projectId: project.id, userId: session.user.id }
      });
      if (error) throw error;
      setLatestAnalysis({ ...data, projectName: project.name, createdAt: new Date().toISOString() });
      const newUsage = await checkAiLimits();
      setAiUsage(newUsage);
      // 履歴を再取得
      const { data: reps } = await supabase.from('analysis_reports').select('*').order('created_at', { ascending: false });
      setReports(reps || []);
    } catch (err: any) {
      alert('分析エラー: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogin  = () => supabase?.auth.signInWithOAuth({ provider: 'google' });
  const handleLogout = () => supabase?.auth.signOut();

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111', color: '#fff' }}>接続中...</div>;

  return (
    <div style={{ minHeight: '100vh', fontFamily: '"Segoe UI", sans-serif', backgroundColor: '#f2f2f7', color: '#1c1c1e' }}>

      {/* ===== カバー ===== */}
      {view === 'cover' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #12121f 40%, #0d1117 100%)',
          color: '#fff', textAlign: 'center', padding: '2rem'
        }}>
          {/* 背景の装飾ブロブ */}
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(100,60,255,0.25) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(0,160,255,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(80,30,180,0.1) 0%, transparent 60%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

          {/* バッジ */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', padding: '6px 16px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)', fontSize: '0.8rem', color: '#bbb', backdropFilter: 'blur(10px)' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34c759', display: 'inline-block', boxShadow: '0 0 8px #34c759' }} />
            AI × 広告クリエイティブ 最先端分析ツール
          </motion.div>

          {/* メインタイトル */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0', background: 'linear-gradient(135deg, #fff 30%, #a78bfa 70%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Swipe to Learn
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{ fontSize: '1.1rem', color: '#888', marginTop: '1.2rem', marginBottom: '0.6rem', letterSpacing: '0.02em' }}
          >
            クリエイターの「暗黙知」をスワイプで収集。
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            style={{ fontSize: '1.1rem', color: '#888', marginBottom: '3rem' }}
          >
            AIが<strong style={{ color: '#c4b5fd', fontStyle: 'normal' }}>成功の法則</strong>を言語化する、自律改善型の広告エンジン。
          </motion.p>

          {/* 機能カード3つ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            {[
              { icon: '👆', text: 'スワイプで直感評価' },
              { icon: '🧠', text: 'AIが傾向を言語化' },
              { icon: '📊', text: '成功基準をDB蓄積' },
            ].map(item => (
              <div key={item.text} style={{ padding: '10px 18px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)', color: '#ccc' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>{item.text}
              </div>
            ))}
          </motion.div>

          {/* ログインボタン */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            style={{ position: 'relative', padding: '16px 40px', fontSize: '1.05rem', cursor: 'pointer', borderRadius: '99px', border: 'none', background: 'linear-gradient(135deg, #6d28d9, #2563eb)', color: '#fff', fontWeight: 'bold', boxShadow: '0 8px 32px rgba(109,40,217,0.5)', letterSpacing: '0.02em' }}
          >
            Googleアカウントでログイン →
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#555' }}
          >
            無料ではじめられます。クレジットカード不要。
          </motion.p>
        </div>
      )}

      {/* ===== 案件一覧 ===== */}
      {view === 'projects' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* ユーザー情報バー */}
          <div style={{ background: 'linear-gradient(135deg, #1c1c1e, #3a3a3c)', color: '#fff', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#aaa' }}>ログイン中</p>
              <p style={{ margin: '2px 0 0', fontWeight: 'bold', fontSize: '1rem' }}>
                こんにちは、{session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0]}さん 👋
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => { setView('admin'); fetchAll(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                <Settings size={15} /> 設定
              </button>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '8px', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.85rem' }}>
                <LogOut size={15} /> ログアウト
              </button>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.2rem', color: '#1c1c1e' }}>📋 プロジェクト一覧</h1>
            {isDataLoading && <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dbProjects.map(p => (
                <motion.div
                  key={p.id}
                  onClick={() => startSwipe(p)}
                  whileTap={{ scale: 0.98 }}
                  style={{ padding: '1.2rem 1.5rem', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{p.name}</h3>
                    <p style={{ color: '#8e8e93', margin: '4px 0 0', fontSize: '0.82rem' }}>{p.category}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ backgroundColor: '#007aff', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      全 {p.project_images?.length || 0}枚
                    </div>
                    <button
                      onClick={(e) => deleteProject(e, p.id, p.name)}
                      style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#ff3b30', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="案件を削除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
              {dbProjects.length === 0 && !isDataLoading && <p style={{ color: '#8e8e93', textAlign: 'center', padding: '2rem' }}>案件がまだありません。設定から追加してください。</p>}
            </div>
          </div>
        </div>
      )}

      {/* ===== スワイプ ===== */}
      {view === 'swipe' && (
        // height固定+overflow:hiddenで縦スクロールを完全に封じる
        <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: '#111', color: '#fff' }}>
          {/* ヘッダー */}
          <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button onClick={() => { setView('projects'); fetchAll(); }} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={20} /> 一覧へ
            </button>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1rem', margin: 0 }}>{selectedProject?.name}</h2>
              {swipeImages.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#aaa', margin: '2px 0 0' }}>残り {swipeImages.length} 枚</p>
              )}
            </div>
            <div style={{ width: 60 }} />
          </div>

          {/* カードエリア */}
          <div style={{ width: '100%', maxWidth: '440px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {isDataLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}><Loader2 className="animate-spin" /></div>
            ) : (
              <AnimatePresence mode="wait">
                {swipeImages.length === 0 ? (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>☕</div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>完了しました！</h3>
                    <p style={{ color: '#aaa', marginBottom: '2rem', fontSize: '0.95rem' }}>この案件の未評価画像はありません。</p>
                    <button onClick={() => { setView('projects'); fetchAll(); }} style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 'bold', fontSize: '1rem' }}>
                      一覧に戻る
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key={swipeImages[0].id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
                    <SwipeCard img={swipeImages[0]} onSwipe={handleSwipe} />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* 操作ボタン＆ガイド */}
          {!isDataLoading && swipeImages.length > 0 && (
            <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '440px', paddingBottom: '1.5rem' }}>
              <p style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', marginBottom: '1rem' }}>
                ← 左スワイプ: PASS　　右スワイプ: GOOD →
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem' }}>
                <button
                  onClick={() => handleSwipe(swipeImages[0].id, 'Bad')}
                  style={{ width: 68, height: 68, borderRadius: '50%', border: '2px solid rgba(255,59,48,0.3)', backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={30} />
                </button>
                <button
                  onClick={() => handleSwipe(swipeImages[0].id, 'Good')}
                  style={{ width: 68, height: 68, borderRadius: '50%', border: '2px solid rgba(52,199,89,0.3)', backgroundColor: 'rgba(52,199,89,0.1)', color: '#34c759', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Check size={30} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 管理ダッシュボード ===== */}
      {view === 'admin' && (
        <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
          <button onClick={() => { setView('projects'); fetchAll(); setLatestAnalysis(null); }} style={{ color: '#007aff', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <ChevronLeft size={20} /> 案件一覧へ戻る
          </button>

          {/* 案件登録 */}
          <ProjectRegistration onComplete={() => { setView('projects'); fetchAll(); }} />

          {/* AI分析セクション */}
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#007aff" /> AI分析実行
            </h2>

            {/* 利用状況メーター */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {[{ label: '1分間 (上限2)', val: aiUsage.rpm, max: 2 }, { label: '今日 (上限50)', val: aiUsage.rpd, max: 50 }].map(({ label, val, max }) => (
                <div key={label} style={{ flex: 1, padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#8e8e93', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: val >= max ? '#ff3b30' : '#1c1c1e' }}>{val} / {max}</div>
                  <div style={{ height: '4px', backgroundColor: '#e5e5ea', borderRadius: '4px', marginTop: '8px' }}>
                    <div style={{ height: '100%', width: `${Math.min(val / max * 100, 100)}%`, backgroundColor: val >= max ? '#ff3b30' : '#34c759', borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 案件ごとの分析ボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dbProjects.map(p => {
                const isLocked = aiUsage.rpm >= 2 || aiUsage.rpd >= 50;
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #f0f0f0', borderRadius: '12px' }}>
                    <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                    <button onClick={() => handleAnalyze(p)} disabled={isAnalyzing || isLocked} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: isLocked ? '#e5e5ea' : '#007aff', color: isLocked ? '#8e8e93' : '#fff', fontWeight: 'bold', cursor: (isAnalyzing || isLocked) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isLocked ? '制限中' : 'AI分析'}
                    </button>
                  </div>
                );
              })}
            </div>

            {(aiUsage.rpm >= 2 || aiUsage.rpd >= 50) && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fff2f2', color: '#ff3b30', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                <AlertCircle size={16} /> 無料枠の上限に達しました。時間を置いて再試行してください。
              </div>
            )}

            {/* 最新の分析結果（即時表示） */}
            {latestAnalysis && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f0f8ff', borderRadius: '16px', border: '1px solid #c2e0ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#007aff' }}>
                    <FileText size={18} /> 最新の分析レポート
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#8e8e93' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={13} color="#34c759" /> {latestAnalysis.goodCount}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsDown size={13} color="#ff3b30" /> {latestAnalysis.badCount}</span>
                  </div>
                </div>
                <MarkdownReport text={latestAnalysis.analysis} />
              </motion.div>
            )}
          </div>

          {/* 分析履歴 */}
          {reports.length > 0 && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#8e8e93" /> 分析履歴
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reports.map(rep => (
                  <div key={rep.id} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* 折りたたみヘッダー */}
                    <button onClick={() => setExpandedReportId(expandedReportId === rep.id ? null : rep.id)} style={{ width: '100%', padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{rep.project_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8e8e93', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={11} /> {formatDate(rep.created_at)}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={11} color="#34c759" />{rep.good_count}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsDown size={11} color="#ff3b30" />{rep.bad_count}</span>
                        </div>
                      </div>
                      {expandedReportId === rep.id ? <ChevronUp size={18} color="#8e8e93" /> : <ChevronDown size={18} color="#8e8e93" />}
                    </button>
                    {/* 展開コンテンツ */}
                    <AnimatePresence>
                      {expandedReportId === rep.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
                            <MarkdownReport text={rep.analysis_text} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
