/**
 * ============================================================================
 * HOOK: useProjectMutations
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook personalizado que centraliza todas as mutations (operações de escrita)
 * usadas na página de detalhes do projeto.
 *
 * POR QUE EXISTE?
 * ---------------
 * Separa a lógica de mutations da UI, tornando o código mais organizado
 * e reutilizável. Cada componente de aba recebe apenas as mutations que precisa.
 * ============================================================================
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  updateProject,
  createTurbine,
  updateTurbine,
  deleteTurbine,
  addMember,
  updateMember,
  removeMember,
  uploadProjectFile,
  deleteProjectFile,
  type CreateTurbinePayload,
  type UpdateTurbinePayload,
  type AddMemberPayload,
  type UpdateMemberPayload,
} from '@/services/project.service';

/**
 * Hook useProjectMutations - Centraliza todas as mutations do projeto.
 *
 * @param projectId - ID do projeto atual
 * @returns Objeto com todas as mutations disponíveis
 */
export function useProjectMutations(projectId: string) {
  const { t } = useTranslation('projects');
  const queryClient = useQueryClient();

  /** Invalida a query do projeto para recarregar os dados. */
  function invalidateProject() {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  }

  // =========================================================================
  // PROJECT MUTATIONS
  // =========================================================================

  const updateProjectMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateProject>[1]) => updateProject(projectId, payload),
    onSuccess: () => {
      toast.success(t('toast.updateSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.updateError'));
    },
  });

  // =========================================================================
  // TURBINE MUTATIONS
  // =========================================================================

  const createTurbineMutation = useMutation({
    mutationFn: (payload: CreateTurbinePayload) => createTurbine(projectId, payload),
    onSuccess: () => {
      toast.success(t('toast.turbineCreateSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.turbineCreateError'));
    },
  });

  const updateTurbineMutation = useMutation({
    mutationFn: ({ turbineId, payload }: { turbineId: string; payload: UpdateTurbinePayload }) =>
      updateTurbine(projectId, turbineId, payload),
    onSuccess: () => {
      toast.success(t('toast.turbineUpdateSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.turbineUpdateError'));
    },
  });

  const deleteTurbineMutation = useMutation({
    mutationFn: (turbineId: string) => deleteTurbine(projectId, turbineId),
    onSuccess: () => {
      toast.success(t('toast.turbineDeleteSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.turbineDeleteError'));
    },
  });

  // =========================================================================
  // MEMBER MUTATIONS
  // =========================================================================

  const addMemberMutation = useMutation({
    mutationFn: (payload: AddMemberPayload) => addMember(projectId, payload),
    onSuccess: () => {
      toast.success(t('toast.memberAddSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.memberAddError'));
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: UpdateMemberPayload }) =>
      updateMember(projectId, memberId, payload),
    onSuccess: () => {
      toast.success(t('toast.memberUpdateSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.memberUpdateError'));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(projectId, memberId),
    onSuccess: () => {
      toast.success(t('toast.memberRemoveSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.memberRemoveError'));
    },
  });

  // =========================================================================
  // FILE MUTATIONS
  // =========================================================================

  const uploadFileMutation = useMutation({
    mutationFn: ({ file, category }: { file: File; category?: string }) =>
      uploadProjectFile(projectId, file, category),
    onSuccess: () => {
      toast.success(t('toast.fileUploadSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.fileUploadError'));
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => deleteProjectFile(projectId, fileId),
    onSuccess: () => {
      toast.success(t('toast.fileDeleteSuccess'));
      invalidateProject();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.fileDeleteError'));
    },
  });

  return {
    // Project
    updateProjectMutation,
    // Turbines
    createTurbineMutation,
    updateTurbineMutation,
    deleteTurbineMutation,
    // Members
    addMemberMutation,
    updateMemberMutation,
    removeMemberMutation,
    // Files
    uploadFileMutation,
    deleteFileMutation,
  };
}
