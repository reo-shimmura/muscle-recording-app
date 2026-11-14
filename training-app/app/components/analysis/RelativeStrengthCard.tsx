import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RelativeStrengthResult } from '../../lib/analysis/bodyComposition';
import { COLORS } from '../../constants/colors';
import Icon from '../Icon';

interface Props {
  result: RelativeStrengthResult | null;
}

// 棒の長さの上限とする倍率。これ以上は端まで伸ばす
const BAR_MAX_RATIO = 2;

/** 11. 体重あたりの挙上重量：推定1RMの自己ベストが体重の何倍かを一覧で見せる */
export default function RelativeStrengthCard({ result }: Props) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle><Icon name="muscle" />体重あたりの挙上重量</CardTitle>
      </CardHeader>
      <CardContent>
        {result === null ? (
          <div className="small-muted">ホーム画面で体重を記録すると、体重に対する強さが表示されます。</div>
        ) : result.items.length === 0 ? (
          <div className="small-muted">重量を使った種目を記録すると表示されます。</div>
        ) : (
          <>
            <div className="small-muted" style={{ marginBottom: '0.5rem' }}>
              基準の体重：{result.bodyWeight}kg（{result.bodyWeightDate}）
            </div>
            {result.items.map((item) => (
              <div key={item.exercise} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 700 }}>{item.exercise}</span>
                  <span>
                    <b>{item.ratio}倍</b>
                    <span className="small-muted">（推定1RM {item.oneRepMax}kg）</span>
                  </span>
                </div>
                <div style={{ height: 6, background: COLORS.barTrack, borderRadius: 3 }}>
                  <div
                    style={{
                      width: `${Math.min(100, (item.ratio / BAR_MAX_RATIO) * 100)}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: COLORS.primary,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="small-muted" style={{ fontSize: '0.75rem' }}>
              推定1RMの自己ベスト ÷ 最新の体重です。体格が変わっても、強さの変化を比べやすくなります。
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
