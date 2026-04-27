import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FolderPlus, FolderOpen, Tag, Loader2, Plus, X } from 'lucide-react';
import { supabase } from './supabaseClient';

interface ProjectRegistrationProps {
  onComplete: () => void;
}

export default function ProjectRegistration({ onComplete }: ProjectRegistrationProps) {
  // タブ: 'new'=新規案件 / 'existing'=既存案件に追加
  const [tab, setTab] = useState<'new' | 'existing'>('new');

  // 新規案件用
  const [projectName, setProjectName] = useState('');
  const [category, setCategory] = useState('');

  // 既存案件用
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // 共通
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 既存案件タブに切り替えた時に案件一覧を取得
  useEffect(() => {
    if (tab === 'existing' && existingProjects.length === 0) {
      supabase?.from('projects').select('id, name').order('created_at', { ascending: false })
        .then(({ data }) => setExistingProjects(data || []));
    }
  }, [tab]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const arr = Array.from(e.target.files);
      setFiles(prev => [...prev, ...arr]);
      setPreviews(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeFile = (i: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  // 画像をStorageとDBに保存する共通処理
  const uploadImages = async (projectId: string) => {
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase!.storage.from('creatives').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase!.storage.from('creatives').getPublicUrl(filePath);
      const { error: iError } = await supabase!.from('project_images').insert([{ project_id: projectId, image_url: publicUrl }]);
      if (iError) throw iError;
    }
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !category || files.length === 0) {
      alert('案件名、カテゴリ、および1枚以上の画像が必要です。');
      return;
    }
    setIsUploading(true);
    try {
      const { data: project, error: pError } = await supabase!
        .from('projects')
        .insert([{ name: projectName, category }])
        .select()
        .single();
      if (pError) throw pError;
      await uploadImages(project.id);
      alert('案件の登録が完了しました！');
      setProjectName(''); setCategory(''); setFiles([]); setPreviews([]);
      onComplete();
    } catch (err: any) {
      alert('登録エラー: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || files.length === 0) {
      alert('案件を選択し、1枚以上の画像を追加してください。');
      return;
    }
    setIsUploading(true);
    try {
      await uploadImages(selectedProjectId);
      alert('画像の追加が完了しました！');
      setSelectedProjectId(''); setFiles([]); setPreviews([]);
      onComplete();
    } catch (err: any) {
      alert('追加エラー: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // タブのスタイル
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px',
    backgroundColor: active ? '#000' : '#f0f0f0',
    color: active ? '#fff' : '#666',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  });

  const inputStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none',
    color: '#1c1c1e',
    backgroundColor: '#fff',
  };

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {/* タブ切り替え */}
      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        <button style={{ ...tabStyle(tab === 'new'), borderRadius: '16px 0 0 0' }} onClick={() => setTab('new')}>
          <FolderPlus size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          新規案件を登録
        </button>
        <button style={{ ...tabStyle(tab === 'existing'), borderRadius: '0 16px 0 0' }} onClick={() => setTab('existing')}>
          <FolderOpen size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          既存案件に追加
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* ===== 新規案件フォーム ===== */}
        {tab === 'new' && (
          <form onSubmit={handleSubmitNew} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>案件名</label>
              <input type="text" placeholder="例: 24年夏_コスメ訴求" value={projectName} onChange={e => setProjectName(e.target.value)} disabled={isUploading} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', fontSize: '0.9rem' }}>
                <Tag size={14} /> 商材カテゴリ
              </label>
              <select value={category} onChange={e => setCategory(e.target.value)} disabled={isUploading} style={{ ...inputStyle, backgroundColor: '#fff' }}>
                <option value="">カテゴリを選択</option>
                <option value="美容・スキンケア">美容・スキンケア</option>
                <option value="アパレル・ファッション">アパレル・ファッション</option>
                <option value="金融・投資">金融・投資</option>
                <option value="アプリ・SaaS">アプリ・SaaS</option>
                <option value="食品・飲料">食品・飲料</option>
                <option value="住まい・インテリア">住まい・インテリア</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <ImageUploader files={files} previews={previews} onSelect={handleImageSelect} onRemove={removeFile} fileInputRef={fileInputRef} isUploading={isUploading} />
            <SubmitButton isUploading={isUploading} label="この案件を登録する" />
          </form>
        )}

        {/* ===== 既存案件に追加フォーム ===== */}
        {tab === 'existing' && (
          <form onSubmit={handleSubmitExisting} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>追加先の案件</label>
              <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} disabled={isUploading} style={{ ...inputStyle, backgroundColor: '#fff' }}>
                <option value="">案件を選択してください</option>
                {existingProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {existingProjects.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '6px' }}>案件がまだ登録されていません。先に「新規案件を登録」してください。</p>
              )}
            </div>
            <ImageUploader files={files} previews={previews} onSelect={handleImageSelect} onRemove={removeFile} fileInputRef={fileInputRef} isUploading={isUploading} />
            <SubmitButton isUploading={isUploading} label="この案件に画像を追加する" />
          </form>
        )}
      </div>
    </div>
  );
}

// ===== 共通: 画像アップローダー =====
function ImageUploader({ files: _files, previews, onSelect, onRemove, fileInputRef, isUploading }: any) {
  return (
    <div>
      <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem' }}>
        <UploadCloud size={14} /> クリエイティブ画像
      </label>
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{ border: '2px dashed #007aff', padding: '1.5rem', textAlign: 'center', borderRadius: '10px', cursor: isUploading ? 'not-allowed' : 'pointer', backgroundColor: '#f5faff', color: '#007aff' }}
      >
        <UploadCloud size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
        <p style={{ margin: 0, fontSize: '0.9rem' }}>{isUploading ? 'アップロード中...' : 'クリックして画像を選択（複数可）'}</p>
        <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={onSelect} disabled={isUploading} />
      </div>
      {previews.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '0.8rem' }}>
          {previews.map((src: string, i: number) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={src} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', display: 'block' }} />
              <button onClick={() => onRemove(i)} type="button" style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#ff3b30', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <X size={11} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: '72px', height: '72px', borderRadius: '8px', border: '2px dashed #ccc', backgroundColor: '#f8f8f8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
            <Plus size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

// ===== 共通: 送信ボタン =====
function SubmitButton({ isUploading, label }: { isUploading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={isUploading}
      style={{ padding: '14px', backgroundColor: isUploading ? '#aaa' : '#000', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: isUploading ? 'default' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
    >
      {isUploading && <Loader2 className="animate-spin" size={18} />}
      {isUploading ? '保存中...' : label}
    </button>
  );
}
