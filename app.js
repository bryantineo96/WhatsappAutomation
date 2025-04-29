const express = require("express");

const cors = require("cors");

const OpenAI = require("openai");

const cron = require('node-cron');


cron.schedule('* * * * *', () => {
  console.log('Ejecutando tarea cada minuto:', new Date().toLocaleString());
});



require("dotenv").config(); // Cargar variables de entorno


//console.log("API Key:", process.env.OPENAI_API_KEY);


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Asegúrate de que la API Key es válida
});


//npm install openai dotenv express cors



const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Crear una instancia de Express
const app = express();

// se habilita peticiones desde cualquier origen
app.use(cors());


// Importar libreria soap
const soap = require("soap");

// Importar libreria fs
const fs = require("fs");


const tempCodes = {}; // Almacenará los códigos temporalmente

const wwebVersion = '2.2407.3';


const client = new Client({
  authStrategy: new LocalAuth(), // your authstrategy here
puppeteer: {
        headless: true, // Asegúrate que esté en true para servidor
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Útil si tienes problemas con /dev/shm pequeño
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Puede o no ser necesario
            '--disable-gpu' // A veces ayuda en servidores sin GPU
        ],
  webVersionCache: {
    type: 'remote',
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
  },
});


// Usar json para los body de las peticiones
app.use(express.json());





// Función para retornar saludo según el tiempo de envio
function getGreeting() {
  var fecha = new Date();
  var hora = fecha.getHours();

  if (hora >= 5 && hora < 12) {
    return "¡Buenos días!";
  } else if (hora >= 12 && hora < 19) {
    return "¡Buenas tardes!";
  } else {
    return "¡Buenas noches!";
  }
}

//Función para pausar la ejecución por un tiempo determinado
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';




// Cuando se recibe el QR de autenticación
client.on("qr", (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

client.on("loading_screen", (percent, message) => {
  console.log("LOADING SCREEN", percent, message);
});



// Conectar cliente
client.on("ready", () => {
  console.log("Cliente esta listo!");
});



app.post("/send-message-single", async (req, res) => {

  const { phoneNumber, message, } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "Faltan los parámetros phoneNumber o message" });
  }

  try {
    const contact = `${phoneNumber}@c.us`; // Formato correcto para números internacionales

    // Enviar el mensaje
    await client.sendMessage(contact, message);

    return res.status(200).json({ success: "Mensaje enviado correctamente" });
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    return res.status(500).json({ error: "Hubo un error al enviar el mensaje" });
  }


});


/*
// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("API REST corriendo en http://localhost:3000");
  client.initialize();
});
*/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API REST corriendo en http://localhost:${PORT}`);
  client.initialize();
});
