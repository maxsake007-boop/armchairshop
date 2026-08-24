import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice, triggerHaptic } from '../../utils/formatters';
import { useTelegram } from '../../context/TelegramContext';
import { useRequests } from '../../context/RequestsContext';

interface LeadModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Uzbekistan Phone Formatter (+998 XX XXX XX XX)
const formatUzbekPhone = (rawInput: string): string => {
  let digits = rawInput.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9); // Max 9 digits after 998

  if (digits.length === 0) return '+998 ';
  if (digits.length <= 2) return `+998 ${digits}`;
  if (digits.length <= 5) return `+998 ${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
};

export const LeadModal: React.FC<LeadModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useTelegram();
  const { addRequest } = useRequests();

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+998 ');
  const [telegramUsername, setTelegramUsername] = useState('@');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Pre-fill user data from Telegram SDK if available
  useEffect(() => {
    if (user) {
      if (user.first_name || user.last_name) {
        const rawName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        // Remove numbers if any
        setCustomerName(rawName.replace(/[0-9]/g, ''));
      }
      if (user.username) {
        setTelegramUsername(`@${user.username}`);
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Name handler: strictly allow letters, spaces, hyphens (no digits/numbers)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/[0-9!@#$%^&*()_+={}[\]:;"'<>,.?/\\|~`]/g, '');
    setCustomerName(cleanValue);
  };

  // Phone handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatUzbekPhone(e.target.value));
  };

  // Telegram username handler
  const handleTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^a-zA-Z0-9_@]/g, '');
    if (!val.startsWith('@')) {
      val = '@' + val.replace(/@/g, '');
    }
    setTelegramUsername(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameClean = customerName.trim();
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    const tgUsernameClean = telegramUsername.replace(/^@/, '').trim();

    // Required Field Validations
    if (!nameClean) {
      setError('Пожалуйста, загляните в поле «Ваше имя» — оно обязательно для заполнения (только буквы).');
      triggerHaptic('warning');
      return;
    }

    if (phoneDigits.length !== 12) { // 998 + 9 digits
      setError('Укажите полный номер телефона в формате +998 XX XXX XX XX.');
      triggerHaptic('warning');
      return;
    }

    if (!tgUsernameClean) {
      setError('Пожалуйста, укажите ваш никнейм в Telegram (например, @comet_user).');
      triggerHaptic('warning');
      return;
    }

    setError('');
    addRequest({
      customerName: nameClean,
      phoneNumber: phoneNumber.trim(),
      telegramUsername: `@${tgUsernameClean}`,
      productId: product?.id,
      productName: product?.name,
      productPrice: product?.price,
      productImage: product?.images[0],
      notes: notes.trim(),
    });

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-surface dark:bg-surface-dark rounded-t-3xl sm:rounded-card p-6 shadow-2xl border border-black/5 dark:border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-card dark:border-surface-card-dark pb-4 mb-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Comet.Uz" className="w-9 h-9 object-contain" />
            <div>
              <h2 className="font-bold text-base text-charcoal dark:text-white leading-tight">
                Оформить заявку
              </h2>
              <p className="text-xs text-charcoal-muted dark:text-zinc-400">
                Менеджер перезвонит в течение 10 минут
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-card dark:hover:bg-surface-card-dark text-charcoal-muted dark:text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Product Summary */}
        {product && (
          <div className="bg-surface-card dark:bg-surface-card-dark rounded-2xl p-3 mb-4 flex items-center gap-3 border border-black/5 dark:border-white/5">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-xl bg-surface-light dark:bg-zinc-800"
            />
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                {product.categoryLabel}
              </span>
              <h4 className="font-semibold text-sm text-charcoal dark:text-white line-clamp-1">
                {product.name}
              </h4>
              <span className="font-extrabold text-sm text-charcoal dark:text-white">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        )}

        {/* Lead Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* 1. Name Input */}
          <div>
            <label className="block text-xs font-semibold text-charcoal dark:text-zinc-300 mb-1">
              Ваше имя *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={handleNameChange}
              placeholder="Только буквы (например: Алишер)"
              className="w-full px-4 py-3 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-black/5 dark:border-white/10 text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 2. Phone Input */}
          <div>
            <label className="block text-xs font-semibold text-charcoal dark:text-zinc-300 mb-1">
              Номер телефона *
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="+998 93 541 03 12"
              className="w-full px-4 py-3 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-black/5 dark:border-white/10 text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            />
          </div>

          {/* 3. Telegram Username Input */}
          <div>
            <label className="block text-xs font-semibold text-charcoal dark:text-zinc-300 mb-1">
              Никнейм в Telegram *
            </label>
            <input
              type="text"
              value={telegramUsername}
              onChange={handleTelegramChange}
              placeholder="@comet.uz"
              className="w-full px-4 py-3 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-black/5 dark:border-white/10 text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            />
          </div>

          {/* 4. Notes Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-charcoal dark:text-zinc-300">
                Комментарий к заказу (необязательно)
              </label>
              <span className={`text-[10px] font-mono font-semibold ${notes.length >= 180 ? 'text-red-500' : 'text-charcoal-muted dark:text-zinc-500'}`}>
                {notes.length}/200
              </span>
            </div>
            <textarea
              rows={2}
              value={notes}
              maxLength={200}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Удобное время для звонка или адрес доставки"
              className="w-full px-4 py-3 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-black/5 dark:border-white/10 text-sm text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-charcoal-muted dark:text-zinc-400 py-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Ваши данные под защитой. Без спама.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-button bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ОФОРМИТЬ ЗАЯВКУ</span>
          </button>
        </form>
      </div>
    </div>
  );
};
