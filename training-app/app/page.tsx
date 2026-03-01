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

export default function Home() {
  const [tab, setTab] = useState<string>('write');
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [form, setForm] = useState<TrainingRecord>({
    date: new Date().toISOString().slice(0, 10),
    exercise: '',
    weight: 0,
    reps: 1,
    sets: 3,
    memo: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

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
    if (!form.exercise.trim()) {
      showMessage('error', '種目を入力してください。');
      return;
    }
    const payload: Omit<TrainingRecord, 'id'> = {
      date: form.date,
      exercise: form.exercise.trim(),
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
      showMessage('success', '✅ 記録を保存しました！');
      setTab('details');
    } catch (err: any) {
      console.error('Save failed:', err?.message);
      showMessage('error', '記録の保存に失敗しました。');
    } finally {
      setLoading(false);
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
                  onChange={(e) => setForm({ ...form, exercise: e.target.value })}
                >
                  <option value="">-- 種目を選択または入力 --</option>
                  {uniqueExercises.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
                {form.exercise && !uniqueExercises.includes(form.exercise) && (
                  <div className="small-muted">新規種目として登録されます</div>
                )}
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
            <div className="element-container">
              <h4>記録済みの日付</h4>
              {markedDates.length === 0 ? (
                <div className="small-muted">まだ記録がありません。</div>
              ) : (
                <ul>
                  {markedDates.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
            <hr />
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
