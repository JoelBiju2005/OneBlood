import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { MessageSquare, Send, X, ArrowLeft, Clock, CheckCheck, Loader2 } from 'lucide-react';

const ChatPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket } = useNotificationStore();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const fetchChatDetails = async () => {
    try {
      // 1. Fetch message history
      const historyRes = await api.get(`/chat/${requestId}/messages`);
      setMessages(historyRes.data?.messages || []);
      setReadOnly(historyRes.data?.requestStatus === 'fulfilled' || historyRes.data?.requestStatus === 'cancelled');

      // 2. Fetch specific blood request details to find names
      const reqRes = await api.get(`/requests/${requestId}`);
      const requestData = reqRes.data?.request;
      setRequest(requestData);

      // Determine who the other user is
      if (requestData) {
        // requesterId is populated as an object; compare using .toString()
        const requesterId = requestData.requesterId?._id?.toString() || requestData.requesterId?.toString();
        const isSeeker = requesterId === user.id;

        if (isSeeker) {
          // Current user is seeker. Find the accepted donor
          const acceptedResponse = requestData.responses?.find(r => r.status === 'accepted');
          if (acceptedResponse) {
            try {
              const donorProfileRes = await api.get(`/donors/${acceptedResponse.responderId}`);
              setOtherUser({
                name: donorProfileRes.data?.donor?.name || 'Donor Partner',
                bloodGroup: donorProfileRes.data?.donor?.bloodGroup || ''
              });
            } catch {
              setOtherUser({ name: 'Donor Partner', bloodGroup: requestData.bloodGroup || '' });
            }
          } else {
            setOtherUser({ name: 'Donor Partner', bloodGroup: requestData.bloodGroup || '' });
          }
        } else {
          // Current user is donor. Other user is the requester (seeker/coordinator)
          const seekerName = requestData.requesterId?.name
            ? `Patient Coordinator (${requestData.patientName || requestData.requesterId.name})`
            : requestData.patientName
              ? `Patient Coordinator (${requestData.patientName})`
              : 'Patient Coordinator';
          setOtherUser({
            name: seekerName,
            bloodGroup: requestData.bloodGroup || ''
          });
        }
      }

      // 3. Mark messages as read
      await api.post(`/chat/${requestId}/read`);
    } catch (err) {
      toast.error('Failed to load chat details or history.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatDetails();
  }, [requestId]);

  // Handle Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join_chat_room', { requestId });

    // Listen to new messages
    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.some(m => m._id === newMsg.messageId || m._id === newMsg._id)) return prev;
        return [...prev, {
          _id: newMsg.messageId || newMsg._id,
          senderId: newMsg.senderId,
          receiverId: newMsg.receiverId,
          text: newMsg.text,
          createdAt: newMsg.createdAt,
          readAt: newMsg.readAt
        }];
      });

      // Mark read if chat is open
      api.post(`/chat/${requestId}/read`).catch(() => {});
    };

    // Presence checking
    const handlePresencePing = () => {
      socket.emit('presence_pong', { requestId });
      setIsOnline(true);
    };

    const handlePresencePong = () => {
      setIsOnline(true);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('presence_ping', handlePresencePing);
    socket.on('presence_pong', handlePresencePong);

    // Ping to check if other user is in room
    socket.emit('presence_ping', { requestId });

    // Periodic ping
    const interval = setInterval(() => {
      socket.emit('presence_ping', { requestId });
    }, 10000);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('presence_ping', handlePresencePing);
      socket.off('presence_pong', handlePresencePong);
      clearInterval(interval);
    };
  }, [socket, requestId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || readOnly) return;

    const text = inputText;
    setInputText('');

    try {
      // Send message via API
      await api.post(`/chat/${requestId}/send`, { text });
      
      // Also emit via socket immediately to speed up local delivery
      socket.emit('send_message', { requestId, text });
    } catch (err) {
      toast.error('Failed to deliver message.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mr-2" />
        <span>Syncing chat session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Dynamic Sheet Panel */}
      <div className="w-full max-w-2xl h-[85vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-left">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center space-x-2">
                <span>{otherUser?.name || 'Chat Partner'}</span>
                {otherUser?.bloodGroup && (
                  <span className="text-[10px] bg-red-600/20 text-red-500 px-1.5 py-0.5 rounded font-black border border-red-500/25">
                    {otherUser.bloodGroup}
                  </span>
                )}
              </h3>
              <p className="text-xs flex items-center space-x-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-slate-400 font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Read-Only Status Bar */}
        {readOnly && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 text-center text-xs font-bold text-red-400">
            This request has been closed. Chat is now read-only.
          </div>
        )}

        {/* Message Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/20 scrollbar-thin scrollbar-thumb-white/5"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600" />
              <p className="text-xs italic">Start coordinates coordination here...</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user.id;
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[#C0152A] text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center space-x-1 mt-1 px-1">
                    <span className="text-[9px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <span className="text-[9px] text-slate-500">
                        {msg.readAt ? (
                          <CheckCheck className="w-3 h-3 text-emerald-400 inline" />
                        ) : (
                          <Clock className="w-3 h-3 text-slate-600 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-slate-900/50 flex gap-2 items-center">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
              placeholder={readOnly ? 'Chat is closed' : 'Type a message...'}
              disabled={readOnly}
              className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all resize-none max-h-12 scrollbar-none disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            {!readOnly && (
              <span className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-semibold">
                {inputText.length}/1000
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={readOnly || !inputText.trim()}
            className="p-3.5 bg-[#C0152A] hover:bg-[#a01021] text-white rounded-xl transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default ChatPage;
