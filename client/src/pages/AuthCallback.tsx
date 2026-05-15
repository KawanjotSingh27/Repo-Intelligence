import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function AuthCallback() {
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const username = params.get("username");
        const avatar = params.get("avatar");

        if (token && username && avatar) {
            login(token, {
                id: 0,
                username,
                avatar_url: avatar
            });
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    }, []);

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <div className="loading">
                <div className="loading-dot" />
                Signing you in...
            </div>
        </div>
    );
}