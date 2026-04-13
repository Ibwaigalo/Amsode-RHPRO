'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink, Clock, Calendar, Briefcase, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpiringContract {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  contractType: string;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  departmentId: string | null;
  isActive: boolean;
}

interface ExpiringContractsWidgetProps {
  initialContracts?: ExpiringContract[];
  daysThreshold?: number;
}

export default function ExpiringContractsWidget({ 
  initialContracts = [], 
  daysThreshold = 30 
}: ExpiringContractsWidgetProps) {
  const [contracts, setContracts] = useState<ExpiringContract[]>(initialContracts);
  const [isLoading, setIsLoading] = useState(!initialContracts.length);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch(`/api/contracts/expiring?days=${daysThreshold}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          setContracts(data.contracts || []);
        }
      } catch (error) {
        console.error('Error fetching expiring contracts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (initialContracts.length === 0) {
      fetchContracts();
    }
  }, [daysThreshold, initialContracts.length]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysLabel = (days: number) => {
    if (days <= 0) return { text: 'Expiré', color: 'text-red-600' };
    if (days <= 7) return { text: `${days} jour(s)`, color: 'text-red-600' };
    if (days <= 30) return { text: `${days} jours`, color: 'text-orange-600' };
    return { text: `${days} jours`, color: 'text-yellow-600' };
  };

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CDI: 'CDI',
      CDD: 'CDD',
      STAGE: 'Stage',
      CONSULTANT: 'Consultant',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="card border-red-200 dark:border-red-800/50 p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="card border-red-200 dark:border-red-800/50"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm sm:text-base font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Contrats Expirants</span>
            <span className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full text-xs">{contracts.length}</span>
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs sm:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <span className="hidden sm:inline">Voir tout</span>
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {contracts.slice(0, 5).map((contract) => {
            const daysInfo = getDaysLabel(contract.daysRemaining);
            return (
              <div 
                key={contract.id} 
                className="flex items-center justify-between gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {contract.firstName} {contract.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Briefcase className="w-3 h-3" />
                    {getContractTypeLabel(contract.contractType)}
                    <span className="hidden sm:inline">•</span>
                    <Calendar className="w-3 h-3 hidden sm:inline" />
                    <span className="hidden sm:inline">{formatDate(contract.endDate)}</span>
                  </p>
                </div>
                <span className={`text-sm font-medium whitespace-nowrap ${daysInfo.color}`}>
                  {daysInfo.text}
                </span>
              </div>
            );
          })}
        </div>

        {contracts.length > 5 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-3 text-sm text-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            +{contracts.length - 5} autres contrats
          </button>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Contrats Expirants dans {daysThreshold} jours
                  <span className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full text-sm">{contracts.length}</span>
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="space-y-2">
                  {contracts.map((contract) => {
                    const daysInfo = getDaysLabel(contract.daysRemaining);
                    return (
                      <div 
                        key={contract.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {contract.firstName} {contract.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {getContractTypeLabel(contract.contractType)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Fin: {formatDate(contract.endDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getContractTypeLabel(contract.contractType)}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${daysInfo.color}`}>
                            {daysInfo.text}
                          </p>
                          <a
                            href={`/employees?id=${contract.id}`}
                            className="text-xs text-[#0090D1] hover:underline"
                          >
                            Voir profil
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};