'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { Modal } from '~/components/ui/Modal';
import { api } from '~/utils/trpc';
import { formatDate } from '~/lib/utils';

type TabType = 'chats' | 'contacts' | 'faqs';

export default function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const itemsPerPage = 10;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
          <p className="text-gray-600">Manage chats, contact requests, and FAQs</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('chats')}
            className={`pb-3 text-sm font-medium ${
              activeTab === 'chats'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💬 Live Chats
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 text-sm font-medium ${
              activeTab === 'contacts'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📧 Contact Requests
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`pb-3 text-sm font-medium ${
              activeTab === 'faqs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ❓ FAQs
          </button>
        </div>

        {/* Content */}
        {activeTab === 'chats' && <ChatsTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'faqs' && <FAQsTab />}
      </div>
    </div>
  );
}

// Chats Tab Component
function ChatsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const { data: chatsData, refetch } = api.chat.getAllChats.useQuery({
    status: statusFilter as any,
    page: currentPage,
    limit: 10,
  });

  const assignChat = api.chat.assignToMe.useMutation({
    onSuccess: () => refetch(),
  });

  const closeChat = api.chat.closeChat.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={statusFilter === '' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'OPEN' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('OPEN')}
        >
          Open
        </Button>
        <Button
          variant={statusFilter === 'IN_PROGRESS' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('IN_PROGRESS')}
        >
          In Progress
        </Button>
        <Button
          variant={statusFilter === 'CLOSED' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('CLOSED')}
        >
          Closed
        </Button>
      </div>

      {/* Chats List */}
      <div className="space-y-4">
        {chatsData?.chats.map((chat: any) => (
          <Card key={chat.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold">{chat.user.name || chat.user.email}</h3>
                    <Badge variant={
                      chat.status === 'OPEN' ? 'default' :
                      chat.status === 'IN_PROGRESS' ? 'warning' : 'secondary'
                    }>
                      {chat.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {chat.subject || 'No subject'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {chat._count.messages} messages • {formatDate(chat.createdAt)}
                  </p>
                  {chat.messages[0] && (
                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                      Last: {chat.messages[0].content}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex gap-2">
                  {chat.status !== 'CLOSED' && !chat.adminId && (
                    <Button
                      size="sm"
                      onClick={() => assignChat.mutate({ chatId: chat.id })}
                    >
                      Take Chat
                    </Button>
                  )}
                  {chat.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => closeChat.mutate({ chatId: chat.id })}
                    >
                      Close
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/admin/support/chat/${chat.id}`, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Contacts Tab Component
function ContactsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [response, setResponse] = useState('');

  const { data: contactsData, refetch } = api.support.getAllContacts.useQuery({
    status: statusFilter as any,
    page: currentPage,
    limit: 10,
  });

  const updateStatus = api.support.updateContactStatus.useMutation({
    onSuccess: () => {
      refetch();
      setIsModalOpen(false);
      setSelectedContact(null);
      setResponse('');
    },
  });

  const deleteContact = api.support.deleteContact.useMutation({
    onSuccess: () => refetch(),
  });

  const handleRespond = (contact: any) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleSubmitResponse = () => {
    if (selectedContact) {
      updateStatus.mutate({
        id: selectedContact.id,
        status: 'RESOLVED',
        response: response,
      });
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={statusFilter === '' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'PENDING' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === 'RESOLVED' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('RESOLVED')}
        >
          Resolved
        </Button>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {contactsData?.contacts.map((contact: any) => (
          <Card key={contact.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold">{contact.name}</h3>
                    <Badge variant={
                      contact.status === 'PENDING' ? 'default' :
                      contact.status === 'RESOLVED' ? 'success' : 'secondary'
                    }>
                      {contact.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                  {contact.phone && (
                    <p className="text-sm text-gray-600">{contact.phone}</p>
                  )}
                  <p className="mt-2 font-medium">{contact.subject}</p>
                  <p className="mt-1 text-sm text-gray-700">{contact.message}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(contact.createdAt)}
                  </p>
                  {contact.response && (
                    <div className="mt-2 rounded bg-blue-50 p-2">
                      <p className="text-xs font-semibold text-blue-900">Response:</p>
                      <p className="text-sm text-blue-800">{contact.response}</p>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex gap-2">
                  {contact.status !== 'RESOLVED' && (
                    <Button
                      size="sm"
                      onClick={() => handleRespond(contact)}
                    >
                      Respond
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm('Delete this contact request?')) {
                        deleteContact.mutate({ id: contact.id });
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Response Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold">Respond to Contact Request</h3>
          {selectedContact && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">From: {selectedContact.name}</p>
              <p className="text-sm text-gray-600">Subject: {selectedContact.subject}</p>
            </div>
          )}
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            placeholder="Type your response..."
            className="w-full rounded-lg border p-2"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse}>
              Send Response
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// FAQs Tab Component
function FAQsTab() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<any>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    order: 0,
    isActive: true,
  });

  const { data: faqs, refetch } = api.support.getAllFAQs.useQuery();

  const createFAQ = api.support.createFAQ.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const updateFAQ = api.support.updateFAQ.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const deleteFAQ = api.support.deleteFAQ.useMutation({
    onSuccess: () => refetch(),
  });

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      order: 0,
      isActive: true,
    });
    setIsCreating(false);
    setEditingFAQ(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFAQ) {
      updateFAQ.mutate({ id: editingFAQ.id, ...formData });
    } else {
      createFAQ.mutate(formData);
    }
  };

  const handleEdit = (faq: any) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isActive: faq.isActive,
    });
    setIsCreating(true);
  };

  return (
    <div>
      <div className="mb-4">
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : '+ Add New FAQ'}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Answer</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                  rows={4}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-24 rounded border px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm">Active</label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingFAQ ? 'Update' : 'Create'} FAQ
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* FAQs List */}
      <div className="space-y-4">
        {faqs?.map((faq: any) => (
          <Card key={faq.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary">{faq.category}</Badge>
                    {!faq.isActive && <Badge variant="danger">Inactive</Badge>}
                  </div>
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-1 text-sm text-gray-700">{faq.answer}</p>
                  <p className="mt-1 text-xs text-gray-500">Order: {faq.order}</p>
                </div>
                <div className="ml-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(faq)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm('Delete this FAQ?')) {
                        deleteFAQ.mutate({ id: faq.id });
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
