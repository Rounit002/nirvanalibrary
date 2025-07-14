import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Define the Transaction interface matching the API response
interface Transaction {
  id: string;
  name: string;
  cashReceipt: number;
  onlineReceipt: number;
  cashExpense: number;
  onlineExpense: number;
}

// Define the props interface
interface TransactionRowProps {
  transaction: Transaction;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction }) => {
  const queryClient = useQueryClient();

  // Initialize state with transaction data
  const [name, setName] = useState<string>(transaction.name);
  const [cashReceipt, setCashReceipt] = useState<string>(transaction.cashReceipt.toString());
  const [onlineReceipt, setOnlineReceipt] = useState<string>(transaction.onlineReceipt.toString());
  const [cashExpense, setCashExpense] = useState<string>(transaction.cashExpense.toString());
  const [onlineExpense, setOnlineExpense] = useState<string>(transaction.onlineExpense.toString());

  // Calculate total dynamically based on current input values
  const total = (
    (parseFloat(cashReceipt) || 0) +
    (parseFloat(onlineReceipt) || 0) -
    (parseFloat(cashExpense) || 0) -
    (parseFloat(onlineExpense) || 0)
  ).toFixed(2);

  // Mutation for updating a transaction
  const updateMutation = useMutation<Transaction, Error, Partial<Transaction>>({
    mutationFn: (updatedData) => api.updateTransaction(transaction.id, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      alert('Transaction updated successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to update transaction:', error.message);
      alert('Failed to update transaction: ' + error.message);
    },
  });

  // Mutation for deleting a transaction
  const deleteMutation = useMutation<void, Error, void>({
    mutationFn: () => api.deleteTransaction(transaction.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      alert('Transaction deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to delete transaction:', error.message);
      alert('Failed to delete transaction: ' + error.message);
    },
  });

  // Handle save action
  const handleSave = () => {
    if (!name.trim()) {
      alert('Name is required');
      return;
    }

    const updatedData: Partial<Transaction> = {
      name: name.trim(),
      cashReceipt: parseFloat(cashReceipt) || 0,
      onlineReceipt: parseFloat(onlineReceipt) || 0,
      cashExpense: parseFloat(cashExpense) || 0,
      onlineExpense: parseFloat(onlineExpense) || 0,
    };

    updateMutation.mutate(updatedData);
  };

  // Handle delete action
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <tr>
      <td className="py-2 px-4 border-b">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-1"
          required
        />
      </td>
      <td className="py-2 px-4 border-b">
        <input
          type="number"
          value={cashReceipt}
          onChange={(e) => setCashReceipt(e.target.value)}
          className="w-full border rounded p-1"
          min="0"
          step="0.01"
        />
      </td>
      <td className="py-2 px-4 border-b">
        <input
          type="number"
          value={onlineReceipt}
          onChange={(e) => setOnlineReceipt(e.target.value)}
          className="w-full border rounded p-1"
          min="0"
          step="0.01"
        />
      </td>
      <td className="py-2 px-4 border-b">
        <input
          type="number"
          value={cashExpense}
          onChange={(e) => setCashExpense(e.target.value)}
          className="w-full border rounded p-1"
          min="0"
          step="0.01"
        />
      </td>
      <td className="py-2 px-4 border-b">
        <input
          type="number"
          value={onlineExpense}
          onChange={(e) => setOnlineExpense(e.target.value)}
          className="w-full border rounded p-1"
          min="0"
          step="0.01"
        />
      </td>
      <td className="py-2 px-4 border-b">{total}</td>
      <td className="py-2 px-4 border-b">
        <button
          onClick={handleSave}
          className="bg-green-500 text-white p-1 rounded mr-2 hover:bg-green-600 disabled:bg-green-300"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-500 text-white p-1 rounded hover:bg-red-600 disabled:bg-red-300"
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </td>
    </tr>
  );
};

export default TransactionRow;