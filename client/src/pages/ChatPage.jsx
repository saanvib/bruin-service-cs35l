import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { getSessionToken } from '@descope/react-sdk'
import { useSession } from '@descope/react-sdk'
import { getJwtRoles } from '@descope/react-sdk'
import './ChatPage.css'

const API = 'http://localhost:3001/api/chat'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getSessionToken()}`,
  }
}

// Format timestamp to a short readable time
function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const location = useLocation()
  const { sessionToken } = useSession()

  // The logged-in user's ID (to determine which bubble is "mine")
  const [myId, setMyId] = useState(null)

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)

  // Extract user ID from the session token on mount
  useEffect(() => {
    if (!sessionToken) return
    try {
      const payload = JSON.parse(atob(sessionToken.split('.')[1]))
      setMyId(payload.sub)
    } catch {
      console.error('Could not decode session token')
    }
  }, [sessionToken])

  // Load conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  // If navigated here with a pre-selected conversation id (from ListingDetailPage),
  // auto-select it once conversations are loaded
  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
      setActiveId(location.state.conversationId)
    }
  }, [location.state, conversations])

  // When active conversation changes, load its messages and start polling
  useEffect(() => {
    if (!activeId) return
    fetchMessages(activeId)

    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(() => fetchMessages(activeId), 3000)
    return () => clearInterval(pollRef.current)
  }, [activeId])

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchConversations() {
    try {
      const res = await fetch(`${API}/conversations`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to load conversations')
      setConversations(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchMessages(conversationId) {
    try {
      const res = await fetch(`${API}/conversations/${conversationId}/messages`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to load messages')
      setMessages(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function sendMessage() {
    if (!inputText.trim() || !activeId) return
    setSending(true)
    try {
      const res = await fetch(`${API}/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ body: inputText.trim() }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setInputText('')
      // Immediately fetch so the message appears without waiting for poll
      fetchMessages(activeId)
      fetchConversations() // refresh preview text in sidebar
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  // Send on Enter key (Shift+Enter for newline)
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const activeConversation = conversations.find(c => c.id === activeId)

  // Get the "other person's" name for the header
  function getOtherName(conversation) {
    if (!conversation) return ''
    // We show the listing name as the thread title (as requested)
    return conversation.listing_name
  }

  // Get initials for the avatar
  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="chat-layout">
      {/* ── Left sidebar ── */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar__header">
          <h2 className="chat-sidebar__title">Messages</h2>
        </div>
        <div className="chat-sidebar__list">
          {conversations.length === 0 ? (
            <p className="chat-sidebar__empty">No conversations yet.</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`chat-thread-item${activeId === conv.id ? ' chat-thread-item--active' : ''}`}
                onClick={() => setActiveId(conv.id)}
              >
                <div className="chat-thread-item__avatar">
                  {getInitials(conv.listing_name)}
                </div>
                <div className="chat-thread-item__body">
                  <p className="chat-thread-item__name">{conv.listing_name}</p>
                  <p className="chat-thread-item__preview">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Right message panel ── */}
      <div className="chat-main">
        {!activeId ? (
          // Placeholder when nothing is selected
          <div className="chat-main__placeholder">
            <span className="chat-main__placeholder-icon">💬</span>
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-main__header">
              <p className="chat-main__header-name">{getOtherName(activeConversation)}</p>
              <p className="chat-main__header-sub">
                {activeConversation?.last_message_at
                  ? `Last message ${formatTime(activeConversation.last_message_at)}`
                  : 'No messages yet'}
              </p>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <p className="chat-messages__empty">No messages yet — say hello!</p>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === myId
                  return (
                    <div
                      key={msg.id}
                      className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}
                    >
                      {!isMine && (
                        <span className="chat-bubble__sender">{msg.sender_name}</span>
                      )}
                      <div className="chat-bubble__text">{msg.body}</div>
                      <span className="chat-bubble__time">{formatTime(msg.created_at)}</span>
                    </div>
                  )
                })
              )}
              {/* Invisible div at the bottom to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="chat-input-bar">
              <input
                className="chat-input-bar__input"
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="chat-input-bar__send"
                onClick={sendMessage}
                disabled={sending || !inputText.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}