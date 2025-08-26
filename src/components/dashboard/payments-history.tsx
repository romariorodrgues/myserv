import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import axios from "axios";
import { Payment } from "@prisma/client";
import { Ban, Building2, MessageSquareShare } from "lucide-react";

export default function PaymentHistory() {
  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["payment-history"],
    initialData: [],
    queryFn: async () => {
      const { data } = await axios.get('/api/payments/history');
      return data;
    }
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pagamentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {payments.length > 0 &&  payments.map((payment) => (
          <div className="flex items-center gap-4 p-4 bg-gray-50 border-[1px] border-gray-200 rounded-md" key={payment.id}>
            {payment.subscriptionId && (<Building2 size={32} className="p-1 bg-blue-100 rounded-sm" />)}
            {payment.serviceRequestId && (<MessageSquareShare size={32} className="p-1 bg-blue-100 rounded-sm" />)}
            <div className="flex flex-col gap-1 justify-start">
              <p className="font-semibold text-lg">Descrição: {payment.description}</p>
              <p className="font-semibold text-base">Valor: R$ {payment.amount.toFixed(2)}</p>
              <p className="text-gray-600 text-base">data de criação: {new Date(payment.createdAt).toLocaleString('pt-br', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              })}</p>
              <p className="text-gray-600 text-base">data da ultima atualização: {new Date(payment.updatedAt).toLocaleString('pt-br', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              })}</p>
              <p className={`font-semibold rounded-sm ${payment.status === 'APPROVED' ? 'text-green-600' : payment.status === 'PENDING' ? 'text-yellow-600' : payment.status === 'REJECTED' ? 'text-red-600' : 'text-gray-600'}`}>Status: {payment.status}</p>
            </div>
          </div>
        ))}

        {
          payments.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center text-gray-600">
              <Ban size={24} />
              <p>Você ainda não fez nenhum plagamento na plataforma</p>
            </div>
          )
        }

      </CardContent>
    </Card>
  )
}
