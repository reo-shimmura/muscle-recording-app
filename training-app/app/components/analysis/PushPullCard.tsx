import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PULL_CATEGORIES, PUSH_CATEGORIES, type PushPullBalance, type PushPullVerdict } from '../../lib/analysis/categoryBalance';
import { COLORS } from '../../constants/colors';

interface Props {
  balance: PushPullBalance;
}

const PUSH_COLOR = COLORS.primary;
// 押す（テーマの赤）と対比させるため、引くは青にする
const PULL_COLOR = COLORS.contrast;

const VERDICT_VIEW: Record<PushPullVerdict, { label: string; message: string; color?: string }> = {
  balanced: { label: '良好', message: '押す・引くのバランスがとれています。', color: COLORS.success },
  'push-heavy': { label: '押す種目に偏り', message: '背中（引く種目）を増やすと、姿勢や肩のケガ予防に役立ちます。', color: COLORS.caution },
  'pull-heavy': { label: '引く種目に偏り', message: '胸・肩（押す種目）も取り入れるとバランスがよくなります。', color: COLORS.caution },
  insufficient: { label: 'データ不足', message: 'この期間に胸・肩・背中の記録がありません。' },
};

/** 6. 押す・引くのバランス：胸＋肩（押す）と背中（引く）の負荷量の比率を帯グラフで見せる */
export default function PushPullCard({ balance }: Props) {
  const { push, pull, ratio, verdict } = balance;
  const total = push + pull;
  const pushPercent = total > 0 ? Math.round((push / total) * 100) : 50;
  const view = VERDICT_VIEW[verdict];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>🔁 押す・引くのバランス</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ marginBottom: '0.5rem' }}>
          <b style={{ color: view.color }}>{view.label}</b>
          {ratio !== null && <span className="small-muted">{'　'}押す ÷ 引く = {ratio}</span>}
        </div>

        {total > 0 && (
          <>
            <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${pushPercent}%`, background: PUSH_COLOR }} />
              <div style={{ width: `${100 - pushPercent}%`, background: PULL_COLOR }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              <span style={{ color: PUSH_COLOR }}>
                押す（{PUSH_CATEGORIES.join('・')}）{pushPercent}%
              </span>
              <span style={{ color: PULL_COLOR }}>
                引く（{PULL_CATEGORIES.join('・')}）{100 - pushPercent}%
              </span>
            </div>
          </>
        )}

        <div className="small-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
          {view.message}（負荷量で比較。押す÷引くが 0.67〜1.5 なら良好）
        </div>
      </CardContent>
    </Card>
  );
}
