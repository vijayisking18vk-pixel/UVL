import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ChatMessage, ChatChannel } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import { uploadToStorage } from '../../lib/supabase';
import { sound } from '../../utils/sound';
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
  CheckCircle2,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  FileText,
  Download,
  Loader2,
  Maximize2
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

  // Staged File / Image Attachment State
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.click();
    setStagedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setStagedPreviewUrl(url);
    } else {
      setStagedPreviewUrl(null);
    }
  };

  const removeStagedFile = () => {
    sound.click();
    if (stagedPreviewUrl) URL.revokeObjectURL(stagedPreviewUrl);
    setStagedFile(null);
    setStagedPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startVoiceRecording = async () => {
    try {
      sound.click();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone permission is required to record audio voice notes.');
    }
  };

  const cancelVoiceRecording = () => {
    sound.click();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const stopAndSendVoiceRecording = async () => {
    if (!mediaRecorderRef.current) return;
    sound.patchStamp();

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const durationMins = Math.floor(recordingSeconds / 60);
    const durationSecs = recordingSeconds % 60;
    const formattedDuration = `${durationMins}:${durationSecs < 10 ? '0' : ''}${durationSecs}`;

    setIsUploading(true);
    setIsRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const filePath = `voice-notes/voice-${Date.now()}.webm`;
        const { url } = await uploadToStorage(audioBlob, filePath, 'audio/webm');

        sendMessage(
          activeChannelId,
          messageText.trim() || `Voice Note (${formattedDuration})`,
          activeThreadMessageId || undefined,
          {
            url,
            type: 'audio',
            name: `Voice Memo`,
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            duration: formattedDuration
          }
        );
        setMessageText('');
      } catch (err) {
        console.error('Failed to upload voice recording:', err);
        alert('Could not upload voice note to database storage.');
      } finally {
        setIsUploading(false);
        setRecordingSeconds(0);
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
          mediaRecorderRef.current = null;
        }
      }
    };

    mediaRecorderRef.current.stop();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !stagedFile) return;

    if (stagedFile) {
      setIsUploading(true);
      try {
        const isImage = stagedFile.type.startsWith('image/');
        const prefix = isImage ? 'chat-images' : 'chat-docs';
        const sanitizedName = stagedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uploadPath = `${prefix}/${Date.now()}-${sanitizedName}`;

        const { url } = await uploadToStorage(stagedFile, uploadPath, stagedFile.type);

        const sizeKb = (stagedFile.size / 1024).toFixed(1);
        const sizeMb = (stagedFile.size / (1024 * 1024)).toFixed(2);
        const formattedSize = stagedFile.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

        sendMessage(
          activeChannelId,
          messageText.trim() || stagedFile.name,
          activeThreadMessageId || undefined,
          {
            url,
            type: isImage ? 'image' : 'file',
            name: stagedFile.name,
            size: formattedSize
          }
        );

        removeStagedFile();
        setMessageText('');
        setShowMentionDropdown(false);
      } catch (err) {
        console.error('File upload error:', err);
        alert('Could not upload file to database storage.');
      } finally {
        setIsUploading(false);
      }
    } else {
      sendMessage(activeChannelId, messageText.trim(), activeThreadMessageId || undefined);
      setMessageText('');
      setShowMentionDropdown(false);
    }
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
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-white/20 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 micro-label text-white/60">
              <span className="w-1.5 h-1.5 bg-[#A1A1AA]" />
              <span>Index</span>
              <span>/</span>
              <span>Comms</span>
              <span>/</span>
              <span className="meta-number text-white">Dispatches</span>
            </div>
            <h1 className="headline-section font-bold tracking-tight text-white">
              Tactical Comms & Channels.
            </h1>
            <p className="body-text text-xs text-white/70 max-w-xl">
              Dedicated operational rooms, threaded discussions, operator tags, and instant Supabase persistence.
            </p>
          </div>

          <button
            onClick={() => setIsCreateChannelOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Channel /</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Channels & Direct Messages Directory */}
        <div className="lg:col-span-3 bg-[#000000] border border-white/20 p-4 space-y-6">
          {/* Public / Private Topic Channels */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/20 mb-3 micro-label text-white/60">
              <span>Topic Channels</span>
              <button onClick={() => setIsCreateChannelOpen(true)} className="hover:text-white cursor-pointer">
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-colors text-left cursor-pointer border ${
                      isActive
                        ? 'border-[#A1A1AA] text-white font-semibold bg-white/5'
                        : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {c.isPrivate ? <Lock size={12} className="text-[#A1A1AA]" /> : <Hash size={13} className="text-white/40" />}
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/20 mb-3 micro-label text-white/60">
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-colors text-left cursor-pointer border ${
                      isActive
                        ? 'border-[#A1A1AA] text-white font-semibold bg-white/5'
                        : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 bg-[#A1A1AA]" />
                    <span className="truncate">{dm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Member Directory */}
          <div className="pt-3 border-t border-white/20">
            <span className="micro-label text-white/50 uppercase tracking-wider block mb-3">
              Roster Active
            </span>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <PatchAvatar user={u} size="sm" showStatus />
                    <span className="text-white text-xs truncate font-medium">{u.name}</span>
                  </div>
                  <span className="meta-number text-[10px] text-white/40">{u.handle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right Column: Active Room Messages */}
        <div className={`bg-[#000000] border border-white/20 p-6 flex flex-col justify-between h-[700px] ${activeThreadMessageId ? 'lg:col-span-5' : 'lg:col-span-9'}`}>
          {/* Room Header */}
          <div className="pb-3 border-b border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeChannel.isPrivate ? <Lock size={16} className="text-[#A1A1AA]" /> : <Hash size={18} className="text-white/40" />}
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeChannel.name}
                </h3>
                <p className="micro-label text-white/50">
                  {activeChannel.description || 'Secure communication pod'}
                </p>
              </div>
            </div>

            {pinnedMessages.length > 0 && (
              <span className="meta-number text-[10px] px-2 py-0.5 border border-[#A1A1AA] text-[#A1A1AA] flex items-center gap-1">
                <Pin size={10} className="fill-[#A1A1AA]" /> {pinnedMessages.length} Pinned
              </span>
            )}
          </div>

          {/* Pinned Messages Bar (if any) */}
          {pinnedMessages.length > 0 && (
            <div className="mt-3 p-3 border border-white/20 text-xs">
              <div className="flex items-center gap-1 text-[#A1A1AA] font-bold text-[10px] uppercase mb-1">
                <Pin size={10} className="fill-[#A1A1AA]" /> Pinned Transmission
              </div>
              <p className="text-white/80 text-xs line-clamp-1 italic">
                "{pinnedMessages[0].text}"
              </p>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {channelMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center micro-label text-white/40">
                No dispatches in #{activeChannel.name} yet. Send the first transmission.
              </div>
            ) : (
              channelMessages.map(msg => {
                const sender = users.find(u => u.id === msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className="p-3 border border-white/10 hover:border-white/30 transition-colors group relative"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {sender && <PatchAvatar user={sender} size="sm" showStatus />}
                        <span className="text-xs font-bold text-white">
                          {sender?.name}
                        </span>
                        <span className="meta-number text-[10px] text-[#A1A1AA]">
                          {sender?.handle}
                        </span>
                        <span className="meta-number text-[10px] text-white/40">
                          • {msg.timestamp}
                        </span>
                      </div>

                      {/* Message Hover Actions */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => addReaction(msg.id, '⚡')}
                          className="p-1 hover:bg-white/10 text-xs cursor-pointer"
                          title="React ⚡"
                        >
                          ⚡
                        </button>
                        <button
                          onClick={() => addReaction(msg.id, '🚀')}
                          className="p-1 hover:bg-white/10 text-xs cursor-pointer"
                          title="React 🚀"
                        >
                          🚀
                        </button>

                        <button
                          onClick={() => togglePinMessage(msg.id)}
                          className={`p-1 hover:bg-white/10 cursor-pointer ${msg.pinned ? 'text-[#A1A1AA]' : 'text-white/60'}`}
                          title={msg.pinned ? 'Unpin' : 'Pin message'}
                        >
                          <Pin size={12} className={msg.pinned ? 'fill-[#A1A1AA]' : ''} />
                        </button>

                        <button
                          onClick={() => setActiveThreadMessageId(msg.id)}
                          className="p-1 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                          title="Reply in thread"
                        >
                          <CornerDownRight size={12} />
                        </button>

                        {!msg.convertedToTaskId ? (
                          <button
                            onClick={() => convertMessageToTask(msg.id)}
                            className="px-2 py-0.5 border border-white/30 hover:border-[#A1A1AA] hover:bg-[#A1A1AA] hover:text-black text-white meta-number text-[10px] flex items-center gap-1 cursor-pointer"
                            title="Auto-create a task from this message"
                          >
                            <ListTodo size={11} /> Task /
                          </button>
                        ) : (
                          <span className="meta-number text-[9px] text-[#A1A1AA] border border-[#A1A1AA] px-1.5 py-0.2">
                            ✓ TASKED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="body-text text-xs text-white/90 pl-8">
                      {msg.text.split(' ').map((word, wIdx) => {
                        if (word.startsWith('@')) {
                          return (
                            <span key={wIdx} className="text-[#A1A1AA] font-semibold mr-1">
                              {word}
                            </span>
                          );
                        }
                        return word + ' ';
                      })}
                    </p>

                    {/* Image Attachment Rendering */}
                    {msg.attachmentType === 'image' && msg.attachmentUrl && (
                      <div className="pl-8 my-2">
                        <div className="relative inline-block group/img">
                          <img
                            src={msg.attachmentUrl}
                            alt={msg.attachmentName || 'Image transmission'}
                            onClick={() => setLightboxImage(msg.attachmentUrl || null)}
                            className="max-h-64 max-w-sm sm:max-w-md border border-white/20 hover:border-[#A1A1AA] cursor-pointer object-cover transition-colors"
                            loading="lazy"
                          />
                          <button
                            onClick={() => setLightboxImage(msg.attachmentUrl || null)}
                            className="absolute top-2 right-2 p-1 bg-black/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity border border-white/30"
                            title="Expand view"
                          >
                            <Maximize2 size={12} />
                          </button>
                        </div>
                        {msg.attachmentName && (
                          <span className="block meta-number text-[10px] text-white/40 mt-1">
                            {msg.attachmentName} {msg.attachmentSize ? `• ${msg.attachmentSize}` : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Document File Attachment Rendering */}
                    {msg.attachmentType === 'file' && msg.attachmentUrl && (
                      <div className="pl-8 my-2">
                        <div className="flex items-center justify-between p-2.5 border border-white/20 bg-white/5 max-w-md">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText size={18} className="text-[#A1A1AA] shrink-0" />
                            <div className="truncate">
                              <span className="font-semibold text-xs text-white block truncate">
                                {msg.attachmentName || 'Document'}
                              </span>
                              <span className="meta-number text-[10px] text-white/50">
                                {msg.attachmentSize || 'File attachment'}
                              </span>
                            </div>
                          </div>
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={msg.attachmentName}
                            className="px-2.5 py-1 border border-white/30 hover:border-white text-white text-[10px] uppercase font-bold flex items-center gap-1 transition-colors shrink-0 ml-2"
                          >
                            <Download size={11} />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Voice Note Audio Rendering */}
                    {msg.attachmentType === 'audio' && msg.attachmentUrl && (
                      <div className="pl-8 my-2">
                        <div className="p-3 border border-white/20 bg-white/5 max-w-md space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white uppercase flex items-center gap-1.5">
                              <Mic size={13} className="text-[#A1A1AA]" /> {msg.attachmentName || 'Voice Note'}
                            </span>
                            {msg.audioDuration && (
                              <span className="meta-number text-[10px] text-[#A1A1AA] px-1.5 py-0.5 border border-white/20">
                                {msg.audioDuration}
                              </span>
                            )}
                          </div>
                          <audio
                            src={msg.attachmentUrl}
                            controls
                            className="w-full h-8 brightness-90 contrast-125"
                          />
                        </div>
                      </div>
                    )}

                    {/* Reactions Bar */}
                    {msg.reactions.length > 0 && (
                      <div className="pl-8 mt-2 flex items-center gap-1.5 flex-wrap">
                        {msg.reactions.map(r => (
                          <button
                            key={r.emoji}
                            onClick={() => addReaction(msg.id, r.emoji)}
                            className="px-2 py-0.5 border border-white/20 hover:border-white text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>{r.emoji}</span>
                            <span className="meta-number text-[10px] text-white/60">{r.userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Thread link button */}
                    {msg.replyCount > 0 && (
                      <div className="pl-8 mt-2">
                        <button
                          onClick={() => setActiveThreadMessageId(msg.id)}
                          className="meta-number text-[10px] text-[#A1A1AA] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CornerDownRight size={11} /> {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'} /
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
          <div className="relative pt-3 border-t border-white/20">
            {/* Hidden File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip,.json,.xlsx"
              className="hidden"
            />

            {/* Mention Suggestions Popup */}
            {showMentionDropdown && (
              <div className="absolute bottom-16 left-0 w-64 bg-black border border-white/40 p-2 z-50 shadow-2xl">
                <span className="micro-label text-white/50 block mb-1.5">
                  Mention Member
                </span>
                <div className="space-y-1">
                  {users
                    .filter(u => u.handle.toLowerCase().includes(mentionFilter) || u.name.toLowerCase().includes(mentionFilter))
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => insertMention(u.handle)}
                        className="w-full flex items-center gap-2 p-1.5 hover:bg-white/10 text-left text-xs cursor-pointer"
                      >
                        <PatchAvatar user={u} size="sm" />
                        <div>
                          <span className="font-semibold block leading-none text-white">{u.name}</span>
                          <span className="meta-number text-[10px] text-[#A1A1AA]">{u.handle}</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Staged File / Image Preview Bar */}
            {stagedFile && (
              <div className="mb-2 p-2 border border-white/30 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {stagedPreviewUrl ? (
                    <img
                      src={stagedPreviewUrl}
                      alt="Staged"
                      className="w-10 h-10 object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <FileText size={20} className="text-[#A1A1AA] shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">{stagedFile.name}</span>
                    <span className="meta-number text-[10px] text-[#A1A1AA]">
                      {(stagedFile.size / 1024).toFixed(1)} KB • Ready to transmit
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeStagedFile}
                  className="p-1 hover:bg-white/10 text-white/60 hover:text-white"
                  title="Remove attachment"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Voice Recording Live Bar */}
            {isRecording ? (
              <div className="p-3 border border-red-500/50 bg-red-950/20 flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="text-xs font-mono text-red-400 font-bold uppercase">
                    REC [{Math.floor(recordingSeconds / 60)}:{recordingSeconds % 60 < 10 ? '0' : ''}{recordingSeconds % 60}]
                  </span>
                  <span className="text-[11px] text-white/60 hidden sm:inline">
                    • Capturing audio transmission...
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="px-3 py-1.5 border border-white/20 hover:border-white text-white text-[11px] uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => stopAndSendVoiceRecording()}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold uppercase flex items-center gap-1.5 transition-colors"
                  >
                    <Send size={11} />
                    <span>Send Audio /</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-2">
                {/* Attach File / Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 border border-white/20 hover:border-[#A1A1AA] hover:text-[#A1A1AA] text-white/60 transition-colors"
                  title="Attach image or document (saved to database storage)"
                >
                  <Paperclip size={14} />
                </button>

                {/* Record Voice Note Button */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="p-2 border border-white/20 hover:border-[#A1A1AA] hover:text-[#A1A1AA] text-white/60 transition-colors"
                  title="Record voice note memo (saved to database storage)"
                >
                  <Mic size={14} />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={`Transmission to #${activeChannel.name}... (type @ to tag)`}
                  className="flex-1 bg-black border border-white/30 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#A1A1AA]"
                />

                <button
                  type="submit"
                  disabled={isUploading || (!messageText.trim() && !stagedFile)}
                  className="px-4 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] disabled:opacity-30 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send /</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Thread Replies Side Panel (if open) */}
        {activeThreadMessageId && threadParentMessage && (
          <div className="lg:col-span-4 bg-[#000000] border border-white/20 p-5 flex flex-col justify-between h-[700px]">
            <div className="pb-3 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CornerDownRight size={14} className="text-[#A1A1AA]" />
                <span>Thread Discussion /</span>
              </div>
              <button onClick={() => setActiveThreadMessageId(null)} className="text-white/60 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Parent Message */}
            <div className="p-3 border border-white/20 my-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[#A1A1AA]">
                  {users.find(u => u.id === threadParentMessage.senderId)?.name}
                </span>
                <span className="meta-number text-[10px] text-white/50">{threadParentMessage.timestamp}</span>
              </div>
              <p className="text-white/90">{threadParentMessage.text}</p>
            </div>

            {/* Thread Replies Stream */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {threadReplies.length === 0 ? (
                <div className="text-center micro-label text-white/40 p-4">
                  No replies yet. Send a response in thread.
                </div>
              ) : (
                threadReplies.map(reply => {
                  const replySender = users.find(u => u.id === reply.senderId);
                  return (
                    <div key={reply.id} className="p-2.5 border border-white/10 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        {replySender && <PatchAvatar user={replySender} size="sm" />}
                        <span className="font-bold text-white">{replySender?.name}</span>
                        <span className="meta-number text-[10px] text-white/40">• {reply.timestamp}</span>
                      </div>
                      <p className="text-white/80 pl-6">{reply.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendThread} className="pt-3 border-t border-white/20 flex gap-2">
              <input
                type="text"
                value={threadText}
                onChange={(e) => setThreadText(e.target.value)}
                placeholder="Reply in thread..."
                className="flex-1 bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-semibold cursor-pointer"
              >
                Reply /
              </button>
            </form>
          </div>
        )}

      </div>

      {/* CREATE CHANNEL MODAL */}
      {isCreateChannelOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateChannelSubmit}
            className="bg-[#000000] text-white border border-white/40 max-w-md w-full p-6 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-4">
              <h3 className="text-base font-bold text-white uppercase">
                Open Operational Channel
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block micro-label text-white/60 mb-1">Channel Name *</label>
                <div className="flex items-center bg-black border border-white/30 px-3 py-1.5">
                  <span className="text-white/40 mr-1">#</span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. deal-flow-scout"
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block micro-label text-white/60 mb-1">Topic Description</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What is this channel for?"
                  className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="private-chk"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="accent-[#A1A1AA]"
                />
                <label htmlFor="private-chk" className="text-xs text-white cursor-pointer">
                  Private Channel (Restricted to selected operators)
                </label>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                className="px-3 py-1.5 border border-white/20 hover:border-white text-white/70 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-semibold cursor-pointer"
              >
                Create Channel /
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-1.5 bg-black border border-white/40 text-white hover:border-white transition-colors flex items-center gap-1 text-xs"
            >
              <X size={14} />
              <span>Close /</span>
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged transmission"
              className="max-h-[85vh] max-w-full object-contain border border-white/30"
            />
          </div>
        </div>
      )}
    </div>
  );
};

