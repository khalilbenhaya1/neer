import Foundation

public enum NeerLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}
