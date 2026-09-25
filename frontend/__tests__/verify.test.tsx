import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VerifyPage from '../app/pay/verify/page';

let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockVerifySuccess = {
  payment: {
    id: 'pay-1',
    status: 'SUCCESSFUL',
    actualAmount: 50000,
    paidAt: '2026-09-24T12:30:00.000Z',
  },
  breakdown: {
    grossAmount: 50000,
    providerFee: 750,
    platformFee: 500,
    tax: 0,
    distributableAmount: 48750,
    collaboratorAllocations: [
      {
        collaboratorId: 'collab-1',
        userId: 'usr-1',
        role: 'OWNER',
        splitPercentage: 60,
        amount: 29250,
      },
      {
        collaboratorId: 'collab-2',
        userId: 'usr-2',
        role: 'MEMBER',
        splitPercentage: 40,
        amount: 19500,
      },
    ],
  },
};

describe('VerifyPage (/pay/verify)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('renders "Missing payment reference" if accessed without reference query param', () => {
    mockSearchParams = new URLSearchParams();
    render(<VerifyPage />);

    expect(screen.getByText('Missing payment reference')).toBeInTheDocument();
    expect(screen.getByText(/No payment reference was found/i)).toBeInTheDocument();
  });

  it('renders loading state while verifying reference', () => {
    mockSearchParams = new URLSearchParams({ reference: 'ref_test_123' });
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<VerifyPage />);

    expect(screen.getByText('Verifying your payment…')).toBeInTheDocument();
  });

  it('renders verified successful state with financial breakdown and allocations', async () => {
    mockSearchParams = new URLSearchParams({ reference: 'ref_test_123' });
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockVerifySuccess }),
    } as Response);

    render(<VerifyPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment successful!')).toBeInTheDocument();
      expect(screen.getByText('Financial breakdown')).toBeInTheDocument();
      expect(screen.getByText('Distributable amount')).toBeInTheDocument();
      expect(screen.getByText('₦48,750.00')).toBeInTheDocument();
      expect(screen.getByText('Collaborator allocations')).toBeInTheDocument();
      expect(screen.getByText('OWNER')).toBeInTheDocument();
      expect(screen.getByText('₦29,250.00')).toBeInTheDocument();
      expect(screen.getByText('MEMBER')).toBeInTheDocument();
      expect(screen.getByText('₦19,500.00')).toBeInTheDocument();
    });
  });

  it('renders failed state when payment transaction was unsuccessful', async () => {
    mockSearchParams = new URLSearchParams({ reference: 'ref_failed_123' });
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          ...mockVerifySuccess,
          payment: {
            ...mockVerifySuccess.payment,
            status: 'FAILED',
          },
        },
      }),
    } as Response);

    render(<VerifyPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
      expect(screen.getByText(/Your payment could not be processed/i)).toBeInTheDocument();
    });
  });

  it('renders error message when verification endpoint returns an error', async () => {
    mockSearchParams = new URLSearchParams({ reference: 'ref_error_123' });
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Invalid transaction reference' } }),
    } as Response);

    render(<VerifyPage />);

    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid transaction reference')).toBeInTheDocument();
    });
  });
});
