import { useContext, useState } from 'react';
import { WeatherContext } from './context/WeatherContext';

export default function App() {
  const { user, login, logout, allCities, data, error, loading, searchWeather, createWeather, updateWeather, deleteWeather } = useContext(WeatherContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const [newCity, setNewCity] = useState('');
  const [newTemp, setNewTemp] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <form onSubmit={(e) => { e.preventDefault(); login(username, password); }} className="bg-slate-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-sky-400">🌦️ Sistema de Clima - Login</h2>
          {error && <p className="text-red-400 mb-4 bg-red-950/40 p-2 rounded text-sm text-center">{error}</p>}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Usuário</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-sky-500" placeholder="anderson_prof" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-sky-500" placeholder="password123" />
          </div>
          <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 font-bold py-2 rounded transition-colors">Entrar</button>
        </form>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity || !newTemp) return;
    await createWeather({
      city: newCity,
      temperature: Number(newTemp),
      windSpeed: 12.5,
      isDay: true,
      weatherCode: 1,
      forecast: [
        { date: "2026-06-22", maxTemp: Number(newTemp) + 2, minTemp: Number(newTemp) - 3, weatherCode: 1 }
      ]
    });
    setNewCity(''); setNewTemp('');
  };

  const handleConfirmDelete = (id: number, city: string) => {
    if (window.confirm(`Tem certeza absoluta de que deseja remover os dados climáticos de: ${city}?`)) {
      deleteWeather(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-12">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold tracking-wide text-sky-400">☀️ CLIMA CORNÉLIO & REGIÃO DISTRIBUÍDO</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-slate-700 px-3 py-1 rounded-full border border-slate-600">Usuário: <strong className="text-sky-300">{user.username}</strong></span>
          <button onClick={logout} className="text-sm bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-semibold px-4 py-1.5 rounded transition-all">Sair</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">

        <div className="space-y-6">
          <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow">
            <h3 className="text-lg font-semibold mb-3 text-sky-400">🔍 Consultar Cidade</h3>
            <div className="flex gap-2">
              <input type="text" value={searchCity} onChange={e => setSearchCity(e.target.value)} placeholder="Ex: Cornélio Procópio" className="flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-sm focus:outline-none focus:border-sky-500" />
              <button onClick={() => searchWeather(searchCity)} className="bg-sky-500 hover:bg-sky-600 px-4 rounded text-sm font-bold">Buscar</button>
            </div>
          </div>

          <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow">
            <h3 className="text-lg font-semibold mb-3 text-emerald-400">➕ Cadastrar Clima Local</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Nome da Cidade</label>
                <input type="text" value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Cidade, Brasil" className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Temperatura Atual (°C)</label>
                <input type="number" value={newTemp} onChange={e => setNewTemp(e.target.value)} placeholder="25" className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-2 rounded transition-colors mt-2 text-slate-900">Cadastrar Cidade</button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {loading && <p className="text-center py-4 text-sky-400 animate-pulse font-medium">Buscando dados na malha local...</p>}

          {data && (
            <div className="bg-gradient-to-br from-sky-600 to-blue-800 p-6 rounded-xl shadow-lg border border-sky-400/30 relative">
              <h2 className="text-2xl font-bold tracking-wide">{data.city}</h2>
              <div className="flex items-center justify-between mt-4">
                <span className="text-5xl font-black">{data.temperature.toFixed(1)}°C</span>
                <div className="text-right text-sm opacity-90">
                  <p>💨 Vento: {data.windSpeed} km/h</p>
                  <p>{data.isDay ? '☀️ Período Diurno' : '🌙 Período Noturno'}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-sky-300/30 grid grid-cols-3 gap-2 text-center text-xs">
                {data.forecast?.map((f, i) => (
                  <div key={i} className="bg-sky-900/40 p-2 rounded border border-sky-300/10">
                    <p className="font-semibold text-sky-200">{f.date}</p>
                    <p className="text-base font-bold mt-1">📈 {f.maxTemp}°C</p>
                    <p className="opacity-75">📉 {f.minTemp}°C</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow">
            <h3 className="text-lg font-semibold mb-4 text-sky-400 border-b border-slate-700 pb-2">📋 Cidades Ativas no Sistema</h3>
            <div className="space-y-3">
              {allCities.map(c => (
                <div key={c.id} className="bg-slate-700/40 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center border border-slate-700 gap-4">
                  <div>
                    <h4 className="font-bold text-base text-sky-300">{c.city}</h4>
                    <p className="text-sm opacity-80">Temperatura: <strong className="text-white">{c.temperature}°C</strong> | Criado por Usuário ID: {c.ownerId}</p>
                  </div>
                  <div className="flex gap-2 text-xs font-bold">
                    <button onClick={() => updateWeather(c.id, c.temperature + 1, c.windSpeed)} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-3 py-1.5 rounded transition-all">☀️ +1°C (Edit)</button>
                    <button onClick={() => handleConfirmDelete(c.id, c.city)} className="bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white px-3 py-1.5 rounded border border-red-500/30 transition-all">Excluir</button>
                  </div>
                </div>
              ))}
              {allCities.length === 0 && <p className="text-sm opacity-60 text-center py-4">Nenhuma cidade cadastrada no banco de dados regional.</p>}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}