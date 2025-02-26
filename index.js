const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

// Importar libreria soap
const soap = require("soap");

// Importar libreria fs
const fs = require("fs");

/*
// MENSAJEs
*¡Buenos días! LUIS P.*
Te escribo para hacerte llegar el reporte correspondiente a los siguientes días:
24/Apr: 50.00
25/Apr: 50.00
26/Apr: 50.00
27/Apr: 50.00                          
28/Apr: 50.00
TOTAL: 250.00
*Atte: SEAFROST S.A.C*
*/

// URL del servicio web SOAP
const url = "http://192.168.10.16/soap/webservice-server.php?wsdl";

const nro_semana = "2025-5";
const cod_trabajador = "";
const cod_origen = "P1";

// Obtener reporte JSON de servicio web
function getDataJSON(nro_semana, cod_trabajador) {
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
        cod_origen,
      };

      // Lamada al método rpt_envio_api_whatsapp
      clientSoap.rpt_envio_api_whatsapp(args, (error, result) => {
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


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';



    const wwebVersion = '2.2407.3';

const client = new Client({
    authStrategy: new LocalAuth(), // your authstrategy here
    puppeteer: {
      headless: true , args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
});


client.on("qr", (qr) => {
  //console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

client.initialize();

client.on("loading_screen", (percent, message) => {
  console.log("LOADING SCREEN", percent, message);
});

// Conectar cliente
client.on("ready", () => {
  console.log("Cliente esta listo!");
});

/*
// Ruta del archivo JSON
const filePath = './reportes/2023-23-test.json';

// Función para leer el archivo JSON de forma asíncrona
function readJSONFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (error, data) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                const jsonObject = JSON.parse(data);
                resolve(jsonObject);
            } catch (error) {
                reject(error);
            }
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

// Función principal
async function sendMessages() {
  try {
    // const jsonObject = await readJSONFile(filePath);

    // JSON obtenido desde el servicio web
    const jsonObject = await getDataJSON(nro_semana, cod_trabajador);

    let contador = 0;

    for (const item of jsonObject) {
      const contact = `51${item.NRO_CELL}@c.us`;
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

      const message = `*${getGreeting()} ${
        item.NOM_TRABAJADOR
      }*\nTe escribo para hacerte llegar el reporte bruto por los siguientes días:\n${contenido}*TOTAL: ${
        item.TOTAL
      }*\n\nPor favor, no responda a este WhatsApp. Si tiene dudas o desea consultar información adicional sobre sus descuentos efectuados ( AFP, Préstamos, entre otros) , por favor escribir a los números registrados de nuestras oficinas de acuerdo a su área de trabajo.\n*Congelado:* 994259068\n*Conservas:* 981283624\n*Atte: SEAFROST S.A.C*`;

      try {
        // Enviar mensaje a contacto
        await sendMessageToContact(contact, message);
        // Actualizar estado del mensaje
        await setUpdateStatusWapi(nro_semana, item.COD_TRABAJADOR, 2);
        console.log(
          "Mensaje enviado exitosamente " +
            contador +
            " " +
            item.COD_TRABAJADOR +
            " " +
            now
        );
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
      }

      await sleep(1000); // Esperar 1 segundo antes de enviar el siguiente mensaje
    }
  } catch (error) {
    console.error("Error al leer el archivo JSON:", error);
  }
}

// Función para pausar la ejecución por un tiempo determinado
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// Iniciar el envío de mensajes
if (client.isReady) {
  // Enviar mensaje
  sendMessages();
} else {
  // Esperar a que el cliente esté listo antes de enviar mensaje
  client.on("ready", () => {
    // Enviar mensaje
    sendMessages();
  });
}
