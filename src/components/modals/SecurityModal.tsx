import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import PinInput from '../ui/PinInput';
import { ShieldCheck, ShieldAlert, Lock, ArrowLeft, KeyRound } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  titleOverride?: string;
}

export function SecurityModal({ isOpen, onClose, onSuccess, titleOverride }: SecurityModalProps) {
  const pinCode = useAppStore((state) => state.pinCode);
  const setPinCode = useAppStore((state) => state.setPinCode);
  const setUnlocked = useAppStore((state) => state.setUnlocked);
  const addToast = useAppStore((state) => state.addToast);

  // States
  const [errorText, setErrorText] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState<string | null>(null); // For dual-entry confirmation
  const [step, setStep] = useState<'enter' | 'confirm'>( 'enter' );

  if (!isOpen) return null;

  const isFirstTime = !pinCode;

  const handlePinChange = () => {
    if (errorText) setErrorText(null);
  };

  const handlePinComplete = (enteredPin: string) => {
    if (isFirstTime) {
      if (step === 'enter') {
        // First step of setting up PIN
        setTempPin(enteredPin);
        setStep('confirm');
        addToast('Пожалуйста, повторите PIN-код для подтверждения', 'info');
      } else {
        // Confirmation step
        if (enteredPin === tempPin) {
          setPinCode(enteredPin);
          setUnlocked(true);
          addToast('PIN-код успешно установлен и сохранен', 'success');
          onSuccess();
          reset();
        } else {
          setErrorText('Введенные PIN-коды не совпадают. Попробуйте еще раз.');
          addToast('Коды подтверждения не соответствуют', 'error');
          setStep('enter');
          setTempPin(null);
        }
      }
    } else {
      // Standard Unlock
      if (enteredPin === pinCode) {
        setUnlocked(true);
        addToast('Доступ предоставлен', 'success');
        onSuccess();
        reset();
      } else {
        setErrorText('Неверный PIN-код. Проверьте правильность ввода.');
        addToast('Доступ отклонен: неверный PIN', 'error');
      }
    }
  };

  const reset = () => {
    setErrorText(null);
    setTempPin(null);
    setStep('enter');
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Absolute blurry overlay background styling backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-300"
        onClick={handleCancel}
      />

      {/* Primary security dialog */}
      <div 
        className="glass-panel max-w-md w-full p-8 rounded-brand border-brand flex flex-col items-center gap-6 text-center text-white relative z-10 shadow-2xl animate-scale-in"
        style={{
          borderWidth: 'var(--app-border)',
          borderRadius: 'var(--app-radius)',
          borderColor: errorText ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-1"
          style={{
            backgroundColor: errorText ? 'rgba(239, 68, 68, 0.15)' : 'rgba(var(--app-primary), 0.15)',
            boxShadow: `0 0 15px ${errorText ? 'rgba(239, 68, 68, 0.1)' : 'rgba(var(--app-primary), 0.1)'}`,
          }}
        >
          {errorText ? (
            <ShieldAlert className="w-8 h-8 text-red-500" />
          ) : isFirstTime ? (
            <KeyRound className="w-8 h-8" style={{ color: 'var(--app-primary)' }} />
          ) : (
            <Lock className="w-8 h-8" style={{ color: 'var(--app-primary)' }} />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            {titleOverride || (isFirstTime 
              ? (step === 'enter' ? 'Новый PIN-код доступа' : 'Подтвердите PIN-код')
              : 'Система заблокирована')}
          </h2>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            {isFirstTime
              ? (step === 'enter' 
                  ? 'Придумайте 4-значный ПИН-код для обеспечения конфиденциальности панели SmashCore.' 
                  : 'Повторите придуманную комбинацию для верификации.')
              : 'Для просмотра графиков истории, управления и перехода в настройки введите ваш PIN-код безопасности.'}
          </p>
        </div>

        {/* Input keys cells container */}
        <div className="py-2" key={step}>
          <PinInput 
            length={4} 
            onChange={handlePinChange} 
            onComplete={handlePinComplete} 
          />
        </div>

        {errorText && (
          <p className="text-xs text-red-500 font-medium px-2 py-1 rounded bg-red-950/40 border border-red-900/30">
            {errorText}
          </p>
        )}

        <div className="w-full flex gap-3 mt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-brand text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 text-slate-300"
            style={{ borderRadius: 'var(--app-radius)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecurityModal;
