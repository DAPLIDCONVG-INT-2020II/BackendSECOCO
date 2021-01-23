//backend-301221
const express = require("express");
const admin = require("firebase-admin");
var email = require("./email.js");
var email = new email();

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

//Cargar las Zonas al iniciar el Servidor
var zonas = [];
cargarZonas();
async function cargarZonas() {
  await db
    .collection("ZONA")
    .get()
    .then(snap => {
      snap.forEach(zona => {
        const obj = {
          I: zona.id,
          LatMa: zona.data().LatMa,
          LatMi: zona.data().LatMi,
          LonMa: zona.data().LonMa,
          LonMi: zona.data().LonMi,
          Lat: zona.data().Lat,
          Lon: zona.data().Lon,
          N: zona.data().N,
          C: zona.data().C
        };
        zonas.push(obj);
      });
    });
}

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
{   "U":"" (usuario),
    "C":"" (contrasena),
    "T" : "" (tipoUsuario)}*/
app.post("/INGRESO", async (req, res) => {
  try {
    await db
      .collection(req.body.T)
      .doc(req.body.U)
      .get()
      .then(snap => {
        if (snap.exists) {
          if (snap.data().C == req.body.C) {
            if (req.body.T == "U_NATURALES") {
              const datos = {
                I: 1,
                N: snap.data().N,
                D: snap.data().D,
                E: snap.data().E,
                ID: snap.data().I,
                M: snap.data().M,
                F: snap.data().F,
                X: snap.data().X,
                Z: snap.data().Z
              };
              res.status(200).send(datos);
            } else {
              res.status(200).send({ I: 1 });
            }
          } else {
            res.status(200).send({ I: 0 });
          }
        } else {
          res.status(200).send({ I: 0 });
        }
      });
  } catch (error) {
    res.status(200).send({ I: 0 });
  } finally {
    res.end();
  }
});

///////////////////////////////////////////////////////// REGISTRO /////////////////////////////////////////////////////////

app.post("/REGISTRO", async (req, res) => {
  /*
  {
  "usuario": "";
  "correo":"":
  "nombre" : "";
  "apellido" : "";
  "contraseña" : "";
  "fechaNacimiento": "";
  "tipoID": "";
  "ID": "";
  "direccion": "";
  "localidad": "";
    }
  */

  let llave = req.body.usuario;
  let rI = req.body.tipoID + " " + req.body.ID;
  let correo = req.body.correo;

  var validarLlaveBoolean = await db
    .collection("U_NATURALES")
    .doc(llave)
    .get();

  if (validarLlaveBoolean.exists) {
    res.send({ M: "Lo sentimos, este usuario ya existe" });
  } else {
    var validarCedula = await db
      .collection("U_NATURALES")
      .where("I", "==", rI)
      .limit(1)
      .get();

    if (!validarCedula.empty) {
      res.send({ M: "Esta cedula ya está inscrita" });
    } else {
      var validarCorreo = await db
        .collection("U_NATURALES")
        .where("M", "==", correo)
        .limit(1)
        .get();

      if (!validarCorreo.empty) {
        res.send({ M: "Este correo ya está inscrito" });
      } else {
        let rN = req.body.nombre + " " + req.body.apellido;
        let rC = req.body.contraseña;
        let rM = req.body.correo;
        let rE = "000000";
        let rX = "-";
        let rF = req.body.fechaNacimiento;
        let rD = req.body.direccion;
        let rZ = req.body.localidad;
        var data = {
          N: rN,
          C: rC,
          M: rM,
          I: rI,
          E: rE,
          X: rX,
          F: rF,
          D: rD,
          Z: rZ
        };
        await db
          .collection("U_NATURALES")
          .doc(llave)
          .set(data);
        await db
          .collection("RELACIONES")
          .doc(llave)
          .set({ U: [] });

        res.send({ M: "Usuario añadido!" });
      }
    }
  }
  res.end();
});

///////////////////////////////////////////////// CAMBIO CONTRASEÑA /////////////////////////////////////////////////////////

