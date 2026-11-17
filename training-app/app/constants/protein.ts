/** プロテイン1杯の量（g） */
export const PROTEIN_SCOOP_G = 30;

/** 1日に飲むべき杯数の目安（筋トレした日は多めに、休みの日は1杯） */
export const PROTEIN_TARGET_CUPS = {
  training: 2,
  rest: 1,
} as const;

/** つまみの刻み（1杯の何割ずつ動かすか）。0.1 なら 10%（3g）刻み */
export const PROTEIN_SLIDER_STEP = 0.1;
