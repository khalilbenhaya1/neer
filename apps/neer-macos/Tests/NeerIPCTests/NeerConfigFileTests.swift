import Foundation
import Testing
@testable import Neer

@Suite(.serialized)
struct NeerConfigFileTests {
    @Test
    func configPathRespectsEnvOverride() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("neer-config-\(UUID().uuidString)")
            .appendingPathComponent("neer.json")
            .path

        await TestIsolation.withEnvValues(["NEER_CONFIG_PATH": override]) {
            #expect(NeerConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func remoteGatewayPortParsesAndMatchesHost() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("neer-config-\(UUID().uuidString)")
            .appendingPathComponent("neer.json")
            .path

        await TestIsolation.withEnvValues(["NEER_CONFIG_PATH": override]) {
            NeerConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(NeerConfigFile.remoteGatewayPort() == 19999)
            #expect(NeerConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(NeerConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(NeerConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func setRemoteGatewayUrlPreservesScheme() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("neer-config-\(UUID().uuidString)")
            .appendingPathComponent("neer.json")
            .path

        await TestIsolation.withEnvValues(["NEER_CONFIG_PATH": override]) {
            NeerConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            NeerConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = NeerConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @Test
    func stateDirOverrideSetsConfigPath() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("neer-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "NEER_CONFIG_PATH": nil,
            "NEER_STATE_DIR": dir,
        ]) {
            #expect(NeerConfigFile.stateDirURL().path == dir)
            #expect(NeerConfigFile.url().path == "\(dir)/neer.json")
        }
    }
}
