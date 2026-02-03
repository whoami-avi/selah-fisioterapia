import React, { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { format, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const Payments = () => {
  const { appointments, patients, services, user } = useStore();
  const [filter, setFilter] = useState('all');
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    // Process appointments to extract payments
    const processedPayments = appointments.map(apt => {
      const patient = patients.find(p => p.id === apt.patient_id);
      const service = services.find(s => s.id === apt.service_id);
      
      return {
        id: apt.id,
        patient: patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente desconocido',
        service: service?.name || 'Sin servicio',
        amount: apt.price_at_appointment || service?.price || 0,
        date: apt.start_time,
        status: apt.status,
        method: apt.payment_method || 'Efectivo'
      };
    });

    setPayments(processedPayments);
  }, [appointments, patients, services]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = parseISO(dateString);
    if (!isValid(date)) return 'N/A';
    return format(date, 'dd MMM yyyy', { locale: es });
  };

  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter(p => p.status !== 'completed').length;

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.status === filter);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pagos y Facturación</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Recaudado</p>
          <p className="text-2xl font-bold text-teal-600">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Citas Completadas</p>
          <p className="text-2xl font-bold text-green-600">
            {payments.filter(p => p.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pagos Pendientes</p>
          <p className="text-2xl font-bold text-orange-600">{pendingPayments}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
        >
          <option value="all">Todos los pagos</option>
          <option value="completed">Completados</option>
          <option value="pending">Pendientes</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(payment.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {payment.patient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status === 'completed' ? 'Completado' : 
                         payment.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No hay pagos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
