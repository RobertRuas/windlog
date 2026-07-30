/**
 * ============================================================================
 * USE PROFILE MUTATIONS - Hook para Mutations do Perfil
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook customizado que encapsula todas as mutations do perfil.
 * Inclui mutations para perfil, telefones, certificações, idiomas,
 * documentos e contas bancárias.
 *
 * RETORNA:
 * --------
 * - profileMutation: mutation para atualizar perfil
 * - phoneMutation: mutation para telefones
 * - certMutation: mutation para certificações
 * - langMutation: mutation para idiomas
 * - docMutation: mutation para documentos
 * - bankMutation: mutation para contas bancárias
 * ============================================================================
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  updateProfile,
  addPhone,
  updatePhone,
  removePhone,
  addCertification,
  updateCertification,
  removeCertification,
  addLanguage,
  updateLanguage,
  removeLanguage,
  addDocument,
  updateDocument,
  removeDocument,
  addBankAccount,
  updateBankAccount,
  removeBankAccount,
  type PhoneNumber,
  type Certification,
  type Language,
  type UserDocument,
  type BankAccount,
} from '@/services/auth.service';

/**
 * Hook useProfileMutations - Encapsula todas as mutations do perfil.
 */
export function useProfileMutations() {
  const { t } = useTranslation('home');
  const queryClient = useQueryClient();

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const phoneMutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: 'add' | 'update' | 'remove'; id?: string; data?: Omit<PhoneNumber, 'id'> | Partial<PhoneNumber> }) => {
      if (action === 'add') return addPhone(data as Omit<PhoneNumber, 'id'>);
      if (action === 'update') return updatePhone(id!, data as Partial<PhoneNumber>);
      return removePhone(id!);
    },
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const certMutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: 'add' | 'update' | 'remove'; id?: string; data?: Omit<Certification, 'id'> | Partial<Certification> }) => {
      if (action === 'add') return addCertification(data as Omit<Certification, 'id'>);
      if (action === 'update') return updateCertification(id!, data as Partial<Certification>);
      return removeCertification(id!);
    },
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const langMutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: 'add' | 'update' | 'remove'; id?: string; data?: Omit<Language, 'id'> | Partial<Language> }) => {
      if (action === 'add') return addLanguage(data as Omit<Language, 'id'>);
      if (action === 'update') return updateLanguage(id!, data as Partial<Language>);
      return removeLanguage(id!);
    },
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const docMutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: 'add' | 'update' | 'remove'; id?: string; data?: Omit<UserDocument, 'id'> | Partial<UserDocument> }) => {
      if (action === 'add') return addDocument(data as Omit<UserDocument, 'id'>);
      if (action === 'update') return updateDocument(id!, data as Partial<UserDocument>);
      return removeDocument(id!);
    },
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const bankMutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: 'add' | 'update' | 'remove'; id?: string; data?: Omit<BankAccount, 'id'> | Partial<BankAccount> }) => {
      if (action === 'add') return addBankAccount(data as Omit<BankAccount, 'id'>);
      if (action === 'update') return updateBankAccount(id!, data as Partial<BankAccount>);
      return removeBankAccount(id!);
    },
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  return {
    profileMutation,
    phoneMutation,
    certMutation,
    langMutation,
    docMutation,
    bankMutation,
  };
}
