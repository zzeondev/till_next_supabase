'use client';

import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import AleartModal from '../modal/AlertModal';
import PostEditorModal from '../modal/PostEditorModal';
import ProfileEditorModal from '../profile/ProfileEditorModal';

export default function ModalProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {createPortal(
        <>
          <PostEditorModal />
          <AleartModal />
          <ProfileEditorModal />
        </>,
        document.getElementById('modal-root')!
      )}
      {children}
    </>
  );
}
