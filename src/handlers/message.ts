import { WASocket, WAMessage } from '@whiskeysockets/baileys';
import { handleText } from './text';
import { handleSticker } from './sticker';
import { DEFAULT_MESSAGE, ERROR_MESSAGE } from '../constants/messages';

export const handleMessage = async (
  sock: WASocket,
  msg: WAMessage
): Promise<void> => {
  const sender = msg.key.remoteJid as string;

  try {
    // Detect message type and route
    if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
      await handleText(sock, sender, msg);
    } else if (msg.message?.imageMessage || msg.message?.videoMessage) {
      await handleSticker(sock, sender, msg);
    } else {
      // Unsupported message type
      await sock.sendMessage(sender, {
        text: DEFAULT_MESSAGE,
      });
    }
  } catch (error) {
    console.error('❌ Error processing message:', error);
    await sock.sendMessage(sender, {
      text: ERROR_MESSAGE,
    });
  }
};
