'use client';

import { DoctorManager } from '@/components/doctors/DoctorManager';

export default function DoctorsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">Gerenciamento de Médicos</h1>
      <DoctorManager />
    </div>
  );
} 