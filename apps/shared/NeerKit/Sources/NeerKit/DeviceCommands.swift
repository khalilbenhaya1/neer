import Foundation

public enum NeerDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum NeerBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum NeerThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum NeerNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum NeerNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct NeerBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: NeerBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: NeerBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct NeerThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: NeerThermalState

    public init(state: NeerThermalState) {
        self.state = state
    }
}

public struct NeerStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct NeerNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: NeerNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [NeerNetworkInterfaceType]

    public init(
        status: NeerNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [NeerNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct NeerDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: NeerBatteryStatusPayload
    public var thermal: NeerThermalStatusPayload
    public var storage: NeerStorageStatusPayload
    public var network: NeerNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: NeerBatteryStatusPayload,
        thermal: NeerThermalStatusPayload,
        storage: NeerStorageStatusPayload,
        network: NeerNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct NeerDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
