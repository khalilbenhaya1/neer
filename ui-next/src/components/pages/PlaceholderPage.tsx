import type { PageId } from '../../router';
import { navigateTo } from '../../router';
import { LayoutDashboard } from 'lucide-react';

interface PlaceholderPageProps {
    page: PageId;
}

const PAGE_LABELS: Partial<Record<PageId, string>> = {
    'goals': 'Goals & Objectives',
    'system-health': 'System Health',
    'agents': 'Agents',
    'channels': 'Channels',
    'devices': 'Devices',
    'skills': 'Skills',
    'automation': 'Automation',
    'execution-control': 'Execution Control',
    'memory': 'Memory',
    'nodes': 'Nodes',
    'logs': 'Logs',
    'configuration': 'Configuration',
};

export function PlaceholderPage({ page }: PlaceholderPageProps) {
    const label = PAGE_LABELS[page] ?? page;
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center">
                <LayoutDashboard className="w-7 h-7 text-[#7c3aed]" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white mb-1">{label}</h2>
                <p className="text-sm text-slate-500">This page is under construction. Gateway data will appear here once integration is complete.</p>
            </div>
            <button
                onClick={() => navigateTo('command-center')}
                className="mt-2 px-5 py-2 bg-[#7c3aed]/15 hover:bg-[#7c3aed]/25 border border-[#7c3aed]/30 text-[#a78bfa] text-sm font-medium rounded-xl transition-all"
            >
                ← Back to Command Center
            </button>
        </div>
    );
}
