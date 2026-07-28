/**
 * ============================================================================
 * LANGUAGE SECTION - Seção de Idiomas
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Exibe e gerencia os idiomas falados pelo usuário.
 * Usado dentro de um Accordion na HomePage.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todos os idiomas com nível de proficiência
 * - Seleção de idioma a partir de lista predefinida
 * - Nível de proficiência (A1, A2, B1, B2, C1, C2, NATIVE)
 * - Design alinhado com altura consistente
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PREDEFINED_LANGUAGES } from '@/constants/languages';
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
   * Busca o nome do idioma pelo código ou nome.
   */
  const getLanguageName = (langName: string) => {
    // Primeiro tenta encontrar pelo nome
    const byName = PREDEFINED_LANGUAGES.find((l) => l.name === langName);
    if (byName) return byName.name;

    // Depois tenta pelo código
    const byCode = PREDEFINED_LANGUAGES.find((l) => l.code === langName);
    if (byCode) return byCode.name;

    // Se não encontrar, retorna o valor original
    return langName;
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
    if (!formData.language) return;
    if (editingId) {
      await onUpdate(editingId, formData);
      setEditingId(null);
    }
  };

  /**
   * Adiciona um novo idioma.
   */
  const handleAdd = async () => {
    if (!formData.language) return;
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

  /**
   * Filtra idiomas já adicionados.
   */
  const availableLanguages = PREDEFINED_LANGUAGES.filter(
    (lang) => !languages.some((l) => l.language === lang.name || l.language === lang.code)
  );

  return (
    <div className="pt-4">
      {/* Botão adicionar */}
      <div className="mb-4">
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
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3"
          >
            {editingId === lang.id ? (
              /* Modo de edição */
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="form-label">{t('languages.language')}</label>
                  <select
                    className="form-select w-full"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="">{t('languages.selectLanguage')}</option>
                    {PREDEFINED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.name}>
                        {l.name} ({l.nativeName})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="form-label">{t('languages.level')}</label>
                  <select
                    className="form-select w-full"
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
                </div>
                <div className="flex items-end gap-2">
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
                  <p className="font-medium text-gray-900">{getLanguageName(lang.language)}</p>
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
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="form-label">{t('languages.language')}</label>
                <select
                  className="form-select w-full"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  <option value="">{t('languages.selectLanguage')}</option>
                  {availableLanguages.map((l) => (
                    <option key={l.code} value={l.name}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="form-label">{t('languages.level')}</label>
                <select
                  className="form-select w-full"
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
              </div>
              <div className="flex items-end gap-2">
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
