/** プロテイン1杯の粉の量（g） */
export const PROTEIN_SCOOP_G = 30;

/**
 * プロテインの粉に含まれるたんぱく質の割合。
 * 一般的なホエイプロテインの表示に近い7割とする（1杯30g → たんぱく質21g）
 */
export const PROTEIN_POWDER_PROTEIN_RATIO = 0.7;

/**
 * 1日のたんぱく質の目安（体重1kgあたりのg）。
 * 筋トレをする人の目安は体重1kgあたり1.4〜2.0g（国際スポーツ栄養学会）とされるため、
 * 筋トレした日は上限寄りの2.0g、休みの日は1.6gとする
 */
export const PROTEIN_TARGET_G_PER_KG = {
  training: 2.0,
  rest: 1.6,
} as const;

/** つまみの刻み（1杯の何割ずつ動かすか）。0.1 なら 10%（3g）刻み */
export const PROTEIN_SLIDER_STEP = 0.1;
