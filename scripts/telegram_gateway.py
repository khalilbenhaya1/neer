
import asyncio
import argparse
import logging
import json
import os
import signal
import re
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters
from telegram.constants import ParseMode
import websockets

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

class NeerTelegramGateway:
    def __init__(self, token, owner_id, gateway_url="ws://127.0.0.1:18789"):
        self.token = token
        self.owner_id = int(owner_id)
        self.gateway_url = gateway_url
        self.ws = None
        self.application = None
        self.session_key = "main" # Default main session
        self.chat_history_buffer = []

    async def connect_neer(self):
        """Connect to Neer WebSocket Gateway."""
        try:
            logger.info(f"Connecting to Neer Gateway at {self.gateway_url}...")
            self.ws = await websockets.connect(self.gateway_url)
            logger.info("Connected to Neer Gateway.")
            
            # Send initial hello/auth payload (mimicking gateway.ts)
            # For local unsecure connection, we might just need to send a 'connect' request.
            connect_msg = {
                "type": "req",
                "id": f"req-{os.urandom(4).hex()}",
                "method": "connect",
                "params": {
                    "client": {
                        "id": "telegram-gateway",
                        "version": "1.0.0",
                        "platform": "python",
                        "mode": "bot"
                    },
                    "role": "operator",
                    "scopes": ["operator.admin", "operator.approvals"],
                    "auth": { "token": os.environ.get("NEER_GATEWAY_TOKEN", "") } 
                }
            }
            if self.ws:
                await self.ws.send(json.dumps(connect_msg))
            
            # Start listening loop
            asyncio.create_task(self.listen_neer())
            
        except Exception as e:
            logger.error(f"Failed to connect to Neer Gateway: {e}")
            self.ws = None
            # Retry logic could be added here
            await asyncio.sleep(5)
            await self.connect_neer()

    async def listen_neer(self):
        """Listen for messages from Neer and forward to Telegram."""
        if not self.ws:
            return

        try:
            async for message in self.ws:
                data = json.loads(message)
                # logger.debug(f"Received from Neer: {data}")
                
                # Handle 'event' types
                if data.get('type') == 'event':
                    event_type = data.get('event')
                    payload = data.get('payload', {})
                    
                    # 1. Chat Delta (Streaming text)
                    if event_type == 'chat.delta':
                        pass

                    # 2. Chat Final or Message (Run completed)
                    elif event_type in ('chat.response.final', 'chat.message'): 
                         # Extract text content
                         content = payload.get('text', '') or payload.get('message', '')
                         if not content:
                             continue
                             
                         # Detect and send Media
                         # Looking for: Image: [path] or Video: [path]
                         # Regex for Image: ...
                         image_matches = re.findall(r'Image:\s*(.*?)(?:\n|$)', content)
                         video_matches = re.findall(r'Video:\s*(.*?)(?:\n|$)', content)
                         
                         clean_text = content
                         
                         # Send Text First
                         if clean_text:
                             # Sanitize? Maybe not needed for simple text.
                             if self.application:
                                await self.application.bot.send_message(chat_id=self.owner_id, text=clean_text)
                         
                         # Send Images
                         for img_path in image_matches:
                             img_path = img_path.strip()
                             if os.path.exists(img_path):
                                 logger.info(f"Sending image: {img_path}")
                                 if self.application:
                                    await self.application.bot.send_photo(chat_id=self.owner_id, photo=open(img_path, 'rb'))
                             else:
                                 logger.warning(f"Image not found: {img_path}")
                                 
                         # Send Videos
                         for vid_path in video_matches:
                             vid_path = vid_path.strip()
                             if os.path.exists(vid_path):
                                 logger.info(f"Sending video: {vid_path}")
                                 if self.application:
                                    await self.application.bot.send_video(chat_id=self.owner_id, video=open(vid_path, 'rb'))
                             else:
                                 logger.warning(f"Video not found: {vid_path}")
                    
                # Handle Response to our requests
                if data.get('type') == 'res':
                    pass
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Neer Gateway connection closed. Reconnecting...")
            self.ws = None
            await asyncio.sleep(2)
            await self.connect_neer()

    async def send_to_neer(self, text):
        """Send a message to Neer."""
        if not self.ws:
            logger.warning("Neer websocket not connected. Attempting reconnect.")
            await self.connect_neer()
            
        if self.ws:
            run_id = f"run-{os.urandom(4).hex()}"
            msg = {
                "type": "req",
                "id": f"req-{os.urandom(4).hex()}",
                "method": "chat.send",
                "params": {
                    "sessionKey": self.session_key,
                    "message": text,
                    "idempotencyKey": run_id
                }
            }
            if self.ws:
                await self.ws.send(json.dumps(msg))
                logger.info(f"Sent to Neer: {text}")
            else:
                logger.error("Cannot send to Neer: WebSocket not connected")

    async def telegram_message_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle incoming Telegram messages."""
        user = update.effective_user
        if user.id != self.owner_id:
            logger.warning(f"Unauthorized access attempt from {user.id} ({user.username})")
            return 

        text = update.message.text
        if not text:
            return

        logger.info(f"Telegram User: {text}")
        
        # Forward to Neer
        await self.send_to_neer(text)
        
        # For now, acknowledge receipt until full duplex is working
        # await update.message.reply_text("Sent to Neer...")

    async def run(self):
        # Initialize Telegram Bot
        self.application = ApplicationBuilder().token(self.token).build()
        if not self.application:
            logger.error("Failed to build Telegram Application")
            return
            
        self.application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), self.telegram_message_handler))

        # Start Neer Connection
        await self.connect_neer()
        
        # Start Telegram Polling
        await self.application.initialize()
        await self.application.start()
        if self.application.updater:
            await self.application.updater.start_polling()
        
        logger.info("Telegram Gateway Started.")
        
        # Keep main loop alive
        stop_signal = asyncio.Event()
        
        def signal_handler():
            stop_signal.set()
            
        # Register signal handlers for graceful shutdown (if supported on Windows)
        # Windows supports SIGINT and SIGTERM mostly
        # signal.signal(signal.SIGINT, lambda s, f: signal_handler())

        # Just wait forever
        while True:
            await asyncio.sleep(1)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Neer Telegram Gateway')
    parser.add_argument('--token', required=True, help='Telegram Bot Token')
    parser.add_argument('--owner', required=True, help='Owner Telegram ID')
    args = parser.parse_args()

    gateway = NeerTelegramGateway(args.token, args.owner)
    
    # Run async main
    try:
        asyncio.run(gateway.run())
    except KeyboardInterrupt:
        pass
