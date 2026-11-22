'use client'

import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProteinMeter from './ProteinMeter';
import Icon from '../Icon';
import { dailyProteinTarget, ratioToGrams, sumProteinByDate } from '../../lib/protein';
import { toDateStr } from '../../lib/goalsProgress';
import { PROTEIN_SCOOP_G, PROTEIN_SLIDER_STEP } from '../../constants/protein';
import { calcProteinGrams, FOOD_BY_KEY, FOODS, formatFoodQuantity, PROTEIN_POWDER_KEY } from '../../constants/foods';
import type { BodyWeight, FoodIntake, TrainingRecord } from '../../types';

interface Props {
  records: TrainingRecord[];
  bodyWeights: BodyWeight[];
  foodIntakes: FoodIntake[];
  loading: boolean;
  onSave: (date: string, foodKey: string, quantity: number) => Promise<boolean>;
  onDelete: (id: number) => void;
}

/** 1杯のうちの割合を「70%」のように表示する */
function percentLabel(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * 記録追加タブ「たんぱく質」：プロテインや卵・肉などの食品と量を選んで記録する。
 * プロテインは1杯（30g）のうち飲んだ割合をつまみで、卵は個数、肉はg数で入力する。
 * その日のたんぱく質の合計と、体重から出した1日の目安をメーターで見せる。
 */
export default function ProteinForm({ records, bodyWeights, foodIntakes, loading, onSave, onDelete }: Props) {
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [foodKey, setFoodKey] = useState(PROTEIN_POWDER_KEY);
  const [ratio, setRatio] = useState(1);
  const [quantity, setQuantity] = useState(FOOD_BY_KEY[PROTEIN_POWDER_KEY].defaultQuantity);
  const [submitting, setSubmitting] = useState(false);

  const food = FOOD_BY_KEY[foodKey];
  const isPowder = foodKey === PROTEIN_POWDER_KEY;
  // プロテインはつまみの割合から粉の量を、それ以外は入力した量をそのまま使う
  const amount = isPowder ? ratioToGrams(ratio) : quantity;
  const adding = calcProteinGrams(foodKey, amount) ?? 0;

  const consumed = useMemo(() => sumProteinByDate(foodIntakes).get(date) ?? 0, [foodIntakes, date]);
  const target = dailyProteinTarget(records, bodyWeights, date);
  const dayIntakes = foodIntakes.filter((p) => p.date === date);

  // 食品を変えたら、その食品の初期の量に戻す
  const handleFoodChange = (key: string) => {
    if (!FOOD_BY_KEY[key]) return;
    setFoodKey(key);
    setRatio(1);
    setQuantity(FOOD_BY_KEY[key].defaultQuantity);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || amount <= 0 || amount > food.maxQuantity) return;

    setSubmitting(true);
    const ok = await onSave(date, foodKey, amount);
    setSubmitting(false);
    if (ok) handleFoodChange(foodKey);
  };

  const handleDelete = (intake: FoodIntake) => {
    const label = FOOD_BY_KEY[intake.food_key]?.label ?? intake.food_key;
    if (window.confirm(`${intake.date} の記録（${label} ${formatFoodQuantity(intake.food_key, intake.quantity)}）を削除しますか？`)) {
      onDelete(intake.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="element-container">
        <label htmlFor="protein-date">日付</label>
        <input id="protein-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="element-container">
        <label>食品</label>
        <Select value={foodKey} onValueChange={(value) => handleFoodChange(value ?? PROTEIN_POWDER_KEY)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(value: string) => FOOD_BY_KEY[value]?.label ?? ''}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FOODS.map((f) => (
              <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="element-container">
        {isPowder ? (
          <>
            <label htmlFor="protein-ratio">
              飲んだ量：1杯（{PROTEIN_SCOOP_G}g）の <b>{percentLabel(ratio)}</b>（{amount}g）
            </label>
            <input
              id="protein-ratio"
              type="range"
              min={PROTEIN_SLIDER_STEP}
              max={1}
              step={PROTEIN_SLIDER_STEP}
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <div className="small-muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>少し</span>
              <span>半分</span>
              <span>1杯</span>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="food-quantity">食べた量（{food.unit}）</label>
            <NumberInput
              id="food-quantity"
              min={food.step}
              max={food.maxQuantity}
              step={food.step}
              value={quantity}
              onChange={setQuantity}
              required
            />
          </>
        )}
        <div style={{ marginTop: '0.25rem' }}>
          この量のたんぱく質：<b>約 {adding}g</b>
          {!isPowder && (
            <span className="small-muted" style={{ fontSize: '0.75rem' }}>
              {food.unit === '個'
                ? `（1個あたり ${food.proteinPerUnit}g）`
                : `（100gあたり ${Math.round(food.proteinPerUnit * 1000) / 10}g）`}
            </span>
          )}
        </div>
      </div>

      <div className="element-container">
        <label>
          この日のたんぱく質
          {target && (
            <span className="small-muted" style={{ fontWeight: 400 }}>
              （目安：体重{target.bodyWeightKg}kg × {target.gramsPerKg}g＝{target.grams}g・
              {target.trained ? '筋トレした日' : '休みの日'}）
            </span>
          )}
        </label>
        <ProteinMeter consumed={consumed} adding={adding} target={target?.grams ?? null} />
      </div>

      <div className="element-container">
        <Button type="submit" disabled={submitting || loading || amount <= 0}>
          {submitting ? <span className="spinner"></span> : <Icon name="shaker" color="currentColor" />}記録する
        </Button>
      </div>

      {dayIntakes.length > 0 && (
        <div className="element-container">
          <label>この日の記録</label>
          {dayIntakes.map((intake) => (
            <div key={intake.id} className="row" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <span>
                {FOOD_BY_KEY[intake.food_key]?.label ?? intake.food_key} {formatFoodQuantity(intake.food_key, intake.quantity)}
                <span className="small-muted">（たんぱく質 {intake.protein_g}g）</span>
              </span>
              <Button type="button" variant="ghost" size="xs" onClick={() => handleDelete(intake)}>
                削除
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="small-muted" style={{ fontSize: '0.75rem' }}>
        たんぱく質の量は、文部科学省「日本食品標準成分表（八訂）増補2023年」の値（生）で計算しています。
        卵は1個（Mサイズ）の可食部を約50g、プロテインは粉の7割をたんぱく質としています。
      </p>
    </form>
  );
}
