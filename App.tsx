import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';

// --- Logging Service ---
const API_BASE_URL = 'http://localhost:8080';

interface LogPayload {
    stack: 'frontend' | 'backend' | 'middleware' | 'config' | 'utils';
    level: 'error' | 'fatal' | 'warn' | 'info' | 'debug';
    package: 'handler' | 'db' | 'route' | 'service' | 'api' | 'component' | 'hook' | 'page' | 'state' | 'style' | 'auth' | 'config' | 'middleware' | 'utils' | 'app';
    message: string;
}

export const Log = async (
    stack: LogPayload['stack'],
    level: LogPayload['level'],
    packageName: LogPayload['package'],
    message: string
): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE_URL}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                stack,
                level,
                package: packageName,
                message,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to send log:', response.status, errorData);
            throw new Error(`Log API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Log successful:', data);
        return data;

    } catch (error) {
        console.error('Error calling logging API:', error);
        return null;
    }
};

// --- Error Boundary ---
interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
        Log('frontend', 'fatal', 'component', `Unhandled React error: ${error.message}. Component Stack: ${errorInfo.componentStack}`);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', border: '1px solid red', margin: '20px', borderRadius: '5px' }}>
                    <h2>Oops! Something went wrong.</h2>
                    <p>We're working to fix it. Please try again later.</p>
                    <p>A fatal error has been logged.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- UserProfile Component ---
interface User {
    id: string;
    name: string;
    email: string;
}

const UserProfile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);

                const mockResponse = {
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    json: async () => ({ id: 'user_001', name: 'swejan', email: 'swejan14@gmail.com' })
                };

                const simulateError = Math.random() < 0.2;
                if (simulateError) {
                    throw new Error("Simulated network error during user data fetch.");
                }

                const response = mockResponse;

                if (!response.ok) {
                    const errorMsg = `Failed to fetch user: ${response.statusText}`;
                    Log('frontend', 'error', 'component', `Failed to fetch user data. Status: ${response.status}, Message: ${errorMsg}`);
                    throw new Error(errorMsg);
                }

                const userData: User = await response.json();
                setUser(userData);
                Log('frontend', 'info', 'component', `Successfully loaded user data for ID: ${userData.id}`);
            } catch (err: any) {
                setError(err.message);
                Log('frontend', 'error', 'page', `Error fetching user profile: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const triggerRuntimeError = () => {
        Log('frontend', 'warn', 'component', 'Attempting to trigger a runtime error for testing ErrorBoundary.');
        const test = undefined as any;
        test.method(); // This will throw an error intentionally
    };

    if (loading) {
        return <div>Loading user profile...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    if (!user) {
        return <div>No user data available.</div>;
    }

    return (
        <div style={{ border: '1px solid lightgray', padding: '15px', margin: '20px', borderRadius: '8px' }}>
            <h2>User Profile</h2>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <button
                onClick={() => {
                    Log('frontend', 'info', 'component', `User clicked 'Edit Profile' button.`);
                    alert('Edit profile functionality not implemented.');
                }}
                style={{ marginRight: '10px', padding: '8px 12px' }}
            >
                Edit Profile
            </button>
            <button
                onClick={triggerRuntimeError}
                style={{ padding: '8px 12px', background: 'salmon', color: 'white' }}
            >
                Trigger Runtime Error (for Boundary test)
            </button>
            <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                Check your browser's console for network requests and logs.
            </p>
        </div>
    );
};

// --- App Component ---
const App: React.FC = () => {
    useEffect(() => {
        Log('frontend', 'info', 'app', 'Application started.');
    }, []);

    return (
        <ErrorBoundary>
            <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
                <h1>Campus Hiring Evaluation - Logging Demo</h1>
                <p>This application demonstrates a logging middleware in a React frontend.</p>
                <UserProfile />
            </div>
        </ErrorBoundary>
    );
};

export default App;
