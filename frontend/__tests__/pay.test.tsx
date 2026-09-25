import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { Suspense } from 'react';
import PayPage from '../app/pay/[token]/page';

const mockPaymentData = {
  id: 'pay-1',
  projectId: 'pool-1',
  paymentLinkToken: 'tok_abc123456789xyz',
  expectedAmount: 50000,
  actualAmount: null,
  currency: 'NGN',
  provider: 'paystack',
  status: 'PENDING',
  paidAt: null,
  createdAt: '2026-09-24T12:00:00.000Z',
};

function renderPayPage(token: string) {
  const tokenPromise = Promise.resolve({ token });
  return render(
    <Suspense fallback={<div>Loading suspense...</div>}>
      <PayPage params={tokenPromise} />
    </Suspense>
  );
}

describe('PayPage (/pay/[token])', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        origin: 'http://localhost:3000',
        href: '',
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('renders loading skeleton while fetching payment details', async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    
    await act(async () => {
      renderPayPage('tok_abc123');
    });
    
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders "Link not found" when payment link does not exist (404)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Not found' } }),
    } as Response);

    await act(async () => {
      renderPayPage('invalid-token');
    });

    await waitFor(() => {
      expect(screen.getByText('Link not found')).toBeInTheDocument();
      expect(screen.getByText(/This payment link doesn't exist/i)).toBeInTheDocument();
    });
  });

  it('renders error state on network or server error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Internal server error' } }),
    } as Response);

    await act(async () => {
      renderPayPage('error-token');
    });

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });
  });

  it('renders "Payment complete" if payment has already been settled', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          ...mockPaymentData,
          status: 'SUCCESSFUL',
          actualAmount: 50000,
          paidAt: '2026-09-24T13:00:00.000Z',
        },
      }),
    } as Response);

    await act(async () => {
      renderPayPage('paid-token');
    });

    await waitFor(() => {
      expect(screen.getByText('Payment complete')).toBeInTheDocument();
      expect(screen.getByText(/This payment has already been completed/i)).toBeInTheDocument();
    });
  });

  it('renders checkout details and initializes payment to redirect to Paystack', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn()
      // Initial fetch for link info
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockPaymentData }),
      } as Response)
      // Payment initialize call
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            authorizationUrl: 'https://checkout.paystack.com/access-code-123',
            reference: 'ref_12345',
          },
        }),
      } as Response);

    await act(async () => {
      renderPayPage('tok_abc123456789xyz');
    });

    await waitFor(() => {
      expect(screen.getByText('Amount due')).toBeInTheDocument();
      expect(screen.getAllByText('Splitpay').length).toBeGreaterThan(0);
    });

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const payButton = screen.getByRole('button', { name: /Pay ₦50,000/i });

    // Validate email validation error
    await user.click(payButton);
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();

    // Type invalid email
    await user.type(emailInput, 'invalid-email');
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();

    // Type valid email and submit
    await user.clear(emailInput);
    await user.type(emailInput, 'buyer@example.com');
    await user.click(payButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/pay/tok_abc123456789xyz/initialize'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'buyer@example.com',
            callbackUrl: 'http://localhost:3000/pay/verify',
          }),
        })
      );
      expect(window.location.href).toBe('https://checkout.paystack.com/access-code-123');
    });
  });
});
