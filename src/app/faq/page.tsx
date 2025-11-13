'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Input } from '~/components/ui/Input';
import { api } from '~/utils/trpc';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get FAQs
  const { data: faqs, isLoading } = api.support.getFAQs.useQuery({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
  });

  // Get categories
  const { data: categories } = api.support.getFAQCategories.useQuery();

  // Group FAQs by category
  const groupedFAQs = faqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category]!.push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600">
            Find answers to common questions about our hotel booking platform
          </p>
        </div>

        {/* Search & Filter */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {categories?.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading FAQs...</p>
          </div>
        ) : faqs && faqs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">
                No FAQs found. Try a different search or category.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFAQs || {}).map(([category, categoryFAQs]) => (
              <div key={category}>
                <h2 className="mb-4 text-xl font-bold text-gray-900">{category}</h2>
                <div className="space-y-3">
                  {categoryFAQs.map((faq) => (
                    <Card key={faq.id} className="overflow-hidden">
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full text-left"
                      >
                        <CardHeader className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold text-gray-900">
                              {faq.question}
                            </CardTitle>
                            <span className="text-2xl text-gray-400">
                              {expandedId === faq.id ? '−' : '+'}
                            </span>
                          </div>
                        </CardHeader>
                      </button>
                      {expandedId === faq.id && (
                        <CardContent className="border-t bg-gray-50">
                          <p className="whitespace-pre-wrap text-gray-700">
                            {faq.answer}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still Need Help */}
        <Card className="mt-8 bg-blue-50">
          <CardContent className="py-8 text-center">
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Still have questions?
            </h3>
            <p className="mb-4 text-gray-600">
              Can't find what you're looking for? Contact our support team.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/contact"
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
              >
                Contact Us
              </a>
              <a
                href="mailto:support@hotelbooking.com"
                className="rounded-lg border border-blue-600 bg-white px-6 py-2 font-medium text-blue-600 hover:bg-blue-50"
              >
                Email Support
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
