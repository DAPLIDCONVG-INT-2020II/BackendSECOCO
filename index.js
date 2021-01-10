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
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

app.listen(port, () => console.log("Server escuchando en el puerto 3000"));
app.use(express.static("public"));

/*-------------------------------------------------- PLANTILLA GENERAL ------------------------------------------------------*/
/*app.get("/:id", async (req, res) => {
  console.log(req.params.id);
  
  let usuarioPositivo = await db.collection('USUARIOS').where("C","==", "0" ).limit(1).get();
  const llaveUsuario= usuarioPositivo.docs[0].id;
    for (const doc of usuario.docs) {
        console.log(doc.id, '=>', doc.data());
    }
  res.send("Recibido");
});*/

///////////////////////////////////////////////////////// INGRESO //////////////////////////////////////////////////////////

/* Formato de entrada
{   "usuario":"",
    "contrasena":"",
    "tipoUsuario" : "" }*/

app.get("/ingreso", async (req, res) => {
  const busqueda = await db
    .collection(req.body.tipoUsuario)
    .doc(req.body.usuario)
    .get()
    .then(snap => {
      if (snap.exists) {
        if (snap.data().C == req.body.contrasena) {
          res.status(200).send({ ingreso: true });
        } else {
          res.status(401).send({ ingreso: false });
        }
      } else {
        res.status(401).send({ ingreso: false });
      }
    });
});

///////////////////////////////////////////////////////// REGISTRO /////////////////////////////////////////////////////////

app.post("/REGISTRO", async (req, res) => {
  //Revisar cedula y usuario - en caso de existencia retornar

  let llave = req.body.usuario;

  let rN = req.body.nombre + " " + req.body.apellido;
  let rC = req.body.contraseña;
  let rM = req.body.correo;
  let rI = req.body.tipoID + " " + req.body.ID;
  let rE = "000000";
  let rX = "-";
  let rF = req.body.fechaNacimiento;
  let rD = req.body.direccion + ":" + req.body.localidad;

  var data = {
    N: rN,
    C: rC,
    M: rM,
    I: rI,
    E: rE,
    X: rX,
    F: rF,
    D: rD
  };
  //console.log(llave, data);
  await db
    .collection("U_NATURALES")
    .doc(llave)
    .set(data);

  //Agregar el usuario a las Relaciones y añadir el arreglo de Ubicaciones
  await db
    .collection("RELACIONES")
    .doc(llave)
    .set({ U: [] });

  res.send("Usuario añadido!");
});

///////////////////////////////////////////////// CAMBIO CONTRASEÑA /////////////////////////////////////////////////////////

//////////////////////////////////////////////// REPORTE UBICACIÓN /////////////////////////////////////////////////////////
/*
{   "U": "",
    "F": "",
    "HF": ,
    "HI": ,
    "Lat": ,
    "Lon": }
*/

app.post("/reporteUbicacion", async (req, res) => {
  const rutas = ["UBICACIONES", "RELACIONES"];
  let indexUbicacion = 0;
  //Se puede mejorar agregando un campo en la base de datos
  try {
    await db
      .collection(rutas[0])
      .get()
      .then(snap => {
        indexUbicacion = snap.size;
      });
    await db
      .collection(rutas[0])
      .doc(indexUbicacion + "")
      .set({
        F: req.body.F,
        HF: req.body.HF,
        HI: req.body.HI,
        Lat: req.body.Lat,
        Lon: req.body.Lon
      });
    await db
      .collection(rutas[1])
      .doc(req.body.U)
      .update({
        U: admin.firestore.FieldValue.arrayUnion(indexUbicacion + "")
      });
    res.status(200).send({ nuevaUbicacion: true });
  } catch (error) {
    res.status(400).send({ nuevaUbicacion: false });
  }
});

///////////////////////////////////////////////// NOTIFICAR CITA ////////////////////////////////////////////////////////////

//Falta corregir
app.get("/notificarCita", async (req, res) => {
  const usuarios = await db.collection("U_NATURALES").where("X", "!=", "- S");
});

/////////////////////////////////////// NOTIFICACIÓN DE CONTACTO CON USUARIO(+) COVID ///////////////////////////////////////

app.get("/RESULTADO-EXAMEN", async (req, res) => {
  // Incluir actualizacion de resultado y en caso de ser positivo ejecutar rutina de contacto
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
    .where("U", "array-contains-any", ubicacionesCoincidentes)
    .get();
  var nombres = [];
  nombresSospechosos.docs.forEach(n => {
    nombres.push(n.id);
  });
  console.log(nombres);
  for (var c = 0; c < nombres.length; c++) {
    var correo = await db
      .collection("U_NATURALES")
      .doc(nombres[c])
      .get();
    correo = correo.data().M;
    enviarCorreo(correo);
  }

  res.end();
});


/////////////////////////////////////// ENVIO DE CORREOS (se puede incluir en un objeto aparte) ///////////////////////////////////////
function enviarCorreo(correo) {
  console.log(correo);
}
