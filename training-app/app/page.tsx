'use client'

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TrainingRecord {
  id?: number;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  memo: string;
}

interface Goal {
  id: string | number;
  exercise: string;
  value: number;
  unit: string;
}

interface ProgressImage {
  id?: number;
  date: string;
  image_url: string;
  note?: string;
}

interface WorkoutSetItem {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
}

interface WorkoutSetTemplate {
  id: string;
  name: string;
  items: WorkoutSetItem[];
}

export default function Home() {
  const [tab, setTab] = useState<string>('write');
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [images, setImages] = useState<ProgressImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [newExercise, setNewExercise] = useState('');
  const [imageForm, setImageForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState<TrainingRecord>({
    date: new Date().toISOString().slice(0, 10),
    exercise: '',
    weight: 0,
    reps: 1,
    sets: 3,
    memo: '',
  });

  const [entryMode, setEntryMode] = useState<'single' | 'set'>('single');
  const [setTemplates, setSetTemplates] = useState<WorkoutSetTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [setDate, setSetDate] = useState(new Date().toISOString().slice(0, 10));
  const [setMemo, setSetMemo] = useState('');
  const [setItemsDraft, setSetItemsDraft] = useState<WorkoutSetItem[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateItems, setNewTemplateItems] = useState<WorkoutSetItem[]>([
    { exercise: '', weight: 0, reps: 1, sets: 3 },
  ]);
  const [setTabMode, setSetTabMode] = useState<'apply' | 'create'>('apply');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem('workout-set-templates');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as WorkoutSetTemplate[];
      if (Array.isArray(parsed)) {
        setSetTemplates(parsed);
      }
    } catch {
      // ignore invalid local data
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('workout-set-templates', JSON.stringify(setTemplates));
  }, [setTemplates]);

  const showMessage = (type: 'error' | 'success' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: recs, error } = await supabase
        .from('records')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) {
        console.error('Supabase Error:', {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        throw error;
      }

      const { data: imageRows, error: imageError } = await supabase
        .from('progress_images')
        .select('*')
        .order('date', { ascending: false });

      if (!imageError) {
        setImages(imageRows || []);
      }
      
      setRecords(recs || []);
    } catch (e: any) {
      const errorMsg = e?.message || '不明なエラーが発生しました。';
      console.error('データ読込エラー:', errorMsg);
      
      let displayMsg = 'データの読込に失敗しました。';
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        displayMsg = '❌ 認証エラー。.env.local に Supabase キーが正しく設定されているか確認してください。';
      } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        displayMsg = '❌ テーブル「records」が見つかりません。Supabase で作成してください。';
      } else if (errorMsg.includes('network')) {
        displayMsg = '❌ ネットワークエラー。インターネット接続を確認してください。';
      }
      
      showMessage('error', displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const resolvedExercise = newExercise.trim() || form.exercise.trim();
    if (!resolvedExercise) {
      showMessage('error', '種目を入力してください。');
      return;
    }
    const payload: Omit<TrainingRecord, 'id'> = {
      date: form.date,
      exercise: resolvedExercise,
      weight: Math.max(0, Number(form.weight)),
      reps: Math.max(1, Number(form.reps)),
      sets: Math.max(1, Number(form.sets)),
      memo: form.memo.trim(),
    };
    try {
      setLoading(true);
      const { data, error } = await supabase.from('records').insert([payload]).select();
      
      if (error) {
        console.error('Insert Error:', error);
        throw error;
      }
      
      setRecords((s) => (data ? [...data, ...s] : s));
      setForm({ date: new Date().toISOString().slice(0, 10), exercise: '', weight: 0, reps: 1, sets: 3, memo: '' });
      setNewExercise('');
      showMessage('success', '✅ 記録を保存しました！');
      setTab('details');
    } catch (err: any) {
      console.error('Save failed:', err?.message);
      showMessage('error', '記録の保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const uploadProgressImage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!imageFile) {
      showMessage('error', '画像ファイルを選択してください。');
      return;
    }

    try {
      setUploadingImage(true);
      const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${imageForm.date}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('training-images')
        .upload(path, imageFile, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('training-images')
        .getPublicUrl(path);

      const { data: savedRow, error: saveError } = await supabase
        .from('progress_images')
        .insert([
          {
            date: imageForm.date,
            image_url: publicUrlData.publicUrl,
            note: imageForm.note.trim(),
          },
        ])
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      setImages((prev) => [savedRow, ...prev]);
      setImageFile(null);
      setImageForm({ date: new Date().toISOString().slice(0, 10), note: '' });
      showMessage('success', '📷 画像を登録しました。');
    } catch (err: any) {
      const errorMsg = err?.message || '';
      if (errorMsg.toLowerCase().includes('bucket')) {
        showMessage('error', '画像バケット `training-images` が見つかりません。Supabase Storage で作成してください。');
      } else if (errorMsg.toLowerCase().includes('progress_images')) {
        showMessage('error', 'テーブル `progress_images` が見つかりません。Supabase に作成してください。');
      } else {
        showMessage('error', '画像登録に失敗しました。');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('records').delete().match({ id });
      
      if (error) {
        console.error('Delete Error:', error);
        throw error;
      }
      
      setRecords((s) => s.filter((r) => r.id !== id));
      setDeleteConfirm(null);
      showMessage('success', '記録を削除しました。');
    } catch (err: any) {
      console.error('Delete failed:', err?.message);
      showMessage('error', '削除に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const selected = setTemplates.find((t) => t.id === templateId);
    if (!selected) {
      setSetItemsDraft([]);
      return;
    }
    setSetItemsDraft(
      selected.items.map((item) => ({
        exercise: item.exercise,
        weight: item.weight,
        reps: item.reps,
        sets: item.sets,
      }))
    );
  };

  const addSetTemplateRow = () => {
    setNewTemplateItems((prev) => [...prev, { exercise: '', weight: 0, reps: 1, sets: 3 }]);
  };

  const removeSetTemplateRow = (index: number) => {
    setNewTemplateItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const saveSetTemplate = () => {
    const cleanedItems = newTemplateItems
      .map((item) => ({
        exercise: item.exercise.trim(),
        weight: Math.max(0, Number(item.weight)),
        reps: Math.max(1, Number(item.reps)),
        sets: Math.max(1, Number(item.sets)),
      }))
      .filter((item) => item.exercise.length > 0);

    if (!newTemplateName.trim()) {
      showMessage('error', 'セット名を入力してください。');
      return;
    }
    if (cleanedItems.length === 0) {
      showMessage('error', 'セットに1種目以上追加してください。');
      return;
    }

    const newTemplate: WorkoutSetTemplate = {
      id: `${Date.now()}`,
      name: newTemplateName.trim(),
      items: cleanedItems,
    };

    setSetTemplates((prev) => [newTemplate, ...prev]);
    setNewTemplateName('');
    setNewTemplateItems([{ exercise: '', weight: 0, reps: 1, sets: 3 }]);
    showMessage('success', 'セットを保存しました。');
  };

  const addRecordSet = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedTemplateId) {
      showMessage('error', 'セットを選択してください。');
      return;
    }
    if (setItemsDraft.length === 0) {
      showMessage('error', 'セット内容が空です。');
      return;
    }

    const payloads: Omit<TrainingRecord, 'id'>[] = setItemsDraft.map((item) => ({
      date: setDate,
      exercise: item.exercise.trim(),
      weight: Math.max(0, Number(item.weight)),
      reps: Math.max(1, Number(item.reps)),
      sets: Math.max(1, Number(item.sets)),
      memo: setMemo.trim(),
    }));

    if (payloads.some((p) => !p.exercise)) {
      showMessage('error', 'セット内の各種目名を入力してください。');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.from('records').insert(payloads).select();
      if (error) {
        throw error;
      }
      setRecords((prev) => (data ? [...data, ...prev] : prev));
      setSetMemo('');
      showMessage('success', `✅ ${payloads.length}種目を一括記録しました！`);
      setTab('details');
    } catch (err: any) {
      console.error('Set insert failed:', err?.message);
      showMessage('error', 'セット記録の保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const uniqueExercises = Array.from(new Set(records.map((r) => r.exercise).filter(Boolean))).sort();
  const addGoal = (g: Goal) => setGoals((s) => [...s, { ...g, id: Date.now() }]);
  const markedDates = Array.from(new Set(records.map((r) => r.date))).filter(Boolean).sort().reverse();

  return (
    <div>
      <div className="card">
        {message && (
          <div className={`alert alert-${message.type}`}>
            <span>{message.text}</span>
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'write' ? 'active' : ''}`}
            onClick={() => setTab('write')}
          >
            📝 記録追加
          </button>
          <button
            className={`tab-btn ${tab === 'goals' ? 'active' : ''}`}
            onClick={() => setTab('goals')}
          >
            🎯 目標管理
          </button>
          <button
            className={`tab-btn ${tab === 'calendar' ? 'active' : ''}`}
            onClick={() => setTab('calendar')}
          >
            📅 カレンダー
          </button>
          <button
            className={`tab-btn ${tab === 'details' ? 'active' : ''}`}
            onClick={() => setTab('details')}
          >
            📊 統計・記録詳細
          </button>
        </div>

        {tab === 'write' && (
          <>
            <div className="element-container">
              <label>登録方法</label>
              <div className="row">
                <button type="button" className={entryMode === 'single' ? 'btn-primary' : ''} onClick={() => setEntryMode('single')}>
                  単体登録
                </button>
                <button type="button" className={entryMode === 'set' ? 'btn-primary' : ''} onClick={() => setEntryMode('set')}>
                  セット登録
                </button>
              </div>
            </div>

            {entryMode === 'single' && (
              <form onSubmit={addRecord}>
                <div className="grid-cols-2">
                  <div className="element-container">
                    <label>日付</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="element-container">
                    <label>種目</label>
                    <select
                      value={form.exercise}
                      onChange={(e) => {
                        setForm({ ...form, exercise: e.target.value });
                      }}
                    >
                      <option value="">-- 既存種目から選択 --</option>
                      {uniqueExercises.map((ex) => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="または新規種目を入力（例: デッドリフト）"
                      value={newExercise}
                      onChange={(e) => setNewExercise(e.target.value)}
                      style={{ marginTop: '0.5rem' }}
                    />
                    <div className="small-muted">新規入力がある場合、選択値より優先して保存されます。</div>
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="element-container">
                    <label>重量 (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="element-container">
                    <label>回数</label>
                    <input
                      type="number"
                      min="1"
                      value={form.reps}
                      onChange={(e) => setForm({ ...form, reps: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="element-container">
                  <label>セット数</label>
                  <input
                    type="number"
                    min="1"
                    value={form.sets}
                    onChange={(e) => setForm({ ...form, sets: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="element-container">
                  <label>メモ（任意）</label>
                  <textarea
                    value={form.memo}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    placeholder="トレーニングの感覚、調整内容など"
                  />
                </div>

                <div className="element-container">
                  <button type="submit" disabled={loading}>
                    {loading ? <span className="spinner"></span> : '✨'}  記録する
                  </button>
                </div>
              </form>
            )}

            {entryMode === 'set' && (
              <>
                <div className="tabs">
                  <button
                    className={`tab-btn ${setTabMode === 'apply' ? 'active' : ''}`}
                    onClick={() => setSetTabMode('apply')}
                  >
                    🎯 セット一括記録
                  </button>
                  <button
                    className={`tab-btn ${setTabMode === 'create' ? 'active' : ''}`}
                    onClick={() => setSetTabMode('create')}
                  >
                    ➕ 新規セット作成
                  </button>
                </div>

                {setTabMode === 'apply' && (
                  <form onSubmit={addRecordSet}>
                    <h4>セットを選択して一括記録</h4>
                    <div className="grid-cols-2">
                      <div className="element-container">
                        <label>セット選択</label>
                        <select value={selectedTemplateId} onChange={(e) => handleTemplateSelect(e.target.value)}>
                          <option value="">-- 保存済みセットを選択 --</option>
                          {setTemplates.map((template) => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="element-container">
                        <label>日付</label>
                        <input type="date" value={setDate} onChange={(e) => setSetDate(e.target.value)} required />
                      </div>
                    </div>

                    {setItemsDraft.map((item, idx) => (
                      <div
                        key={`draft-${idx}`}
                        style={{
                          marginBottom: '1.5rem',
                          padding: '1rem',
                          backgroundColor: 'var(--background-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ marginBottom: '1rem' }}>
                          <label>種目 {idx + 1}</label>
                          <input
                            type="text"
                            value={item.exercise}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSetItemsDraft((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, exercise: value } : row)));
                            }}
                            required
                          />
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <label>重量 (kg)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.weight}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setSetItemsDraft((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, weight: value } : row)));
                              }}
                              required
                            />
                          </div>
                          <div>
                            <label>回数</label>
                            <input
                              type="number"
                              min="1"
                              value={item.reps}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setSetItemsDraft((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, reps: value } : row)));
                              }}
                              required
                            />
                          </div>
                          <div>
                            <label>セット数</label>
                            <input
                              type="number"
                              min="1"
                              value={item.sets}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setSetItemsDraft((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, sets: value } : row)));
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="element-container">
                      <label>メモ（任意）</label>
                      <textarea
                        value={setMemo}
                        onChange={(e) => setSetMemo(e.target.value)}
                        placeholder="セット全体に共通のメモ"
                      />
                    </div>

                    <button type="submit" disabled={loading || setItemsDraft.length === 0}>
                      {loading ? <span className="spinner"></span> : '🚀'} セット内容を一括記録
                    </button>
                  </form>
                )}

                {setTabMode === 'create' && (
                  <div className="element-container">
                    <h4>セットを作成</h4>
                    <div className="grid-cols-2">
                      <div>
                        <label>セット名</label>
                        <input
                          type="text"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="例: 胸トレA"
                        />
                      </div>
                      <div className="row" style={{ alignItems: 'end' }}>
                        <button type="button" onClick={addSetTemplateRow}>種目を追加</button>
                        <button type="button" className="btn-primary" onClick={saveSetTemplate}>セットを保存</button>
                      </div>
                    </div>

                    {newTemplateItems.map((item, idx) => (
                      <div className="grid-cols-2" key={`new-template-${idx}`} style={{ marginBottom: '1.5rem' }}>
                        <div>
                          <label>種目 {idx + 1}</label>
                          <input
                            type="text"
                            value={item.exercise}
                            onChange={(e) => {
                              const value = e.target.value;
                              setNewTemplateItems((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, exercise: value } : row)));
                            }}
                            placeholder="例: ベンチプレス"
                          />
                        </div>
                        <div className="row" style={{ alignItems: 'end' }}>
                          <div>
                            <label>重量</label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.weight}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setNewTemplateItems((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, weight: value } : row)));
                              }}
                            />
                          </div>
                          <div>
                            <label>回数</label>
                            <input
                              type="number"
                              min="1"
                              value={item.reps}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setNewTemplateItems((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, reps: value } : row)));
                              }}
                            />
                          </div>
                          <div style={{ marginRight: '1rem' }}>
                            <label>セット数</label>
                            <input
                              type="number"
                              min="1"
                              value={item.sets}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setNewTemplateItems((prev) => prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, sets: value } : row)));
                              }}
                            />
                          </div>
                          <button type="button" className="btn-danger" onClick={() => removeSetTemplateRow(idx)} disabled={newTemplateItems.length === 1}>削除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'goals' && (
          <div>
            <h3>🎯 目標を追加</h3>
            <GoalForm onAdd={addGoal} exercises={uniqueExercises} />
            {goals.length > 0 && (
              <>
                <h4>設定済みの目標</h4>
                <div>
                  {goals.map((g) => (
                    <div key={g.id} className="record-item">
                      <div className="record-item-title">{g.exercise}</div>
                      <div className="record-item-meta">目標: {g.value} {g.unit}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {goals.length === 0 && (
              <div className="alert alert-info">
                まだ目標がありません。上記で目標を追加してください。
              </div>
            )}
          </div>
        )}

        {tab === 'calendar' && (
          <div>
            <h3>📅 トレーニングカレンダー</h3>
            <CalendarGrid
              records={records}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={(month, year) => {
                setCurrentMonth(month);
                setCurrentYear(year);
              }}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
            
            {selectedDate && (
              <div className="element-container" style={{ marginTop: '2rem' }}>
                <h4>📋 {selectedDate} のトレーニング内容</h4>
                {records.filter((r) => r.date === selectedDate).length === 0 ? (
                  <div className="small-muted">この日のトレーニング記録はありません。</div>
                ) : (
                  <div>
                    {records
                      .filter((r) => r.date === selectedDate)
                      .map((r) => (
                        <div key={r.id} className="record-item">
                          <div className="record-item-title">{r.exercise}</div>
                          <div className="record-item-meta">
                            {r.weight}kg × {r.reps}回 × {r.sets}セット
                          </div>
                          {r.memo && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                              {r.memo}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            <hr />
            <h4>画像登録</h4>
            <form onSubmit={uploadProgressImage} className="element-container">
              <div className="grid-cols-2">
                <div className="element-container">
                  <label>撮影日</label>
                  <input
                    type="date"
                    value={imageForm.date}
                    onChange={(e) => setImageForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="element-container">
                  <label>画像ファイル</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              </div>
              <div className="element-container">
                <label>メモ（任意）</label>
                <textarea
                  value={imageForm.note}
                  onChange={(e) => setImageForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="撮影条件・体調メモなど"
                />
              </div>
              <button type="submit" disabled={uploadingImage}>
                {uploadingImage ? <span className="spinner"></span> : '📤'} 画像を登録する
              </button>
            </form>

            {images.length > 0 && (
              <div className="element-container" style={{ marginTop: '1rem' }}>
                <h4>登録済み画像</h4>
                <div className="grid-cols-2">
                  {images.map((img) => (
                    <div key={img.id ?? `${img.date}-${img.image_url}`} className="record-item">
                      <div className="record-item-meta" style={{ marginBottom: '0.5rem' }}>{img.date}</div>
                      <div className="image-container">
                        <img src={img.image_url} alt={`記録画像-${img.date}`} />
                      </div>
                      {img.note && <div className="small-muted" style={{ marginTop: '0.5rem' }}>{img.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h4>画像比較（ビフォーアフター）</h4>
            <ImageCompare />
          </div>
        )}

        {tab === 'details' && (
          <div>
            <h3>📊 記録一覧</h3>
            {records.length === 0 ? (
              <div className="alert alert-info">
                まだ記録がありません。「記録追加」タブで追加してください。
              </div>
            ) : (
              <div>
                <p className="small-muted">{records.length} 件の記録</p>
                {records.map((r) => (
                  <div key={r.id} className="record-item">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="record-item-title">
                          {r.exercise}
                        </div>
                        <div className="record-item-meta">
                          {r.date} • {r.weight}kg × {r.reps}回 × {r.sets}セット
                        </div>
                        {r.memo && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            {r.memo}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn-danger"
                        style={{ marginLeft: '1rem', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                        onClick={() => setDeleteConfirm(r.id || 0)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>本当に削除しますか？</h3>
            <p className="small-muted">この操作は元に戻せません。</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  background: 'var(--border-color)',
                  color: 'var(--foreground)',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                className="btn-danger"
                onClick={() => deleteRecord(deleteConfirm)}
                disabled={loading}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalForm({ onAdd, exercises }: { onAdd: (g: Goal) => void; exercises: string[] }) {
  const [exercise, setExercise] = useState(exercises[0] || '');
  const [value, setValue] = useState(15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.trim()) {
      alert('種目を選択してください。');
      return;
    }
    onAdd({ id: Date.now(), exercise, value, unit: 'sets' });
    setExercise(exercises[0] || '');
    setValue(15);
  };

  return (
    <form onSubmit={handleSubmit} className="element-container">
      <div className="grid-cols-2">
        <div>
          <label>対象種目</label>
          <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
            {exercises.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>
        <div>
          <label>目標値（総セット数）</label>
          <input
            type="number"
            min="1"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            required
          />
        </div>
      </div>
      <button type="submit" style={{ marginTop: '1rem' }}>
        🎯 目標を設定する
      </button>
    </form>
  );
}

function ImageCompare() {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);

  const handleFileLoad = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid-cols-2">
      <div className="element-container">
        <label>Before 画像を選択</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileLoad(e.target.files[0], setLeft);
            }
          }}
        />
        {left && (
          <div className="image-container" style={{ marginTop: '1rem' }}>
            <img src={left} alt="Before" />
          </div>
        )}
      </div>
      <div className="element-container">
        <label>After 画像を選択</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileLoad(e.target.files[0], setRight);
            }
          }}
        />
        {right && (
          <div className="image-container" style={{ marginTop: '1rem' }}>
            <img src={right} alt="After" />
          </div>
        )}
      </div>
    </div>
  );
}

interface CalendarGridProps {
  records: TrainingRecord[];
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

function CalendarGrid({
  records,
  currentMonth,
  currentYear,
  onMonthChange,
  selectedDate,
  onDateSelect,
}: CalendarGridProps) {
  const monthNames = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const recordDates = new Set(records.map((r) => r.date));

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="element-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button type="button" onClick={handlePrevMonth}>
          ← 前月
        </button>
        <h4 style={{ margin: 0 }}>
          {currentYear}年 {monthNames[currentMonth]}
        </h4>
        <button type="button" onClick={handleNextMonth}>
          翌月 →
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              padding: '0.5rem',
              backgroundColor: 'var(--border-color)',
              borderRadius: '4px',
              fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
            }}
          >
            {day}
          </div>
        ))}

        {days.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                style={{
                  aspectRatio: '1',
                  backgroundColor: 'transparent',
                }}
              />
            );
          }

          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasRecord = recordDates.has(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDateSelect(dateStr)}
              style={{
                aspectRatio: '1',
                padding: '0.25rem',
                borderRadius: '8px',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? 'var(--primary)20' : hasRecord ? 'var(--primary)10' : 'transparent',
                color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                fontWeight: isSelected || hasRecord ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'border 0.2s ease, background-color 0.2s ease',
                boxSizing: 'border-box',
                fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.1rem',
                overflow: 'hidden',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = hasRecord ? 'var(--primary)20' : 'var(--border-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = hasRecord ? 'var(--primary)10' : 'transparent';
                }
              }}
            >
              <div style={{ lineHeight: '1', height: '1em' }}>{day}</div>
              {hasRecord && <div style={{ fontSize: '0.5em', lineHeight: '1', height: '0.5em', marginTop: '-0.1em' }}>●</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

