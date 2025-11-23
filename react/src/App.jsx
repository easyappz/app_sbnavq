import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatPage from './components/Chat/ChatPage';
import ProfilePage from './components/Profile/ProfilePage';

const AuthContext = React.createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function PrivateRoute(props) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return props.children;
}

function App() {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('authToken');
    }
    return null;
  });

  const [member, setMember] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('authMember');
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  });

  function setAuthFromResponse(authResponse) {
    if (!authResponse) {
      return;
    }

    const nextToken = authResponse.token || null;
    const nextMember = authResponse.member || null;

    setToken(nextToken);
    setMember(nextMember);

    if (typeof window !== 'undefined' && window.localStorage) {
      if (nextToken) {
        window.localStorage.setItem('authToken', nextToken);
      } else {
        window.localStorage.removeItem('authToken');
      }

      if (nextMember) {
        window.localStorage.setItem('authMember', JSON.stringify(nextMember));
      } else {
        window.localStorage.removeItem('authMember');
      }
    }
  }

  function clearAuth() {
    setToken(null);
    setMember(null);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('authMember');
    }
  }

  function updateMember(updatedMember) {
    if (!updatedMember) {
      return;
    }

    setMember(updatedMember);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('authMember', JSON.stringify(updatedMember));
    }
  }

  const authValue = useMemo(
    () => ({ token, member, setAuthFromResponse, clearAuth, updateMember }),
    [token, member]
  );

  /** Никогда не удаляй этот код */
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.handleRoutes === 'function') {
      /** Нужно передавать список существующих роутов */
      window.handleRoutes(['/', '/login', '/register', '/profile']);
    }
  }, []);

  return (
    <div data-easytag="id1-react/src/App.jsx" className="app-root">
      <ErrorBoundary>
        <AuthContext.Provider value={authValue}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={(
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              )}
            />
            <Route
              path="/profile"
              element={(
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              )}
            />
          </Routes>
        </AuthContext.Provider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
