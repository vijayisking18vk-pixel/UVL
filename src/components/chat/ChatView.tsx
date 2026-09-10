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
  const [mobileView, setMobileView] = useState<'chat' | 'channels'>('chat');

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E5E5E7]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-black">
            Tactical Comms & Channels.
          </h1>
          <p className="text-sm text-[#6E6E73] mt-1 max-w-xl">
            Operational rooms, threaded discussions, operator mentions, and real-time cloud persistence.
          </p>
        </div>

        <button
          onClick={() => setIsCreateChannelOpen(true)}
          className="self-start sm:self-auto bg-black hover:bg-black/90 text-white rounded-full px-4 py-2 text-xs font-medium shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Channel</span>
        </button>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Channels & Direct Messages Directory */}
        <div className={`lg:col-span-3 bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-4 sm:p-5 space-y-6 ${mobileView === 'channels' ? 'block' : 'hidden lg:block'}`}>
          {/* Mobile Back Button */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] lg:hidden">
            <span className="text-xs font-semibold text-black uppercase tracking-wider">Channels & Comms</span>
            <button
              onClick={() => setMobileView('chat')}
              className="text-xs text-[#6E6E73] hover:text-black font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Back to Chat →</span>
            </button>
          </div>

          {/* Public / Private Topic Channels */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7] mb-3 text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
              <span>Topic Channels</span>
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                className="hover:text-black transition-colors cursor-pointer p-0.5 rounded-md hover:bg-white"
                title="Create Channel"
              >
                <Plus size={13} />
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
                      setMobileView('chat');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-semibold shadow-xs border border-[#E5E5E7]'
                        : 'text-[#6E6E73] hover:text-black hover:bg-white/60'
                    }`}
                  >
                    {c.isPrivate ? <Lock size={13} className="text-[#6E6E73]" /> : <Hash size={14} className="text-[#8E8E93]" />}
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7] mb-3 text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
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
                      setMobileView('chat');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-semibold shadow-xs border border-[#E5E5E7]'
                        : 'text-[#6E6E73] hover:text-black hover:bg-white/60'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{dm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Member Directory */}
          <div className="pt-3 border-t border-[#E5E5E7]">
            <span className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider block mb-3">
              Roster Active ({users.length})
            </span>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <PatchAvatar user={u} size="sm" showStatus />
                    <span className="text-black text-xs truncate font-medium">{u.name}</span>
                  </div>
                  <span className="text-[10px] text-[#6E6E73]">{u.handle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right Column: Active Room Messages */}
        <div className={`bg-white border border-[#E5E5E7] rounded-3xl p-4 sm:p-6 flex flex-col justify-between h-[680px] sm:h-[720px] shadow-sm ${mobileView === 'chat' ? 'flex' : 'hidden lg:flex'} ${activeThreadMessageId ? 'lg:col-span-5' : 'lg:col-span-9'}`}>
          {/* Room Header */}
          <div className="pb-3 border-b border-[#E5E5E7] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileView('channels')}
                className="lg:hidden p-1.5 border border-[#E5E5E7] rounded-xl hover:bg-[#F5F5F7] text-black mr-1 flex items-center gap-1 text-[11px] cursor-pointer"
                title="View All Channels"
              >
                <Hash size={13} className="text-[#6E6E73]" />
                <span className="hidden sm:inline">Rooms</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-center text-black">
                {activeChannel.isPrivate ? <Lock size={15} className="text-black" /> : <Hash size={16} className="text-black" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-black flex items-center gap-1.5">
                  <span>{activeChannel.name}</span>
                  {activeChannel.isPrivate && (
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[#6E6E73] border border-[#E5E5E7]">
                      Private
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#6E6E73]">
                  {activeChannel.description || 'Secure communication pod'}
                </p>
              </div>
            </div>

            {pinnedMessages.length > 0 && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F5F5F7] text-black border border-[#E5E5E7] flex items-center gap-1">
                <Pin size={11} className="fill-black" /> {pinnedMessages.length} Pinned
              </span>
            )}
          </div>

          {/* Pinned Messages Bar (if any) */}
          {pinnedMessages.length > 0 && (
            <div className="mt-3 p-3 bg-[#F5F5F7] border border-[#E5E5E7] rounded-2xl text-xs">
              <div className="flex items-center gap-1 text-black font-semibold text-[10px] uppercase tracking-wider mb-1">
                <Pin size={10} className="fill-black" /> Pinned Transmission
              </div>
              <p className="text-[#6E6E73] text-xs line-clamp-1 italic">
                "{pinnedMessages[0].text}"
              </p>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
            {channelMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-sm text-[#6E6E73]">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-center mb-3">
                  <MessageSquare size={20} className="text-[#6E6E73]" />
                </div>
                <p className="font-medium text-black">No transmissions in #{activeChannel.name} yet.</p>
                <p className="text-xs text-[#6E6E73] mt-1">Start the conversation below.</p>
              </div>
            ) : (
              channelMessages.map(msg => {
                const sender = users.find(u => u.id === msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7]/40 hover:bg-[#F5F5F7] hover:border-[#D1D1D6] transition-all group relative"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {sender && <PatchAvatar user={sender} size="sm" showStatus />}
                        <span className="text-xs font-semibold text-black">
                          {sender?.name}
                        </span>
                        <span className="text-[10px] text-[#6E6E73]">
                          {sender?.handle}
                        </span>
                        <span className="text-[10px] text-[#8E8E93]">
                          • {msg.timestamp}
                        </span>
                      </div>

                      {/* Message Hover Actions */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white border border-[#E5E5E7] rounded-full px-1.5 py-0.5 shadow-xs">
                        <button
                          onClick={() => addReaction(msg.id, '⚡')}
                          className="p-1 hover:bg-[#F5F5F7] rounded-full text-xs cursor-pointer"
                          title="React ⚡"
                        >
                          ⚡
                        </button>
                        <button
                          onClick={() => addReaction(msg.id, '🚀')}
                          className="p-1 hover:bg-[#F5F5F7] rounded-full text-xs cursor-pointer"
                          title="React 🚀"
                        >
                          🚀
                        </button>

                        <button
                          onClick={() => togglePinMessage(msg.id)}
                          className={`p-1 hover:bg-[#F5F5F7] rounded-full cursor-pointer ${msg.pinned ? 'text-black' : 'text-[#6E6E73]'}`}
                          title={msg.pinned ? 'Unpin' : 'Pin message'}
                        >
                          <Pin size={12} className={msg.pinned ? 'fill-black' : ''} />
                        </button>

                        <button
                          onClick={() => setActiveThreadMessageId(msg.id)}
                          className="p-1 hover:bg-[#F5F5F7] rounded-full text-[#6E6E73] hover:text-black cursor-pointer"
                          title="Reply in thread"
                        >
                          <CornerDownRight size={12} />
                        </button>

                        {!msg.convertedToTaskId ? (
                          <button
                            onClick={() => convertMessageToTask(msg.id)}
                            className="px-2 py-0.5 rounded-full border border-[#E5E5E7] hover:border-black hover:bg-black hover:text-white text-black text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Auto-create a task from this message"
                          >
                            <ListTodo size={11} /> Task
                          </button>
                        ) : (
                          <span className="text-[9px] font-semibold text-black bg-black/5 rounded-full px-2 py-0.5">
                            ✓ Tasked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-xs text-black leading-relaxed pl-8">
                      {msg.text.split(' ').map((word, wIdx) => {
                        if (word.startsWith('@')) {
                          return (
                            <span key={wIdx} className="text-black font-semibold bg-black/5 px-1 py-0.5 rounded-md mr-1">
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
                            className="max-h-64 max-w-sm sm:max-w-md rounded-2xl border border-[#E5E5E7] hover:border-black cursor-pointer object-cover transition-colors shadow-xs"
                            loading="lazy"
                          />
                          <button
                            onClick={() => setLightboxImage(msg.attachmentUrl || null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                            title="Expand view"
                          >
                            <Maximize2 size={12} />
                          </button>
                        </div>
                        {msg.attachmentName && (
                          <span className="block text-[10px] text-[#6E6E73] mt-1 font-medium">
                            {msg.attachmentName} {msg.attachmentSize ? `• ${msg.attachmentSize}` : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Document File Attachment Rendering */}
                    {msg.attachmentType === 'file' && msg.attachmentUrl && (
                      <div className="pl-8 my-2">
                        <div className="flex items-center justify-between p-3 border border-[#E5E5E7] bg-white rounded-2xl max-w-md shadow-xs">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-center shrink-0">
                              <FileText size={16} className="text-black" />
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-xs text-black block truncate">
                                {msg.attachmentName || 'Document'}
                              </span>
                              <span className="text-[10px] text-[#6E6E73]">
                                {msg.attachmentSize || 'File attachment'}
                              </span>
                            </div>
                          </div>
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={msg.attachmentName}
                            className="px-3 py-1.5 rounded-full border border-[#E5E5E7] hover:border-black hover:bg-black hover:text-white text-black text-[11px] font-medium flex items-center gap-1 transition-all shrink-0 ml-2"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Voice Note Audio Rendering */}
                    {msg.attachmentType === 'audio' && msg.attachmentUrl && (
                      <div className="pl-8 my-2">
                        <div className="p-3 border border-[#E5E5E7] bg-white rounded-2xl max-w-md space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-black flex items-center gap-1.5">
                              <Mic size={13} className="text-black" /> {msg.attachmentName || 'Voice Note'}
                            </span>
                            {msg.audioDuration && (
                              <span className="text-[10px] font-medium text-[#6E6E73] px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7]">
                                {msg.audioDuration}
                              </span>
                            )}
                          </div>
                          <audio
                            src={msg.attachmentUrl}
                            controls
                            className="w-full h-8"
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
                            className="px-2.5 py-0.5 bg-white border border-[#E5E5E7] hover:border-black rounded-full text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[10px] font-semibold text-[#6E6E73]">{r.userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Thread link button */}
                    {msg.replyCount > 0 && (
                      <div className="pl-8 mt-2">
                        <button
                          onClick={() => setActiveThreadMessageId(msg.id)}
                          className="text-[11px] font-medium text-black hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CornerDownRight size={12} /> {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
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
          <div className="relative pt-3 border-t border-[#E5E5E7]">
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
              <div className="absolute bottom-16 left-0 w-64 bg-white border border-[#E5E5E7] rounded-2xl p-2 z-50 shadow-xl">
                <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block px-2 mb-1.5">
                  Mention Member
                </span>
                <div className="space-y-1">
                  {users
                    .filter(u => u.handle.toLowerCase().includes(mentionFilter) || u.name.toLowerCase().includes(mentionFilter))
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => insertMention(u.handle)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-[#F5F5F7] rounded-xl text-left text-xs transition-colors cursor-pointer"
                      >
                        <PatchAvatar user={u} size="sm" />
                        <div>
                          <span className="font-semibold block leading-none text-black">{u.name}</span>
                          <span className="text-[10px] text-[#6E6E73]">{u.handle}</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Staged File / Image Preview Bar */}
            {stagedFile && (
              <div className="mb-2 p-2.5 border border-[#E5E5E7] bg-[#F5F5F7] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {stagedPreviewUrl ? (
                    <img
                      src={stagedPreviewUrl}
                      alt="Staged"
                      className="w-10 h-10 object-cover rounded-xl border border-[#E5E5E7] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5E7] flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-black" />
                    </div>
                  )}
                  <div className="truncate">
                    <span className="text-xs font-semibold text-black block truncate">{stagedFile.name}</span>
                    <span className="text-[10px] text-[#6E6E73]">
                      {(stagedFile.size / 1024).toFixed(1)} KB • Ready to send
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeStagedFile}
                  className="p-1.5 hover:bg-white rounded-full text-[#6E6E73] hover:text-black transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Voice Recording Live Bar */}
            {isRecording ? (
              <div className="p-3 border border-red-200 bg-red-50 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                    Recording [{Math.floor(recordingSeconds / 60)}:{recordingSeconds % 60 < 10 ? '0' : ''}{recordingSeconds % 60}]
                  </span>
                  <span className="text-[11px] text-[#6E6E73] hidden sm:inline">
                    • Capturing audio memo...
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="px-3 py-1.5 rounded-full border border-red-200 hover:bg-white text-red-600 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => stopAndSendVoiceRecording()}
                    className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send size={11} />
                    <span>Send Audio</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full p-1.5 focus-within:border-black/30 focus-within:bg-white transition-all">
                {/* Attach File / Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full text-[#6E6E73] hover:text-black hover:bg-white/80 transition-all cursor-pointer"
                  title="Attach image or document"
                >
                  <Paperclip size={15} />
                </button>

                {/* Record Voice Note Button */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="p-2 rounded-full text-[#6E6E73] hover:text-black hover:bg-white/80 transition-all cursor-pointer"
                  title="Record voice note memo"
                >
                  <Mic size={15} />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={`Message #${activeChannel.name}... (@ to mention)`}
                  className="flex-1 bg-transparent border-0 px-2 py-1.5 text-xs text-black placeholder-[#8E8E93] focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isUploading || (!messageText.trim() && !stagedFile)}
                  className="px-4 py-2 bg-black hover:bg-black/90 disabled:opacity-30 text-white text-xs font-medium rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Thread Replies Side Panel (if open) */}
        {activeThreadMessageId && threadParentMessage && (
          <div className="lg:col-span-4 bg-white border border-[#E5E5E7] rounded-3xl p-5 flex flex-col justify-between h-[680px] sm:h-[720px] shadow-sm">
            <div className="pb-3 border-b border-[#E5E5E7] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-black">
                <CornerDownRight size={14} className="text-black" />
                <span>Thread Discussion</span>
              </div>
              <button
                onClick={() => setActiveThreadMessageId(null)}
                className="p-1 rounded-full text-[#6E6E73] hover:text-black hover:bg-[#F5F5F7] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Parent Message */}
            <div className="p-3.5 bg-[#F5F5F7] border border-[#E5E5E7] rounded-2xl my-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-black">
                  {users.find(u => u.id === threadParentMessage.senderId)?.name}
                </span>
                <span className="text-[10px] text-[#6E6E73]">{threadParentMessage.timestamp}</span>
              </div>
              <p className="text-black">{threadParentMessage.text}</p>
            </div>

            {/* Thread Replies Stream */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-2 pr-1">
              {threadReplies.length === 0 ? (
                <div className="text-center text-xs text-[#6E6E73] p-6">
                  No replies yet. Send a response in this thread.
                </div>
              ) : (
                threadReplies.map(reply => {
                  const replySender = users.find(u => u.id === reply.senderId);
                  return (
                    <div key={reply.id} className="p-3 bg-[#F5F5F7]/50 border border-[#E5E5E7] rounded-2xl text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        {replySender && <PatchAvatar user={replySender} size="sm" />}
                        <span className="font-semibold text-black">{replySender?.name}</span>
                        <span className="text-[10px] text-[#6E6E73]">• {reply.timestamp}</span>
                      </div>
                      <p className="text-black pl-7 leading-relaxed">{reply.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendThread} className="pt-3 border-t border-[#E5E5E7] flex items-center gap-2">
              <input
                type="text"
                value={threadText}
                onChange={(e) => setThreadText(e.target.value)}
                placeholder="Reply in thread..."
                className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full px-3.5 py-2 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black/30 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-black hover:bg-black/90 text-white rounded-full text-xs font-medium cursor-pointer shadow-xs transition-all"
              >
                Reply
              </button>
            </form>
          </div>
        )}

      </div>

      {/* CREATE CHANNEL MODAL */}
      {isCreateChannelOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateChannelSubmit}
            className="bg-white text-black border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-md w-full p-6 sm:p-8 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] mb-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-black">
                  New Channel.
                </h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">
                  Create a dedicated space for your team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1.5">Channel Name *</label>
                <div className="flex items-center bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 focus-within:border-black focus-within:bg-white transition-all">
                  <span className="text-[#8E8E93] mr-1">#</span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. deal-flow-scout"
                    className="flex-1 bg-transparent text-xs text-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1.5">Topic Description</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What is this channel for?"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="private-chk"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="w-4 h-4 rounded accent-black cursor-pointer"
                />
                <label htmlFor="private-chk" className="text-xs text-black cursor-pointer font-medium">
                  Private Channel (Restricted access)
                </label>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-black hover:bg-black/90 text-white text-xs font-medium shadow-xs cursor-pointer transition-all"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 px-3 py-1.5 bg-white/20 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md transition-all flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <X size={14} />
              <span>Close</span>
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged transmission"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
