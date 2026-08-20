import React from 'react';
import { Trash2, AlertTriangle, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface BulkDeleteErrorDetails {
  requested: number;
  deleted: number;
  failed: number;
  errorMessage: string;
  details?: string[];
}

export interface BulkDeleteItemSummary {
  id: string;
  primary: string;
  secondary?: string;
  badge?: string;
}

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  entityName: string;
  itemCount: number;
  selectedItems?: BulkDeleteItemSummary[];
  dependencies?: string[];
  isDeleting: boolean;
  errorResult?: BulkDeleteErrorDetails | null;
  warningNote?: string;
  secondaryAction?: {
    label: string;
    onClick: () => Promise<void>;
    disabled?: boolean;
  };
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  itemCount,
  selectedItems = [],
  dependencies = [],
  isDeleting,
  errorResult,
  warningNote,
  secondaryAction
}) => {
  if (!isOpen) return null;

  const hasDependencies = dependencies.length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      id="bulk-delete-modal-backdrop"
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        id="bulk-delete-modal-content"
      >
        {/* Modal Header */}
        <div className={`p-5 flex items-start justify-between border-b ${
          hasDependencies 
            ? 'bg-amber-500/10 border-amber-200 dark:border-amber-900/50' 
            : 'bg-rose-500/10 border-rose-200 dark:border-rose-900/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              hasDependencies 
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              {hasDependencies ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white" id="bulk-delete-modal-title">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {hasDependencies 
                  ? 'Deletion is blocked due to existing dependencies' 
                  : 'This action cannot be undone. Records will be permanently deleted from Supabase.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            id="btn-close-bulk-delete-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Error Banner if bulk delete failed */}
          {errorResult && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Bulk Delete Failed</span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Requested</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{errorResult.requested}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Deleted</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">{errorResult.deleted}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Failed</div>
                  <div className="font-bold text-rose-600 dark:text-rose-400">{errorResult.failed}</div>
                </div>
              </div>
              <div className="text-rose-700 dark:text-rose-300 font-mono text-[11px] break-words">
                <span className="font-bold font-sans">Supabase error:</span> {errorResult.errorMessage}
              </div>
            </div>
          )}

          {/* Dependency Block Notice */}
          {hasDependencies && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Linked Dependencies Found</span>
              </div>
              <p className="text-amber-700 dark:text-amber-400">
                The following records cannot be deleted because other training modules or courses depend on them. Please remove or reassign their linked items first:
              </p>
              <ul className="space-y-1.5 mt-2 pl-4 list-disc text-amber-900 dark:text-amber-200 font-medium">
                {dependencies.map((dep, idx) => (
                  <li key={idx} className="text-[11px] leading-relaxed">
                    {dep}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning Note if any */}
          {warningNote && !hasDependencies && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              <span>{warningNote}</span>
            </div>
          )}

          {/* List of Selected Items */}
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Selected {entityName} ({itemCount})</span>
              <span className="text-[11px] font-normal text-slate-400">Will be permanently removed</span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
              {selectedItems.map((item) => (
                <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                      <span className="font-mono text-blue-600 dark:text-blue-400">{item.primary}</span>
                      {item.secondary && (
                        <span className="text-slate-500 dark:text-slate-400 truncate">• {item.secondary}</span>
                      )}
                    </div>
                  </div>
                  {item.badge && (
                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            id="btn-cancel-bulk-delete"
          >
            Cancel
          </button>

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={isDeleting || secondaryAction.disabled}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="btn-secondary-bulk-action"
            >
              {secondaryAction.label}
            </button>
          )}

          {!hasDependencies && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              id="btn-confirm-bulk-delete"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete {itemCount} {itemCount === 1 ? entityName.slice(0, -1) : entityName}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
