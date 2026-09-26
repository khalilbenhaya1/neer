import Foundation

public enum NeerCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum NeerCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum NeerCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum NeerCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct NeerCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: NeerCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: NeerCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: NeerCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: NeerCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct NeerCameraClipParams: Codable, Sendable, Equatable {
    public var facing: NeerCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: NeerCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: NeerCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: NeerCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
