/**
 * Reset Password Page
 * Handles password reset completion from email link
 */

import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
};