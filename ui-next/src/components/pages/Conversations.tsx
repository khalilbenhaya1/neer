import { ChatView } from '../chat/ChatView';
import { MessageSquare, Clock } from 'lucide-react';

export function Conversations() {
    return (
        <div className="flex h-full gap-4 -m-6 overflow-hidden" style={{ height: 'calc(100vh - 3rem)' }}>
            {/* Left: Session List */}
            <aside className="w-64 glass-elevated border-r border-white/5 flex flex-col flex-shrink-0 p-3 overflow-y-auto">
                <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase px-2 py-2 mb-1">Sessions</div>
                {/* Placeholder sessions */}
                {['main session', 'project-alpha', 'research'].map((s, i) => (
                    <button
                        key={s}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${i === 0 ? 'bg-[#7c3aed]/15 border border-[#7c3aed]/30' : 'hover:bg-white/5'}`}
                    >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-medium text-slate-300 capitalize">{s}</p>
                            <p className="text-[10px] text-slate-600">No recent messages</p>
                        </div>
                    </button>
                ))}
            </aside>

            {/* Center: Chat Area */}
            <div className="flex-1 overflow-hidden">
                <ChatView />
            </div>

            {/* Right: Tool Execution Timeline */}
            <aside className="w-56 glass-elevated border-l border-white/5 flex flex-col flex-shrink-0 p-3 overflow-y-auto">
                <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase px-2 py-2 mb-1">Tool Timeline</div>
                <div className="space-y-2">
                    {[
                        { tool: 'bash', time: '23:50', ok: true },
                        { tool: 'file.read', time: '23:48', ok: true },
                        { tool: 'browser.open', time: '23:45', ok: true },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/3 border border-white/5">
                            <Clock className="w-3 h-3 text-slate-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono-data text-slate-400 truncate">{item.tool}</p>
                                <p className="text-[10px] text-slate-600">{item.time}</p>
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
}
