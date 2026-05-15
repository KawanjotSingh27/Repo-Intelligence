import {useState} from "react";
import { AuthContext } from "./context";

type User = {
    id: number;
    username: string;
    avatar_url: string;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("token")
    );

    const [user, setUser] = useState<User | null>(
        () => {
            const saved = localStorage.getItem("user");
            return saved ? JSON.parse(saved) : null;
        }
    );

    const login = (token: string, user: User) => {
        setToken(token);
        setUser(user);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}