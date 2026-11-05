import { useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  MapPin, ArrowRight, CalendarDays, CheckCircle2, 
  Navigation, ChevronDown, Sparkles, Route, 
  Star, Quote, Wallet, PieChart, Users, Receipt
} from 'lucide-react';

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (custom: number) => ({ opacity: 1, y: 0, transition: { delay: custom * 0.15, duration: 0.8, ease: "easeOut" }})
};

const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

interface HomeProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function Home({ onOpenAuth }: HomeProps) {
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  const scrollToHowItWorks = () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-[900px] h-[900px] bg-emerald-100/50 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full">
            <div className="text-left z-10 py-12 lg:py-0">
              <motion.div custom={1} initial="hidden" animate="visible" variants={heroVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold mb-8 shadow-sm">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                Nowy wymiar planowania
              </motion.div>
              <motion.h1 custom={2} initial="hidden" animate="visible" variants={heroVariants} className="text-6xl lg:text-[5.5rem] font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.05]">
                Zaplanuj podróż życia <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">bez stresu.</span>
              </motion.h1>
              <motion.p custom={3} initial="hidden" animate="visible" variants={heroVariants} className="text-xl text-slate-500 mb-12 max-w-xl leading-relaxed">
                Koniec z dziesiątkami otwartych zakładek. Zbuduj przejrzysty harmonogram, zoptymalizuj trasę na mapie i miej wszystkie detale wyjazdu zawsze pod ręką.
              </motion.p>
              <motion.div custom={4} initial="hidden" animate="visible" variants={heroVariants} className="bg-white p-3 rounded-full shadow-xl border border-slate-200/60 flex flex-col sm:flex-row items-center gap-3 max-w-3xl hover:shadow-2xl transition-shadow duration-300">
                <div className="flex-1 flex items-center px-5 w-full py-3 sm:py-0">
                  <MapPin className="w-6 h-6 text-emerald-500 mr-4 shrink-0" />
                  <input type="text" placeholder="Dokąd chcesz pojechać? np. Rzym, Madera..." className="w-full py-2 outline-none text-slate-700 bg-transparent text-lg placeholder:text-slate-400 font-medium"/>
                </div>
                <button onClick={() => onOpenAuth('register')} className="group w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-full font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 shrink-0 overflow-hidden relative cursor-pointer text-lg">
                  <span className="relative z-10 flex items-center gap-2">Rozpocznij <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" /></span>
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                </button>
              </motion.div>
            </div>
            <motion.div custom={5} initial="hidden" animate="visible" variants={heroVariants} className="relative hidden lg:block h-[650px] w-full">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[110%] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/50 p-3 transform rotate-2 hover:rotate-0 transition-transform duration-700 ease-out z-10">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80" alt="Map view" className="w-full h-full object-cover rounded-[2rem] opacity-90"/>
                <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><Navigation className="w-5 h-5" /></div>
                  <div><p className="text-sm font-bold text-slate-800">Koloseum</p><p className="text-[10px] font-semibold text-emerald-600">Zoptymalizowano trasę</p></div>
                </motion.div>
                <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute bottom-6 left-12 bg-white p-5 rounded-3xl shadow-2xl border border-slate-100 w-72 z-20">
                  <div className="flex items-center justify-between mb-4"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dzień 1</span><span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">14 Maja</span></div>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start"><div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0"></div><div><p className="text-sm font-bold text-slate-800">Śniadanie przy fontannie</p><p className="text-xs text-slate-500 mt-0.5">09:00 • 45 min</p></div></div>
                    <div className="flex gap-3 items-start"><div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 shrink-0"></div><div><p className="text-sm font-bold text-slate-800">Zwiedzanie Panteonu</p><p className="text-xs text-slate-500 mt-0.5">10:30 • 2h</p></div></div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        <motion.button onClick={scrollToHowItWorks} custom={6} initial="hidden" animate="visible" variants={heroVariants} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer text-slate-400 hover:text-emerald-500 transition-colors focus:outline-none">
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Odkryj aplikację</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}><ChevronDown className="w-6 h-6" /></motion.div>
        </motion.button>
      </section>

