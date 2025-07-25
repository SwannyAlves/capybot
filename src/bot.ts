import {
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import P from 'pino';
import qrcode from 'qrcode-terminal';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'info' }),
    version,
  });

  sock.ev.on('creds.update', saveCreds);

  // Handle QR code generation
  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('QR Code received, scan with WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('Connected to WhatsApp!');
      return;
    }

    if (connection === 'close') {
      //  const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      //   if (shouldReconnect) startBot()

      console.log('lastDisconnect', lastDisconnect);
      console.log('connection', connection);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];

    if (msg && !msg.key.fromMe && msg.message?.conversation) {
      const sender = msg.key.remoteJid as string;
      const text = msg.message.conversation.toLowerCase();

      console.log(`📩 Message from ${sender}: ${text}`);

      if (text === 'hi') {
        await sock.sendMessage(sender, {
          text: 'Hello! How can I help you today?',
        });
      }
    }
  });
}

startBot();
