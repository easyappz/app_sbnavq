import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuth } from '../../App';

function extractErrorMessage(error) {
  if (!error) {
    return 'Произошла непредвиденная ошибка.';
  }

  const response = error.response;
  if (response && response.data) {
    const data = response.data;

    if (data.detail) {
      return data.detail;
    }

    if (data.fields) {
      const fieldKeys = Object.keys(data.fields);
      if (fieldKeys.length > 0) {
        const firstKey = fieldKeys[0];
        const messages = data.fields[firstKey];
        if (Array.isArray(messages) && messages.length > 0) {
          return messages[0];
        }
      }
    }
  }

  return 'Не удалось выполнить вход. Попробуйте еще раз.';
}

function Login() {
  const { token, setAuthFromResponse } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username || !password) {
      setError('Пожалуйста, введите имя пользователя и пароль.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const data = await login({ username, password });
      setAuthFromResponse(data);
      navigate('/', { replace: true });
    } catch (apiError) {
      const message = extractErrorMessage(apiError);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div data-easytag="id3-react/src/components/Auth/Login.jsx" className="page page-auth">
      <div className="page-inner">
        <div className="card auth-card">
          <h1 className="card-title">Вход</h1>
          <p className="card-subtitle">Введите данные для входа в групповой чат.</p>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-field">
              <label htmlFor="login-username" className="form-label">
                Имя пользователя
              </label>
              <input
                id="login-username"
                type="text"
                className="form-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Введите имя пользователя"
                autoComplete="username"
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password" className="form-label">
                Пароль
              </label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
                autoComplete="current-password"
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Входим...' : 'Войти'}
              </button>
            </div>
          </form>

          <div className="form-footer-text">
            Нет аккаунта?{' '}
            <Link to="/register" className="link">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
