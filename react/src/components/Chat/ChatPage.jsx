import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage } from '../../api/chat';
import { logout as apiLogout } from '../../api/auth';
import { useAuth } from '../../App';

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

  return 'Не удалось выполнить операцию. Попробуйте еще раз.';
}

function ChatPage() {
  const { member, clearAuth } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchMessages() {
      setIsLoading(true);
      setLoadError('');
      try {
        const data = await getMessages();
        if (isMounted && Array.isArray(data)) {
          setMessages(data);
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

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSend(event) {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setIsSending(true);
    setSendError('');

    try {
      const created = await sendMessage({ text: trimmed });
      setMessages((prev) => {
        const next = prev ? prev.slice() : [];
        next.push(created);
        return next;
      });
      setText('');
    } catch (error) {
      const message = extractErrorMessage(error);
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  }

  async function handleLogout() {
    try {
      await apiLogout();
    } catch (error) {
      // Игнорируем ошибку, все равно очищаем локальное состояние
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div data-easytag="id4-react/src/components/Chat/ChatPage.jsx" className="page page-chat">
      <div className="page-inner">
        <div className="chat-layout card">
          <header className="chat-header">
            <div className="chat-header-left">
              <div className="chat-title">Групповой чат</div>
              <div className="chat-subtitle">Общий канал для всех участников</div>
            </div>
            <div className="chat-header-right">
              {member && (
                <div className="chat-user-info">
                  <span className="chat-user-label">Вы:</span>
                  <span className="chat-username">{member.username}</span>
                </div>
              )}
              <nav className="chat-nav">
                <Link to="/profile" className="chat-nav-link">
                  Профиль
                </Link>
                <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                  Выйти
                </button>
              </nav>
            </div>
          </header>

          <main className="chat-body">
            <section className="chat-messages-wrapper">
              {isLoading && <div className="chat-info">Загрузка сообщений...</div>}
              {loadError && !isLoading && <div className="chat-error">{loadError}</div>}

              {!isLoading && !loadError && messages.length === 0 && (
                <div className="chat-info">Сообщений пока нет. Будьте первым, кто что-нибудь напишет.</div>
              )}

              <div className="chat-messages">
                {messages.map((message) => (
                  <div key={message.id} className="chat-message">
                    <div className="chat-message-header">
                      <span className="chat-message-author">{message.author && message.author.username}</span>
                      <span className="chat-message-time">{formatDateTime(message.created_at)}</span>
                    </div>
                    <div className="chat-message-text">{message.text}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="chat-input-section">
              <form onSubmit={handleSend} className="chat-input-form">
                <textarea
                  className="chat-input"
                  placeholder="Напишите сообщение..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={3}
                />
                {sendError && <div className="chat-error chat-error-inline">{sendError}</div>}
                <div className="chat-input-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSending || !text.trim()}
                  >
                    {isSending ? 'Отправляем...' : 'Отправить'}
                  </button>
                </div>
              </form>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
