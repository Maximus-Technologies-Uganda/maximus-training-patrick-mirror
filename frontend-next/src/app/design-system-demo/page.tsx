"use client";

import React, { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationControls } from "@/components/PaginationControls";

/**
 * Design System Demo Page
 *
 * Showcases all Phase 2 components with their variants and states
 * for visual testing and documentation screenshots.
 */
export default function DesignSystemDemoPage() {
  const [inputValue, setInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text mb-2">
            Phase 2: Design System Components
          </h1>
          <p className="text-text-muted">
            Foundational components built with design tokens
          </p>
        </div>

        {/* Button Component */}
        <section>
          <h2 className="text-2xl font-semibold text-text mb-4">Button</h2>

          <Card className="mb-4">
            <div className="space-y-6">
              {/* Variants */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">Variants</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">Sizes</h3>
                <div className="flex flex-wrap items-end gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* States */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">States</h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Normal</Button>
                  <Button disabled>Disabled</Button>
                  <Button loading>Loading</Button>
                </div>
              </div>

              {/* All Combinations */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">All Combinations</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-text-muted font-medium">Primary</p>
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-text-muted font-medium">Secondary</p>
                    <Button variant="secondary" size="sm">Small</Button>
                    <Button variant="secondary" size="md">Medium</Button>
                    <Button variant="secondary" size="lg">Large</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-text-muted font-medium">Ghost</p>
                    <Button variant="ghost" size="sm">Small</Button>
                    <Button variant="ghost" size="md">Medium</Button>
                    <Button variant="ghost" size="lg">Large</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Input Component */}
        <section>
          <h2 className="text-2xl font-semibold text-text mb-4">Input</h2>

          <Card>
            <div className="space-y-6 max-w-2xl">
              {/* Basic */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">Basic</h3>
                <Input
                  label="Username"
                  placeholder="Enter your username"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              {/* With Description */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">With Description</h3>
                <Input
                  label="Email"
                  description="We'll never share your email with anyone else."
                  placeholder="you@example.com"
                  type="email"
                />
              </div>

              {/* Error State */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">Error State</h3>
                <Input
                  label="Password"
                  error="Password must be at least 8 characters"
                  placeholder="Enter password"
                  type="password"
                />
              </div>

              {/* Disabled */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">Disabled</h3>
                <Input
                  label="Disabled Input"
                  placeholder="Cannot edit"
                  disabled
                  value="Read-only value"
                />
              </div>

              {/* All Features */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">All Features</h3>
                <Input
                  label="Full Name"
                  description="Enter your first and last name"
                  error="This field cannot be empty"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Card Component */}
        <section>
          <h2 className="text-2xl font-semibold text-text mb-4">Card</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Card */}
            <Card>
              <h3 className="text-lg font-medium text-text mb-2">Basic Card</h3>
              <p className="text-text-muted">
                A simple card with just body content. No header or footer.
              </p>
            </Card>

            {/* Card with Header */}
            <Card
              header={
                <h3 className="text-lg font-medium text-text">Card with Header</h3>
              }
            >
              <p className="text-text-muted">
                This card has a header section with a gray background.
              </p>
            </Card>

            {/* Card with Footer */}
            <Card
              footer={
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary">Cancel</Button>
                  <Button size="sm" className="ml-2">Save</Button>
                </div>
              }
            >
              <h3 className="text-lg font-medium text-text mb-2">Card with Footer</h3>
              <p className="text-text-muted">
                This card has action buttons in the footer.
              </p>
            </Card>

            {/* Card with Header and Footer */}
            <Card
              header={
                <h3 className="text-lg font-medium text-text">Complete Card</h3>
              }
              footer={
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-muted">Last updated: 2 mins ago</span>
                  <Button size="sm">View Details</Button>
                </div>
              }
            >
              <p className="text-text-muted">
                This card demonstrates all sections: header, body, and footer.
              </p>
            </Card>
          </div>
        </section>

        {/* Composite Components */}
        <section>
          <h2 className="text-2xl font-semibold text-text mb-4">Composite Components</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* LoadingState */}
            <div>
              <h3 className="text-lg font-medium text-text mb-3">LoadingState</h3>
              <LoadingState message="Loading data..." />
            </div>

            {/* EmptyState */}
            <div>
              <h3 className="text-lg font-medium text-text mb-3">EmptyState</h3>
              <EmptyState
                title="No items found"
                message="Get started by creating your first item."
                action={{
                  label: "Create Item",
                  onClick: () => alert("Create clicked!"),
                }}
              />
            </div>

            {/* ErrorState */}
            <div>
              <h3 className="text-lg font-medium text-text mb-3">ErrorState</h3>
              <ErrorState
                title="Connection Error"
                message="Unable to load data. Please try again."
                onRetry={() => alert("Retry clicked!")}
              />
            </div>
          </div>

          {/* PaginationControls */}
          <div>
            <h3 className="text-lg font-medium text-text mb-3">PaginationControls</h3>
            <Card>
              <PaginationControls
                currentPage={currentPage}
                totalPages={10}
                onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(10, p + 1))}
              />
            </Card>
          </div>
        </section>

        {/* Real-World Example */}
        <section>
          <h2 className="text-2xl font-semibold text-text mb-4">Real-World Example</h2>

          <Card
            header={
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-text">User Profile</h3>
                <Button size="sm" variant="ghost">Edit</Button>
              </div>
            }
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="secondary">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            }
          >
            <div className="space-y-4">
              <Input
                label="Full Name"
                description="Enter your first and last name"
                placeholder="John Doe"
              />
              <Input
                label="Email Address"
                description="We'll use this for account notifications"
                placeholder="you@example.com"
                type="email"
              />
              <Input
                label="Phone Number"
                description="Optional"
                placeholder="+1 (555) 000-0000"
                type="tel"
              />
            </div>
          </Card>
        </section>

        {/* Design Tokens Reference */}
        <section>
          <h2 className="text-2xl font-semibold text-text mb-4">Design Tokens</h2>

          <Card>
            <div className="space-y-6">
              {/* Colors */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="bg-primary h-16 rounded border mb-2"></div>
                    <p className="text-sm text-text-muted">Primary</p>
                  </div>
                  <div>
                    <div className="bg-surface h-16 rounded border mb-2"></div>
                    <p className="text-sm text-text-muted">Surface</p>
                  </div>
                  <div>
                    <div className="bg-error h-16 rounded border mb-2"></div>
                    <p className="text-sm text-text-muted">Error</p>
                  </div>
                  <div>
                    <div className="bg-text h-16 rounded border mb-2"></div>
                    <p className="text-sm text-text-muted">Text</p>
                  </div>
                </div>
              </div>

              {/* Spacing */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">Spacing</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary" style={{ width: 'var(--spacing-xs)', height: '24px' }}></div>
                    <p className="text-sm text-text-muted">XS (4px)</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary" style={{ width: 'var(--spacing-sm)', height: '24px' }}></div>
                    <p className="text-sm text-text-muted">SM (8px)</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary" style={{ width: 'var(--spacing-md)', height: '24px' }}></div>
                    <p className="text-sm text-text-muted">MD (16px)</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary" style={{ width: 'var(--spacing-lg)', height: '24px' }}></div>
                    <p className="text-sm text-text-muted">LG (24px)</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary" style={{ width: 'var(--spacing-xl)', height: '24px' }}></div>
                    <p className="text-sm text-text-muted">XL (32px)</p>
                  </div>
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <h3 className="text-lg font-medium text-text mb-3">Border Radius</h3>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="bg-primary w-16 h-16 rounded-sm mb-2"></div>
                    <p className="text-sm text-text-muted">SM</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary w-16 h-16 rounded-md mb-2"></div>
                    <p className="text-sm text-text-muted">MD</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary w-16 h-16 rounded-lg mb-2"></div>
                    <p className="text-sm text-text-muted">LG</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
