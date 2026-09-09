import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ChatMessage, ChatChannel } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  MessageSquare,
  Hash,
  Lock,
  Pin,
  Send,
  Plus,
  ListTodo,
  Smile,
  CornerDownRight,
  X,
  AtSign,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const {
    channels,
    activeChannelId,
    setActiveChannelId,
    addChannel,
    messages,
    sendMessage,
    togglePinMessage,
    addReaction,
    convertMessageToTask,
    users,
    currentUser,
    setActiveTab
  } = useWorkspace();

  const [messageText, setMessageText] = useState('');
  const [activeThreadMessageId, setActiveThreadMessageId] = useState<string | null>(null);
  const [threadText, setThreadText] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  // New Channel Form
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const channelMessages = messages.filter(m => m.channelId === activeChannelId && !m.parentId);
  const pinnedMessages = channelMessages.filter(m => m.pinned);

  const threadParentMessage = messages.find(m => m.id === activeThreadMessageId);
  const threadReplies = messages.filter(m => m.parentId === activeThreadMessageId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);

    // Detect if typing @
    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      setShowMentionDropdown(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (handle: string) => {
    const words = messageText.split(' ');
    words.pop(); // remove partial @
    words.push(handle + ' ');
    setMessageText(words.join(' '));
    setShowMentionDropdown(false);
    inputRef.current?.focus();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessage(activeChannelId, messageText.trim());
    setMessageText('');
    setShowMentionDropdown(false);
  };

  const handleSendThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadText.trim() || !activeThreadMessageId) return;

    sendMessage(activeChannelId, threadText.trim(), activeThreadMessageId);
    setThreadText('');
  };

  const handleCreateChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const formattedName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    addChannel({
      name: formattedName,
      description: newChannelDesc,
      isPrivate: newChannelPrivate,
      isDm: false
    });

    setNewChannelName('');
    setNewChannelDesc('');
    setIsCreateChannelOpen(false);
  };

  const emojis = ['⚡', '🚀', '🔥', '🔒', '👍', '👀'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F242C] border border-[#3A4250] flex items-center justify-center patch-chamfer-sm text-[#9D7BFF]">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                Tactical Comms & Secure Channels
              </h2>
              <p className="font-mono text-xs text-[#9E9A8E]">
                Dedicated topic rooms, threaded replies, @mentions & 1-click message-to-task conversion.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateChannelOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold transition-transform active:scale-95 patch-chamfer-sm shadow-sm"
          >
            <Plus size={14} strokeWidth={3} />
            New Channel
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Channels & Direct Messages Directory */}
        <div className="lg:col-span-3 bg-[#14171B] border border-[#2A303A] p-3.5 patch-chamfer-md shadow-md space-y-4">
          {/* Public / Private Topic Channels */}
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#242930] mb-2 text-[10px] font-mono text-[#9E9A8E] uppercase tracking-wider">
              <span>Topic Channels</span>
              <button onClick={() => setIsCreateChannelOpen(true)} className="hover:text-[#EDE8DB]">
                <Plus size={12} />
              </button>
            </div>

            <div className="space-y-1">
              {channels.filter(c => !c.isDm).map(c => {
                const isActive = c.id === activeChannelId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveChannelId(c.id);
                      setActiveThreadMessageId(null);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 font-mono text-xs patch-chamfer-sm transition-colors text-left ${
                      isActive
                        ? 'bg-[#1F242C] text-[#E5B869] border border-[#3A4250]'
                        : 'text-[#9E9A8E] hover:text-[#EDE8DB] hover:bg-[#181B20]'
                    }`}
                  >
                    {c.isPrivate ? <Lock size={12} className="text-[#E5B869]" /> : <Hash size={13} />}
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#242930] mb-2 text-[10px] font-mono text-[#9E9A8E] uppercase tracking-wider">
              <span>Direct Comms</span>
            </div>

            <div className="space-y-1">
              {channels.filter(c => c.isDm).map(dm => {
                const isActive = dm.id === activeChannelId;
                return (
                  <button
                    key={dm.id}
                    onClick={() => {
                      setActiveChannelId(dm.id);
                      setActiveThreadMessageId(null);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 font-mono text-xs patch-chamfer-sm transition-colors text-left ${
                      isActive
                        ? 'bg-[#1F242C] text-[#E5B869] border border-[#3A4250]'
                        : 'text-[#9E9A8E] hover:text-[#EDE8DB] hover:bg-[#181B20]'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-none bg-[#5EBA7D]" />
                    <span className="truncate">{dm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Member Directory */}
          <div className="pt-2 border-t border-[#242930]">
            <span className="text-[10px] font-mono text-[#9E9A8E] uppercase tracking-wider block mb-2">
              Team On Comms
            </span>
            <div className="space-y-1.5">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between text-xs font-mono py-1 px-1.5">
                  <div className="flex items-center gap-2">
                    <PatchAvatar user={u} size="sm" showStatus />
                    <span className="text-[#EDE8DB] text-[11px] truncate">{u.name}</span>
                  </div>
                  <span className="text-[9px] text-[#9E9A8E]">{u.handle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right Column: Active Room Messages */}
        <div className={`bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md flex flex-col justify-between h-[650px] ${activeThreadMessageId ? 'lg:col-span-5' : 'lg:col-span-9'}`}>
          {/* Room Header */}
          <div className="pb-3 border-b border-[#242930] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeChannel.isPrivate ? <Lock size={16} className="text-[#E5B869]" /> : <Hash size={18} className="text-[#9E9A8E]" />}
              <div>
                <h3 className="font-mono text-sm font-bold text-[#EDE8DB]">
                  {activeChannel.name}
                </h3>
                <p className="font-mono text-[10px] text-[#9E9A8E]">
                  {activeChannel.description || 'Secure communication pod'}
                </p>
              </div>
            </div>

            {pinnedMessages.length > 0 && (
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#E5B869]/15 border border-[#E5B869]/40 text-[#E5B869] flex items-center gap-1">
                <Pin size={10} className="fill-[#E5B869]" /> {pinnedMessages.length} Pinned
              </span>
            )}
          </div>

          {/* Pinned Messages Bar (if any) */}
          {pinnedMessages.length > 0 && (
            <div className="mt-2 p-2 bg-[#0C0E11] border border-[#2B313B] patch-chamfer-sm text-xs font-mono">
              <div className="flex items-center gap-1 text-[#E5B869] font-bold text-[10px] uppercase mb-1">
                <Pin size={10} className="fill-[#E5B869]" /> Pinned Message
              </div>
              <p className="text-[#D8D2C2] text-xs line-clamp-1 italic">
                "{pinnedMessages[0].text}"
              </p>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {channelMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center font-mono text-xs text-[#9E9A8E]">
                No messages yet in #{activeChannel.name}. Send the first transmission!
              </div>
            ) : (
              channelMessages.map(msg => {
                const sender = users.find(u => u.id === msg.senderId);
                const isMe = msg.senderId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className="p-3 bg-[#181B20] border border-[#252B35] hover:border-[#3A4250] patch-chamfer-sm transition-all group relative"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {sender && <PatchAvatar user={sender} size="sm" showStatus />}
                        <span className="font-mono text-xs font-bold text-[#EDE8DB]">
                          {sender?.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#E5B869]">
                          {sender?.handle}
                        </span>
                        <span className="font-mono text-[10px] text-[#9E9A8E]">
                          • {msg.timestamp}
                        </span>
                      </div>

                      {/* Message Hover Actions */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        {/* Reaction quick picks */}
                        <button
                          onClick={() => addReaction(msg.id, '⚡')}
                          className="p-1 hover:bg-[#20252D] text-xs"
                          title="React ⚡"
                        >
                          ⚡
                        </button>
                        <button
                          onClick={() => addReaction(msg.id, '🚀')}
                          className="p-1 hover:bg-[#20252D] text-xs"
                          title="React 🚀"
                        >
                          🚀
                        </button>

                        <button
                          onClick={() => togglePinMessage(msg.id)}
                          className={`p-1 hover:bg-[#20252D] ${msg.pinned ? 'text-[#E5B869]' : 'text-[#9E9A8E]'}`}
                          title={msg.pinned ? 'Unpin' : 'Pin message'}
                        >
                          <Pin size={12} className={msg.pinned ? 'fill-[#E5B869]' : ''} />
                        </button>

                        <button
                          onClick={() => setActiveThreadMessageId(msg.id)}
                          className="p-1 hover:bg-[#20252D] text-[#9E9A8E] hover:text-[#EDE8DB]"
                          title="Reply in thread"
                        >
                          <CornerDownRight size={12} />
                        </button>

                        {!msg.convertedToTaskId ? (
                          <button
                            onClick={() => convertMessageToTask(msg.id)}
                            className="px-2 py-0.5 bg-[#E5B869]/20 hover:bg-[#E5B869]/30 border border-[#E5B869]/40 text-[#E5B869] text-[10px] font-mono flex items-center gap-1"
                            title="Auto-create a task from this message"
                          >
                            <ListTodo size={11} /> Task
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono text-[#5EBA7D] px-1 py-0.2 border border-[#5EBA7D]/40">
                            ✓ Tasked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="font-mono text-xs text-[#EDE8DB] leading-relaxed pl-8">
                      {msg.text.split(' ').map((word, wIdx) => {
                        if (word.startsWith('@')) {
                          return (
                            <span key={wIdx} className="bg-[#E5B869]/20 text-[#E5B869] font-bold px-1 border border-[#E5B869]/30 mr-1">
                              {word}
                            </span>
                          );
                        }
                        return word + ' ';
                      })}
                    </p>

                    {/* Reactions Bar */}
                    {msg.reactions.length > 0 && (
                      <div className="pl-8 mt-2 flex items-center gap-1.5 flex-wrap">
                        {msg.reactions.map(r => (
                          <button
                            key={r.emoji}
                            onClick={() => addReaction(msg.id, r.emoji)}
                            className="px-2 py-0.5 bg-[#0C0E11] border border-[#2D333F] text-[11px] font-mono text-[#EDE8DB] hover:border-[#E5B869] flex items-center gap-1 patch-chamfer-sm"
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[10px] text-[#9E9A8E]">{r.userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Thread link button */}
                    {msg.replyCount > 0 && (
                      <div className="pl-8 mt-2">
                        <button
                          onClick={() => setActiveThreadMessageId(msg.id)}
                          className="text-[10px] font-mono text-[#4EC5D4] hover:underline flex items-center gap-1"
                        >
                          <CornerDownRight size={11} /> {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Box */}
          <div className="relative pt-2 border-t border-[#242930]">
            {/* Mention Suggestions Popup */}
            {showMentionDropdown && (
              <div className="absolute bottom-14 left-0 w-64 bg-[#14171B] border-2 border-[#323945] shadow-2xl p-2 z-50 patch-chamfer-md">
                <span className="text-[10px] font-mono text-[#9E9A8E] uppercase block mb-1.5">
                  Mention Team Member
                </span>
                <div className="space-y-1">
                  {users
                    .filter(u => u.handle.toLowerCase().includes(mentionFilter) || u.name.toLowerCase().includes(mentionFilter))
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => insertMention(u.handle)}
                        className="w-full flex items-center gap-2 p-1.5 hover:bg-[#1F242C] text-left text-xs font-mono text-[#EDE8DB] patch-chamfer-sm"
                      >
                        <PatchAvatar user={u} size="sm" />
                        <div>
                          <span className="font-semibold block leading-none">{u.name}</span>
                          <span className="text-[10px] text-[#E5B869]">{u.handle}</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={handleInputChange}
                placeholder={`Transmission to #${activeChannel.name}... (type @ to tag)`}
                className="flex-1 bg-[#0C0E11] border border-[#2D333F] px-3.5 py-2 text-xs font-mono text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="px-4 py-2 bg-[#E5B869] hover:bg-[#F0C57A] disabled:opacity-40 text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm"
              >
                <Send size={13} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Thread Replies Side Panel (if open) */}
        {activeThreadMessageId && threadParentMessage && (
          <div className="lg:col-span-4 bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md flex flex-col justify-between h-[650px]">
            <div className="pb-2.5 border-b border-[#242930] flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#EDE8DB]">
                <CornerDownRight size={14} className="text-[#4EC5D4]" />
                <span>Thread Discussion</span>
              </div>
              <button onClick={() => setActiveThreadMessageId(null)} className="text-[#9E9A8E] hover:text-[#EDE8DB]">
                <X size={16} />
              </button>
            </div>

            {/* Parent Message */}
            <div className="p-3 bg-[#0C0E11] border border-[#282F3B] patch-chamfer-sm my-2 font-mono text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[#E5B869]">
                  {users.find(u => u.id === threadParentMessage.senderId)?.name}
                </span>
                <span className="text-[10px] text-[#9E9A8E]">{threadParentMessage.timestamp}</span>
              </div>
              <p className="text-[#EDE8DB]">{threadParentMessage.text}</p>
            </div>

            {/* Thread Replies Stream */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {threadReplies.length === 0 ? (
                <div className="text-center font-mono text-xs text-[#9E9A8E] p-4">
                  No replies yet. Be the first to chime in.
                </div>
              ) : (
                threadReplies.map(reply => {
                  const replySender = users.find(u => u.id === reply.senderId);
                  return (
                    <div key={reply.id} className="p-2.5 bg-[#181B20] border border-[#232832] patch-chamfer-sm font-mono text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        {replySender && <PatchAvatar user={replySender} size="sm" />}
                        <span className="font-bold text-[#EDE8DB]">{replySender?.name}</span>
                        <span className="text-[10px] text-[#9E9A8E]">• {reply.timestamp}</span>
                      </div>
                      <p className="text-[#D8D2C2] pl-6">{reply.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendThread} className="pt-2 border-t border-[#242930] flex gap-2">
              <input
                type="text"
                value={threadText}
                onChange={(e) => setThreadText(e.target.value)}
                placeholder="Reply in thread..."
                className="flex-1 bg-[#0C0E11] border border-[#2D333F] px-3 py-1.5 text-xs font-mono text-[#EDE8DB] patch-chamfer-sm"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#4EC5D4] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
              >
                Reply
              </button>
            </form>
          </div>
        )}

      </div>

      {/* CREATE CHANNEL MODAL */}
      {isCreateChannelOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateChannelSubmit}
            className="bg-[#14171B] border-2 border-[#323A48] max-w-md w-full p-5 patch-chamfer-md shadow-2xl relative"
          >
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
              <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
                Open Tactical Channel
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Channel Name *</label>
                <div className="flex items-center bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 patch-chamfer-sm">
                  <span className="text-[#9E9A8E] mr-1">#</span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. tokenomics-lab"
                    className="flex-1 bg-transparent text-xs text-[#EDE8DB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Topic Description</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What is this channel for?"
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="private-chk"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="accent-[#E5B869]"
                />
                <label htmlFor="private-chk" className="text-xs text-[#EDE8DB] cursor-pointer">
                  Private Channel (Restricted to selected operators)
                </label>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#282F3B] text-[#9E9A8E] hover:text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

