package ai.neer.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class NeerProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", NeerCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", NeerCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", NeerCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", NeerCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", NeerCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", NeerCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", NeerCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", NeerCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", NeerCapability.Canvas.rawValue)
    assertEquals("camera", NeerCapability.Camera.rawValue)
    assertEquals("screen", NeerCapability.Screen.rawValue)
    assertEquals("voiceWake", NeerCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", NeerScreenCommand.Record.rawValue)
  }
}
