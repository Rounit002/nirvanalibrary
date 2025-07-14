import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

// Define the props interface
interface AddTransactionFormProps {
  onAddSuccess: () => void;
}

// Define the transaction data shape for the API (camelCase as used in frontend)
interface NewTransaction {
  name: string;
  cashReceipt: number;
  onlineReceipt: number;
  cashExpense: number;
  onlineExpense: number;
}

// Define the shape of the API response (assuming the backend returns the created transaction)
interface TransactionResponse {
  id: string;
  name: string;
  cashReceipt: number;
  onlineReceipt: number;
  cashExpense: number;
  onlineExpense: number;
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ onAddSuccess }) => {
  const [name, setName] = useState<string>('');
  const [cashReceipt, setCashReceipt] = useState<string>('');
  const [onlineReceipt, setOnlineReceipt] = useState<string>('');
  const [cashExpense, setCashExpense] = useState<string>('');
  const [onlineExpense, setOnlineExpense] = useState<string>('');

  // Define the mutation for adding a transaction with proper typing
  const addMutation = useMutation<TransactionResponse, Error, NewTransaction>({
    mutationFn: (newTransaction) => api.addTransaction(newTransaction),
    onSuccess: () => {
      onAddSuccess();
      // Reset form fields
      setName('');
      setCashReceipt('');
      setOnlineReceipt('');
      setCashExpense('');
      setOnlineExpense('');
    },
    onError: (error: Error) => {
      console.error('Failed to add transaction:', error.message);
      alert('Failed to add transaction: ' + error.message);
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required');
      return;
    }

    const newTransaction: NewTransaction = {
      name: name.trim(),
      cashReceipt: cashReceipt === '' ? 0 : parseFloat(cashReceipt),
      onlineReceipt: onlineReceipt === '' ? 0 : parseFloat(onlineReceipt),
      cashExpense: cashExpense === '' ? 0 : parseFloat(cashExpense),
      onlineExpense: onlineExpense === '' ? 0 : parseFloat(onlineExpense),
    };

    addMutation.mutate(newTransaction);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          value={cashReceipt}
          onChange={(e) => setCashReceipt(e.target.value)}
          placeholder="Cash Receipt"
          className="border p-2 rounded"
          min="0"
          step="0.01"
        />
        <input
          type="number"
          value={onlineReceipt}
          onChange={(e) => setOnlineReceipt(e.target.value)}
          placeholder="Online Receipt"
          className="border p-2 rounded"
          min="0"
          step="0.01"
        />
        <input
          type="number"
          value={cashExpense}
          onChange={(e) => setCashExpense(e.target.value)}
          placeholder="Cash Expense"
          className="border p-2 rounded"
          min="0"
          step="0.01"
        />
        <input
          type="number"
          value={onlineExpense}
          onChange={(e) => setOnlineExpense(e.target.value)}
          placeholder="Online Expense"
          className="border p-2 rounded"
          min="0"
          step="0.01"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={addMutation.isPending}
        >
          {addMutation.isPending ? 'Adding...' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
};

export default AddTransactionForm;