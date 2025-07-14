import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react'; // Using a suitable icon for WhatsApp
import api from '../services/api';

// Define the structure for student data
interface Student {
  id: number;
  name: string;
  phone: string;
  membershipEnd: string;
}

const ExpiringMembershipsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetches students with expiring memberships when the page loads
  useEffect(() => {
    const fetchExpiringStudents = async () => {
      setLoading(true);
      try {
        const response = await api.getExpiringSoon();
        setStudents(response.students);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch expiring memberships.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpiringStudents();
  }, []);

  /**
   * Handles the click on the WhatsApp icon.
   * It formats the phone number and opens the WhatsApp chat link in a new tab.
   * @param phoneNumber The student's phone number.
   */
  const handleWhatsAppClick = (phoneNumber: string) => {
    if (!phoneNumber) {
      toast.error('No phone number available for this student.');
      return;
    }
    // Clean up the number by removing any non-digit characters.
    let cleanedNumber = phoneNumber.replace(/\D/g, '');

    // Prepend Indian country code '91' if it's a 10-digit number.
    if (cleanedNumber.length === 10) {
      cleanedNumber = `91${cleanedNumber}`;
    }

    const whatsappUrl = `https://wa.me/${cleanedNumber}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // A small helper function to format date strings for better readability.
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Expiring Memberships</h1>
              <p className="text-gray-500">View all memberships expiring soon.</p>
            </div>
            
            {/* The list of students is now rendered directly on this page. */}
            <div className="rounded-lg border bg-white shadow-sm">
              {loading ? (
                <p className="p-4 text-center text-gray-500">Loading...</p>
              ) : students.length === 0 ? (
                <p className="p-4 text-center text-gray-500">No memberships are expiring soon.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>{formatDate(student.membershipEnd)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleWhatsAppClick(student.phone)}
                            title={`Send WhatsApp message to ${student.name}`}
                          >
                            <MessageSquare className="h-5 w-5 text-green-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiringMembershipsPage;