import React from 'react';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { useRequests } from '../context/RequestsContext';
import { formatDate, formatPrice, triggerHaptic } from '../utils/formatters';

interface RequestsPageProps {
  onGoToCatalog: () => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ onGoToCatalog }) => {
  const { requests } = useRequests();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Новая заявка</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-primary/10 text-primary dark:text-blue-400 border border-primary/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            <span>В обработке</span>
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Успешно</span>
          </span>
        );
      case 'closed':
      default:
        return (
          <span className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Закрыта</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 px-5 pt-3 pb-24 animate-fade-in">
      <div>
        <h1 className="font-bold text-xl text-charcoal dark:text-white tracking-tight">
          Мои заявки
        </h1>
        <p className="text-xs text-charcoal-muted dark:text-zinc-400">
          История и статусы ваших обращений в Comet.Uz
        </p>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-surface-card dark:bg-surface-card-dark p-4 rounded-card border border-black/5 dark:border-white/5 space-y-3 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-charcoal dark:text-white">
                  #{req.id}
                </span>
                {getStatusBadge(req.status)}
              </div>

              {/* Product info if attached */}
              {req.productName && (
                <div className="flex items-center gap-3 bg-surface dark:bg-surface-dark p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                  {req.productImage && (
                    <img
                      src={req.productImage}
                      alt={req.productName}
                      className="w-12 h-12 object-cover rounded-lg bg-surface-light dark:bg-zinc-800"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-charcoal dark:text-white truncate">
                      {req.productName}
                    </h4>
                    {req.productPrice && (
                      <span className="font-extrabold text-xs text-charcoal dark:text-white">
                        {formatPrice(req.productPrice)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Meta details */}
              <div className="text-[11px] text-charcoal-muted dark:text-zinc-400 space-y-1 pt-1 border-t border-black/5 dark:border-white/5">
                <div className="flex justify-between">
                  <span>Клиент:</span>
                  <span className="font-semibold text-charcoal dark:text-white">{req.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Телефон:</span>
                  <span className="font-mono font-semibold text-charcoal dark:text-white">{req.phoneNumber}</span>
                </div>
                {req.telegramUsername && (
                  <div className="flex justify-between">
                    <span>Telegram:</span>
                    <span className="font-mono font-semibold text-primary dark:text-blue-400">{req.telegramUsername}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Дата создания:</span>
                  <span>{formatDate(req.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-surface-card dark:bg-surface-card-dark rounded-card border border-black/5 dark:border-white/5 my-6">
          <ClipboardList className="w-12 h-12 text-charcoal-muted dark:text-zinc-500 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-charcoal dark:text-white mb-1">
            У вас пока нет активных заявок
          </h3>
          <p className="text-xs text-charcoal-muted dark:text-zinc-400 mb-4 max-w-xs mx-auto">
            Выберите понравившееся эргономичное кресло в каталоге и оставьте заявку в 1 клик
          </p>
          <button
            onClick={() => {
              triggerHaptic('light');
              onGoToCatalog();
            }}
            className="bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-button shadow-md inline-flex items-center gap-2 hover:bg-primary-hover"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Перейти в каталог</span>
          </button>
        </div>
      )}
    </div>
  );
};
