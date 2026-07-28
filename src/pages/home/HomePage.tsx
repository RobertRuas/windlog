/**
 * ============================================================================
 * HOME PAGE - Página Inicial
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página inicial do sistema, exibida na rota /.
 * Mostra uma saudação ao usuário com informações rápidas do perfil.
 *
 * LAYOUT:
 * -------
 * Utiliza o AppLayout (sidebar à esquerda).
 * Responsivo: conteúdo centralizado em PC e mobile.
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Award, Globe, MapPin, Building } from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Serviços
import type { ProfileResponse } from '@/types/user.types';
import { getProfile } from '@/services/auth.service';

/**
 * Componente HomePage - Página inicial com saudação e resumo do perfil.
 */
export function HomePage() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">{t('common:status.loading')}</p>
        </div>
      </AppLayout>
    );
  }

  /**
   * Cards de resumo exibidos na home.
   * Cada card mostra um ícone, label e valor (ou "—").
   */
  const summaryCards = [
    {
      icon: User,
      label: t('profile.department'),
      value: data?.department || '—',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Building,
      label: t('profile.position'),
      value: data?.position || '—',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: MapPin,
      label: t('profile.city'),
      value: data?.city || '—',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Phone,
      label: t('phones.title'),
      value: data?.phoneNumbers?.length ?? 0,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: Award,
      label: t('certifications.title'),
      value: data?.certifications?.length ?? 0,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      icon: Globe,
      label: t('languages.title'),
      value: data?.languages?.length ?? 0,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
  ];

  return (
    <AppLayout>
      {/* Saudação */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('title')}, {data?.firstName}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('homeSubtitle')}
        </p>
      </div>

      {/* Grid de cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={card.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{card.label}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Atalho para o perfil */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {t('profileCard.title')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('profileCard.description')}
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {t('profileCard.action')}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
