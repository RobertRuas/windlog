/**
 * ============================================================================
 * TECHNICIAN SELECT - Dropdown de Seleção de Técnico
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Dropdown com pesquisa para selecionar técnico no timesheet.
 * É um componente restritivo: o usuário DEVE selecionar da lista.
 *
 * COMPORTAMENTO:
 * --------------
 * - Clique abre dropdown com todos os membros do projeto (filtrável por nome)
 * - Se digitar algo que não corresponde a nenhum membro, reverte ao último valor válido
 * - Ao fechar sem seleção válida, limpa se não havia valor anterior
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
  suffix,
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

  // Calcula a posição do dropdown sempre que abre (alinhado à caixa inteira)
  useEffect(() => {
    const anchor = wrapperRef.current || inputRef.current;
    if (isOpen && anchor) {
      const rect = anchor.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [isOpen]);

  // Fecha dropdown ao clicar fora (input OU dropdown são considerados "dentro")
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isInsideWrapper = wrapperRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      if (!isInsideWrapper && !isInsideDropdown) {
        setIsOpen(false);
        const matchedUser = users.find((u) => u.fullName === query);
        if (!matchedUser) {
          setQuery(lastValidValue.current);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, users]);

  // Filtra: exclui técnicos já adicionados neste dia (exceto o valor atual)
  const availableUsers = users.filter(
    (u) => !excludeNames.includes(u.fullName) || u.fullName === value,
  );

  const filtered = query.trim().length > 0
    ? availableUsers.filter((u) => u.fullName.toLowerCase().includes(query.toLowerCase()))
    : availableUsers;

  function handleSelect(user: SystemUser) {
    setQuery(user.fullName);
    lastValidValue.current = user.fullName;
    onChange(user.fullName);
    onSelectUser(user);
    setIsOpen(false);
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
          {filtered.length > 0 ? (
            filtered.map((user) => (
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
            ))
          ) : (
            <div className="p-3 text-center text-xs text-gray-400">
              {t('form.noMemberFound')}
            </div>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Caixa única: nome editável + sufixo (cargo) + ícones */}
      <div className="flex items-center gap-1 h-8 border border-gray-200 rounded px-2 bg-white focus-within:ring-1 focus-within:ring-blue-500">
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
          className="flex-1 min-w-0 text-sm font-medium focus:outline-none disabled:opacity-60"
        />
        {/* Cargo exibido junto ao nome, dentro do próprio campo */}
        {suffix && (
          <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">{suffix}</span>
        )}
        <div className="flex items-center gap-0.5 shrink-0">
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
