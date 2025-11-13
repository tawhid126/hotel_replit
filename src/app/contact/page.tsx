'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { api } from '~/utils/trpc';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const submitContact = api.support.submitContact.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    },
    onError: (error) => {
      alert('Failed to send message: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitContact.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mb-4 text-6xl">✅</div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Message Sent Successfully!
              </h2>
              <p className="mb-6 text-gray-600">
                Thank you for contacting us. We'll get back to you within 24 hours.
              </p>
              <Button onClick={() => setSubmitted(false)}>Send Another Message</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="text-gray-600">
            Have questions? We're here to help. Send us a message!
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Contact Information */}
          <div className="space-y-6 md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">📧 Email</h3>
                  <a
                    href="mailto:support@hotelbooking.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@hotelbooking.com
                  </a>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">📞 Phone</h3>
                  <a
                    href="tel:+8801234567890"
                    className="text-blue-600 hover:underline"
                  >
                    +880 1234-567890
                  </a>
                  <p className="text-sm text-gray-500">Available 24/7</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">💬 Live Chat</h3>
                  <p className="text-sm text-gray-600">
                    Click the chat button in the bottom right corner for instant support
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">⏰ Business Hours</h3>
                  <p className="text-sm text-gray-600">24/7 Support Available</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Name *"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="Your full name"
                    />
                    <Input
                      label="Email *"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <Input
                    label="Phone (Optional)"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+880 1234-567890"
                  />

                  <Input
                    label="Subject *"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                    placeholder="How can we help you?"
                  />

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Message *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                      rows={6}
                      placeholder="Please describe your question or issue in detail..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Minimum 10 characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitContact.isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {submitContact.isLoading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Looking for quick answers?{' '}
            <a href="/faq" className="font-semibold text-blue-600 hover:underline">
              Check our FAQ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
