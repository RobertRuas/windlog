/**
 * ============================================================================
 * LANGUAGE SECTION - Seção de Idiomas
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Exibe e gerencia os idiomas falados pelo usuário.
 * Permite adicionar, editar e remover idiomas com seus níveis.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todos os idiomas com nível de proficiência
 * - Adiciona novo idioma com nível (A1, A2, B1, B2, C1, C2, NATIVE)
 * - Edita idiomas existentes
 * - Remove idiomas com confirmação
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Language } from '@/services/auth.service';

/**
 * Props do componente.
 */
interface LanguageSectionProps {
  languages: Language[];
  onAdd: (data: Omit<Language, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Language>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * Seção de idiomas.
 */
export function LanguageSection({ languages, onAdd, onUpdate, onRemove }: LanguageSectionProps) {
  const { t } = useTranslation('home');

  // Estado para controlar qual item está sendo editado
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<Omit<Language, 'id'>>({
    language: '',
    level: 'A1',
  });

  /**
   * Formata o nível de proficiência para exibição.
   */
  const formatLevel = (level: string) => {
    const levels: Record<string, string> = {
      A1: t('languages.levels.a1'),
      A2: t('languages.levels.a2'),
      B1: t('languages.levels.b1'),
      B2: t('languages.levels.b2'),
      C1: t('languages.levels.c1'),
      C2: t('languages.levels.c2'),
      NATIVE: t('languages.levels.native'),
    };
    return levels[level] || level;
  };

  /**
   * Inicia a edição de um idioma.
   */
  const handleEdit = (lang: Language) => {
    setEditingId(lang.id);
    setFormData({
      language: lang.language,
      level: lang.level,
    });
  };

  /**
   * Cancela a edição.
   */
  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      language: '',
      level: 'A1',
    });
  };

  /**
   * Salva as alterações de um idioma.
   */
  const handleSave = async () => {
    if (!formData.language.trim()) return;
    if (editingId) {
      await onUpdate(editingId, formData);
      setEditingId(null);
    }
  };

  /**
   * Adiciona um novo idioma.
   */
  const handleAdd = async () => {
    if (!formData.language.trim()) return;
    await onAdd(formData);
    setIsAdding(false);
    setFormData({
      language: '',
      level: 'A1',
    });
  };

  /**
   * Remove um idioma.
   */
  const handleRemove = async (id: string) => {
    if (window.confirm(t('languages.confirmDelete'))) {
      await onRemove(id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t('languages.title')}
          </h2>
        </div>
        {!isAdding && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('languages.add')}
          </Button>
        )}
      </div>

      {/* Lista de idiomas */}
      <div className="space-y-3">
        {languages.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 italic">
            {t('languages.empty')}
          </p>
        )}

        {languages.map((lang) => (
          <div
            key={lang.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            {editingId === lang.id ? (
              /* Modo de edição */
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  type="text"
                  label={t('languages.language')}
                  value={formData.language}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  placeholder="English"
                />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="A1">{t('languages.levels.a1')}</option>
                  <option value="A2">{t('languages.levels.a2')}</option>
                  <option value="B1">{t('languages.levels.b1')}</option>
                  <option value="B2">{t('languages.levels.b2')}</option>
                  <option value="C1">{t('languages.levels.c1')}</option>
                  <option value="C2">{t('languages.levels.c2')}</option>
                  <option value="NATIVE">{t('languages.levels.native')}</option>
                </select>
                <div className="flex items-end gap-1">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Modo de visualização */
              <>
                <div>
                  <p className="font-medium text-gray-900">{lang.language}</p>
                  <p className="text-sm text-gray-500">
                    <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                      {formatLevel(lang.level)}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(lang)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRemove(lang.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Formulário para adicionar novo idioma */}
        {isAdding && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                type="text"
                label={t('languages.language')}
                value={formData.language}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, language: e.target.value })
                }
                placeholder="English"
              />
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="A1">{t('languages.levels.a1')}</option>
                <option value="A2">{t('languages.levels.a2')}</option>
                <option value="B1">{t('languages.levels.b1')}</option>
                <option value="B2">{t('languages.levels.b2')}</option>
                <option value="C1">{t('languages.levels.c1')}</option>
                <option value="C2">{t('languages.levels.c2')}</option>
                <option value="NATIVE">{t('languages.levels.native')}</option>
              </select>
              <div className="flex items-end gap-1">
                <Button size="sm" onClick={handleAdd}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
