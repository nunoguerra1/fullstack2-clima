import { createContext, useReducer, useEffect, type ReactNode } from 'react';

export type ForecastDay = {
    id?: number;
    date: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
};

export type WeatherData = {
    id: number;
    city: string;
    temperature: number;
    windSpeed: number;
    isDay: boolean;
    weatherCode: number;
    ownerId: number;
    forecast: ForecastDay[];
};

type UserInfo = { id: number; username: string } | null;

type State = {
    data: WeatherData | null;
    allCities: WeatherData[];
    loading: boolean;
    error: string | null;
    user: UserInfo;
    token: string | null;
};

type Action =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: WeatherData }
    | { type: 'FETCH_ALL_SUCCESS'; payload: WeatherData[] }
    | { type: 'FETCH_ERROR'; payload: string }
    | { type: 'LOGIN_SUCCESS'; payload: { user: UserInfo; token: string } }
    | { type: 'LOGOUT' };

const initialState: State = {
    data: null,
    allCities: [],
    loading: false,
    error: null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    token: localStorage.getItem('token'),
};

function weatherReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'FETCH_START': return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS': return { ...state, data: action.payload, loading: false, error: null };
        case 'FETCH_ALL_SUCCESS': return { ...state, allCities: action.payload, loading: false, error: null };
        case 'FETCH_ERROR': return { ...state, loading: false, error: action.payload };
        case 'LOGIN_SUCCESS': return { ...state, user: action.payload.user, token: action.payload.token, error: null };
        case 'LOGOUT': return { ...state, data: null, allCities: [], user: null, token: null };
        default: return state;
    }
}

type ContextType = State & {
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loadAllCities: () => Promise<void>;
    searchWeather: (city: string) => Promise<void>;
    createWeather: (payload: any) => Promise<void>;
    updateWeather: (id: number, temperature: number, windSpeed: number) => Promise<void>;
    deleteWeather: (id: number) => Promise<void>;
};

export const WeatherContext = createContext<ContextType>({} as ContextType);

export const WeatherProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(weatherReducer, initialState);

    const login = async (username: string, password: string): Promise<boolean> => {
        dispatch({ type: 'FETCH_START' });
        try {
            const res = await fetch('http://localhost:3001/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Falha ao autenticar.");

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
            return true;
        } catch (err: any) {
            dispatch({ type: 'FETCH_ERROR', payload: err.message });
            return false;
        }
    };

    const logout = () => {
        fetch('http://localhost:3001/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` }
        }).catch(() => { });

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    const loadAllCities = async () => {
        if (!state.token) return;
        try {
            const res = await fetch('http://localhost:3002/weather/search', {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            const data = await res.json();
            if (res.ok) dispatch({ type: 'FETCH_ALL_SUCCESS', payload: data });
        } catch (err) { }
    };

    const searchWeather = async (city: string) => {
        const cleanCity = city.trim();
        if (!cleanCity) {
            dispatch({ type: 'FETCH_ERROR', payload: "Por favor, introduza o nome de uma cidade." });
            return;
        }
        dispatch({ type: 'FETCH_START' });
        try {
            const res = await fetch(`http://localhost:3002/weather/search?city=${cleanCity}`, {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Cidade não encontrada.");
            dispatch({ type: 'FETCH_SUCCESS', payload: data });
        } catch (err: any) {
            dispatch({ type: 'FETCH_ERROR', payload: err.message });
        }
    };

    const createWeather = async (payload: any) => {
        const res = await fetch('http://localhost:3002/weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Erro ao cadastrar clima.");
        }
    };

    const updateWeather = async (id: number, temperature: number, windSpeed: number) => {
        const res = await fetch(`http://localhost:3002/weather/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ temperature, windSpeed })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Erro ao atualizar.");
        }
    };

    const deleteWeather = async (id: number) => {
        const res = await fetch(`http://localhost:3002/weather/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Erro ao excluir.");
        }
    };

    useEffect(() => {
        if (!state.token) return;

        const ws = new WebSocket('ws://localhost:3003');

        ws.onopen = () => console.log("[FRONTEND] Conectado ao canal de notificações WebSocket!");

        ws.onmessage = (event) => {
            const msgData = JSON.parse(event.data);
            console.log("[FRONTEND] Notificação em tempo real recebida:", msgData);

            loadAllCities();
            if (state.data && state.data.city === msgData.city) {
                searchWeather(msgData.city);
            }
        };

        ws.onclose = () => console.log("[FRONTEND] WebSocket desconectado.");

        return () => ws.close();
    }, [state.token, state.data?.city]);

    useEffect(() => {
        if (state.token) loadAllCities();
    }, [state.token]);

    return (
        <WeatherContext.Provider value={{ ...state, login, logout, loadAllCities, searchWeather, createWeather, updateWeather, deleteWeather }}>
            {children}
        </WeatherContext.Provider>
    );
};