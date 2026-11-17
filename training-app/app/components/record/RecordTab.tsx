'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TabNav from '../TabNav';
import Icon, { type IconName } from '../Icon';
import ProteinForm from './ProteinForm';
import BodyWeightForm from './BodyWeightForm';
import SingleRecordForm from './SingleRecordForm';
import ApplySetForm from './ApplySetForm';
import CreateSetForm from './CreateSetForm';
import { useSetTemplates } from '../../hooks/useSetTemplates';
import type { CustomExercise, TrainingRecord, AlertMessage, ProteinIntake, BodyWeight } from '../../types';

interface Props {
  customExercises: string[];
  customExercisesWithCategory: CustomExercise[];
  allExercisesFlat: string[];
  loading: boolean;
  onSave: (records: TrainingRecord[]) => Promise<boolean>;
  onSaveExercise: (name: string, category: string) => Promise<void>;
  showMessage: (msg: AlertMessage) => void;
  records: TrainingRecord[];
  proteinIntakes: ProteinIntake[];
  proteinLoading: boolean;
  onSaveProtein: (date: string, amountG: number) => Promise<boolean>;
  onDeleteProtein: (id: number) => void;
  bodyWeights: BodyWeight[];
  bodyWeightLoading: boolean;
  onSaveBodyWeight: (date: string, weightKg: number) => Promise<boolean>;
  onDeleteBodyWeight: (id: number) => void;
}

type RecordKind = 'training' | 'protein' | 'bodyWeight';

// 記録の種類（画面上部の選択ボタン）
const RECORD_KIND_TABS: { id: RecordKind; label: string; icon: IconName }[] = [
  { id: 'training', label: '筋トレ記録', icon: 'dumbbell' },
  { id: 'protein', label: 'プロテイン', icon: 'shaker' },
  { id: 'bodyWeight', label: '体重', icon: 'scale' },
];

const ENTRY_MODE_TABS = [
  { id: 'single', label: '単体登録' },
  { id: 'set', label: 'セット登録' },
];

const SET_MODE_TABS = [
  { id: 'apply', label: 'セット一括記録', icon: 'lifter' as const },
  { id: 'create', label: '新規セット作成', icon: 'pencil' as const },
];

/** 記録追加タブ：筋トレ記録（単体登録・セット登録）、プロテイン、体重の3種類を切り替えて記録する */
export default function RecordTab({
  customExercises,
  customExercisesWithCategory,
  allExercisesFlat,
  loading,
  onSave,
  onSaveExercise,
  showMessage,
  records,
  proteinIntakes,
  proteinLoading,
  onSaveProtein,
  onDeleteProtein,
  bodyWeights,
  bodyWeightLoading,
  onSaveBodyWeight,
  onDeleteBodyWeight,
}: Props) {
  const [kind, setKind] = useState<RecordKind>('training');
  const [entryMode, setEntryMode] = useState<'single' | 'set'>('single');
  const [setTabMode, setSetTabMode] = useState<'apply' | 'create'>('apply');

  const {
    setTemplates,
    selectedTemplateId,
    setItemsDraft,
    newTemplateName,
    newTemplateItems,
    setSetItemsDraft,
    setNewTemplateName,
    setNewTemplateItems,
    handleTemplateSelect,
    addSetTemplateRow,
    removeSetTemplateRow,
    saveSetTemplate,
  } = useSetTemplates(showMessage);

  return (
    <>
      <div className="element-container">
        <label>記録の種類</label>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {RECORD_KIND_TABS.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={kind === tab.id ? 'default' : 'outline'}
              onClick={() => setKind(tab.id)}
            >
              <Icon name={tab.icon} color="currentColor" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {kind === 'protein' && (
        <ProteinForm
          records={records}
          proteinIntakes={proteinIntakes}
          loading={proteinLoading}
          onSave={onSaveProtein}
          onDelete={onDeleteProtein}
        />
      )}

      {kind === 'bodyWeight' && (
        <BodyWeightForm
          bodyWeights={bodyWeights}
          loading={bodyWeightLoading}
          onSave={onSaveBodyWeight}
          onDelete={onDeleteBodyWeight}
        />
      )}

      {kind === 'training' && (
        <>
          <div className="element-container">
            <label>登録方法</label>
            <div className="row">
              {ENTRY_MODE_TABS.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant={entryMode === tab.id ? 'default' : 'outline'}
                  onClick={() => setEntryMode(tab.id as 'single' | 'set')}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {entryMode === 'single' && (
            <SingleRecordForm
              customExercises={customExercises}
              customExercisesWithCategory={customExercisesWithCategory}
              loading={loading}
              onSave={onSave}
              onSaveExercise={onSaveExercise}
              showMessage={showMessage}
            />
          )}

          {entryMode === 'set' && (
            <>
              <TabNav tabs={SET_MODE_TABS} activeTab={setTabMode} onTabChange={(id) => setSetTabMode(id as 'apply' | 'create')} />

              {setTabMode === 'apply' && (
                <ApplySetForm
                  setTemplates={setTemplates}
                  selectedTemplateId={selectedTemplateId}
                  setItemsDraft={setItemsDraft}
                  loading={loading}
                  onTemplateSelect={handleTemplateSelect}
                  onDraftChange={setSetItemsDraft}
                  onSave={onSave}
                  showMessage={showMessage}
                />
              )}

              {setTabMode === 'create' && (
                <CreateSetForm
                  newTemplateName={newTemplateName}
                  newTemplateItems={newTemplateItems}
                  allExercisesFlat={allExercisesFlat}
                  onNameChange={setNewTemplateName}
                  onItemsChange={setNewTemplateItems}
                  onAddRow={addSetTemplateRow}
                  onRemoveRow={removeSetTemplateRow}
                  onSave={saveSetTemplate}
                  showMessage={showMessage}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
