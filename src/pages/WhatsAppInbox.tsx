import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Search, Send, Paperclip, Mic, Sparkles,
  Zap, StickyNote, X, Check, CheckCheck, Clock, AlertCircle,
  FileText, ChevronDown, RotateCcw, User, PawPrint, Calendar,
  Phone, Mail, Tag, UserCheck, MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './WhatsAppInbox.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const BASE_API_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

interface Conversation {
  id: string;
  phone: string;
  status: string;
  category: string;
  unread_count: number;
  last_message: string;
  last_message_at: string;
  assigned_to: string | null;
  user_profile?: { id: string; full_name: string; phone: string; avatar_url: string } | null;
  assigned_profile?: { id: string; full_name: string; avatar_url: string } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  message: string;
  media_url: string | null;
  media_filename: string | null;
  meta_message_id: string;
  status: string;
  sender_name: string;
  is_note: boolean;
  created_at: string;
}

interface QuickReply {
  id: string;
  shortcode: string;
  title: string;
  body: string;
}

export default function WhatsAppInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [notes, setNotes] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);

  const [messageText, setMessageText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  // AI Suggestion
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Quick Replies
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: '🔴 Unread' },
    { id: 'booking', label: 'Booking' },
    { id: 'enquiry', label: 'Enquiry' },
    { id: 'complaint', label: 'Complaint' },
    { id: 'payment', label: 'Payment' },
  ];

  const getHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    };
  }, []);

  // ─── FETCH CONVERSATIONS ─────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilter === 'unread') {
        // No direct filter for unread — we filter client-side
      } else if (activeFilter !== 'all') {
        params.set('category', activeFilter);
      }
      if (searchQuery) params.set('search', searchQuery);

      const hdrs = await getHeaders();
      const res = await fetch(`${BASE_API_URL}/api/whatsapp/conversations?${params}`, { headers: hdrs });
      const json = await res.json();

      if (json.success) {
        let convs = json.data.conversations || [];
        if (activeFilter === 'unread') {
          convs = convs.filter((c: Conversation) => c.unread_count > 0);
        }
        setConversations(convs);
        setTotalUnread(json.data.total_unread || 0);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery, getHeaders]);

  useEffect(() => {
    fetchConversations();
    // Poll every 10 seconds for new messages
    pollRef.current = setInterval(fetchConversations, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchConversations]);

  // ─── FETCH CONVERSATION DETAIL ────────────────────

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setLoadingChat(true);
    setAiSuggestion(null);

    try {
      const hdrs = await getHeaders();
      const res = await fetch(`${BASE_API_URL}/api/whatsapp/conversations/${conv.id}`, { headers: hdrs });
      const json = await res.json();

      if (json.success) {
        const allMessages = json.data.messages || [];
        setMessages(allMessages.filter((m: Message) => !m.is_note));
        setNotes(allMessages.filter((m: Message) => m.is_note));
        setPets(json.data.pets || []);
        setBookings(json.data.bookings || []);

        // Update conversation in list (unread → 0)
        setConversations(prev => prev.map(c =>
          c.id === conv.id ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  // ─── FETCH QUICK REPLIES ──────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const hdrs = await getHeaders();
        const res = await fetch(`${BASE_API_URL}/api/whatsapp/quick-replies`, { headers: hdrs });
        const json = await res.json();
        if (json.success) setQuickReplies(json.data || []);
      } catch { /* ignore */ }
    })();
  }, [getHeaders]);

  // ─── AUTO-SCROLL ──────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── SEND MESSAGE ─────────────────────────────────

  const sendMessage = async (text?: string) => {
    const msg = text || messageText.trim();
    if (!msg || !selectedConv || sending) return;

    setSending(true);
    try {
      const hdrs = await getHeaders();
      const res = await fetch(`${BASE_API_URL}/api/whatsapp/messages/send`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          type: 'text',
          message: msg,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setMessages(prev => [...prev, json.data.message]);
        setMessageText('');
        setAiSuggestion(null);
        if (textareaRef.current) textareaRef.current.style.height = '40px';
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // ─── AI SUGGEST ───────────────────────────────────

  const requestAiSuggestion = async () => {
    if (!selectedConv || aiLoading) return;
    setAiLoading(true);

    try {
      const hdrs = await getHeaders();
      const res = await fetch(`${BASE_API_URL}/api/whatsapp/messages/ai-suggest`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ conversation_id: selectedConv.id }),
      });
      const json = await res.json();

      if (json.success) {
        setAiSuggestion(json.data.suggestion);
      }
    } catch (err) {
      console.error('Failed to get AI suggestion:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // ─── ADD NOTE ─────────────────────────────────────

  const addNote = async () => {
    if (!noteText.trim() || !selectedConv) return;

    try {
      const hdrs = await getHeaders();
      const res = await fetch(`${BASE_API_URL}/api/whatsapp/conversations/${selectedConv.id}/notes`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ note: noteText }),
      });
      const json = await res.json();
      if (json.success) {
        setNotes(prev => [...prev, json.data]);
        setNoteText('');
      }
    } catch { /* ignore */ }
  };

  // ─── UPDATE CONVERSATION ──────────────────────────

  const updateConversation = async (field: string, value: string) => {
    if (!selectedConv) return;
    try {
      const hdrs = await getHeaders();
      await fetch(`${BASE_API_URL}/api/whatsapp/conversations/${selectedConv.id}`, {
        method: 'PATCH',
        headers: hdrs,
        body: JSON.stringify({ [field]: value }),
      });
      setSelectedConv(prev => prev ? { ...prev, [field]: value } : null);
      fetchConversations();
    } catch { /* ignore */ }
  };

  // ─── HELPERS ──────────────────────────────────────

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitial = (conv: Conversation) => {
    if (conv.user_profile?.full_name) return conv.user_profile.full_name[0].toUpperCase();
    return conv.phone.slice(-2);
  };

  const getDisplayName = (conv: Conversation) => {
    return conv.user_profile?.full_name || conv.phone;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check size={12} />;
      case 'delivered': return <CheckCheck size={12} />;
      case 'read': return <CheckCheck size={12} style={{ color: '#53bdeb' }} />;
      case 'failed': return <AlertCircle size={12} style={{ color: '#ef4444' }} />;
      default: return <Clock size={10} />;
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);

    // Check for quick reply trigger
    if (e.target.value.startsWith('/')) {
      setShowQuickReplies(true);
    } else {
      setShowQuickReplies(false);
    }

    // Auto-resize
    e.target.style.height = '40px';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const applyQuickReply = (qr: QuickReply) => {
    setMessageText(qr.body);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  const useAiSuggestion = () => {
    if (aiSuggestion) {
      setMessageText(aiSuggestion);
      setAiSuggestion(null);
      textareaRef.current?.focus();
    }
  };

  // ─── RENDER ───────────────────────────────────────

  return (
    <div className={`wa-inbox ${!selectedConv ? 'show-list' : ''}`}>

      {/* ── LEFT: Conversation List ─────────────────── */}
      <div className="wa-conv-list">
        <div className="wa-conv-header">
          <div className="wa-conv-header-top">
            <div className="wa-conv-title">
              <MessageCircle size={20} />
              Inbox
              {totalUnread > 0 && <span className="wa-unread-badge">{totalUnread}</span>}
            </div>
            <button className="wa-tool-btn" onClick={fetchConversations} title="Refresh">
              <RotateCcw size={14} />
            </button>
          </div>
          <div className="wa-search-box">
            <Search size={14} className="wa-search-icon" />
            <input
              type="text"
              placeholder="Search by phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="wa-filter-tabs">
          {filters.map(f => (
            <button
              key={f.id}
              className={`wa-filter-tab ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="wa-conv-items">
          {loading ? (
            <div className="wa-loading"><Clock size={16} /> Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="wa-loading" style={{ flexDirection: 'column', gap: 4 }}>
              <MessageCircle size={24} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <span style={{ fontSize: 12 }}>No conversations</span>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                className={`wa-conv-item ${selectedConv?.id === conv.id ? 'active' : ''} ${conv.unread_count > 0 ? 'unread' : ''}`}
                onClick={() => selectConversation(conv)}
              >
                <div className="wa-conv-avatar">
                  {getInitial(conv)}
                  {conv.unread_count > 0 && <div className="unread-dot" />}
                </div>
                <div className="wa-conv-info">
                  <div className="wa-conv-name-row">
                    <span className="wa-conv-name">{getDisplayName(conv)}</span>
                    <span className="wa-conv-time">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <div className="wa-conv-preview">{conv.last_message || 'No messages yet'}</div>
                  <div className="wa-conv-meta">
                    <span className={`wa-conv-category ${conv.category}`}>{conv.category}</span>
                    {conv.assigned_profile && (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                        → {conv.assigned_profile.full_name?.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── CENTER: Chat Panel ─────────────────────── */}
      <div className="wa-chat-panel">
        {!selectedConv ? (
          <div className="wa-empty-state">
            <div className="wa-empty-icon">
              <MessageSquare size={32} />
            </div>
            <div className="wa-empty-title">Pawber WhatsApp Inbox</div>
            <div className="wa-empty-subtitle">
              Select a conversation to start replying. Use ✨ AI Suggest to generate smart replies.
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="wa-chat-header">
              <div className="wa-chat-header-info">
                <div className="wa-chat-header-avatar">{getInitial(selectedConv)}</div>
                <div>
                  <div className="wa-chat-header-name">{getDisplayName(selectedConv)}</div>
                  <div className="wa-chat-header-phone">
                    <Phone size={10} style={{ display: 'inline', marginRight: 4 }} />
                    {selectedConv.phone}
                  </div>
                </div>
              </div>
              <div className="wa-chat-header-actions">
                <span className={`wa-status-badge ${selectedConv.status}`}>
                  {selectedConv.status}
                </span>
                <select
                  value={selectedConv.status}
                  onChange={e => updateConversation('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="waiting">Waiting</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={selectedConv.category}
                  onChange={e => updateConversation('category', e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="booking">Booking</option>
                  <option value="enquiry">Enquiry</option>
                  <option value="complaint">Complaint</option>
                  <option value="payment">Payment</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="wa-chat-messages">
              {loadingChat ? (
                <div className="wa-loading"><Clock size={16} /> Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="wa-loading" style={{ flex: 1, flexDirection: 'column' }}>
                  <MessageCircle size={32} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: 12, marginTop: 8 }}>No messages in this conversation</span>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    // Date divider
                    const showDate = idx === 0 ||
                      new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="wa-date-divider">
                            <span>{new Date(msg.created_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          </div>
                        )}
                        <div className={`wa-message ${msg.is_note ? 'note' : msg.direction}`}>
                          {msg.is_note && (
                            <div className="wa-message-sender">
                              <StickyNote size={10} style={{ display: 'inline', marginRight: 4 }} />
                              Internal Note — {msg.sender_name}
                            </div>
                          )}
                          {msg.direction === 'inbound' && !msg.is_note && (
                            <div className="wa-message-sender">{msg.sender_name}</div>
                          )}

                          {/* Media */}
                          {msg.media_url && (
                            <div className="wa-message-media">
                              {msg.message_type === 'image' ? (
                                <img src={msg.media_url} alt="Shared image" />
                              ) : msg.message_type === 'document' ? (
                                <div className="wa-message-media-doc">
                                  <FileText size={16} />
                                  <span>{msg.media_filename || 'Document'}</span>
                                </div>
                              ) : msg.message_type === 'audio' ? (
                                <audio controls src={msg.media_url} style={{ width: '100%' }} />
                              ) : null}
                            </div>
                          )}

                          {msg.message && <div className="wa-message-text">{msg.message}</div>}

                          <div className="wa-message-time">
                            {formatMessageTime(msg.created_at)}
                            {msg.direction === 'outbound' && !msg.is_note && (
                              <span className="wa-message-status">{getStatusIcon(msg.status)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {aiLoading && (
                <div className="wa-typing-indicator">
                  <div className="wa-typing-dot" />
                  <div className="wa-typing-dot" />
                  <div className="wa-typing-dot" />
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Composer */}
            <div className="wa-composer">
              {/* AI Suggestion */}
              {aiSuggestion && (
                <div className="wa-ai-suggestion">
                  <div className="wa-ai-suggestion-icon">✨</div>
                  <div className="wa-ai-suggestion-content">
                    <div className="wa-ai-suggestion-label">AI Suggested Reply</div>
                    <div className="wa-ai-suggestion-text">{aiSuggestion}</div>
                    <div className="wa-ai-suggestion-actions">
                      <button className="btn btn-sm btn-primary" onClick={useAiSuggestion}>
                        <Check size={12} /> Use & Edit
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => sendMessage(aiSuggestion)}>
                        <Send size={12} /> Send Now
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setAiSuggestion(null)}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tools Row */}
              <div className="wa-composer-tools">
                <button
                  className="wa-tool-btn ai"
                  onClick={requestAiSuggestion}
                  disabled={aiLoading}
                  title="✨ AI Suggest Reply"
                >
                  <Sparkles size={14} />
                </button>
                <button className="wa-tool-btn" title="Attach file">
                  <Paperclip size={14} />
                </button>
                <button className="wa-tool-btn" title="Voice message">
                  <Mic size={14} />
                </button>
                <button
                  className="wa-tool-btn"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  title="Quick Replies"
                >
                  <Zap size={14} />
                </button>
              </div>

              {/* Input Row */}
              <div className="wa-composer-input-row">
                {/* Quick Replies Dropdown */}
                {showQuickReplies && quickReplies.length > 0 && (
                  <div className="wa-quick-replies-dropdown">
                    {quickReplies
                      .filter(qr => !messageText || qr.shortcode.includes(messageText.toLowerCase()))
                      .map(qr => (
                        <button
                          key={qr.id}
                          className="wa-quick-reply-item"
                          onClick={() => applyQuickReply(qr)}
                        >
                          <div className="wa-quick-reply-code">{qr.shortcode}</div>
                          <div className="wa-quick-reply-title">{qr.title}</div>
                        </button>
                      ))}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (/ for quick replies)"
                  rows={1}
                />
                <button
                  className="wa-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!messageText.trim() || sending}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Details Panel ───────────────────── */}
      <div className="wa-details-panel">
        {selectedConv ? (
          <>
            {/* Contact Info */}
            <div className="wa-details-section">
              <div className="wa-details-section-title">
                <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                Contact
              </div>
              <div className="wa-details-row">
                <span className="wa-details-label">Name</span>
                <span className="wa-details-value">{getDisplayName(selectedConv)}</span>
              </div>
              <div className="wa-details-row">
                <span className="wa-details-label">Phone</span>
                <span className="wa-details-value">{selectedConv.phone}</span>
              </div>
              {selectedConv.user_profile && (
                <div className="wa-details-row">
                  <span className="wa-details-label">Email</span>
                  <span className="wa-details-value" style={{ fontSize: 10 }}>
                    {(selectedConv.user_profile as any).email || '—'}
                  </span>
                </div>
              )}
              <div className="wa-details-row">
                <span className="wa-details-label">Status</span>
                <span className={`wa-status-badge ${selectedConv.status}`}>{selectedConv.status}</span>
              </div>
              <div className="wa-details-row">
                <span className="wa-details-label">Category</span>
                <span className={`wa-conv-category ${selectedConv.category}`}>{selectedConv.category}</span>
              </div>
            </div>

            {/* Pets */}
            {pets.length > 0 && (
              <div className="wa-details-section">
                <div className="wa-details-section-title">
                  <PawPrint size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Pets
                </div>
                {pets.map((pet: any) => (
                  <div key={pet.id} className="wa-pet-card">
                    <div className="wa-pet-avatar">🐾</div>
                    <div>
                      <div className="wa-pet-name">{pet.name}</div>
                      <div className="wa-pet-breed">{pet.breed || pet.type} • {pet.age ? `${pet.age}y` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bookings */}
            {bookings.length > 0 && (
              <div className="wa-details-section">
                <div className="wa-details-section-title">
                  <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Recent Bookings
                </div>
                {bookings.slice(0, 5).map((b: any) => (
                  <div key={b.id} className="wa-booking-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="wa-booking-id">{b.id.substring(0, 8)}</span>
                      <span className={`wa-booking-status badge-status ${b.status}`}>{b.status}</span>
                    </div>
                    <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 10 }}>
                      ₹{b.escrow_amount || 0} • {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assign Agent */}
            <div className="wa-details-section">
              <div className="wa-details-section-title">
                <UserCheck size={12} style={{ display: 'inline', marginRight: 4 }} />
                Assignment
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {selectedConv.assigned_profile
                  ? `Assigned to ${selectedConv.assigned_profile.full_name}`
                  : 'Unassigned'}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="wa-details-section">
              <div className="wa-details-section-title">
                <StickyNote size={12} style={{ display: 'inline', marginRight: 4 }} />
                Internal Notes
              </div>
              {notes.map(note => (
                <div key={note.id} className="wa-note-item">
                  {note.message}
                  <div className="wa-note-meta">
                    {note.sender_name} • {formatTime(note.created_at)}
                  </div>
                </div>
              ))}
              <div className="wa-note-input">
                <input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  onKeyDown={e => e.key === 'Enter' && addNote()}
                />
                <button className="btn btn-sm btn-secondary" onClick={addNote}>
                  <StickyNote size={12} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="wa-empty-state" style={{ height: '100%', padding: 20 }}>
            <Tag size={24} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 8 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select a conversation to view details</span>
          </div>
        )}
      </div>
    </div>
  );
}
