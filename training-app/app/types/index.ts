export interface TrainingRecord {
  id?: number;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  duration_minutes?: number | null;
  memo: string;
}

export interface Goal {
  id: string | number;
  exercise: string;
  value: number;
  unit: string;
}

export interface ProgressImage {
  id?: number;
  date: string;
  image_path: string;
  record_id?: number | null;
  created_at?: string;
}

export interface WorkoutSetItem {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
}

export interface WorkoutSetTemplate {
  id: string;
  name: string;
  items: WorkoutSetItem[];
}

export interface CustomExercise {
  id: number;
  name: string;
  category: string;
}

export type AlertType = 'error' | 'success' | 'info';

export interface AlertMessage {
  type: AlertType;
  text: string;
}
