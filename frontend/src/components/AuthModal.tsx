import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2, X, Mail, Lock, User as UserIcon, Eye, EyeOff, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Input } from './ui';
import { LAYER } from '../lib/layers';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register' | 'reset';
  onSwitchMode: (mode: 'login' | 'register' | 'reset') => void;
}

export function AuthModal({ isOpen, onClose, initialMode, onSwitchMode }: AuthModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Stany dla komunikacji z backendem (Karol)
  const [authError, setAuthError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Czyszczenie formularza i błędów przy zamykaniu lub zmianie trybu
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    }
    setAuthError('');
    setResetSuccess(false);
  }, [isOpen, initialMode]);

  // Obsługa zamykania modala klawiszem Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const validations = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password !== '' && password === confirmPassword
  };

  const getConditionColor = (isValid: boolean) => {
    if (password.length === 0) return 'text-slate-400';
    return isValid ? 'text-emerald-600 font-medium' : 'text-red-500';
  };

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    setResetSuccess(false);

    // Symulacja zapytania do API dla Karola
    setTimeout(() => {
      setIsLoading(false);
      
      if (initialMode === 'reset') {
        // TODO (Karol - Backend): POST /api/auth/reset-password
        // Jeśli 200 OK:
        setResetSuccess(true);
        // Po 3 sekundach wracamy do logowania
        setTimeout(() => {
          onSwitchMode('login');
          setResetSuccess(false);
        }, 3000);
        
        // Jeśli błąd (np. brak maila w bazie):
        // setAuthError('Nie znaleziono konta z takim adresem e-mail.');
      } else if (initialMode === 'login') {
        // TODO (Karol - Backend): POST /api/auth/login
        // Symulacja złego hasła dla testów UI (wpisz "zledane" jako hasło, żeby zobaczyć błąd)
        if (password === 'zledane') {
          setAuthError('Nieprawidłowy adres e-mail lub hasło.');
        } else {
          // Sukces:
          onClose();
          navigate('/dashboard');
        }
      } else {
        // TODO (Karol - Backend): POST /api/auth/register
        onClose();
        navigate('/dashboard');
      }
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-overlay"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 ${LAYER.modal} flex items-center justify-center p-4 sm:p-6`}
        >
          <div 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm cursor-pointer"
          />

          <motion.div 
            key="modal-content"
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }} 
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200/80 shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row h-auto md:h-[680px]"
          >
            <div className="hidden md:block md:w-5/12 bg-emerald-900 relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80" alt="Travel" className="absolute inset-0 w-full h-full object-cover opacity-60"/>
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 to-transparent"></div>
              <div className="absolute bottom-10 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-4 opacity-80"><Globe2 className="w-5 h-5" /><span className="font-bold tracking-wide">TravelPlanner</span></div>
                <AnimatePresence mode="wait">
                  <motion.h3 key={initialMode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="text-2xl font-bold leading-snug">
                    {initialMode === 'login' ? 'Witaj z powrotem na szlaku.' : 
                     initialMode === 'register' ? 'Rozpocznij swoją przygodę już dziś.' : 
                     'Znajdziemy Twój zagubiony szlak.'}
                  </motion.h3>
                </AnimatePresence>
              </div>
            </div>

            <div className="w-full md:w-7/12 p-8 sm:p-12 relative flex flex-col h-full overflow-y-auto">
              <Button variant="ghost" pill onClick={onClose} aria-label="Zamknij" className="absolute top-6 right-6 !p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 z-20"><X className="w-5 h-5" /></Button>
              
              <AnimatePresence mode="wait">
                <motion.div key={initialMode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: "easeOut" }} className="flex-1 flex flex-col justify-center">
                  <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900">
                      {initialMode === 'login' ? 'Zaloguj się' : initialMode === 'register' ? 'Utwórz konto' : 'Resetuj hasło'}
                    </h2>
                    <p className="text-slate-500 mt-2">
                      {initialMode === 'login' ? 'Wpisz swoje dane, aby kontynuować.' : 
                       initialMode === 'register' ? 'Wypełnij formularz, aby dołączyć.' : 
                       'Podaj e-mail, na który wyślemy instrukcje.'}
                    </p>
                  </div>

                  {/* UI BŁĘDÓW I SUKCESÓW DLA KAROLA */}
                  <AnimatePresence>
                    {authError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }} 
                        animate={{ opacity: 1, y: 0, height: 'auto' }} 
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {authError}
                        </div>
                      </motion.div>
                    )}

                    {resetSuccess && initialMode === 'reset' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }} 
                        animate={{ opacity: 1, y: 0, height: 'auto' }} 
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="p-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          Link resetujący został wysłany na Twój e-mail!
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    {initialMode === 'register' && (
                      <Input type="text" placeholder="Imię" icon={<UserIcon />} />
                    )}

                    <Input type="email" placeholder="Adres e-mail" icon={<Mail />} required />

                    {initialMode !== 'reset' && (
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Hasło"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock />}
                        rightSlot={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>}
                      />
                    )}

                    {initialMode === 'register' && (
                      <>
                        <div className="grid grid-cols-2 gap-2 mt-2 px-1">
                          <div className={`text-xs flex items-center gap-1.5 transition-colors ${getConditionColor(validations.length)}`}><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Min. 12 znaków</div>
                          <div className={`text-xs flex items-center gap-1.5 transition-colors ${getConditionColor(validations.lowercase && validations.uppercase)}`}><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Mała i duża litera</div>
                          <div className={`text-xs flex items-center gap-1.5 transition-colors ${getConditionColor(validations.number)}`}><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Min. 1 cyfra</div>
                          <div className={`text-xs flex items-center gap-1.5 transition-colors ${getConditionColor(validations.special)}`}><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Znak specjalny</div>
                        </div>
                        <div className="mt-4">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Powtórz hasło"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            icon={<Lock />}
                            state={confirmPassword.length > 0 ? (validations.match ? 'success' : 'error') : 'default'}
                            rightSlot={<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>}
                          />
                        </div>
                        {confirmPassword.length > 0 && !validations.match && <p className="text-red-500 text-xs mt-1 px-1">Hasła nie są identyczne.</p>}
                      </>
                    )}

                    {initialMode === 'login' && (
                      <div className="flex justify-end pt-2">
                        <button type="button" onClick={() => onSwitchMode('reset')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-4 transition-colors cursor-pointer">
                          Zapomniałeś hasła?
                        </button>
                      </div>
                    )}

                    <Button type="submit" fullWidth isLoading={isLoading} className="mt-6 h-[52px]">
                      {initialMode === 'login' ? 'Zaloguj się' :
                       initialMode === 'register' ? 'Utwórz konto' :
                       'Wyślij link'}
                    </Button>
                  </form>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 text-center text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                {initialMode === 'login' ? (
                  <>Nie masz jeszcze konta? <button onClick={() => onSwitchMode('register')} className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer">Zarejestruj się</button></>
                ) : initialMode === 'register' ? (
                  <>Masz już konto? <button onClick={() => onSwitchMode('login')} className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer">Zaloguj się</button></>
                ) : (
                  <button onClick={() => onSwitchMode('login')} className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer flex items-center justify-center gap-1.5 w-full">
                    <ArrowLeft className="w-4 h-4" /> Wróć do logowania
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}