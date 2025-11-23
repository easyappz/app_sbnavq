import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, updateProfile } from '../../api/profile';
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

  return 'Не удалось обновить профиль. Попробуйте еще раз.';
}

function ProfilePage() {
  const { member, updateMember } = useAuth();

  const [username, setUsername] = useState(member ? member.username : '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (member) {
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const data = await getProfile();
        if (isMounted) {
          updateMember(data);
          setUsername(data.username || '');
        }
      } catch (error) {
        if (isMounted) {
          const message = extractErrorMessage(error);
          setLoadError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [member, updateMember]);

  useEffect(() => {
    if (member && !username) {
      setUsername(member.username || '');
    }
  }, [member, username]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username) {
      setSubmitError('Имя пользователя не может быть пустым.');
      setSubmitSuccess('');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const updated = await updateProfile({ username });
      updateMember(updated);
      setSubmitSuccess('Профиль обновлен.');
    } catch (error) {
      const message = extractErrorMessage(error);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div data-easytag="id5-react/src/components/Profile/ProfilePage.jsx" className="page page-profile">
      <div className="page-inner">
        <div className="card profile-card">
          <h1 className="card-title">Профиль</h1>
          <p className="card-subtitle">Измените данные своего аккаунта.</p>

          {isLoading && <div className="info-block">Загрузка профиля...</div>}
          {loadError && !isLoading && <div className="form-error">{loadError}</div>}

          <form onSubmit={handleSubmit} className="form">
            <div className="form-field">
              <label htmlFor="profile-username" className="form-label">
                Имя пользователя
              </label>
              <input
                id="profile-username"
                type="text"
                className="form-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Имя пользователя"
                autoComplete="username"
              />
            </div>

            {submitError && <div className="form-error">{submitError}</div>}
            {submitSuccess && <div className="form-success">{submitSuccess}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
              <Link to="/" className="btn btn-secondary btn-link-like">
                Вернуться в чат
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
