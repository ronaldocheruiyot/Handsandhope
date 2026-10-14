import { useEffect, useState } from 'react';
import { MessageSquare, Search, Filter, Reply, Archive, Trash2, Clock, CheckCircle, Plus, Send, User, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { api } from '../services/api';
import { toast } from 'sonner';

interface InquiryReply {
  message: string;
  responder?: 'seller' | 'buyer' | 'caregiver';
  timestamp?: string;
}

interface Inquiry {
  id: string;
  _id?: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  productName: string;
  productImage: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  replies?: InquiryReply[];
}

interface InquiriesPageProps {
  highContrast?: boolean;
  canRespond?: boolean;
  targetAccountId?: string;
  accountOwnerName?: string;
}

export function InquiriesPage({ highContrast = false, canRespond = true, targetAccountId, accountOwnerName }: InquiriesPageProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);

  // Compose Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeBuyerName, setComposeBuyerName] = useState('Jane Mwangi');
  const [composeBuyerEmail, setComposeBuyerEmail] = useState('buyer.jane@example.com');
  const [composeProductName, setComposeProductName] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      const data = await api.getInquiries(token, targetAccountId);

      const mapped = (data || []).map((item: any) => ({
        ...item,
        id: item.id || item._id,
        timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent',
        replies: item.replies || []
      }));

      setInquiries(mapped);
      if (selectedInquiry) {
        const updatedSelected = mapped.find((m: any) => m.id === selectedInquiry.id);
        if (updatedSelected) setSelectedInquiry(updatedSelected);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [targetAccountId]);

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesFilter = filter === 'all' || inquiry.status === filter;
    const matchesSearch = 
      inquiry.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;
  const repliedCount = inquiries.filter(i => i.status === 'replied').length;

  const handleReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;

    try {
      setIsReplying(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      await api.replyInquiry(selectedInquiry.id, replyText, token, targetAccountId);
      
      const newReply = {
        message: replyText,
        responder: 'seller' as const,
        timestamp: new Date().toISOString()
      };

      const updated = inquiries.map(i =>
        i.id === selectedInquiry.id 
          ? { ...i, status: 'replied' as const, replies: [...(i.replies || []), newReply] } 
          : i
      );
      
      setInquiries(updated);
      setSelectedInquiry(prev => prev ? { ...prev, status: 'replied', replies: [...(prev.replies || []), newReply] } : null);
      setReplyText('');
      toast.success('Reply sent successfully!');
    } catch (error: any) {
      console.error('Reply error:', error);
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setIsComposing(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      await api.composeInquiry({
        sellerId: targetAccountId,
        buyerName: composeBuyerName,
        buyerEmail: composeBuyerEmail,
        productName: composeProductName || 'Artisan Craft',
        message: composeMessage
      }, token);

      toast.success('Inquiry sent successfully!');
      setShowComposeModal(false);
      setComposeMessage('');
      setComposeProductName('');
      fetchInquiries();
    } catch (error: any) {
      console.error('Error creating inquiry:', error);
      toast.error(error.message || 'Failed to create inquiry');
    } finally {
      setIsComposing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'replied':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={highContrast ? 'border-2 border-white bg-black' : 'shadow-lg'}>
        <CardContent className="py-12 text-center">
          <p className={highContrast ? 'text-gray-300' : 'text-gray-600'}>Loading inquiries from database...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Customer Inquiries {accountOwnerName && <span className="text-blue-600">({accountOwnerName})</span>}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {pendingCount} pending • {repliedCount} replied • {inquiries.length} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowComposeModal(true)} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <Plus className="h-4 w-4" />
            Compose / Test Inquiry
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search inquiries by customer or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10"
              />
            </div>
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-4 h-10">
                <TabsTrigger value="all">All ({inquiries.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                <TabsTrigger value="replied">Replied ({repliedCount})</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {filteredInquiries.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-blue-50 p-6">
                <MessageSquare className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold mb-1">No Inquiries Found</h2>
              <p className="text-gray-500 max-w-md text-sm mb-4">
                {searchQuery ? 'Try a different search query' : 'No customer inquiries yet. Click "Compose / Test Inquiry" to simulate buyer questions!'}
              </p>
              <Button onClick={() => setShowComposeModal(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Send Test Inquiry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Inquiries List */}
          <div className="space-y-3 lg:col-span-2">
            {filteredInquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedInquiry?.id === inquiry.id ? 'ring-2 ring-blue-600 bg-blue-50/20' : ''
                }`}
                onClick={() => setSelectedInquiry(inquiry)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                        {inquiry.customerName?.split(' ').map(n => n[0]).join('') || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-semibold text-sm truncate">{inquiry.customerName}</h4>
                        <Badge className={`text-xs capitalize ${getPriorityColor(inquiry.priority)}`}>
                          {inquiry.priority}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-blue-600 truncate">{inquiry.productName}</p>
                      <p className="line-clamp-2 text-xs text-gray-600">{inquiry.message}</p>
                      <div className="flex items-center justify-between pt-1 text-xs text-gray-400">
                        <span>{inquiry.timestamp}</span>
                        <span className="flex items-center gap-1 font-medium capitalize">
                          {getStatusIcon(inquiry.status)} {inquiry.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Inquiry Details & Reply */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              {selectedInquiry ? (
                <Card className="shadow-lg">
                  <CardHeader className="border-b pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 items-center">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-lg">
                            {selectedInquiry.customerName?.split(' ').map(n => n[0]).join('') || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{selectedInquiry.customerName}</CardTitle>
                          <p className="text-xs text-gray-500">{selectedInquiry.customerEmail}</p>
                        </div>
                      </div>
                      <Badge variant={selectedInquiry.status === 'replied' ? 'secondary' : 'default'} className="capitalize gap-1">
                        {getStatusIcon(selectedInquiry.status)}
                        {selectedInquiry.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-6">
                    {/* Product Info */}
                    <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3">
                      <div className="size-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        🛍️
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Inquiring about item:</p>
                        <p className="font-semibold text-sm text-gray-900">{selectedInquiry.productName}</p>
                      </div>
                    </div>

                    {/* Customer Question Bubble */}
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Message</span>
                      <div className="mt-1 rounded-lg border bg-white p-4 shadow-sm">
                        <p className="text-gray-800 text-sm leading-relaxed">{selectedInquiry.message}</p>
                        <p className="mt-2 text-xs text-gray-400">Received {selectedInquiry.timestamp}</p>
                      </div>
                    </div>

                    {/* Reply Thread History */}
                    {selectedInquiry.replies && selectedInquiry.replies.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversation History</span>
                        {selectedInquiry.replies.map((reply, idx) => (
                          <div key={idx} className="rounded-lg border bg-blue-50/50 p-3 ml-4 border-blue-200">
                            <div className="flex items-center justify-between text-xs text-blue-700 font-medium mb-1">
                              <span>💬 {reply.responder === 'caregiver' ? 'Caregiver Response' : 'Seller Response'}</span>
                              <span>{reply.timestamp ? new Date(reply.timestamp).toLocaleTimeString() : 'Just now'}</span>
                            </div>
                            <p className="text-sm text-gray-900">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Compose Reply */}
                    {canRespond ? (
                      <div className="space-y-2 pt-2 border-t">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Compose Response
                        </label>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply to the customer here..."
                          rows={3}
                          className="resize-none text-sm"
                        />
                        <Button 
                          onClick={handleReply} 
                          disabled={isReplying || !replyText.trim()}
                          className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        >
                          <Send className="h-4 w-4" />
                          {isReplying ? 'Sending...' : 'Send Reply'}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                        🔒 You have view-only access for inquiries on this account.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <MessageSquare className="h-14 w-14 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium text-sm">Select an inquiry from the left to read or send a reply</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Inquiry Dialog */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-blue-600" />
              Compose / Send Inquiry
            </DialogTitle>
            <DialogDescription>
              Submit a customer inquiry to test store communications and caregiver responses.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInquiry} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Buyer Name</label>
              <Input
                value={composeBuyerName}
                onChange={(e) => setComposeBuyerName(e.target.value)}
                placeholder="e.g. Jane Mwangi"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Buyer Email</label>
              <Input
                type="email"
                value={composeBuyerEmail}
                onChange={(e) => setComposeBuyerEmail(e.target.value)}
                placeholder="e.g. buyer.jane@example.com"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Product / Topic</label>
              <Input
                value={composeProductName}
                onChange={(e) => setComposeProductName(e.target.value)}
                placeholder="e.g. African Elephant Sculpture / Custom Pottery"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Inquiry Message</label>
              <Textarea
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder="Ask about dimensions, materials, custom colors, shipping time..."
                rows={4}
                className="mt-1 resize-none"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowComposeModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isComposing || !composeMessage.trim()} className="gap-2 bg-blue-600 text-white">
                <Send className="size-4" />
                {isComposing ? 'Sending...' : 'Send Inquiry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
