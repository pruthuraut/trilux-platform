'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AuthExpiredModal from '@/components/AuthExpiredModal';

const AuthModalDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalReason, setModalReason] = useState<'expired' | 'invalid' | 'missing'>('expired');

  const showExpiredModal = () => {
    setModalReason('expired');
    setShowModal(true);
  };

  const showInvalidModal = () => {
    setModalReason('invalid');
    setShowModal(true);
  };

  const showMissingModal = () => {
    setModalReason('missing');
    setShowModal(true);
  };

  const hideModal = () => {
    setShowModal(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Authentication Modal Demo</h2>
      <p className="text-muted-foreground">
        Test the different authentication modal states:
      </p>
      
      <div className="flex gap-4">
        <Button onClick={showExpiredModal} variant="destructive">
          Show Session Expired
        </Button>
        <Button onClick={showInvalidModal} variant="destructive">
          Show Invalid Token
        </Button>
        <Button onClick={showMissingModal} variant="outline">
          Show Missing Token
        </Button>
      </div>

      <AuthExpiredModal
        isOpen={showModal}
        onClose={hideModal}
        reason={modalReason}
      />
    </div>
  );
};

export default AuthModalDemo;
