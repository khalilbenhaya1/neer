import { useState } from 'react';
import {
    LayoutDashboard, Brain, Target, Activity,
    MessageSquare, Users, Radio, Smartphone,
    Wrench, Clock, Shield, BarChart3, Database,
    AlertTriangle, Server, Network, ScrollText,
    Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { PageId } from '../../router';
import { navigateTo } from '../../router';

interface SidebarProps {
    currentPage: PageId;
}

const SECTIONS = [
    {
        id: 'core',
        label: '🧠 CORE',
        items: [
            { id: 'command-center' as PageId, icon: LayoutDashboard, label: 'Command Center' },
            { id: 'cognitive-pulse' as PageId, icon: Brain, label: 'Cognitive Pulse' },
            { id: 'goals' as PageId, icon: Target, label: 'Goals & Objectives' },
            { id: 'system-health' as PageId, icon: Activity, label: 'System Health' },
        ],
    },
    {
        id: 'comms',
        label: '💬 COMMUNICATION',
        items: [
            { id: 'conversations' as PageId, icon: MessageSquare, label: 'Conversations' },
            { id: 'agents' as PageId, icon: Users, label: 'Agents' },
            { id: 'channels' as PageId, icon: Radio, label: 'Channels' },
            { id: 'devices' as PageId, icon: Smartphone, label: 'Devices' },
        ],
    },
    {
        id: 'capabilities',
        label: '🧰 CAPABILITIES',
        items: [
            { id: 'skills' as PageId, icon: Wrench, label: 'Skills' },
            { id: 'automation' as PageId, icon: Clock, label: 'Automation' },
            { id: 'execution-control' as PageId, icon: Shield, label: 'Execution Control' },
        ],
    },
    {
        id: 'intelligence',
        label: '📊 INTELLIGENCE',
        items: [
            { id: 'usage-models' as PageId, icon: BarChart3, label: 'Usage & Models' },
            { id: 'memory' as PageId, icon: Database, label: 'Memory' },
            { id: 'threat-monitor' as PageId, icon: AlertTriangle, label: 'Threat Monitor' },
        ],
    },
    {
        id: 'system',
        label: '⚙ SYSTEM',
        items: [
            { id: 'gateway-core' as PageId, icon: Server, label: 'Gateway Core' },
            { id: 'nodes' as PageId, icon: Network, label: 'Nodes' },
            { id: 'logs' as PageId, icon: ScrollText, label: 'Logs' },
            { id: 'configuration' as PageId, icon: Settings, label: 'Configuration' },
        ],
    },
];

export function Sidebar({ currentPage }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className="glass-elevated flex flex-col border-r border-white/5 flex-shrink-0 transition-all duration-300 relative z-40"
            style={{ width: collapsed ? 56 : 220 }}
        >
            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-8 w-6 h-6 rounded-full glass-elevated border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-50"
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {SECTIONS.map((section) => (
                    <div key={section.id} className="mb-2">
                        {!collapsed && (
                            <div className="px-3 py-1.5 text-[9px] font-bold tracking-[0.18em] text-slate-500 uppercase">
                                {section.label}
                            </div>
                        )}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigateTo(item.id)}
                                    className={`nav-item w-full text-left ${isActive ? 'active' : ''}`}
                                    title={collapsed ? item.label : undefined}
                                    style={collapsed ? { justifyContent: 'center', padding: '8px' } : {}}
                                >
                                    <Icon className="icon" />
                                    {!collapsed && <span>{item.label}</span>}
                                </button>
                            );
                        })}
                        {!collapsed && <div className="h-px bg-white/5 mt-2 mx-1" />}
                    </div>
                ))}
            </nav>

            {/* Footer brand */}
            {!collapsed && (
                <div className="px-3 py-3 border-t border-white/5">
                    <p className="text-[9px] text-slate-600 text-center leading-tight">
                        Designed & Engineered by<br />
                        <span className="text-slate-500">Khalil Benhaya</span>
                    </p>
                </div>
            )}
        </aside>
    );
}
