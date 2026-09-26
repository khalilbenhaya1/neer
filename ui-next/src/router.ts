export type PageId =
    // CORE
    | 'command-center'
    | 'cognitive-pulse'
    | 'goals'
    | 'system-health'
    // COMMUNICATION
    | 'conversations'
    | 'agents'
    | 'channels'
    | 'devices'
    // CAPABILITIES
    | 'skills'
    | 'automation'
    | 'execution-control'
    // INTELLIGENCE
    | 'usage-models'
    | 'memory'
    | 'threat-monitor'
    // SYSTEM
    | 'gateway-core'
    | 'nodes'
    | 'logs'
    | 'configuration';

export function getPageFromHash(): PageId {
    const hash = window.location.hash.replace('#/', '').replace('#', '') as PageId;
    const valid: PageId[] = [
        'command-center', 'cognitive-pulse', 'goals', 'system-health',
        'conversations', 'agents', 'channels', 'devices',
        'skills', 'automation', 'execution-control',
        'usage-models', 'memory', 'threat-monitor',
        'gateway-core', 'nodes', 'logs', 'configuration',
    ];
    return valid.includes(hash) ? hash : 'command-center';
}

export function navigateTo(page: PageId) {
    window.location.hash = `#/${page}`;
}
