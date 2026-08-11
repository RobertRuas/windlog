/**
 * ============================================================================
 * TECHNICIAN SELECT - Dropdown de Seleção de Técnico
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Dropdown com pesquisa para selecionar técnico no timesheet.
 * Suporta membros do projeto E técnicos externos (digitando o nome).
 *
 * COMPORTAMENTO:
 * --------------
 * - Clique abre dropdown com todos os membros do projeto (filtrável por nome)
 * - Se digitar um nome que não corresponde a nenhum membro, aparece a opção
 *   "Adicionar como técnico externo" para criar entry com nome livre
 * - Dropdown renderizado via portal (fora do container overflow-hidden do accordion)
 * - Exclui técnicos já adicionados neste dia (para evitar duplicidade)
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, User as UserIcon } from 'lucide-react';
import type { TechnicianSelectProps, SystemUser } from '../types/timesheet-form.types';

/**
 * Dropdown com pesquisa para selecionar técnico.
 * Restritivo: o usuário DEVE selecionar da lista.
 */
export function TechnicianSelect({
  value,
  onChange,
  onSelectUser,
  users,
  excludeNames = [],
  disabled,
  placeholder,
}: TechnicianSelectProps) {
  const { t } = useTranslation('timesheet');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const lastValidValue = useRef(value);

  // Sincroniza valor externo → display
  useEffect(() => {
    setQuery(value);
    if (value) lastValidValue.current = value;
  }, [value]);

  // Calcula a posição do dropdown sempre que abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [isOpen]);

  // Fecha dropdown ao clicar fora — aceita nome customizado se não houver match
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isInsideWrapper = wrapperRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      if (!isInsideWrapper && !isInsideDropdown) {
        setIsOpen(false);
        // Se digitou um nome que não é membro do projeto, aceita como externo
        if (query.trim() && !users.find((u) => u.fullName === query.trim())) {
          lastValidValue.current = query.trim();
          onChange(query.trim());
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, users, onChange]);

  // Filtra: exclui técnicos já adicionados neste dia (exceto o valor atual)
  const availableUsers = users.filter(
    (u) => !excludeNames.includes(u.fullName) || u.fullName === value,
  );

  const filtered = query.trim().length > 0
    ? availableUsers.filter((u) => u.fullName.toLowerCase().includes(query.toLowerCase()))
    : availableUsers;

  // Verifica se o nome digitado corresponde exatamente a algum membro (para não mostrar "externo")
  const exactMatch = query.trim().length > 0
    && availableUsers.some((u) => u.fullName.toLowerCase() === query.trim().toLowerCase());

  // Verifica se o nome já está em uso neste dia
  const nameAlreadyUsed = query.trim().length > 0
    && excludeNames.includes(query.trim());

  const showAddExternal = !exactMatch && !nameAlreadyUsed && query.trim().length > 0;

  function handleSelect(user: SystemUser) {
    setQuery(user.fullName);
    lastValidValue.current = user.fullName;
    onChange(user.fullName);
    onSelectUser(user);
    setIsOpen(false);
  }

  /** Cria técnico externo a partir do nome digitado. */
  function handleAddExternal() {
    const name = query.trim();
    if (!name) return;
    const parts = name.split(/\s+/);
    const externalUser: SystemUser = {
      id: `external-${Date.now()}`,
      firstName: parts[0] || name,
      lastName: parts.slice(1).join(' ') || '',
      fullName: name,
      position: '',
    };
    handleSelect(externalUser);
  }

  function handleClear() {
    setQuery('');
    lastValidValue.current = '';
    onChange('');
  }

  /**
   * Dropdown renderizado via portal (fora do container overflow-hidden do accordion).
   */
  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {filtered.length > 0 && filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors ${
                value === user.fullName ? 'bg-blue-50' : ''
              }`}
            >
              <UserIcon size={14} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900">{user.fullName}</span>
                {user.position && (
                  <span className="ml-2 text-xs text-gray-500">{user.position}</span>
                )}
              </div>
            </button>
          ))}
          {showAddExternal && (
            <button
              type="button"
              onClick={handleAddExternal}
              className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center gap-2 transition-colors border-t border-gray-100"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-[10px] font-bold">+</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-emerald-700">{t('form.addExternal')}</span>
                <span className="ml-1 text-xs text-gray-500">"{query.trim()}"</span>
              </div>
            </button>
          )}
          {filtered.length === 0 && !showAddExternal && (
            <div className="p-3 text-center text-xs text-gray-400">
              {nameAlreadyUsed ? t('form.alreadyAdded') : t('form.noMemberFound')}
            </div>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value.trim() === '') {
              lastValidValue.current = '';
              onChange('');
            }
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery(lastValidValue.current);
              setIsOpen(false);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-2 py-1.5 pr-12 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              title={t('formEditor.clear')}
            >
              <X size={12} />
            </button>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {dropdown}
    </div>
  );
}
