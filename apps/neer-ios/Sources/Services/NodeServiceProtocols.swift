import CoreLocation
import Foundation
import NeerKit
import UIKit

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: NeerCameraSnapParams) async throws -> (format: String, base64: String, width: Int, height: Int)
    func clip(params: NeerCameraClipParams) async throws -> (format: String, base64: String, durationMs: Int, hasAudio: Bool)
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: NeerLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: NeerLocationGetParams,
        desiredAccuracy: NeerLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
}

protocol DeviceStatusServicing: Sendable {
    func status() async throws -> NeerDeviceStatusPayload
    func info() -> NeerDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: NeerPhotosLatestParams) async throws -> NeerPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: NeerContactsSearchParams) async throws -> NeerContactsSearchPayload
    func add(params: NeerContactsAddParams) async throws -> NeerContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: NeerCalendarEventsParams) async throws -> NeerCalendarEventsPayload
    func add(params: NeerCalendarAddParams) async throws -> NeerCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: NeerRemindersListParams) async throws -> NeerRemindersListPayload
    func add(params: NeerRemindersAddParams) async throws -> NeerRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: NeerMotionActivityParams) async throws -> NeerMotionActivityPayload
    func pedometer(params: NeerPedometerParams) async throws -> NeerPedometerPayload
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
