'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/common/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useGetReportTemplatesQuery,
  useCreateReportTemplateMutation,
  useUpdateReportTemplateMutation,
} from '@/ducks/admin/adminApi';
import { ReportTemplate, TemplateConfig, SectionKey, SectionItem } from '@/ducks/admin/types';
import { buildHtmlPreview, SAMPLE_DATA } from '@/common/report-template/build-html-preview';

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_SECTIONS: SectionItem[] = [
  { key: 'executiveSummary', enabled: true },
  { key: 'breakdownByCategory', enabled: true },
  { key: 'byEmployee', enabled: true },
  { key: 'anomalies', enabled: true },
  { key: 'recommendations', enabled: true },
  { key: 'aiAnalysis', enabled: true },
];

const DEFAULT_CONFIG: TemplateConfig = {
  title: 'Monthly Expense Report',
  company: 'My Company GmbH',
  logoUrl: '',
  primaryColor: '#1E40AF',
  sections: DEFAULT_SECTIONS,
};

// ─── Backward compat helper ────────────────────────────────────────────────

const SECTION_ORDER: SectionKey[] = [
  'executiveSummary', 'breakdownByCategory', 'byEmployee',
  'anomalies', 'recommendations', 'aiAnalysis',
];

function normalizeSections(raw: any): SectionItem[] {
  if (Array.isArray(raw)) return raw as SectionItem[];
  // old object format → convert to ordered array
  return SECTION_ORDER.map(key => ({
    key,
    enabled: key === 'aiAnalysis' ? true : Boolean(raw[key]),
  }));
}

// ─── SortableSectionItem ───────────────────────────────────────────────────

interface SortableSectionItemProps {
  item: SectionItem;
  label: string;
  onToggle: (key: SectionKey, enabled: boolean) => void;
}

