//backend-301221
const express = require("express");
const admin = require("firebase-admin");
const email = require("nodemailer");

let serviceAccount = require("./cuentaServicio/backend-301221-c62c974d78b8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

const app = express();

const port = process.env.PORT || 3000;

app.listen(port, () => console.log("Server escuchando en el puerto 3000"));
app.use(express.static("public"));
/*-------------------------------------------------- PLANTILLA GENERAL ------------------------------------------------------*/
app.get("/:id", async (req, res) => {
  console.log(req.params.id);
  
  let usuarioPositivo = await db.collection('USUARIOS').where("C","==", "0" ).limit(1).get();
  const llaveUsuario= usuarioPositivo.docs[0].id;
    /*for (const doc of usuario.docs) {
        console.log(doc.id, '=>', doc.data());
    }*/
  res.send("Recibido");
});

/////////////////////////////////////// NOTIFICACIÓN DE CONTACTO CON USUARIO(+) COVID /////////////////////////////////////// 

/*app.get("/:id", async (req, res) => {
  console.log(req.params.id);
  var usuarioPositivo = await db
    .collection("U_NATURALES")
    .where("I", "==", "C.C. " + req.params.id)
    .limit(1)
    .get();
  const llaveUsuario = usuarioPositivo.docs[0].id;

  var relacionUbicaciones = await db
    .collection("RELACIONES")
    .doc(llaveUsuario)
    .get();
  relacionUbicaciones = relacionUbicaciones.data().U;

  var datosUbicaciones = [];
  for (var i = 0; i < relacionUbicaciones.length; i++) {
    var ubicacion = await db
      .collection("UBICACIONES")
      .doc(relacionUbicaciones[i])
      .get();
    datosUbicaciones.push(ubicacion.data());
  }

  var ubicacionesCoincidentes = [];
  for (var u = 0; u < datosUbicaciones.length; u++) {
    var F = datosUbicaciones[u].F;
    var HI = datosUbicaciones[u].HI;
    var HF = datosUbicaciones[u].HF;
    var Lat = datosUbicaciones[u].Lat;
    var Lon = datosUbicaciones[u].Lon;

    var ubicacionCoincidente = await db
      .collection("UBICACIONES")
      .where("Lat", ">=", Lat - 0.00001)
      .where("Lat", "<=", Lat + 0.00001)
      .get();

    ubicacionCoincidente.docs.forEach(ub => {
      var llave = ub.id;
      ub = ub.data();
      if (!relacionUbicaciones.includes(llave)) {
        if (Lon - 0.00001 <= ub.Lon && ub.Lon <= Lon + 0.00001) {
          if (HI <= ub.HI && ub.HI <= HF) {
            if (ub.F == F) {
              ubicacionesCoincidentes.push(llave);
            }
          }
        }
      }
    });
  }
  console.log(ubicacionesCoincidentes);
  
  var nombresSospechosos = await db
    .collection("RELACIONES")
    .where("U", "array-contains-any", ubicacionesCoincidentes).get();
  var nombres =[];
  nombresSospechosos.docs.forEach(n => {nombres.push(n.id)});
  console.log(nombres);
  for (var c = 0; c < nombres.length; c++) {
    var correo = await db
      .collection("U_NATURALES")
      .doc(nombres[c])
      .get();
    correo=correo.data().M;
    enviarCorreo(correo);
  }
  
  res.end();
});
*/
function enviarCorreo(correo){ console.log(correo);}