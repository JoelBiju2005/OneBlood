import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { MessageSquare, Send, X, ArrowLeft, Clock, CheckCheck, Loader2, HeartPulse, User, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

const DonorFindRequestsPage = () => {
  const navigate = useNavigate();
  const { user, oneblood_token } = useAuthStore();
  const { socket } = useNotificationStore();

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [request, setRequest] = useState(null);
  
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Quick reply options for the donor
  const QUICK_PROMPTS = [
    "I'm ready to donate.",
    "Send more details.",
    "Which hospital should I come to?",
    "I will be there in an hour.",
    "Can you arrange transportation?",
    "Sorry, I am not available right now."
  ];

  const fetchRooms = async (autoSelectId = null) => {
    try {
      const res = await api.get('/chat/rooms');
      const chatRooms = res.data?.rooms || [];
      setRooms(chatRooms);
      
      if (autoSelectId) {
        setActiveRoomId(autoSelectId);
        const match = chatRooms.find(r => r.requestId === autoSelectId);
        if (match) setActiveRoom(match);
      } else if (chatRooms.length > 0 && !activeRoomId) {
        // Optionally auto-select first room
        setActiveRoomId(chatRooms[0].requestId);
        setActiveRoom(chatRooms[0]);
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err.message);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMessages = async (requestId) => {
    setLoadingMessages(true);
    try {
      const historyRes = await api.get(`/chat/${requestId}/messages`);
      setMessages(historyRes.data?.messages || []);

      const reqRes = await api.get(`/requests/${requestId}`);
      setRequest(reqRes.data?.request);

      await api.post(`/chat/${requestId}/read`);
      // Update room read state in sidebar
      setRooms(prev => prev.map(r => r.requestId === requestId ? { ...r, unreadCount: 0 } : r));
    } catch (err) {
      toast.error('Failed to load conversation history.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (activeRoomId) {
      fetchMessages(activeRoomId);
    }
  }, [activeRoomId]);

  // Handle Socket listeners
  useEffect(() => {
    if (!socket || !activeRoomId) return;

    socket.emit('join_chat_room', { requestId: activeRoomId });

    const handleNewMessage = (newMsg) => {
      if (newMsg.requestId === activeRoomId) {
        setMessages((prev) => {
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
        api.post(`/chat/${activeRoomId}/read`).catch(() => {});
      }
      fetchRooms(activeRoomId); // Refresh sidebar previews
    };

    const handlePresencePing = () => {
      socket.emit('presence_pong', { requestId: activeRoomId });
      setIsOnline(true);
    };

    const handlePresencePong = () => {
      setIsOnline(true);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('presence_ping', handlePresencePing);
    socket.on('presence_pong', handlePresencePong);

    socket.emit('presence_ping', { requestId: activeRoomId });

    const interval = setInterval(() => {
      socket.emit('presence_ping', { requestId: activeRoomId });
    }, 10000);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('presence_ping', handlePresencePing);
      socket.off('presence_pong', handlePresencePong);
      clearInterval(interval);
    };
  }, [socket, activeRoomId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendPrompt = async (promptText) => {
    if (!activeRoomId || !request) return;

    // Donor has to accept the request first before replying if they want to share contact info,
    // but they can still chat to coordinate prior. We will send the message:
    try {
      await api.post(`/chat/${activeRoomId}/send`, { text: promptText });
      
      // Update local state immediately
      setMessages(prev => [
        ...prev,
        {
          _id: Math.random().toString(),
          senderId: user.id,
          text: promptText,
          createdAt: new Date().toISOString()
        }
      ]);

      if (socket) {
        socket.emit('send_message', { requestId: activeRoomId, text: promptText });
      }
      
      // Update sidebar previews
      fetchRooms(activeRoomId);
    } catch (err) {
      toast.error('Failed to deliver response prompt.');
    }
  };

  const handleAcceptRequest = async () => {
    if (!activeRoomId) return;
    try {
      await api.post(`/requests/${activeRoomId}/accept`);
      toast.success('Donation request accepted! Contact details unlocked.');
      fetchMessages(activeRoomId);
      fetchRooms(activeRoomId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request.');
    }
  };

  const getUrgencyBadgeColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border border-red-500/35';
      case 'urgent': return 'bg-amber-500/20 text-amber-500 border border-amber-500/35';
      default: return 'bg-blue-500/20 text-blue-400 border border-blue-500/35';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col md:flex-row bg-oneblood-midnight relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-oneblood-crimson/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-oneblood-gold/5 blur-[120px] pointer-events-none" />

      {/* 1. Left Sidebar - Chat Inbox List */}
      <div className="w-full md:w-5/12 border-r border-white/5 bg-slate-950 flex flex-col h-[calc(100vh-80px)] relative z-20">
        <div className="p-4 border-b border-white/5 bg-slate-900/30 text-left">
          <h2 className="text-base font-bold text-white font-display tracking-wide flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-oneblood-crimson" />
            <span>Find Requests & Coordination Chats</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">Review emergency requests and message seekers directly.</p>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-white/5">
          {loadingRooms ? (
            <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2 h-full">
              <Loader2 className="w-7 h-7 text-oneblood-crimson animate-spin" />
              <span>Fetching coordination rooms...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs space-y-3 h-full flex flex-col items-center justify-center">
              <div className="p-3 bg-white/5 border border-white/5 rounded-full text-slate-400">
                <HeartPulse className="w-8 h-8 text-slate-500" />
              </div>
              <p className="font-semibold text-slate-400">No active seeker requests found.</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                When a seeker directly requests your help or you match nearby emergencies, they will appear here as direct chat lines.
              </p>
            </div>
          ) : (
            rooms.map((room) => {
              const isSelected = room.requestId === activeRoomId;
              return (
                <div
                  key={room.requestId}
                  onClick={() => {
                    setActiveRoomId(room.requestId);
                    setActiveRoom(room);
                  }}
                  className={`p-4 text-left cursor-pointer transition-colors ${
                    isSelected ? 'bg-white/5 border-l-2 border-oneblood-crimson' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="font-bold text-xs text-white block">
                        {room.otherPartyName}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                        Patient: {room.patientName} &bull; {room.bloodGroup} Needed
                      </span>
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="bg-oneblood-crimson text-white font-bold text-[8px] px-2 py-0.5 rounded-full animate-pulse">
                        {room.unreadCount} new
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 truncate mt-2 font-medium">
                    {room.latestMessage ? room.latestMessage.text : 'Opened conversation loop...'}
                  </p>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2">
                    <span>{room.latestMessage ? new Date(room.latestMessage.createdAt).toLocaleDateString() : ''}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                      room.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-oneblood-gold border border-oneblood-gold/20'
                    }`}>
                      {room.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Pane - WhatsApp style Chat Area */}
      <div className="flex-grow h-[calc(100vh-80px)] flex flex-col bg-slate-900/30 relative z-10">
        {activeRoomId && request ? (
          <>
            {/* Chat Panel Header */}
            <div className="p-4 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>{activeRoom?.otherPartyName || 'Seeker Coordination'}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${getUrgencyBadgeColor(request.urgencyLevel)}`}>
                    {request.urgencyLevel}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  <strong>Hospital:</strong> {request.hospitalName} &bull; <strong>Group Required:</strong> {request.bloodGroup} &bull; <strong>Component:</strong> {request.bloodComponent?.replace('_', ' ').toUpperCase()}
                </p>
              </div>

              {/* Action Accept request Button */}
              {request.status !== 'accepted' && (
                <button
                  onClick={handleAcceptRequest}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Donation Request</span>
                </button>
              )}
            </div>

            {/* Chat message list area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/20 scrollbar-thin scrollbar-thumb-white/5 flex flex-col"
            >
              {messages.length === 0 ? (
                <div className="m-auto text-center text-slate-500 space-y-2 flex flex-col items-center">
                  <MessageSquare className="w-10 h-10 text-slate-600 animate-bounce" />
                  <p className="text-xs font-medium">Chat is active. Choose a prompt response below to message the seeker.</p>
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
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed text-left ${
                          isMe
                            ? 'bg-oneblood-crimson text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/5'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-slate-500 mt-1 px-1 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Selector Board */}
            <div className="p-4 border-t border-white/5 bg-slate-950/40 space-y-3">
              <div className="flex items-center space-x-1.5 text-left text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-oneblood-gold" />
                <span>Limited Prompt Responses (Tap to send WhatsApp-style message)</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendPrompt(prompt)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-left text-[10px] font-medium transition-all transition-colors truncate focus:outline-none cursor-pointer"
                    title={prompt}
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="m-auto text-center text-slate-500 space-y-3 p-8 flex flex-col items-center">
            <HeartPulse className="w-12 h-12 text-oneblood-crimson/50 animate-pulse" />
            <h3 className="text-base font-bold text-white font-display">No Coordination Selected</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Select one of the request cards on the left panel to review historical messages, accept tasks, and coordinate drop locations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorFindRequestsPage;
