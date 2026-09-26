// swift-tools-version: 6.2
// Package manifest for the Neer macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "Neer",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "NeerIPC", targets: ["NeerIPC"]),
        .library(name: "NeerDiscovery", targets: ["NeerDiscovery"]),
        .executable(name: "Neer", targets: ["Neer"]),
        .executable(name: "neer-mac", targets: ["NeerMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/NeerKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "NeerIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "NeerDiscovery",
            dependencies: [
                .product(name: "NeerKit", package: "NeerKit"),
            ],
            path: "Sources/NeerDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "Neer",
            dependencies: [
                "NeerIPC",
                "NeerDiscovery",
                .product(name: "NeerKit", package: "NeerKit"),
                .product(name: "NeerChatUI", package: "NeerKit"),
                .product(name: "NeerProtocol", package: "NeerKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/Neer.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "NeerMacCLI",
            dependencies: [
                "NeerDiscovery",
                .product(name: "NeerKit", package: "NeerKit"),
                .product(name: "NeerProtocol", package: "NeerKit"),
            ],
            path: "Sources/NeerMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "NeerIPCTests",
            dependencies: [
                "NeerIPC",
                "Neer",
                "NeerDiscovery",
                .product(name: "NeerProtocol", package: "NeerKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
