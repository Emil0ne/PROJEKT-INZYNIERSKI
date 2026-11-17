import { useEffect } from 'react';
import {
  MapPin, ArrowRight, CalendarDays, Check,
  Navigation, Wallet, Plane, Luggage, Clock,
} from 'lucide-react';
import { Button, Card, Input } from '../components/ui';

interface HomeProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const Eyebrow = ({ children }: { children: string }) => (
  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">{children}</p>
);

const FeatureList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2.5">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2.5 text-stone-700 text-sm">
        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {item}
      </li>
    ))}
  </ul>
);

const FEATURES = [
  { icon: CalendarDays, title: 'Harmonogram dzień po dniu', desc: 'Oś czasu z godzinami, czasem trwania i kolorami dni. Punkty planu od razu trafiają na mapę.' },
  { icon: Navigation, title: 'Mapa i trasa', desc: 'Wszystkie miejsca na jednej mapie, z trasą łączącą kolejne punkty dnia i podglądem dystansów.' },
  { icon: Plane, title: 'Loty i noclegi', desc: 'Rezerwacje lotów i hoteli w jednym miejscu, z wyszukiwarką lotnisk.' },
  { icon: Wallet, title: 'Budżet i rozliczenia', desc: 'Wydatki w kategoriach, podział kosztów między uczestników i pasek wykorzystania budżetu.' },
  { icon: Luggage, title: 'Lista pakowania', desc: 'Checklista przed wyjazdem – odhaczaj rzeczy i nie zapomnij o niczym.' },
  { icon: Clock, title: 'Kontrola tempa', desc: 'Automatyczne liczenie czasu spędzonego w atrakcjach i czasu wolnego.' },
];

export function Home({ onOpenAuth }: HomeProps) {
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <Eyebrow>Planer podróży</Eyebrow>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight text-zinc-900 leading-[1.08] mb-5">
              Zaplanuj podróż.<br />Bez dziesięciu zakładek.
            </h1>
            <p className="text-lg text-stone-600 mb-8 max-w-lg leading-relaxed">
              Harmonogram, mapa, loty, hotele i budżet w jednym narzędziu. Układaj plan dzień po dniu i widź całą trasę na mapie.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <div className="flex-1">
                <Input icon={<MapPin />} placeholder="Dokąd chcesz pojechać? np. Rzym, Madera…" aria-label="Cel podróży" />
              </div>
              <Button size="md" onClick={() => onOpenAuth('register')} className="group sm:px-5">
                Rozpocznij <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
            <p className="text-xs text-stone-500 mt-3">Darmowe konto. Bez karty kredytowej.</p>
          </div>

          {/* Podgląd produktu */}
          <div className="lg:col-span-6 hidden lg:block">
            <Card padding="none" className="overflow-hidden shadow-sm">
              <div className="grid grid-cols-5 h-[380px]">
                <div className="col-span-2 p-5 border-r border-stone-200 bg-white">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Dzień 1</span>
                    <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">14 maja</span>
                  </div>
                  <ol className="relative space-y-5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-stone-200">
                    {[
                      { t: '09:00', n: 'Śniadanie przy fontannie', d: '45 min', on: true },
                      { t: '10:30', n: 'Zwiedzanie Panteonu', d: '2 h', on: true },
                      { t: '13:00', n: 'Koloseum', d: '2,5 h', on: false },
                    ].map((s) => (
                      <li key={s.n} className="relative pl-6">
                        <span className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-white ring-1 ${s.on ? 'bg-emerald-600 ring-emerald-600' : 'bg-stone-300 ring-stone-300'}`} />
                        <p className="text-sm font-medium text-zinc-900 leading-snug">{s.n}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{s.t} · {s.d}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="col-span-3 relative bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=70"
                    alt="Widok mapy"
                    className="absolute inset-0 w-full h-full object-cover grayscale opacity-70"
                  />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 380" fill="none" aria-hidden>
                    <path d="M70 90 C 120 130, 150 200, 200 230 S 240 300, 230 330" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
                  </svg>
                  {[{ x: '23%', y: '24%' }, { x: '66%', y: '60%' }, { x: '76%', y: '86%' }].map((p, i) => (
                    <span key={i} className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center ring-2 ring-white shadow-sm" style={{ left: p.x, top: p.y }}>{i + 1}</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FUNKCJE */}
      <section id="how-it-works" className="py-20 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <Eyebrow>Funkcje</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-3">Wszystko, czego potrzebujesz na wyjazd</h2>
            <p className="text-stone-600">Zamiast arkuszy i przeskakiwania między aplikacjami – jedno miejsce na cały plan.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-200 border border-stone-200 rounded-xl overflow-hidden">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-6">
                <div className="w-9 h-9 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center mb-4">
                  <f.icon className="w-4 h-4 text-zinc-800" />
                </div>
                <h3 className="font-semibold tracking-tight text-zinc-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JAK TO DZIAŁA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <Eyebrow>Jak to działa</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-6">Trzy kroki do gotowego planu</h2>
            <ol className="space-y-6">
              {[
                ['Określ cel', 'Podaj miejsce, daty i swoje preferencje podróżnicze.'],
                ['Personalizuj', 'Dodaj atrakcje, ułóż harmonogram i logistykę.'],
                ['Podróżuj', 'Zabierz gotowy plan w drogę i kontroluj szczegóły.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-zinc-900 text-white text-sm font-medium flex items-center justify-center">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold tracking-tight text-zinc-900">{t}</h3>
                    <p className="text-sm text-stone-600 mt-0.5">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Card padding="lg">
            <Eyebrow>Podział kosztów</Eyebrow>
            <div className="divide-y divide-stone-200 border-y border-stone-200 mb-5">
              <div className="flex justify-between py-3 text-sm"><span className="text-stone-600">Całkowity koszt</span><span className="font-semibold tabular-nums text-zinc-900">4 250,00 PLN</span></div>
              <div className="flex justify-between py-3 text-sm"><span className="text-stone-600">Twój udział</span><span className="font-semibold tabular-nums text-zinc-900">2 125,00 PLN</span></div>
            </div>
            <FeatureList items={['Podział kosztów między uczestników', 'Kategoryzacja wydatków', 'Automatyczne podsumowanie wyjazdu']} />
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-zinc-900 rounded-xl px-8 py-14 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-3">Gotowy na podróż bez stresu?</h2>
            <p className="text-stone-400 mb-7 max-w-lg mx-auto">Zacznij planować swój następny wyjazd. Za darmo.</p>
            <Button variant="light" size="lg" onClick={() => onOpenAuth('register')}>
              Załóż darmowe konto
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
