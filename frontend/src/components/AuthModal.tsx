import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2, X, Mail, Lock, User as UserIcon, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
}

export function AuthModal({ isOpen, onClose, initialMode, onSwitchMode }: AuthModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const validations = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password !== '' && password === confirmPassword
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm cursor-pointer"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row h-auto md:h-[680px]"
        >
          <div className="hidden md:block md:w-5/12 bg-emerald-900 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80" alt="Travel" className="absolute inset-0 w-full h-full object-cover opacity-60"/>
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 to-transparent"></div>
            <div className="absolute bottom-10 left-8 right-8 text-white">
              <div className="flex items-center gap-2 mb-4 opacity-80"><Globe2 className="w-5 h-5" /><span className="font-bold tracking-wide">TravelPlanner</span></div>
              <AnimatePresence mode="wait">
                <motion.h3 key={initialMode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="text-2xl font-bold leading-snug">
                  {initialMode === 'login' ? 'Witaj z powrotem na szlaku.' : 'Rozpocznij swoją przygodę już dziś.'}
                </motion.h3>
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full md:w-7/12 p-8 sm:p-12 relative flex flex-col h-full overflow-y-auto">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer z-20"><X className="w-5 h-5" /></button>
            <AnimatePresence mode="wait">
              <motion.div key={initialMode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: "easeOut" }} className="flex-1 flex flex-col justify-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900">{initialMode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}</h2>
                  <p className="text-slate-500 mt-2">{initialMode === 'login' ? 'Wpisz swoje dane, aby kontynuować.' : 'Wypełnij formularz, aby dołączyć.'}</p>
                </div>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  {initialMode === 'register' && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-slate-400" /></div>
                      <input type="text" placeholder="Imię" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"/>
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                    <input type="email" placeholder="Adres e-mail" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"/>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                    <input type={showPassword ? "text" : "password"} placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                  </div>
                  {initialMode === 'register' && (
                    <>
                      <div className="grid grid-cols-2 gap-2 mt-2 px-1">
                        <div className={`text-xs flex items-center gap-1.5 ${validations.length ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}><CheckCircle2 className="w-3.5 h-3.5" /> Min. 12 znaków</div>
                        <div className={`text-xs flex items-center gap-1.5 ${validations.lowercase && validations.uppercase ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}><CheckCircle2 className="w-3.5 h-3.5" /> Mała i duża litera</div>
                        <div className={`text-xs flex items-center gap-1.5 ${validations.number ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}><CheckCircle2 className="w-3.5 h-3.5" /> Min. 1 cyfra</div>
                        <div className={`text-xs flex items-center gap-1.5 ${validations.special ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}><CheckCircle2 className="w-3.5 h-3.5" /> Znak specjalny</div>
                      </div>
                      <div className="relative mt-4">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                        <input type={showConfirmPassword ? "text" : "password"} placeholder="Powtórz hasło" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full pl-11 pr-12 py-3 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${confirmPassword.length > 0 ? (validations.match ? 'border-emerald-500 focus:ring-emerald-500/20' : 'border-red-400 focus:ring-red-400/20') : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}/>
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                      </div>
                      {confirmPassword.length > 0 && !validations.match && <p className="text-red-500 text-xs mt-1 px-1">Hasła nie są identyczne.</p>}
                    </>
                  )}
                  {initialMode === 'login' && <div className="flex justify-end pt-2"><a href="#" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">Zapomniałeś hasła?</a></div>}
                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors mt-6 cursor-pointer shadow-md shadow-emerald-200">
                    {initialMode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
                  </button>
                </form>
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 text-center text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
              {initialMode === 'login' ? (
                <>Nie masz jeszcze konta?{' '}<button onClick={() => onSwitchMode('register')} className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer">Zarejestruj się</button></>
              ) : (
                <>Masz już konto?{' '}<button onClick={() => onSwitchMode('login')} className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer">Zaloguj się</button></>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}