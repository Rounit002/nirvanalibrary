import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({ name: '' });
  const [editingProduct, setEditingProduct] = useState<{ id: number; name: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await api.getProducts();
      setProducts(data);
    };
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        const updatedProduct = await api.updateProduct(editingProduct.id, formData);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        setEditingProduct(null);
      } else {
        const newProduct = await api.addProduct(formData);
        setProducts(prev => [...prev, newProduct]);
        setFormData({ name: '' });
      }
      toast.success('Product saved successfully');
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleEdit = (product: { id: number; name: string }) => {
    setEditingProduct(product);
    setFormData({ name: product.name });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure?')) {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Products</h1>
        <div className="bg-white p-4 rounded shadow mb-6">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Product Name"
            className="p-2 border rounded mr-2"
          />
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
            {editingProduct ? 'Update' : 'Add'} Product
          </button>
        </div>
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Name</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td className="p-2">{product.name}</td>
                <td className="p-2">
                  <button onClick={() => handleEdit(product)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsPage;