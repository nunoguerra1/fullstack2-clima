import { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  Sun,
  CloudRain,
  Cloud,
  Wind,
  Moon,
  CalendarBlank,
  MagnifyingGlass,
  Plus,
  Trash,
  SignOut,
  Lock,
  User as UserIcon,
  CircleNotch,
} from '@phosphor-icons/react';
import { WeatherContext } from './context/WeatherContext';

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric' }).format(date);
};

function AnimatedBackground() {
  const { data } = useContext(WeatherContext);

  let color1 = "bg-green-300";
  let color2 = "bg-blue-300";

  if (data) {
    if (data.weatherCode >= 51 && data.weatherCode <= 67) {
      color1 = "bg-gray-400"; color2 = "bg-blue-500";
    } else if (data.weatherCode >= 1 && data.weatherCode <= 3) {
      color1 = "bg-gray-300"; color2 = "bg-gray-400";
    } else if (!data.isDay) {
      color1 = "bg-indigo-900"; color2 = "bg-purple-900";
    } else {
      color1 = "bg-yellow-300"; color2 = "bg-orange-300";
    }
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f3f4f6] transition-colors duration-1000">
      <motion.div
        animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-3xl opacity-50 ${color1} transition-colors duration-1000`}
      />
      <motion.div
        animate={{ x: [0, -100, 50, 0], y: [0, 100, -50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-3xl opacity-50 ${color2} transition-colors duration-1000`}
      />
    </div>
  );
}

export default function App() {
  const { user, login, logout, allCities, data, error, loading, searchWeather, createWeather, updateWeather, deleteWeather } = useContext(WeatherContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newTemp, setNewTemp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; city: string } | null>(null);

  let cardBgColor = "bg-[#fcd34d]";
  let weatherText = "Ensolarado";
  let WeatherIcon = data?.isDay ? Sun : Moon;

  if (data) {
    if (data.weatherCode >= 51 && data.weatherCode <= 67) {
      cardBgColor = "bg-[#93c5fd]"; weatherText = "Chuvoso"; WeatherIcon = CloudRain;
    } else if (data.weatherCode >= 1 && data.weatherCode <= 3) {
      cardBgColor = "bg-[#d1d5db]"; weatherText = "Nublado"; WeatherIcon = Cloud;
    } else if (!data.isDay) {
      cardBgColor = "bg-[#374151]"; weatherText = "Noite Estrelada"; WeatherIcon = Moon;
    }
  }
  const cardTextColor = cardBgColor === "bg-[#374151]" ? "text-white" : "text-[#111827]";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    setIsSubmitting(true);
    const success = await login(username, password);
    setIsSubmitting(false);
    if (success) {
      toast.success(`Bem-vindo de volta, ${username}!`);
    } else {
      toast.error("Credenciais inválidas. Verifique os dados.");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity || !newTemp) {
      toast.error("Preencha a cidade e a temperatura!");
      return;
    }
    setIsSubmitting(true);

    const createPromise = createWeather({
      city: newCity,
      temperature: Number(newTemp),
      windSpeed: 12.4,
      isDay: true,
      weatherCode: 0,
      forecast: [
        { date: "2026-06-21", maxTemp: Number(newTemp) + 2, minTemp: Number(newTemp) - 2, weatherCode: 0 },
        { date: "2026-06-22", maxTemp: Number(newTemp) + 4, minTemp: Number(newTemp) - 1, weatherCode: 1 }
      ]
    });

    toast.promise(createPromise, {
      loading: 'Salvando no banco distribuído...',
      success: 'Cidade cadastrada com sucesso!',
      error: (err) => err.message
    });

    try { await createPromise; setNewCity(''); setNewTemp(''); } catch (e) { }
    setIsSubmitting(false);
  };

  const handleUpdateTemp = async (id: number, currentTemp: number, wind: number) => {
    const updatePromise = updateWeather(id, currentTemp + 1, wind);

    toast.promise(updatePromise, {
      loading: 'Atualizando temperatura...',
      success: 'Temperatura elevada em +1°C!',
      error: (err) => err.message
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    const deletePromise = deleteWeather(deleteTarget.id);

    toast.promise(deletePromise, {
      loading: 'Removendo da malha...',
      success: 'Registro deletado com sucesso.',
      error: (err) => err.message
    });

    try {
      await deletePromise;
      setDeleteTarget(null);
    } catch (e) {
      setDeleteTarget(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <AnimatedBackground />
        <Toaster position="top-center" reverseOrder={false} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-white/50 relative z-10 text-gray-800"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl mb-2 text-amber-600">
              <Sun size={40} weight="duotone" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sistema de Clima</h2>
            <p className="text-gray-500 text-sm">Entre para acessar as portas de microsserviços</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Usuário</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-amber-500 text-sm transition-colors"
                  placeholder="anderson_prof"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-amber-500 text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit" disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-4 flex items-center justify-center"
            >
              {isSubmitting ? <CircleNotch size={18} className="animate-spin" /> : "Acessar Painel"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 relative font-sans text-gray-900">
      <AnimatedBackground />
      <Toaster position="top-right" toastOptions={{ className: 'rounded-xl text-sm font-medium' }} />

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-6 rounded-[2rem] max-w-sm w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="text-red-500 bg-red-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash size={24} weight="bold" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Excluir Registro?</h3>
              <p className="text-sm text-gray-500 mt-1">Tem certeza que deseja remover os dados climáticos de <strong className="text-gray-800">{deleteTarget.city}</strong>?</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all">Cancelar</button>
                <button onClick={handleExecuteDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/20">Sim, Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white/60 backdrop-blur-md border-b border-gray-200/50 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Sun size={26} weight="duotone" className="text-amber-500" />
          <h1 className="text-base font-black tracking-tight text-gray-800 uppercase">
            Clima Cornélio & Região Distribuidor
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-white/80 border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
            Usuário: <span className="text-amber-600">{user.username}</span>
          </span>
          <button onClick={logout} className="text-xs font-bold bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5">
            <SignOut size={14} /> Sair
          </button>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

        <div className="space-y-6">
          <div className="bg-white/70 backdrop-blur-md p-5 rounded-[2rem] border border-white/60 shadow-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <MagnifyingGlass size={16} weight="bold" /> Consultar Cidade
            </h3>
            <div className="flex gap-2">
              <input
                type="text" value={searchCity} onChange={e => setSearchCity(e.target.value)}
                placeholder="Ex: Londrina..."
                className="flex-1 p-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button onClick={() => searchWeather(searchCity)} className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 rounded-xl transition-all active:scale-95">
                Buscar
              </button>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-5 rounded-[2rem] border border-white/60 shadow-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Plus size={16} weight="bold" /> Inserir Novo Clima
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1 font-semibold">Nome da Cidade</label>
                <input
                  type="text" value={newCity} onChange={e => setNewCity(e.target.value)}
                  placeholder="Cidade, Brasil" className="w-full p-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1 font-semibold">Temperatura Atual (°C)</label>
                <input
                  type="number" value={newTemp} onChange={e => setNewTemp(e.target.value)}
                  placeholder="25" className="w-full p-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-colors mt-1 shadow-sm">
                Cadastrar Cidade
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">

          <AnimatePresence mode="wait">
            {loading && (
              <div className="flex justify-center items-center py-12 gap-2 text-gray-400 text-sm font-semibold">
                <CircleNotch size={20} className="animate-spin" /> Buscando nós distribuídos...
              </div>
            )}

            {data && !loading && (
              <div className="w-full flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                  className={`w-full p-8 rounded-[3rem] ${cardBgColor} shadow-xl flex flex-col items-center ${cardTextColor} transition-colors duration-500 relative overflow-hidden`}
                >
                  <div className="mb-4">
                    <WeatherIcon size={84} weight="duotone" />
                  </div>

                  <h2 className="text-3xl font-black text-center tracking-tight mb-0.5">{data.city}</h2>
                  <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-6 text-center">{weatherText}</p>

                  <div className="text-7xl font-black tracking-tighter mb-6 flex items-start">
                    {Math.round(data.temperature)}
                    <span className="text-3xl mt-1 font-bold">°C</span>
                  </div>

                  <div className="w-full bg-white/20 rounded-[2rem] p-5 flex justify-between items-center backdrop-blur-md border border-white/10">
                    <div className="flex flex-col items-center gap-0.5 flex-1">
                      <Wind size={20} weight="bold" className="opacity-60" />
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Vento</span>
                      <span className="text-base font-black">{data.windSpeed} km/h</span>
                    </div>
                    <div className="h-10 w-[1px] bg-current opacity-10 rounded-full"></div>
                    <div className="flex flex-col items-center gap-0.5 flex-1">
                      {data.isDay ? <Sun size={20} weight="bold" className="opacity-60" /> : <Moon size={20} weight="bold" className="opacity-60" />}
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Período</span>
                      <span className="text-base font-black">{data.isDay ? 'Dia' : 'Noite'}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="w-full mt-4 flex flex-wrap justify-center gap-3"
                >
                  {data.forecast?.map((day, index) => (
                    <div key={index} className="bg-white/60 backdrop-blur-lg rounded-[1.5rem] p-4 shadow-sm border border-white/50 flex flex-col items-center min-w-[110px] flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                        <CalendarBlank size={12} /> {formatDate(day.date)}
                      </span>
                      <div className="flex items-center gap-1.5 text-sm font-black text-gray-800">
                        <span className="text-red-500">{day.maxTemp}°</span>
                        <span className="text-gray-300 font-normal">|</span>
                        <span className="text-blue-500">{day.minTemp}°</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-3 mb-4">
              Malha Regional Sincronizada (Redis Fila)
            </h3>

            <motion.div layout className="space-y-2.5">
              <AnimatePresence initial={false}>
                {allCities.map(c => (
                  <motion.div
                    key={c.id}
                    layoutId={`row-${c.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/80 p-3.5 rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 tracking-tight">{c.city}</h4>
                      <p className="text-[11px] text-gray-400">
                        Temp: <strong className="text-amber-600">{c.temperature}°C</strong> | Proprietário ID: {c.ownerId}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateTemp(c.id, c.temperature, c.windSpeed)}
                        className="text-[10px] bg-amber-500/10 text-amber-600 font-black px-2.5 py-1.5 rounded-xl hover:bg-amber-500 hover:text-white transition-all"
                      >
                        +1°C
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: c.id, city: c.city })}
                        className="text-[10px] bg-red-500/10 text-red-500 font-black p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash size={12} weight="bold" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

      </main>
    </div>
  );
}