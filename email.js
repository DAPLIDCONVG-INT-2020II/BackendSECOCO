var nodemailer;
var transporter;
var mailOptions;

module.exports = class email {
  constructor(arg) {
    nodemailer = require("nodemailer");

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        //Ocultar esta información
        user: "secocoda@gmail.com",
        pass: "Secoco2021:)"
      }
    });

    mailOptions = {
      from: "secocoda@gmail.com",
      to: "",
      subject: "",
      text: ""
    };
  }
  async enviarCorreo(destinatario, asunto, informacion) {
    if (asunto == "SeCoCo - Citación para Prueba COVID-19") {
      let DF = informacion.E.charAt(0) == 1 ? "Dificultad para Respirar," : "";
      let FB = informacion.E.charAt(1) == 1 ? "Fiebre," : "";
      let FT = informacion.E.charAt(2) == 1 ? "Fatiga," : "";
      let CS = informacion.E.charAt(3) == 1 ? "Contacto con Sospechoso," : "";
      let TS = informacion.E.charAt(4) == 1 ? "Tos," : "";
      let DOS =
        informacion.E.charAt(4) == 1 ? "Disminución de Olfato y Sabor" : "";

      mailOptions.text = `Estimado Ciudadano\n\nTeniendo en cuenta que usted ${informacion.N} identificado con el documento ${informacion.I} ha presentado síntomas de ${DF} ${FB} ${FT} ${CS} ${TS} ${DOS}; ha sido citado para una prueba Obligatoria de COVID-19, la cual se realizará en el transcurso del día: ${informacion.F} en su domicilio (${informacion.D}).\n\nRecuerde mantenerse en cuarentena preventiva hasta nuevo aviso.\n\nGracias por su Atención\n\nP.D: La cura viene en camino =D`;
    } else if (asunto == "SeCoCo - Aislamiento de Zona") {
      mailOptions.text = `Estimado Ciudadano\n\nTeniendo en cuenta que en la localidad donde reside (${informacion.ZN}) tiene ${informacion.PA}% de infectados con COVID-19. El distrito de Bogotá D.C ha dispuesto poner la localidad en cuarentena.\n\nGracias por su atención.`;
    } else if (asunto == "SeCoCo - Levantamiento de Aislamiento de Zona") {
      mailOptions.text = `Estimado Ciudadano\n\nTeniendo en cuenta que en la localidad donde reside (${informacion.ZN}) tiene ${informacion.PA}% de infectados con COVID-19. El distrito de Bogotá D.C ha dispuesto levantar la cuarentena de la localidad.\n\nGracias por su atención.`;
    } else if (asunto == "SeCoCo - Continua Aislamiento de Zona") {
      mailOptions.text = `Estimado Ciudadano\n\nTeniendo en cuenta que en la localidad donde reside (${informacion.ZN}) tiene ${informacion.PA}% de infectados con COVID-19. El distrito de Bogotá D.C ha dispuesto continuar con la cuarentena de la localidad.\n\nGracias por su atención.`;
    } else if (asunto == "SeCoCo - Continua Sin Aislamiento la Zona") {
      mailOptions.text = `Estimado Ciudadano\n\nTeniendo en cuenta que en la localidad donde reside (${informacion.ZN}) tiene ${informacion.PA}% de infectados con COVID-19. El distrito de Bogotá D.C ha dispuesto continuar sin la cuarentena en la localidad.\n\nGracias por su atención.`;
    } else if (asunto == "SeCoCo - Actualización de resultado de examen") {
      let dato =
        informacion == "A"
          ? "Activo"
          : informacion == "I"
          ? "Inactivo"
          : informacion == "S"
          ? "Solicitado"
          : informacion == "P"
          ? "Pendiente"
          : "Examen no Tomado";
      mailOptions.text =
        "Estimado Ciudadano\n\nEl resultado de su examen fue actualizado a: " +
        dato +
        "\n\nGracias por su atención.";
    } else {
      mailOptions.text =
        "Estimado Ciudadano\n\nRevise sus sintomas, estuvo en contacto en los ultimos días con una persona activa con COVID-19\n\nGracias por su atención.";
    }
    mailOptions.to = destinatario;
    mailOptions.subject = asunto;

    await transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email enviado: " + info.response);
      }
    });
  }
};
