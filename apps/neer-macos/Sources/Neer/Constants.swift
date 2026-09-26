import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-neer writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.neer.mac"
let gatewayLaunchdLabel = "ai.neer.gateway"
let onboardingVersionKey = "neer.onboardingVersion"
let onboardingSeenKey = "neer.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "neer.pauseEnabled"
let iconAnimationsEnabledKey = "neer.iconAnimationsEnabled"
let swabbleEnabledKey = "neer.swabbleEnabled"
let swabbleTriggersKey = "neer.swabbleTriggers"
let voiceWakeTriggerChimeKey = "neer.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "neer.voiceWakeSendChime"
let showDockIconKey = "neer.showDockIcon"
let defaultVoiceWakeTriggers = ["neer"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "neer.voiceWakeMicID"
let voiceWakeMicNameKey = "neer.voiceWakeMicName"
let voiceWakeLocaleKey = "neer.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "neer.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "neer.voicePushToTalkEnabled"
let talkEnabledKey = "neer.talkEnabled"
let iconOverrideKey = "neer.iconOverride"
let connectionModeKey = "neer.connectionMode"
let remoteTargetKey = "neer.remoteTarget"
let remoteIdentityKey = "neer.remoteIdentity"
let remoteProjectRootKey = "neer.remoteProjectRoot"
let remoteCliPathKey = "neer.remoteCliPath"
let canvasEnabledKey = "neer.canvasEnabled"
let cameraEnabledKey = "neer.cameraEnabled"
let systemRunPolicyKey = "neer.systemRunPolicy"
let systemRunAllowlistKey = "neer.systemRunAllowlist"
let systemRunEnabledKey = "neer.systemRunEnabled"
let locationModeKey = "neer.locationMode"
let locationPreciseKey = "neer.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "neer.peekabooBridgeEnabled"
let deepLinkKeyKey = "neer.deepLinkKey"
let modelCatalogPathKey = "neer.modelCatalogPath"
let modelCatalogReloadKey = "neer.modelCatalogReload"
let cliInstallPromptedVersionKey = "neer.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "neer.heartbeatsEnabled"
let debugPaneEnabledKey = "neer.debugPaneEnabled"
let debugFileLogEnabledKey = "neer.debug.fileLogEnabled"
let appLogLevelKey = "neer.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
