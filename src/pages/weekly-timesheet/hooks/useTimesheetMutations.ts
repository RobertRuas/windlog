/**
 * ============================================================================
 * HOOK: useTimesheetMutations
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook personalizado que centraliza todas as mutations (operações de escrita)
 * para o módulo de Weekly Timesheet.
 *
 * POR QUE EXISTE?
 * ---------------
 * Separa a lógica de mutations da UI, tornando o código mais organizado.
 * Cada componente recebe apenas as mutations que precisa.
 *
 * MUTATIONS DISPONÍVEIS:
 * ----------------------
 * - createTimesheet: cria novo timesheet
 * - updateTimesheet: atualiza metadata + dias + entradas
 * - deleteTimesheet: remove timesheet (soft delete)
 * - submitTimesheet: submete para aprovação
 * ============================================================================
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
  submitTimesheet,
  type CreateTimesheetPayload,
  type UpdateTimesheetPayload,
} from '@/services/weekly-timesheet.service';

/**
 * Hook useTimesheetMutations - Centraliza todas as mutations de timesheets.
 *
 * @param timesheetId - ID do timesheet atual (opcional, usado para invalidar)
 * @returns Objeto com todas as mutations disponíveis
 */
export function useTimesheetMutations(timesheetId?: string) {
  const { t } = useTranslation('timesheet');
  const queryClient = useQueryClient();

  /**
   * Invalida as queries de timesheets para recarregar os dados.
   * Chama invalidate tanto para a lista quanto para o timesheet específico.
   */
  function invalidateTimesheets() {
    queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    if (timesheetId) {
      queryClient.invalidateQueries({ queryKey: ['timesheet', timesheetId] });
    }
  }

  // =========================================================================
  // CREATE TIMESHEET
  // =========================================================================

  /**
   * Mutation para criar novo timesheet.
   * Após sucesso, invalida a lista e exibe toast de sucesso.
   */
  const createTimesheetMutation = useMutation({
    mutationFn: (payload: CreateTimesheetPayload) => createTimesheet(payload),
    onSuccess: (response) => {
      toast.success(t('toasts.created'));
      invalidateTimesheets();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toasts.error'));
    },
  });

  // =========================================================================
  // UPDATE TIMESHEET
  // =========================================================================

  /**
   * Mutation para atualizar timesheet existente.
   * Suporta atualização aninhada (metadata + dias + entradas).
   */
  const updateTimesheetMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTimesheetPayload;
    }) => updateTimesheet(id, data),
    onSuccess: () => {
      toast.success(t('toasts.updated'));
      invalidateTimesheets();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toasts.error'));
    },
  });

  // =========================================================================
  // DELETE TIMESHEET
  // =========================================================================

  /**
   * Mutation para remover timesheet (soft delete).
   */
  const deleteTimesheetMutation = useMutation({
    mutationFn: (id: string) => deleteTimesheet(id),
    onSuccess: () => {
      toast.success(t('toasts.deleted'));
      invalidateTimesheets();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toasts.error'));
    },
  });

  // =========================================================================
  // SUBMIT TIMESHEET
  // =========================================================================

  /**
   * Mutation para submeter timesheet para aprovação.
   * Muda o status de DRAFT para SUBMITTED.
   */
  const submitTimesheetMutation = useMutation({
    mutationFn: (id: string) => submitTimesheet(id),
    onSuccess: () => {
      toast.success(t('toasts.submitted'));
      invalidateTimesheets();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toasts.error'));
    },
  });

  return {
    createTimesheet: createTimesheetMutation,
    updateTimesheet: updateTimesheetMutation,
    deleteTimesheet: deleteTimesheetMutation,
    submitTimesheet: submitTimesheetMutation,
  };
}
