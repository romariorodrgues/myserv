import {initMercadoPago} from '@mercadopago/sdk-react';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!;

export default function useMp() {
  const mp = initMercadoPago(PUBLIC_KEY);
  return mp;
}