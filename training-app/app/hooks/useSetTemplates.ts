'use client'

import { useState, useEffect } from 'react';
import type { WorkoutSetTemplate, WorkoutSetItem, AlertMessage } from '../types';

interface UseSetTemplatesReturn {
  setTemplates: WorkoutSetTemplate[];
  selectedTemplateId: string;
  setItemsDraft: WorkoutSetItem[];
  newTemplateName: string;
  newTemplateItems: WorkoutSetItem[];
  setSelectedTemplateId: React.Dispatch<React.SetStateAction<string>>;
  setSetItemsDraft: React.Dispatch<React.SetStateAction<WorkoutSetItem[]>>;
  setNewTemplateName: React.Dispatch<React.SetStateAction<string>>;
  setNewTemplateItems: React.Dispatch<React.SetStateAction<WorkoutSetItem[]>>;
  handleTemplateSelect: (templateId: string) => void;
  addSetTemplateRow: () => void;
  removeSetTemplateRow: (index: number) => void;
  saveSetTemplate: () => void;
}

export function useSetTemplates(
  showMessage: (msg: AlertMessage) => void
): UseSetTemplatesReturn {
  const [setTemplates, setSetTemplates] = useState<WorkoutSetTemplate[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('workout-set-templates');
      const parsed = raw ? (JSON.parse(raw) as WorkoutSetTemplate[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [setItemsDraft, setSetItemsDraft] = useState<WorkoutSetItem[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateItems, setNewTemplateItems] = useState<WorkoutSetItem[]>([
    { exercise: '', weight: 0, reps: 1, sets: 3 },
  ]);

  useEffect(() => {
    localStorage.setItem('workout-set-templates', JSON.stringify(setTemplates));
  }, [setTemplates]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const selected = setTemplates.find((t) => t.id === templateId);
    if (!selected) {
      setSetItemsDraft([]);
      return;
    }
    setSetItemsDraft(selected.items.map((item) => ({ ...item })));
  };

  const addSetTemplateRow = () => {
    setNewTemplateItems((prev) => [...prev, { exercise: '', weight: 0, reps: 1, sets: 3 }]);
  };

  const removeSetTemplateRow = (index: number) => {
    setNewTemplateItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const saveSetTemplate = () => {
    const cleanedItems = newTemplateItems
      .map((item) => ({
        exercise: item.exercise.trim(),
        weight: Math.max(0, Number(item.weight)),
        reps: Math.max(1, Number(item.reps)),
        sets: Math.max(1, Number(item.sets)),
      }))
      .filter((item) => item.exercise.length > 0);

    if (!newTemplateName.trim()) {
      showMessage({ type: 'error', text: 'セット名を入力してください。' });
      return;
    }
    if (cleanedItems.length === 0) {
      showMessage({ type: 'error', text: 'セットに1種目以上追加してください。' });
      return;
    }

    const newTemplate: WorkoutSetTemplate = {
      id: `${Date.now()}`,
      name: newTemplateName.trim(),
      items: cleanedItems,
    };

    setSetTemplates((prev) => [newTemplate, ...prev]);
    setNewTemplateName('');
    setNewTemplateItems([{ exercise: '', weight: 0, reps: 1, sets: 3 }]);
    showMessage({ type: 'success', text: 'セットを保存しました。' });
  };

  return {
    setTemplates,
    selectedTemplateId,
    setItemsDraft,
    newTemplateName,
    newTemplateItems,
    setSelectedTemplateId,
    setSetItemsDraft,
    setNewTemplateName,
    setNewTemplateItems,
    handleTemplateSelect,
    addSetTemplateRow,
    removeSetTemplateRow,
    saveSetTemplate,
  };
}