function SortableSectionItem({ item, label, onToggle }: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded px-1 py-1.5 hover:bg-gray-50 ${isDragging ? 'opacity-50 bg-blue-50' : ''}`}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-300 hover:text-gray-500 select-none text-base leading-none"
        title="Drag to reorder"
      >
        ⠿
      </span>
      <input
        type="checkbox"
        checked={item.enabled}
        onChange={e => onToggle(item.key, e.target.checked)}
        className="h-3.5 w-3.5 cursor-pointer"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

// ─── ReportTemplateDesigner ────────────────────────────────────────────────

export default function ReportTemplateDesigner() {
  const { isAdmin, session } = useAuth();
  const isManager = session?.user?.role === "MANAGER";
  const router = useRouter();
  const { t } = useTranslation();

  const { data, isLoading } = useGetReportTemplatesQuery();
  const [createTemplate, { isLoading: isCreating }] = useCreateReportTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateReportTemplateMutation();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('New Template');
  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_CONFIG);
  const [saveMsg, setSaveMsg] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    if (!isAdmin && !isManager) router.replace('/not-found');
  }, [isAdmin, isManager, router]);

  // Load first template on mount
  useEffect(() => {
    const templates = data?.templates;
    if (templates && templates.length > 0 && selectedId === null) {
      loadTemplate(templates[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const loadTemplate = (tpl: ReportTemplate) => {
    setSelectedId(tpl.id);
    setName(tpl.name);
    try {
      const parsed = JSON.parse(tpl.configJson);
      setConfig({ ...parsed, sections: normalizeSections(parsed.sections) });
    } catch {
      setConfig(DEFAULT_CONFIG);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setName('New Template');
    setConfig(DEFAULT_CONFIG);
    setSaveMsg('');
  };

  const handleSave = async () => {
    const configJson = JSON.stringify(config);
    try {
      if (selectedId) {
        await updateTemplate({ id: selectedId, name, configJson }).unwrap();
        setSaveMsg(t('template.template_saved'));
      } else {
        const result = await createTemplate({ name, configJson }).unwrap();
        setSelectedId((result as any).id);
        setSaveMsg(t('template.template_created'));
      }
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg(t('template.template_save_error'));
    }
  };

  const setSection = (key: SectionKey, enabled: boolean) =>
    setConfig(c => ({ ...c, sections: c.sections.map(s => s.key === key ? { ...s, enabled } : s) }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setConfig(c => {
        const keys = c.sections.map(s => s.key);
        const oldIndex = keys.indexOf(active.id as SectionKey);
        const newIndex = keys.indexOf(over.id as SectionKey);
        return { ...c, sections: arrayMove(c.sections, oldIndex, newIndex) };
      });
    }
  };

  const SECTION_LABELS: Record<SectionKey, string> = {
    executiveSummary: t('template.section_executive_summary'),
    breakdownByCategory: t('template.section_by_category'),
    byEmployee: t('template.section_by_employee'),
    anomalies: t('template.section_anomalies'),
    recommendations: t('template.section_top_expenses'),
    aiAnalysis: t('template.section_ai_analysis'),
  };

  const previewHtml = useCallback(
    () => buildHtmlPreview(config, SAMPLE_DATA),
    [config],
  );

  const isSaving = isCreating || isUpdating;

  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/admin')}
          className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-neutral-900">{t('template.template_name')}</h2>
      </div>

      {/* Template selector */}
      <div className="flex items-center gap-3">
        <select
          className="border rounded px-3 py-1.5 text-sm"
          value={selectedId ?? ''}
          onChange={e => {
            const tpl = data?.templates.find(t => t.id === Number(e.target.value));
            if (tpl) loadTemplate(tpl);
          }}
        >
          <option value="" disabled>{isLoading ? t('template.loading') : t('template.select_template')}</option>
          {data?.templates.map(tpl => (
            <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
          ))}
        </select>
        <button onClick={handleNew} className="text-sm text-blue-600 hover:underline">
          + {t('template.new_template')}
        </button>
      </div>

      {/* Split panel */}
      <div className="flex gap-4" style={{ height: '70vh' }}>
        {/* Left: config panel */}
        <div className="w-2/5 flex flex-col gap-4 overflow-y-auto border rounded-lg p-4 bg-white">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('template.template_name')}</label>
            <input
              className="w-full border rounded px-3 py-1.5 text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('template.report_title')}</label>
            <input
              className="w-full border rounded px-3 py-1.5 text-sm"
              value={config.title}
              onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('template.company_name')}</label>
            <input
              className="w-full border rounded px-3 py-1.5 text-sm"
              value={config.company}
              onChange={e => setConfig(c => ({ ...c, company: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('template.primary_color')}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-12 cursor-pointer border rounded"
                value={config.primaryColor}
                onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))}
              />
              <span className="text-sm text-gray-500">{config.primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('template.logo_url')}</label>
            <input
              className="w-full border rounded px-3 py-1.5 text-sm"
              placeholder="https://..."
              value={config.logoUrl}
              onChange={e => setConfig(c => ({ ...c, logoUrl: e.target.value }))}
            />
          </div>

          {/* DnD sections */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">{t('template.sections')}</p>
            <p className="text-[10px] text-gray-400 mb-2">Drag ⠿ to reorder</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={config.sections.map(s => s.key)} strategy={verticalListSortingStrategy}>
                {config.sections.map(item => (
                  <SortableSectionItem
                    key={item.key}
                    item={item}
                    label={SECTION_LABELS[item.key]}
                    onToggle={setSection}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="mt-auto pt-3 border-t">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? t('template.saving') : selectedId ? t('template.save_template') : t('template.create_template')}
            </button>
            {saveMsg && (
              <p className="text-xs text-center mt-2 text-green-600">{saveMsg}</p>
            )}
          </div>
        </div>

        {/* Right: live preview */}
        <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-2 text-xs text-gray-500 font-medium">
            {t('template.preview')} — {t('template.preview_sample_data')}
          </div>
          <iframe
            className="flex-1 w-full"
            srcDoc={previewHtml()}
            title="Report Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
