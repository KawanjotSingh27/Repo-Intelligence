import { Navigate } from "react-router-dom";
import { useAuth } from "../useAuth";

type Props = {
    children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}