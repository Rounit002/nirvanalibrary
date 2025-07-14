import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import AddTransactionForm from '../components/AddTransactionForm';
import TransactionRow from '../components/TransactionRow';

interface Transaction {
  id: string;
  name: string;
  cashReceipt: number;
  onlineReceipt: number;
  cashExpense: number;
  onlineExpense: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
}

const TransactionPage: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<TransactionsResponse, Error>({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
  });

  const handleAddSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const transactions = data?.transactions || [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#fef9f6]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <span role="img" aria-label="money">💰</span> Transactions
          </h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white shadow-lg rounded-xl p-4 mb-6 w-full"
          >
            <AddTransactionForm onAddSuccess={handleAddSuccess} />
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center text-gray-600 mt-6">
              <Loader2 className="animate-spin mr-2" />
              Loading transactions...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center text-red-500 mt-6">
              <AlertTriangle className="mr-2" />
              Error: {error.message}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="overflow-x-auto bg-white shadow-md rounded-xl w-full"
            >
              <table className="w-full text-sm text-left table-auto">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Cash Receipt</th>
                    <th className="px-4 py-3">Online Receipt</th>
                    <th className="px-4 py-3">Cash Expense</th>
                    <th className="px-4 py-3">Online Expense</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TransactionPage;
