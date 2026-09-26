import Foundation

public enum NeerChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(NeerChatEventPayload)
    case agent(NeerAgentEventPayload)
    case seqGap
}

public protocol NeerChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> NeerChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [NeerChatAttachmentPayload]) async throws -> NeerChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> NeerChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<NeerChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension NeerChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "NeerChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> NeerChatSessionsListResponse {
        throw NSError(
            domain: "NeerChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
