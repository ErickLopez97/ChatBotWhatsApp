const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require("dotenv").config

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const path = require("path")
const fs = require("fs")
const chat = require("./chatGPT")

const menuPath = path.join(__dirname, "messages", "text_menu.txt")
const menu = fs.readFileSync(menuPath, "utf8")

const pathRequest = path.join(__dirname, "messages", "prompt_Request.txt")
const promptRequest = fs.readFileSync(pathRequest, "utf8")

//Flujo de Bienvenida.  
const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer("¡Hola, bienvenido a *Star Shipping*!", {
        delay: 500,
        media: "https://i.postimg.cc/jd4rMCgH/logo.png"
    })
    .addAnswer("¡Por favor, escribe *Menú* para iniciar una conversación!")

//Flujo de Términos y Condiciones.
const flowLegal = addKeyword(EVENTS.ACTION)
    .addAnswer("Este es el flow de los Términos y Condiciones.", {
        media: "https://firebasestorage.googleapis.com/v0/b/proyecto-la-casona.appspot.com/o/Terminos_y_Condiciones.pdf?alt=media&token=4b70f336-cdfe-46dd-8037-61a3d82ef2de"
    })
    .addAnswer("Estos son nuestros *Términos y Condiciones*")
    .addAnswer("¿Si tienes alguna duda o pregunta?")
    .addAnswer("Vuelve a escribir *Menú*")

//Flujo de Servicios y Tarifas.
const flowServices = addKeyword(EVENTS.ACTION)
    .addAnswer("Estos son nuestros Servicios y Tarifas.", {
        media: "https://i.postimg.cc/PrgBfgSq/Servicio-Tarifa.png"
    })
    .addAnswer("¿Si tienes alguna duda o pregunta?")
    .addAnswer("Vuelve a escribir *Menú*")

//Flujo de Ubicación y Horarios.
const flowHours = addKeyword(EVENTS.ACTION)
    .addAnswer("Esta es nuestra Ubicación y los Horarios de Atención.", {
        media: "https://i.postimg.cc/7ZSj5KRn/Ubicacion-Horario.png"
    })
    .addAnswer("¿Si tienes alguna duda o pregunta?")
    .addAnswer("Vuelve a escribir *Menú*")

//Flujo de Consultas con Inteligencia Artificial.
const flowRequest = addKeyword(EVENTS.ACTION)
    //.addAnswer("Este es el flow consultas")
    .addAnswer("Realiza tu consulta", { capture: true }, async (ctx, ctxFn) => {
        const prompt = promptRequest
        //const prompt = "Responde hola"
        const consulta = ctx.body
        const answer = await chat(prompt, consulta)
        await ctxFn.flowDynamic(answer.content)
        //console.log(answer.content)
    })
    .addAnswer("¿Tienes otras dudas o preguntas?")
    .addAnswer("Vuelve a escribir *Menú* \n- Luego elige la *Opción 3*")

//Flujo para mostrar el Menú Principal
const flowMenu = addKeyword(["Menu", "Menú"]).addAnswer(
    menu,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!["1", "2", "3", "4", "0"].includes(ctx.body)) {
            return fallBack(
                "Respuesta no válida, por favor escribe el número de una de las opciones."
            );
        }
        switch (ctx.body) {
            case "1":
                return gotoFlow(flowServices);
            case "2":
                return gotoFlow(flowHours);
            case "3":
                return gotoFlow(flowRequest);
            case "4":
                return gotoFlow(flowLegal);
            case "0":
                return await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menú escribiendo *Menú*"
                );
        }
    }
);

//Función Principal para que funcionen los Flujos.
const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([
        flowWelcome, flowMenu, flowServices, flowHours, flowRequest, flowLegal])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