/*Estructura {
  "U": "" (Usuario),
  "C": "" (Contraseña)
}*/

app.post("/CAMBIAR-CONTRASENA", async (req, res) => {
  try {
    const usuario = await db
      .collection("U_NATURALES")
      .doc(req.body.U)
      .get();

    if (usuario.exists) {
      await db
        .collection("U_NATURALES")
        .doc(req.body.U)
        .update({ C: req.body.C });
      res.status(200).send({ A: 1 });
    } else {
      res.status(200).send({ A: 2 });
    }
  } catch (error) {
    res.status(200).send({ A: 3 });
  } finally {
    res.end();
  }
});

//////////////////////////////////////////////// REPORTE UBICACIÓN /////////////////////////////////////////////////////////
/*
{   "U": "",
    "F": "",
    "HF": ,
    "HI": ,
    "Lat": ,
    "Lon": 
    }
*/
app.post("/REPORTE-UBICACION", async (req, res) => {
  const rutas = ["UBICACIONES", "RELACIONES", "ZONA"];
  let indexUbicacion = 0;
  let i = 0;
  let idZona = 0;
  let tieneZona = false;
  try {
    while (!tieneZona || i < zonas.length) {
      if (
        req.body.Lat >= zonas[i].LatMi &&
        req.body.Lat <= zonas[i].LatMa &&
        req.body.Lon >= zonas[i].LonMi &&
        req.body.Lon <= zonas[i].LonMa
      ) {
        tieneZona = true;
        idZona = zonas[i].I;
      }
      i++;
    }

    await db
      .collection(rutas[0])
      .doc("C")
      .get()
      .then(snap => {
        indexUbicacion = snap.data().C;
      });

    await db
      .collection(rutas[0])
      .doc(indexUbicacion + "")
      .set({
        F: req.body.F,
        HF: req.body.HF,
        HI: req.body.HI,
        Lat: req.body.Lat,
        Lon: req.body.Lon,
        Z: idZona
      });
    await db
      .collection(rutas[1])
      .doc(req.body.U)
      .update({
        U: admin.firestore.FieldValue.arrayUnion(indexUbicacion + "")
      });

    await db
      .collection(rutas[0])
      .doc("C")
      .update({ C: indexUbicacion + 1 });

    res.status(200).send({ nuevaUbicacion: true });
  } catch (error) {
    res.status(400).send({ nuevaUbicacion: false });
  } finally {
    res.end();
  }
});

///////////////////////////////////////////////// ACTUALIZAR ESTADO DE SINTOMAS ////////////////////////////////////////////////////////////

app.put("/ACTUALIZAR-SINTOMAS", async (req, res) => {
  let llave = req.body.usuario;
  let estado = req.body.estado;
  await db
    .collection("U_NATURALES")
    .doc(llave)
    .update({ E: estado });
  res.end();
});

///////////////////////////////////////////////// NOTIFICAR CITA ////////////////////////////////////////////////////////////

/*Estructura { 
  "E" :"" (sintomas),
  "L" : (Limite)
} responde lista de usuarios*/
app.post("/SOLICITAR-USUARIOS-NOTIFICAR-CITA", async (req, res) => {
  try {
    let listaUsuarios = [];
    await db
      .collection("U_NATURALES")
      .where("E", "==", req.body.E)
      .limit(req.body.L)
      .get()
      .then(snap => {
        snap.forEach(doc => {
          if (doc.data().X != "S") {
            const datos = {
              U: doc.id,
              N: doc.data().N,
              I: doc.data().I,
              M: doc.data().M,
              Z: doc.data().Z,
              E: doc.data().E
            };
            listaUsuarios.push(datos);
          }
        });
      });
    res.status(200).send({ listaUsuarios });
  } catch (error) {
    res.status(400).send({ listaUsuarios: false });
  } finally {
    res.end();
  }
});