      <section id="how-it-works" className="py-24 bg-white border-y border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={scrollReveal} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Jak działa TravelPlanner?</h2>
            <p className="text-lg text-slate-500">Trzy proste kroki, które dzielą Cię od perfekcyjnie zorganizowanego wyjazdu.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-slate-100 -translate-y-1/2 -z-10"></div>
            {[
              { icon: MapPin, title: "1. Określ cel", desc: "Podaj miejsce, daty i swoje preferencje podróżnicze." },
              { icon: Sparkles, title: "2. Personalizuj", desc: "Dostosuj wygenerowany plan, dodaj atrakcje i ułóż logistykę." },
              { icon: Route, title: "3. Podróżuj", desc: "Zabierz gotowy plan w drogę i kontroluj wszystkie szczegóły." }
            ].map((step, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={scrollReveal} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 text-center relative">
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm"><step.icon className="w-7 h-7 text-emerald-500" /></div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-32 pb-16 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={scrollReveal} className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">Wszystko, czego potrzebujesz na wyjazd</h2>
            <p className="text-xl text-slate-500">Tworzenie exceli i przeskakiwanie między aplikacjami to przeszłość. Prawdziwe narzędzie "all-in-one".</p>
          </motion.div>

          {/* Sekcja 1: Harmonogram */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={scrollReveal} className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <div className="order-2 md:order-1">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><CalendarDays className="w-8 h-8 text-emerald-600" /></div>
              <h3 className="text-4xl font-bold text-slate-900 mb-6">Przejrzysty harmonogram</h3>
              <p className="text-slate-600 text-xl mb-8 leading-relaxed">Układaj plany dzień po dniu. Dodawaj własne punkty, przeliczaj czas spędzony w atrakcjach i miej pełną kontrolę nad tempem wycieczki.</p>
              <ul className="space-y-4">
                {['Zarządzanie dniami i godzinami', 'Automatyczne liczenie czasu wolnego', 'Ustalanie priorytetów zwiedzania'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium text-lg"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> {item}</li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
               <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 hover:shadow-md transition-shadow duration-300">
                  <div className="border-l-4 border-emerald-400 pl-4 py-2 relative bg-white p-4 rounded-r-xl shadow-sm">
                    <div className="absolute w-4 h-4 bg-emerald-500 rounded-full -left-[10px] top-5 border-4 border-white"></div>
                    <p className="text-sm font-bold text-emerald-600 mb-1">09:00 - 11:00</p><p className="text-lg font-bold text-slate-800">Galeria Uffizi</p><p className="text-slate-500 mt-1">Zarezerwuj bilety online z wyprzedzeniem.</p>
                  </div>
                  <div className="border-l-4 border-slate-300 pl-4 py-2 relative bg-white p-4 rounded-r-xl shadow-sm">
                    <div className="absolute w-4 h-4 bg-slate-400 rounded-full -left-[10px] top-5 border-4 border-white"></div>
                    <p className="text-sm font-bold text-slate-400 mb-1">11:30 - 13:00</p><p className="text-lg font-bold text-slate-800">Ponte Vecchio</p><p className="text-slate-500 mt-1">Spacer i robienie zdjęć.</p>
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Sekcja 2: Mapa */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={scrollReveal} className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
               <div className="w-full h-[300px] bg-emerald-100/50 rounded-2xl border border-emerald-200 flex items-center justify-center relative overflow-hidden group hover:bg-emerald-100/80 transition-colors">
                 <div className="absolute top-1/2 left-[30%] bg-white p-3 rounded-full shadow-lg z-10 transition-transform group-hover:scale-110 group-hover:-translate-y-2"><MapPin className="w-6 h-6 text-emerald-600"/></div>
                 <div className="absolute top-[30%] right-[30%] bg-white p-3 rounded-full shadow-lg z-10 transition-transform group-hover:scale-110 group-hover:-translate-y-2 delay-75"><MapPin className="w-6 h-6 text-emerald-600"/></div>
                 <div className="absolute top-[40%] left-[38%] w-40 h-1 bg-emerald-500/50 rotate-[-15deg] rounded-full"></div>
               </div>
            </div>
            <div>
              <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm"></div>
              <h3 className="text-4xl font-bold text-slate-900 mb-6">Logistyka bez tajemnic</h3>
              <p className="text-slate-600 text-xl mb-8 leading-relaxed">Każdy punkt z Twojego planu automatycznie ląduje na interaktywnej mapie. Od razu widzisz, czy Twoja trasa ma sens i nie nadkładasz kilometrów.</p>
              <ul className="space-y-4">
                {['Wizualizacja punktów per dzień', 'Automatyczne centrowanie', 'Podgląd dystansów pieszych'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium text-lg"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> {item}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Sekcja 3 (ZAMIENIONA): Inteligentny budżet i rozliczenia */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={scrollReveal} className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Wallet className="w-8 h-8 text-amber-600" /></div>
              <h3 className="text-4xl font-bold text-slate-900 mb-6">Rozliczenia pod kontrolą</h3>
              <p className="text-slate-600 text-xl mb-8 leading-relaxed">Planujesz wyjazd ze znajomymi? Rejestrujcie koszty na bieżąco. Aplikacja automatycznie przeliczy wydatki i pokaże, kto komu ile wisi.</p>
              <ul className="space-y-4">
                {['Podział kosztów między uczestników', 'Kategoryzacja wydatków (jedzenie, nocleg)', 'Automatyczne podsumowanie wyjazdu'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium text-lg"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> {item}</li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
               <div className="w-full h-[300px] bg-amber-50/60 rounded-2xl border border-amber-100 p-6 flex flex-col justify-center relative overflow-hidden group">
                 {/* Elementy udające widok budżetu */}
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 flex justify-between items-center z-10 transition-transform group-hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"><PieChart className="w-5 h-5 text-amber-600" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">CAŁKOWITY KOSZT</p>
                        <p className="text-lg font-black text-slate-800">4 250,00 PLN</p>
                      </div>
                    </div>
                 </div>
                 
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center z-10 transition-transform group-hover:-translate-y-1 delay-75">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Receipt className="w-5 h-5 text-emerald-600" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">TWÓJ UDZIAŁ</p>
                        <p className="text-lg font-black text-slate-800">2 125,00 PLN</p>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">Ty</div>
                      <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500"><Users className="w-4 h-4"/></div>
                    </div>
                 </div>
                 
                 <Wallet className="absolute -bottom-8 -right-8 w-48 h-48 text-amber-200/40 z-0 transition-transform group-hover:scale-110 duration-700" />
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={scrollReveal} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Podróżnicy już to wiedzą</h2>
            <p className="text-lg text-slate-500">Zobacz, co o planowaniu z nami mówią pierwsi testerzy.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Michał T.", role: "Digital Nomad", text: "Kiedyś spędzałem godziny w Excelu. Teraz wrzucam miasta na mapę, a TravelPlanner sam układa mi optymalną trasę. Złoto!" },
              { name: "Anna K.", role: "Podróżuje z rodziną", text: "Najlepsza funkcja to budżet i dzielenie kosztów. W końcu nie musimy się z mężem zastanawiać, ile wydaliśmy na bilety w Rzymie." },
              { name: "Kamil R.", role: "Weekendowy odkrywca", text: "Świetnie sprawdza się do zarządzania czasem podczas intensywnych weekendowych city-breaków. Nic nam nie umyka." }
            ].map((review, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={scrollReveal} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-200" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 mb-6 italic">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">{review.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{review.name}</p>
                    <p className="text-xs text-slate-500">{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={scrollReveal} className="bg-gradient-to-br from-emerald-600 to-teal-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-emerald-900/20">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Gotowy na podróż bez stresu?</h2>
              <p className="text-emerald-100 text-lg md:text-xl mb-10">Dołącz do nas i zacznij planować swoje wyjazdy w zupełnie nowym wymiarze. Za darmo.</p>
              <button onClick={() => onOpenAuth('register')} className="bg-white hover:bg-slate-50 text-emerald-700 px-10 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-xl cursor-pointer">
                Załóż darmowe konto
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}