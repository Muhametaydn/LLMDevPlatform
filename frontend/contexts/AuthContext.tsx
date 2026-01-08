"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: number;
    fullName: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "https://localhost:7295/api";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sayfa yüklendiğinde token kontrolü
    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/Auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                setIsLoading(false);
                return true;
            } else {
                setError(data.message || "Giriş başarısız");
                setIsLoading(false);
                return false;
            }
        } catch (err) {
            setError("Bağlantı hatası");
            setIsLoading(false);
            return false;
        }
    };

    const register = async (
        fullName: string,
        email: string,
        password: string,
        confirmPassword: string
    ): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/Auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, password, confirmPassword }),
            });

            const data = await response.json();

            if (data.success) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                setIsLoading(false);
                return true;
            } else {
                setError(data.message || "Kayıt başarısız");
                setIsLoading(false);
                return false;
            }
        } catch (err) {
            setError("Bağlantı hatası");
            setIsLoading(false);
            return false;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}