/*Estructura { 
  "E" :"" (sintomas),
  "F" :"" (fecha)
}  envia correos*/
app.post("/ENVIAR-CORREO-USUARIOS-NOTIFICAR-CITA", async (req, res) => {
  try {
    let listaUsuarios = [];
    await db
      .collection("U_NATURALES")
      .where("E", "==", req.body.E)
      .get()
      .then(snap => {
        snap.forEach(doc => {
          if (doc.data().X != "S") {
            const datos = {
              M: doc.data().M,
              N: doc.data().N,
              I: doc.data().I,
              E: doc.data().E,
              D: doc.data().D,
              U: doc.id,
              F: req.body.F
            };
            listaUsuarios.push(datos);
          }
        });
      });
    for (var i = 0; i < listaUsuarios.length; i++) {
      email.enviarCorreo(
        listaUsuarios[i].M,
        "SeCoCo - Citación para Prueba COVID-19",
        listaUsuarios[i]
      );
      await db
        .collection("U_NATURALES")
        .doc(listaUsuarios[i].U)
        .update({ X: "S" });
    }
    res.status(200).send({ E: 1 });
  } catch (error) {
    res.status(400).send({ E: 0 });
  } finally {
    res.end();
  }
});

/*Estructura { 
  "U" : "" (Usuario),
  "F" :"" (fecha)
}  envia correo*/
app.post("/ENVIAR-CORREO-USUARIO", async (req, res) => {
  try {
    let datos;
    await db
      .collection("U_NATURALES")
      .doc(req.body.U)
      .get()
      .then(snap => {
        datos = {
          M: snap.data().M,
          N: snap.data().N,
          I: snap.data().I,
          E: snap.data().E,
          D: snap.data().D,
          U: snap.id,
          F: req.body.F
        };
      });
    email.enviarCorreo(
      datos.M,
      "SeCoCo - Citación para Prueba COVID-19",
      datos
    );
    await db
      .collection("U_NATURALES")
      .doc(datos.U)
      .update({ X: "S" });
    res.status(200).send({ E: 1 });
  } catch (error) {
    res.status(400).send({ E: 0 });
  } finally {
    res.end();
  }
});

/////////////////////////////////////// NOTIFICACIÓN DE CONTACTO CON USUARIO(+) COVID ///////////////////////////////////////

//ERROR
app.post("/RESULTADO-EXAMEN", async (req, res) => {
  /*
  {
  "ID" : "";
  "tipoID" : "";
  "resultado" : "";
  }
  */
  let ID = req.body.ID;
  let tipoID = req.body.tipoID;
  let resultado = req.body.resultado;
  let info = "";

  var usuarioPositivo = await db
    .collection("U_NATURALES")
    .where("I", "==", tipoID + " " + ID)
    .limit(1)
    .get();

  const llaveUsuario = usuarioPositivo.docs[0].id;
  const emailUsuarioCorreo = usuarioPositivo.docs[0].data().M;

  email.enviarCorreo(
    emailUsuarioCorreo,
    "SeCoCo - Actualización de resultado de examen",
    resultado
  );

  await db
    .collection("U_NATURALES")
    .doc(llaveUsuario)
    .update({ X: resultado });

  if (resultado == "A") {
    info = ", se ha le ha informado a los demas usuarios el posible contacto";

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
        .where("Lat", ">=", Lat - 0.00004504504)
        .where("Lat", "<=", Lat + 0.00004504504)
        .get();

      ubicacionCoincidente.docs.forEach(ub => {
        var llave = ub.id;
        ub = ub.data();

        if (Lon - 0.00004504504 <= ub.Lon && ub.Lon <= Lon + 0.00004504504) {
          if (!relacionUbicaciones.includes(llave)) {
            if (HI <= ub.HI && ub.HI <= HF) {
              if (ub.F == F) {
                ubicacionesCoincidentes.push(llave);
              }
            }
          }
        }
      });
    }
    //console.log(ubicacionesCoincidentes);
    var nombresSospechosos = await db
      .collection("RELACIONES")
      .where("U", "array-contains-any", ubicacionesCoincidentes)
      .get();

    var nombres = [];

    nombresSospechosos.docs.forEach(n => {
      nombres.push(n.id);
    });
    //console.log(nombres);
    for (var c = 0; c < nombres.length; c++) {
      var correo = await db
        .collection("U_NATURALES")
        .doc(nombres[c])
        .get();

      correo = correo.data().M;
      email.enviarCorreo(correo, "SeCoCo - Revisa tus sintomas", null);
    }
  }
  res.send({ X: "Dato actualizado" + info });
  res.end();
});

