const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 5000;

// Object to store QR code data for each client
let qrCodeData = {};

// Function to create and configure WhatsApp client
 function createClient(clientId, minMessages, maxMessages,replyMessage,delay) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId }) // Use unique session for each client
    });

    let keywordDetected = false;
    let messageCounter = 0;
    let randomMessageThreshold = 0;
    let isMessageSent = false;
  

    client.on('qr', (qr) => {
        console.log(`QR code for ${clientId} received, scan it with your WhatsApp app:`);

        // Generate QR code as base64 data URL
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Failed to generate QR code:', err);
            } else {
                // Save QR code base64 URL to the global object
                qrCodeData[clientId] = url;
            }
        });
    });

    client.on('ready', () => {
        console.log(`${clientId} is ready!`);
    });
    
    client.on('auth_failure', () => {
        console.log('Autentikasi gagal! Reset proses...');
        process.exit(1); // Reset aplikasi

    });

    client.on('disconnected', (reason) => {
        console.log(`Bot terputus: ${reason}. Memaksa keluar...`);
        process.exit(1); // Reset aplikasi
    });
    
    client.on('message', async (message) => {
        try {
            //Untuk Grup
        const groupIds = new Set(['120363330027562897@g.us','120363375009644369@g.us']);
        const cekGroup = groupIds.has(message.from);
            // Untuk Pengirim
        const cekPeopleid = new Set(['62895424010064@c.us']);
        const peopleIds = cekPeopleid.has(message.author);
        const cekKunci = ['Halo dek'].some(keyword => message.body.toLowerCase().includes(keyword));
        const pesan1 = ['apa yung'].some(keyword => message.body.toLowerCase().includes(keyword));
        const pesan2 = ['yes i am'].some(keyword => message.body.toLowerCase().includes(keyword));
        const slot = ['masih ada slot'].some(keyword => message.body.toLowerCase().includes(keyword));
        const kataTamb = ['1 orang'].some(keyword => message.body.toLowerCase().includes(keyword));
        // if (message.fromMe) return; // Ignore messages from the bot itself
        // Detect keyword only once
        if (clientId === "client2" && slot) { // Gunakan '===' untuk perbandingan
            if (cekPeopleid && cekGroup) {
                // Pastikan client2 adalah objek klien, bukan string
                client2.sendMessage(message.from, "yang bener");
                console.log("pesan terkirim dari",clientId);
            }
        }
        //detect masuk ke grup
        if (cekGroup && cekKunci && kataTamb && peopleIds && !keywordDetected && !isMessageSent)
        {
            
            console.log(`keyword terdeteksi ${clientId}.`);
            keywordDetected = true;
            messageCounter = 0;
            randomMessageThreshold = Math.floor(Math.random() * (maxMessages - minMessages + 1)) + minMessages;
            console.log(`Waiting for ${randomMessageThreshold} new messages before replying.`);
        }
        

        if (keywordDetected && !isMessageSent && cekGroup) {
            messageCounter++;

            if (clientId === "client1" && pesan2){
                isMessageSent = true;
                keywordDetected = 0;
                messageCounter = 0;
                console.log("pesan sudah dibalas tanpa bot");
            }
            if (clientId === "client2" && pesan1){
               
                isMessageSent = true;
                keywordDetected = 0;
                messageCounter = 0;
                console.log("pesan sudah dibalas tanpa bot");
            }

            // console.log(`New message received on ${clientId}: "${message.body}" (${messageCounter}/${randomMessageThreshold})`);
            if (messageCounter >= randomMessageThreshold && !isMessageSent) {
                const detik = Math.floor(Math.random() * delay) + 1000; // Random delay between 1-10 seconds
                // console.log(`Reply will be sent by ${clientId} in ${detik / 1000} seconds...`);

                isMessageSent = true; // Mark that the message has been sent
                keywordDetected = false; // Reset keyword detection to avoid repeated detections
                messageCounter = 0; // Reset message counter
                setTimeout(async () => {
                 await client.sendMessage(message.from, replyMessage);
                    console.log(`${clientId} sent: "${replyMessage}"`);
                }, detik);
               
            }

           
        }

        if (isMessageSent) {
            return isMessageSent = false;
        }

    } catch (err) {
        console.error('Terjadi kesalahan:', err.message);
        process.exit(1); // Reset aplikasi
    }
    });

    return client;
}

// Create two clients
const client1 = createClient('client1', 11, 19, "apakah kami bisa bantu",1000);
const client2 = createClient('client2', 3, 5, "terimakasih apa ada yang bisa dibantu",1000);

// Initialize clients
client1.initialize();
client2.initialize();

// Express server
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded form data

app.get('/', (req, res) => {
    // Display both QR codes on the same page with Clear Session buttons
    const client1QRCode = qrCodeData.client1 ? `<img src="${qrCodeData.client1}" alt="QR Code for Client 1">` : 'QR code for Client 1 is not available yet.';
    const client2QRCode = qrCodeData.client2 ? `<img src="${qrCodeData.client2}" alt="QR Code for Client 2">` : 'QR code for Client 2 is not available yet.';
    
    res.send(`
        <h1>WhatsApp Web QR Codes</h1>
        <p><strong>Client 1 QR Code:</strong></p>
        ${client1QRCode}
        <form action="/clear-session" method="POST">
            <input type="hidden" name="clientId" value="client1">
            <button type="submit">Clear Client 1 Session</button>
        </form>
        <p><strong>Client 2 QR Code:</strong></p>
        ${client2QRCode}
        <form action="/clear-session" method="POST">
            <input type="hidden" name="clientId" value="client2">
            <button type="submit">Clear Client 2 Session</button>
        </form>
    `);
});

// Route to clear session data
app.post('/clear-session', (req, res) => {
    const { clientId } = req.body;

    if (clientId && qrCodeData[clientId]) {
        console.log(`Clearing session for ${clientId}`);

        // Delete the session directory manually using fs
        const sessionPath = path.join(__dirname, 'wwebjs_auth', clientId);
        if (fs.existsSync(sessionPath)) {
            fs.rmdirSync(sessionPath, { recursive: true }); // Remove the session folder for the client
            console.log(`Session for ${clientId} cleared.`);
        } else {
            console.log(`No session found for ${clientId}`);
        }

        // Remove the QR code from memory
        delete qrCodeData[clientId];

        // Redirect to the home page to update the QR code status
        res.redirect('/');
    } else {
        res.status(400).send('Invalid client ID');
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
