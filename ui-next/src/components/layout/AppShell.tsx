import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ConnectionBanner } from './ConnectionBanner';
import { useGateway } from '../../hooks/useGateway';
import { getPageFromHash, type PageId } from '../../router';

// Lazy page imports
import { CommandCenter } from '../pages/CommandCenter';
import { CognitivePulse } from '../pages/CognitivePulse';
import { ThreatMonitor } from '../pages/ThreatMonitor';
import { GatewayCore } from '../pages/GatewayCore';
import { Conversations } from '../pages/Conversations';
import { UsageModels } from '../pages/UsageModels';
import { Agents } from '../pages/Agents';
import { Channels } from '../pages/Channels';
import { Devices } from '../pages/Devices';
import { PlaceholderPage } from '../pages/PlaceholderPage';

function renderPage(page: PageId, gateway: ReturnType<typeof useGateway>) {
    switch (page) {
        case 'command-center': return <CommandCenter gateway={gateway} />;
        case 'cognitive-pulse': return <CognitivePulse gateway={gateway} />;
        case 'threat-monitor': return <ThreatMonitor gateway={gateway} />;
        case 'gateway-core': return <GatewayCore gateway={gateway} />;
        case 'conversations': return <Conversations />;
        case 'usage-models': return <UsageModels gateway={gateway} />;
        case 'agents': return <Agents gateway={gateway} />;
        case 'channels': return <Channels gateway={gateway} />;
        case 'devices': return <Devices gateway={gateway} />;
        default: return <PlaceholderPage page={page} />;
    }
}

export function AppShell() {
    const [currentPage, setCurrentPage] = useState<PageId>(getPageFromHash());
    const gateway = useGateway();

    useEffect(() => {
        const onHash = () => setCurrentPage(getPageFromHash());
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            switch (e.key.toLowerCase()) {
                case 'g': setCurrentPage('command-center'); window.location.hash = '#/command-center'; break;
                case 't': setCurrentPage('threat-monitor'); window.location.hash = '#/threat-monitor'; break;
                case 'l': setCurrentPage('logs'); window.location.hash = '#/logs'; break;
                case 's': setCurrentPage('system-health'); window.location.hash = '#/system-health'; break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[#080a12]">
            {/* Background ambient glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] left-[10%] w-[35%] h-[35%] bg-[#7c3aed]/6 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[5%] w-[30%] h-[30%] bg-[#ff4d6d]/5 blur-[100px] rounded-full" />
            </div>

            {/* TopBar */}
            <TopBar gateway={gateway} />

            {/* Disconnected banner */}
            {gateway.status === 'OFFLINE' && (
                <ConnectionBanner onReconnect={gateway.reconnect} />
            )}

            {/* Body */}
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar currentPage={currentPage} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 relative z-10">
                    <div className="animate-fade-up">
                        {renderPage(currentPage, gateway)}
                    </div>
                </main>
            </div>
        </div>
    );
}
