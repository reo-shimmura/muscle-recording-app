import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RECENT_PR_DAYS, type PersonalRecord } from '../../lib/analysis/personalRecords';

interface Props {
  personalRecords: PersonalRecord[];
}

/** 7. 自己ベスト一覧：種目ごとの最大重量・推定1RMと達成日（最近の更新は強調） */
export default function PersonalRecordCard({ personalRecords }: Props) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>🏅 自己ベスト</CardTitle>
      </CardHeader>
      <CardContent>
        {personalRecords.length === 0 ? (
          <div className="small-muted">重量を使った種目を記録すると、自己ベストが表示されます。</div>
        ) : (
          <>
            {personalRecords.map((pr) => (
              <div
                key={pr.exercise}
                style={{
                  borderLeft: `4px solid ${pr.isRecent ? '#f59e0b' : 'var(--border, #e5e7eb)'}`,
                  padding: '0.25rem 0 0.25rem 0.75rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {pr.exercise}
                  <span className="small-muted" style={{ fontWeight: 400 }}>{'　'}{pr.category}</span>
                  {pr.isRecent && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>NEW</span>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  最大重量 <b>{pr.maxWeight}kg</b> <span className="small-muted">（{pr.maxWeightDate}）</span>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  推定1RM <b>{pr.bestOneRepMax}kg</b> <span className="small-muted">（{pr.bestOneRepMaxDate}）</span>
                </div>
              </div>
            ))}
            <div className="small-muted" style={{ fontSize: '0.75rem' }}>
              更新が新しい順です。NEW は直近{RECENT_PR_DAYS}日以内に更新した種目です。
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
