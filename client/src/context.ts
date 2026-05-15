import { createContext } from "react";

type User = {
    id: number;
    username: string;
    avatar_url: string;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);