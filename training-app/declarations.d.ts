// プレーンCSSファイルの副作用インポート用型宣言
// Next.jsのglobal.d.tsは*.module.cssのみ宣言しているため、
// globals.cssのような非モジュールCSSには別途宣言が必要
declare module '*.css';
