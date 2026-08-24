import React from 'react';
import { CheckCircle, PhoneCall, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../../utils/formatters';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewRequests: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  onViewRequests,
}) => {
  if (!isOpen) return null;

  const handleRequestsClick = () => {
    triggerHaptic('light');
    onViewRequests();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-surface dark:bg-surface-dark rounded-card p-6 shadow-2xl border border-black/5 dark:border-white/10 text-center">
        {/* Animated Check Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto mb-4 flex items-center justify-center animate-bounce">
          <CheckCircle className="w-10 h-10 stroke-[2.5]" />
        </div>

        <h3 className="font-bold text-xl text-charcoal dark:text-white mb-1">
          Заявка принята!
        </h3>
        <p className="text-xs text-charcoal-muted dark:text-zinc-400 mb-6 leading-relaxed">
          Менеджер Comet.Uz уже связывается с вами для подтверждения заказа и уточнения детали доставки.
        </p>

        <div className="bg-surface-card dark:bg-surface-card-dark rounded-xl p-3.5 mb-6 flex items-center gap-3 text-left border border-black/5 dark:border-white/5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-charcoal dark:text-white block">
              Служба поддержки
            </span>
            <span className="text-xs text-primary dark:text-blue-400 font-bold">
              +998 (90) 123-45-67
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleRequestsClick}
            className="w-full py-3 rounded-button bg-primary text-white font-bold text-xs tracking-wide shadow-md shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-hover transition-all"
          >
            <span>ПОСМОТРЕТЬ МОИ ЗАЯВКИ</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-button bg-surface-card dark:bg-surface-card-dark text-charcoal dark:text-zinc-300 font-semibold text-xs hover:opacity-80 transition-all"
          >
            Продолжить покупки
          </button>
        </div>
      </div>
    </div>
  );
};