/////////////////////////////////////////////// REPORTE ZONA ////////////////////////////////////////////////////////////////

/*A (Activo) - I (Inactivo) - S(Solicitado) - P(Pendiente) -N (Examen no Tomado)*/
/*Estructura { Z : "" (id Zona)}*/

app.post("/REPORTE-ZONA", async (req, res) => {
  try {
    let activos = 0,
      inactivos = 0,
      solicitados = 0,
      pendientes = 0,
      examenNoTomado = 0;

    await db
      .collection("U_NATURALES")
      .where("Z", "==", req.body.Z)
      .get()
      .then(snap => {
        snap.forEach(doc => {
          const estado = doc.data().X;
          if (estado == "A") {
            activos += 1;
          } else if (estado == "I") {
            inactivos += 1;
          } else if (estado == "S") {
            solicitados += 1;
          } else if (estado == "P") {
            pendientes += 1;
          } else if (estado == "N") {
            examenNoTomado += 1;
          }
        });
      });

    const resultados = {
      A: activos,
      I: inactivos,
      S: solicitados,
      P: pendientes,
      N: examenNoTomado
    };
    res.status(200).send(resultados);
  } catch (error) {
    res.status(400).send({ resultados: false });
  } finally {
    res.end();
  }
});

/*Estructura {
 "PA" :  (numero "Porcentaje de Activos")
 "Z" : (idZona)
 "C" : (Activo "A" o Inactivo (I))
}*/

//Tengo que revisar
app.post("/REPORTAR-CUARENTENA-ZONA", async (req, res) => {
  try {
    let estadoLocalidad,
      mensaje = req.body.C;
    const nombreZona = zonas.find(zona => zona.I == req.body.Z).N;
    const informacion = {
      PA: req.body.PA * 100,
      ZN: nombreZona
    };
    let asunto;

    await db
      .collection("ZONA")
      .doc(req.body.Z)
      .get()
      .then(snap => {
        estadoLocalidad = snap.data().C;
      });

    if (estadoLocalidad != mensaje) {
      await db
        .collection("ZONA")
        .doc(req.body.Z)
        .update({ C: req.body.C });
      const index = zonas.findIndex(zona => zona.I == req.body.Z);
      zonas[index].C = req.body.C;
    } else {
      mensaje = "C";
    }

    if (mensaje == "C") {
      asunto =
        req.body.PA > 0.5
          ? "SeCoCo - Continua Aislamiento de Zona"
          : "SeCoCo - Continua Sin Aislamiento la Zona";
    } else {
      asunto =
        req.body.C == "A"
          ? "SeCoCo - Aislamiento de Zona"
          : "SeCoCo - Levantamiento de Aislamiento de Zona";
    }

    console.log(asunto);

    await db
      .collection("U_NATURALES")
      .where("Z", "==", req.body.Z)
      .get()
      .then(snap => {
        snap.forEach(doc => {
          email.enviarCorreo(doc.data().M, asunto, informacion);
        });
      });
    res.status(200).send({ E: 1 });
  } catch (error) {
    res.status(200).send({ E: 0 });
  } finally {
    res.end();
  }
});

app.get("/ZONAS", async (req, res) => {
  try {
    let coorZonas = [];

    for (var i = 0; i < zonas.length; i++) {
      const zona = {
        I: zonas[i].I,
        N: zonas[i].N,
        Lat: zonas[i].Lat,
        Lon: zonas[i].Lon,
        C: zonas[i].C
      };
      coorZonas.push(zona);
    }
    res.status(200).send({ coorZonas });
  } catch (error) {
    res.status(200).send({ coorZonas: false });
  } finally {
    res.end();
  }
});

