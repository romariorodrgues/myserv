import MercadoPagoConfig from "mercadopago";

const TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!TOKEN) throw new Error("MP Error: Token not found!");

const mercadoPagoConfig = new MercadoPagoConfig({
  accessToken: TOKEN,
});

export default mercadoPagoConfig;
