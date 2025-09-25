import MercadoPagoConfig from "mercadopago";

let cachedConfig: MercadoPagoConfig | null = null;
let warnedMissingToken = false;

export function getMercadoPagoConfig(): MercadoPagoConfig | null {
  if (cachedConfig) {
    return cachedConfig;
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    if (!warnedMissingToken) {
      console.warn(
        "[MercadoPago] MERCADOPAGO_ACCESS_TOKEN não está configurado. Fluxos pagos ficarão indisponíveis."
      );
      warnedMissingToken = true;
    }

    return null;
  }

  cachedConfig = new MercadoPagoConfig({ accessToken: token });
  return cachedConfig;
}

export function isMercadoPagoConfigured(): boolean {
  return getMercadoPagoConfig() !== null;
}

export function ensureMercadoPagoConfig(): MercadoPagoConfig {
  const config = getMercadoPagoConfig();

  if (!config) {
    throw new Error(
      "Mercado Pago não configurado. Defina MERCADOPAGO_ACCESS_TOKEN para habilitar pagamentos."
    );
  }

  return config;
}

export default getMercadoPagoConfig;
