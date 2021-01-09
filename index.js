const express = require('express');
const admin = require('firebase-admin');
const email = require('nodemailer');

let serviceAccount = require('./cuentaServicio/backend-301221-c62c974d78b8.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

const app = express();

const port = process.env.PORT || 3000;

app.listen(port, () => console.log('Server escuchando en el puerto 3000'));
app.use(express.static('public'));

//backend-301221
var data= [ {"0":"0"}, {"1":"1"}, {"2":"2"},
 {"3":"3"}, {"4":"4"}, {"5":"5"}, {"6":"6"}, {"7":"7"},
 {"8":"8"}];

var llaves = ["Pedro1"];

app.get('/:id', async (req, res) => {
    console.log(req.params.id);
    /*let usuarioPositivo = await db.collection('USUARIOS').where("C","==", "0" ).limit(1).get();
    const llaveUsuario= usuarioPositivo.docs[0].id;
    for (const doc of usuario.docs) {
        console.log(doc.id, '=>', doc.data());
    }*/
    //const ref = await db.collection('RELACIONES').doc('REA').set(data);
   
    for(var i= 0 ; i< data.length; i++){
        //var name= i+""; 
        db.collection("RELACIONES").doc(llaves[0]).set(data[i]);
    }
   
    res.end();
});