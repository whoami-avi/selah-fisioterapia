import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '../stores/useStore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Statistics = () => {
  const { user, appointments, patients, services, isLoading } = useStore();
  
  const [stats, setStats] = useState({
    monthlyRevenue: [],
    appointmentsByService: [],
    appointmentsByDay: [],
    weeklyEvolution: [],
    completedVsCancelled: []
  });
  
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (appointments.length === 0 || services.length === 0) {
      return;
    }

    const now = new Date();
    let startDate, endDate;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = now;
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // Filter appointments by period and status
    const filteredAppointments = appointments.filter(apt => {
      if (!apt.date) return false;
      const aptDate = parseISO(apt.date);
      if (!isValid(aptDate)) return false;
      const isInRange = aptDate >= startDate && aptDate <= endDate;
      const isCompleted = apt.status === 'completed';
      return isInRange && isCompleted;
    });

    // Calculate revenue by month
    const revenueByMonth = {};
    const dayAppointments = {};
    const serviceAppointments = {};
    let completed = 0;
    let cancelled = 0;

    appointments.forEach(apt => {
      if (!apt.date) return;
      const aptDate = parseISO(apt.date);
      if (!isValid(aptDate)) return;
      
      if (apt.status === 'completed') {
        completed++;
      } else if (apt.status === 'cancelled') {
        cancelled++;
      }
    });

    filteredAppointments.forEach(apt => {
      // Monthly revenue
      const monthKey = format(aptDate, 'yyyy-MM', { locale: es });
      const service = services.find(s => s.id === apt.service_id);
      const price = service?.price || 0;
      
      if (revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] += price;
      } else {
        revenueByMonth[monthKey] = price;
      }

      // Appointments by day
      const dayKey = format(aptDate, 'dd MMM', { locale: es });
      if (dayAppointments[dayKey]) {
        dayAppointments[dayKey]++;
      } else {
        dayAppointments[dayKey] = 1;
      }

      // Appointments by service
      const serviceName = service?.name || 'Sin servicio';
      if (serviceAppointments[serviceName]) {
        serviceAppointments[serviceName]++;
      } else {
        serviceAppointments[serviceName] = 1;
      }
    });

    // Prepare data for charts
    const monthlyRevenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month: month.charAt(0).toUpperCase() + month.slice(1),
      revenue: revenue
    }));

    const appointmentsByDayData = Object.entries(dayAppointments).map(([day, count]) => ({
      day,
      count
    }));

    const appointmentsByServiceData = Object.entries(serviceAppointments).map(([service, count]) => ({
      service,
      count
    }));

    // Weekly evolution
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayKey = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'EEEE', { locale: es });
      
      const dayApts = appointments.filter(apt => {
        if (!apt.date) return false;
        const aptDate = parseISO(apt.date);
        if (!isValid(aptDate)) return false;
        return format(aptDate, 'yyyy-MM-dd') === dayKey && apt.status === 'completed';
      });

      let dayRevenue = 0;
      dayApts.forEach(apt => {
        const service = services.find(s => s.id === apt.service_id);
        dayRevenue += service?.price || 0;
      });

      weeklyData.push({
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        revenue: dayRevenue,
        appointments: dayApts.length
      });
    }

    // Completed vs Cancelled
    const completedVsCancelledData = [
      { name: 'Completadas', value: completed },
      { name: 'Canceladas', value: cancelled }
    ];

    setStats({
      monthlyRevenue: monthlyRevenueData,
      appointmentsByService: appointmentsByServiceData,
      appointmentsByDay: appointmentsByDayData,
      weeklyEvolution: weeklyData,
      completedVsCancelled: completedVsCancelledData
    });
  }, [appointments, services, period]);

  // Safe data access helpers
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const totalRevenue = stats.monthlyRevenue.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalAppointments = appointments.filter(apt => apt.status === 'completed').length;
  const totalPatients = patients.length;
  const totalServices = services.length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas</h1>
      
      {/* Period selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === 'week' 
              ? 'bg-teal-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === 'month' 
              ? 'bg-teal-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Este Mes
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Ingresos del período</p>
          <p className="text-2xl font-bold text-teal-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Citas completadas</p>
          <p className="text-2xl font-bold text-blue-600">{totalAppointments}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total pacientes</p>
          <p className="text-2xl font-bold text-purple-600">{totalPatients}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Servicios activos</p>
          <p className="text-2xl font-bold text-orange-600">{totalServices}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Evolution */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Evolución Semanal</h2>
          {stats.weeklyEvolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.weeklyEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Ingresos' : 'Citas'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0d9488" 
                  strokeWidth={2}
                  dot={{ fill: '#0d9488', r: 4 }}
                  name="Ingresos"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
          )}
        </div>

        {/* Appointments by Service */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Citas por Servicio</h2>
          {stats.appointmentsByService.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.appointmentsByService}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="service" tick={{ fontSize: 11 }} interval={0} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
          )}
        </div>

        {/* Appointments by Day */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Citas por Día</h2>
          {stats.appointmentsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.appointmentsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
          )}
        </div>

        {/* Completed vs Cancelled */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Completadas vs Canceladas</h2>
          {stats.completedVsCancelled.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.completedVsCancelled}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.completedVsCancelled.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} citas`, '']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay citas registradas</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
