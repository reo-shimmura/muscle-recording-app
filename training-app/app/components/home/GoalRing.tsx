import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface Props {
  label: string;
  sublabel: string;
  percent: number;
  size?: number;
}

const ACHIEVED_COLOR = '#10b981';
const IN_PROGRESS_COLOR = '#3b82f6';
const TRACK_COLOR = '#e5e7eb';

/** 目標の達成率をリング（ドーナツ）グラフで表示する */
export default function GoalRing({ label, sublabel, percent, size = 112 }: Props) {
  const data = [{ value: percent }];
  const color = percent >= 100 ? ACHIEVED_COLOR : IN_PROGRESS_COLOR;

  return (
    <div className="goal-ring">
      <div className="goal-ring-canvas" style={{ width: size, height: size }}>
        <RadialBarChart
          width={size}
          height={size}
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar dataKey="value" cornerRadius={999} background={{ fill: TRACK_COLOR }} fill={color} />
        </RadialBarChart>
        <div className="goal-ring-percent">{percent}%</div>
      </div>
      <div className="goal-ring-label">{label}</div>
      <div className="small-muted">{sublabel}</div>
    </div>
  );
}
