'use client'

import { useState } from 'react';
import TabNav from '../TabNav';
import SingleRecordForm from './SingleRecordForm';
import ApplySetForm from './ApplySetForm';
import CreateSetForm from './CreateSetForm';
import { useSetTemplates } from '../../hooks/useSetTemplates';
import type { TrainingRecord, AlertMessage } from '../../types';

interface Props {
  customExercises: string[];
  allExercisesFlat: string[];
  loading: boolean;
  onSave: (records: TrainingRecord[]) => Promise<boolean>;
  showMessage: (msg: AlertMessage) => void;
}

const ENTRY_MODE_TABS = [
  { id: 'single', label: '単体登録' },
  { id: 'set', label: 'セット登録' },
];

const SET_MODE_TABS = [
  { id: 'apply', label: '🎯 セット一括記録' },
  { id: 'create', label: '➕ 新規セット作成' },
];

/** 記録追加タブ：単体登録とセット登録のモード切替を管理 */
export default function RecordTab({ customExercises, allExercisesFlat, loading, onSave, showMessage }: Props) {
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
        <label>登録方法</label>
        <div className="row">
          {ENTRY_MODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={entryMode === tab.id ? 'btn-primary' : ''}
              onClick={() => setEntryMode(tab.id as 'single' | 'set')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {entryMode === 'single' && (
        <SingleRecordForm
          customExercises={customExercises}
          loading={loading}
          onSave={onSave}
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
  );
}
