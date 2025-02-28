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

// URL del servicio web SOAP
const url = "http://192.168.10.16/soap/webservice-server.php?wsdl";

const tempCodes = {}; // Almacenará los códigos temporalmente

const wwebVersion = '2.2407.3';


const client = new Client({
  authStrategy: new LocalAuth(), // your authstrategy here
  puppeteer: {
    headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  webVersionCache: {
    type: 'remote',
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
  },
});


// Usar json para los body de las peticiones
app.use(express.json());


// Obtener reporte JSON de servicio web
function getDataJSON(nro_semana, cod_trabajador, cod_origen) {
  // Función para leer el archivo JSON de forma asíncrona
  return new Promise((resolve, reject) => {
    // Crear cliente soap
    soap.createClient(url, (error, clientSoap) => {
      if (error) {
        reject(error);
        return;
      }

      // Argumentos del método rpt_envio_api_whatsapp
      const args = {
        nro_semana: nro_semana,
        cod_trabajador: cod_trabajador,
        cod_origen: cod_origen,
      };

      // Lamada al método rpt_envio_api_whatsapp
      clientSoap.rpt_envio_api_whatsapp_oracle(args, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const jsonObject = JSON.parse(result.data.$value);
          resolve(jsonObject);
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}

/*
    // Actualizar estado Wapi
    function setUpdateStatusWapi(nro_semana, cod_trabajador, estado) {
      return new Promise((resolve, reject) => {
        // Crear cliente soap
        soap.createClient(url, (error, clientSoap) => {
          if (error) {
            reject(error);
            return;
          }

          // Argumentos del método rpt_envio_api_whatsapp
          const args = {
            nro_semana: nro_semana,
            cod_trabajador: cod_trabajador,
            estado: estado,
          };

          // Lamada al método rpt_envio_api_whatsapp
          clientSoap.updateEstado_wapi(args, (error) => {
            if (error) {
              reject(error);
              return;
            }

            try {
              resolve("Estado Actualizado");
            } catch (error) {
              reject(error);
            }
          });
        });
      });
    }
*/

// Función para enviar un mensaje a un contacto
function sendMessageToContact(contact, message) {
  return new Promise((resolve, reject) => {
    client
      .sendMessage(contact, message)
      .then((response) => {
        if (response._data.isNewMsg) {
          resolve("Mensaje enviado exitosamente");
        } else {
          reject("Error al enviar el mensaje");
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

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


/*

client.on("message", async (msg) => {
  console.log(`Mensaje recibido de ${msg.from}: ${msg.body}`);

  if (msg.body.toLowerCase() === "hola") {
      await msg.reply("¡Hola! ¿En qué puedo ayudarte?");
  }

  // Puedes procesar el mensaje y almacenarlo en la base de datos
});*/
/*
client.on("message", async (msg) => {
  console.log(`Mensaje recibido de ${msg.from}: ${msg.body}`);

 //if (msg.body.startsWith("GPT:")) { // Solo responde si el mensaje empieza con "GPT:"
    //  let userMessage = msg.body.replace("GPT:", "").trim();


let userMessage = msg.body;
      try {
          let response = await openai.chat.completions.create({
              model: "gpt-3.5-turbo", // Modelo correcto

              messages:   [{ role: "system", content: "Eres un asistente que responde solo sobre la empresa 'SEAFROST S.A.C.'. No inventes información."},
                          { role: "user", content: userMessage }],
          });

          let replyText = response.choices[0].message.content;
          await msg.reply(replyText);
      } catch (error) {
          console.error("Error en OpenAI:", error); // 🔹 Agregamos esto
          await msg.reply("Lo siento, ocurrió un error al procesar tu solicitud.");
      }
  //}
});
*/

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

// Ruta para enviar un mensaje
app.post("/send-message", async (req, res) => {
  const { in_nro_semana, in_codigo_trabajador, in_origen } = req.body;

  await sleep(400);

  try {
    // const jsonObject = await readJSONFile(filePath);

    // JSON obtenido desde el servicio web
    const jsonObject = await getDataJSON(in_nro_semana, in_codigo_trabajador, in_origen);

    let contador = 0;
    //  console.log(jsonObject);

    for (const item of jsonObject) {
      const contact = `51${item.NRO_CELL}@c.us`;
      // const contact = `51970577832@c.us`;
      let contenido = "";
      contador += 1;
      const arr = item.DATA_API;

      // Fecha y hora actual
      let now = new Date();

      // Ciclo para formatear el texto
      for (const data of arr) {
        const fechaString = data["FECHA"];
        const fecha = new Date(fechaString);
        const dia = fecha.getDate();
        const mes = fecha.getMonth();
        const meses = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];
        const nombreMes = meses[mes];
        const fechaFormateada = `${dia}/${nombreMes}`;
        contenido += `${fechaFormateada}: ${data["IMPORTE"]}\n`;
      }

      const message = `*${getGreeting()} ${item.NOM_TRABAJADOR
        }*\nTe escribo para hacerte llegar el reporte bruto por los siguientes días:\n${contenido}*TOTAL: ${item.TOTAL
        }*\n\nPor favor, no responda a este WhatsApp. Si tiene dudas o desea consultar información adicional sobre sus descuentos efectuados ( AFP, Préstamos, entre otros) , por favor escribir a los números registrados de nuestras oficinas de acuerdo a su área de trabajo.\n*Congelado:* 994259068\n*Conservas:* 981283624\n*Atte: SEAFROST S.A.C*`;

      try {
        // Enviar mensaje a contacto
        await sendMessageToContact(contact, message);

        console.log(
          "Mensaje enviado exitosamente " +
          contador +
          " " +
          item.COD_TRABAJADOR +
          " " +
          now
        );
        return res.status(200).json({ success: "Mensaje enviado correctamente" });
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
        return res.status(500).json({ error: "Hubo un error al enviar el mensaje "+ error });
      }


    }

  } catch (error) {
    console.error("Error al leer el archivo JSON:", error);
  }
});

// Endpoint para enviar el código de recuperación por WhatsApp
app.post("/send-recovery-code", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
      return res.status(400).json({ error: "Falta el parámetro phoneNumber" });
  }

  try {
      const recoveryCode = Math.floor(100000 + Math.random() * 900000); // Código de 6 dígitos
      tempCodes[phoneNumber] = recoveryCode; // Guardar en memoria

      // Eliminar el código después de 10 minutos
      setTimeout(() => delete tempCodes[phoneNumber], 1 * 60 * 1000);

      const contact = `${phoneNumber}@c.us`;
      const message = `Tu código de recuperación es: *${recoveryCode}*. Expira en 1 minuto.`;

      await client.sendMessage(contact, message);

      return res.status(200).json({ success: "Código enviado correctamente" });
  } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      return res.status(500).json({ error: "Hubo un error al enviar el código" });
  }
});

// Endpoint para verificar el código ingresado
app.post("/verify-code", (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
      return res.status(400).json({ error: "Faltan los parámetros phoneNumber o code" });
  }

  if (tempCodes[phoneNumber] && tempCodes[phoneNumber] == code) {
      delete tempCodes[phoneNumber]; // Eliminar el código después de usarlo
      return res.status(200).json({ success: "Código verificado correctamente" });
  } else {
      return res.status(400).json({ error: "Código inválido o expirado" });
  }
});


// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("API REST corriendo en http://localhost:3000");
  client.initialize();
});