/////////////////////////////////////// HISTORIAL DESPLAZAMIENTOS ///////////////////////////////////////////////////////////

app.post("/HISTORIAL-DESPLAZAMIENTOS", async (req, res) => {
  const llaveUsuario = req.body.usuario;

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
  res.send({ datosUbicaciones });

  res.end();
});

/////////////////////////////////////// MANEJO AISLAMIENTO ///////////////////////////////////////////////////////////

app.post("/MANEJO-AISLAMIENTO", async (req, res) => {
  const localidad = req.body.Z;

  var latMin, latMax, lonMin, lonMax;
  //console.log("--------P-----------");
  //console.log(zonas);
  //console.log("********S************");
  for (var i = 0; i < zonas.length; i++) {
    //console.log(localidad+ ":",zonas[i].I, zonas[i].LatMi, zonas[i].LatMa, zonas[i].LonMi,zonas[i].LonMa);
    if (zonas[i].I == localidad) {
      latMin = zonas[i].LatMi;
      latMax = zonas[i].LatMa;
      lonMin = zonas[i].LonMi;
      lonMax = zonas[i].LonMa;
    }
  }

  var usuariosLocalidad = await db
    .collection("U_NATURALES")
    .where("Z", "==", localidad)
    .get();

  var activos = 0;
  var posibles = 0;
  var total = 0;

  usuariosLocalidad.docs.forEach(u => {
    total++;
    if (u.data().X == "A") {
      activos++;
    } else if (u.data().X == "S" || u.data().X == "P" || u.data().X == "N") {
      posibles++;
    }
  });

  var rta = Number(activos) / Number(total);
  posibles = posibles / total;

  //console.log(total, rta, posibles, latMin, lonMin, latMax, lonMax);

  res.send({
    Activos: rta,
    Posibles: posibles,
    LatMin: latMin,
    LonMin: lonMin,
    LatMax: latMax,
    LonMax: lonMax
  });
  res.end();
});

/////////////////////////////////////// MOVIMIENTO EN AISLAMIENTO //////////////////////////////////////////////////////

app.post("/MOVIMIENTO-EN-AISLAMIENTO", async (req, res) => {
  let Z = req.body.Z;

  var usuariosDeLocalidad = await db
    .collection("U_NATURALES")
    .where("Z", "==", Z)
    .get();

  var nombres = [];
  var datos = [];
  usuariosDeLocalidad.docs.forEach(n => {
    nombres.push(n.id);
    datos.push(n.data());
  });

  var usuariosFueraDeLocalidad = [];

  var info = {
    nombre: "",
    correo: "",
    cedula: "",
    usuario: "",
    fecha: ""
  };

  var respuesta = [];

  for (var n = 0; n < nombres.length; n++) {
    var relacionUbicaciones = await db
      .collection("RELACIONES")
      .doc(nombres[n])
      .get();

    relacionUbicaciones = relacionUbicaciones.data().U;
    for (var u = 0; u < relacionUbicaciones.length; u++) {
      var ubicacion = await db
        .collection("UBICACIONES")
        .doc(relacionUbicaciones[u])
        .get();

      if (
        ubicacion.data().Z != Z
        // &&!usuariosFueraDeLocalidad.includes(nombres[n])
      ) {
        //usuariosFueraDeLocalidad.push(nombres[n]);
        info.usuario = nombres[n];
        info.nombre = datos[n].N;
        info.correo = datos[n].M;
        info.cedula = datos[n].I;
        info.fecha = ubicacion.data().F;
        respuesta.push(info);
      }
    }
  }
  /*--------------------- Que enviamos? el correo, la cedula, el usuario?--------------------*/

  res.send({ Z: respuesta });
  res.end();
});
