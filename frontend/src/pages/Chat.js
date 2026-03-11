import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, API } from "@/App";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages/${userId}`);
      setMessages(response.data);
      if (response.data.length > 0) {
        const otherMsg = response.data.find((m) => m.from_user_id === userId);
        if (otherMsg) {
          setOtherUser({
            id: userId,
            display_name: otherMsg.from_user_name,
            avatar_url: otherMsg.from_user_avatar,
          });
        }
      }
      // Also fetch from connections if no messages
      if (!otherUser) {
        const connResponse = await axios.get(`${API}/connections`);
        const conn = connResponse.data.find((c) => c.user_id === userId);
        if (conn) {
          setOtherUser({
            id: conn.user_id,
            display_name: conn.display_name,
            avatar_url: conn.avatar_url,
          });
        }
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("You're not connected with this person");
        navigate("/connections");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await axios.post(`${API}/messages`, {
        to_user_id: userId,
        content: newMessage.trim(),
      });
      setNewMessage("");
      fetchMessages();
      inputRef.current?.focus();
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" data-testid="chat-page">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-btn"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/connections")}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {otherUser && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={otherUser.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"}
                    alt={otherUser.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-lg font-semibold text-white">{otherUser.display_name}</h1>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                data-testid={`message-${message.id}`}
                className={`flex ${
                  message.from_user_id === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.from_user_id === user.id
                      ? "message-sent text-white"
                      : "message-received text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.from_user_id === user.id
                        ? "text-white/60"
                        : "text-slate-500"
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 glass border-t border-white/5 px-4 py-4">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-3">
          <Input
            ref={inputRef}
            data-testid="message-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-12 bg-white/5 border-transparent focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500"
          />
          <Button
            data-testid="send-btn"
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="h-12 w-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
