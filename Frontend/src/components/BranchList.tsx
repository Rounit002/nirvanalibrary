import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Branch {
  id: string;
  name: string;
  studentCount: number;
}

interface BranchListProps {
  branches: Branch[];
  onUpdateBranch: (id: string, name: string) => void;
  onDeleteBranch: (id: string) => void;
}

const BranchList: React.FC<BranchListProps> = ({ branches, onUpdateBranch, onDeleteBranch }) => {
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editName, setEditName] = useState('');

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setEditName(branch.name);
  };

  const handleSave = () => {
    if (editingBranch) {
      onUpdateBranch(editingBranch.id, editName);
      setEditingBranch(null);
    }
  };

  const handleCancel = () => {
    setEditingBranch(null);
  };

  return (
    <div className="space-y-4">
      {branches.map((branch) => (
        <div key={branch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
          {editingBranch?.id === branch.id ? (
            <div className="flex items-center space-x-2 w-full">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-800"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <Link
                to={`/hostel/branches/${branch.id}/students`}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {branch.name} ({branch.studentCount} students)
              </Link>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(branch)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteBranch(branch.id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={branch.studentCount > 0}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default BranchList;