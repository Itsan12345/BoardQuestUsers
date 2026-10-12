"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { logArenaIntegrityIncidentAction } from '@/app/actions/arena';

export interface UseArenaIntegrityOptions {
  isActive: boolean;
  targetElementRef?: React.RefObject<HTMLElement | null>;
  subject?: string;
  nodeId?: string;
  quizMode?: string;
  maxStrikes?: number;
  onForfeit?: () => void;
  onViolation?: (reason: 'blur' | 'printscreen' | 'fullscreen_exit' | 'copy_attempt', strikes: number) => void;
}

export function useArenaIntegrity({
  isActive,
  targetElementRef,
  subject = 'Quest Arena',
  nodeId = 'unknown',
  quizMode = 'quest',
  maxStrikes = 3,
  onForfeit,
  onViolation,
}: UseArenaIntegrityOptions) {
  // Real-time privacy shield (blackout while window is blurred/minimized)
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [shieldReason, setShieldReason] = useState<'blur' | 'printscreen' | 'fullscreen_exit' | null>(null);

  // Interactive warning modal that requires student acknowledgement
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<'blur' | 'printscreen' | 'fullscreen_exit' | 'copy_attempt'>('blur');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNativeFsSupported, setIsNativeFsSupported] = useState(true);
  const [strikes, setStrikes] = useState(0);

  const wasFullscreenRef = useRef(false);
  const strikesRef = useRef(0);
  strikesRef.current = strikes;

  // Debounce ref per violation reason to avoid Alt-Tab or Esc duplicate infractions
  const lastViolationTimesRef = useRef<Record<string, number>>({});

  const onForfeitRef = useRef(onForfeit);
  useEffect(() => {
    onForfeitRef.current = onForfeit;
  }, [onForfeit]);

  const onViolationRef = useRef(onViolation);
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  // Check native fullscreen capability
  const isCurrentlyFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return false;
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const el = document.documentElement as any;
      const supported = !!(
        document.fullscreenEnabled ||
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen
      );
      setIsNativeFsSupported(supported);
      setIsFullscreen(isCurrentlyFullscreen());
    }
  }, [isCurrentlyFullscreen]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (typeof document === 'undefined') return;
      const el = (targetElementRef?.current || document.documentElement) as any;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      } else {
        setIsFullscreen(true);
        wasFullscreenRef.current = true;
      }
    } catch (err) {
      console.warn("Arena Integrity: Fullscreen request rejected or unavailable:", err);
      setIsFullscreen(true);
      wasFullscreenRef.current = true;
    }
  }, [targetElementRef]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (typeof document === 'undefined') return;
      const doc = document as any;
      if (doc.exitFullscreen && isCurrentlyFullscreen()) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen && isCurrentlyFullscreen()) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen && isCurrentlyFullscreen()) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen && isCurrentlyFullscreen()) {
        await doc.msExitFullscreen();
      }
    } catch (err) {
      console.warn("Arena Integrity: Fullscreen exit error:", err);
    } finally {
      setIsFullscreen(false);
      wasFullscreenRef.current = false;
    }
  }, [isCurrentlyFullscreen]);

  // Core violation recorder with debouncing and asynchronous database logging
  const recordViolation = useCallback((reason: 'blur' | 'printscreen' | 'fullscreen_exit' | 'copy_attempt') => {
    const now = Date.now();
    const lastTime = lastViolationTimesRef.current[reason] || 0;
    // Per-reason debounce: 1200ms for fullscreen_exit to deduplicate keydown and fullscreenchange; 2500ms for others
    const debounceMs = reason === 'fullscreen_exit' ? 1200 : 2500;
    if (now - lastTime < debounceMs) {
      if (reason === 'fullscreen_exit') {
        setModalReason('fullscreen_exit');
        setIsWarningModalOpen(true);
      }
      return;
    }
    lastViolationTimesRef.current[reason] = now;

    const nextStrikes = strikesRef.current + 1;
    setStrikes(nextStrikes);
    setModalReason(reason);
    setIsWarningModalOpen(true);

    onViolationRef.current?.(reason, nextStrikes);

    // Asynchronously log incident directly to MongoDB for administrator review
    let incidentType: 'TAB_SWITCH' | 'SCREENSHOT_ATTEMPT' | 'FULLSCREEN_EXIT' | 'COPY_ATTEMPT' = 'TAB_SWITCH';
    let details = 'Window focus lost or tab switched during active trial';

    if (reason === 'printscreen') {
      incidentType = 'SCREENSHOT_ATTEMPT';
      details = 'PrintScreen key pressed during active trial';
    } else if (reason === 'fullscreen_exit') {
      incidentType = 'FULLSCREEN_EXIT';
      details = 'Exited full-screen mode during active trial';
    } else if (reason === 'copy_attempt') {
      incidentType = 'COPY_ATTEMPT';
      details = 'Attempted text copy or right-click context menu';
    }

    logArenaIntegrityIncidentAction({
      incidentType,
      subject,
      nodeId,
      quizMode,
      strikeCount: nextStrikes,
      details,
    }).catch(err => console.warn('Failed to log integrity incident to DB:', err));
  }, [subject, nodeId, quizMode]);

  // Acknowledge warning and resume battle
  const dismissWarningModal = useCallback(async () => {
    setIsWarningModalOpen(false);
    setIsShieldActive(false);
    // Restore fullscreen upon student clicking resume
    await enterFullscreen();
  }, [enterFullscreen]);

  // Main listener for fullscreen, focus loss, keyboard, and clipboard events
  useEffect(() => {
    if (!isActive) {
      setIsShieldActive(false);
      setIsWarningModalOpen(false);
      return;
    }

    const handleFsChange = () => {
      const active = isCurrentlyFullscreen();
      setIsFullscreen(active);

      if (active) {
        wasFullscreenRef.current = true;
      } else {
        // Any time fullscreen drops while trial simulation is active, warn the student
        if (isActive) {
          recordViolation('fullscreen_exit');
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape') {
        // If warning modal is already open, consume Esc so modal cannot be dismissed without restoring
        if (isWarningModalOpen) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // Esc pressed while trial is active -> warn the student immediately!
        recordViolation('fullscreen_exit');
      } else if (isWarningModalOpen && (e.key === 'Enter' || e.key === ' ')) {
        // Allow pressing Enter or Space to acknowledge modal and restore fullscreen
        e.preventDefault();
        e.stopPropagation();
        dismissWarningModal();
      }
    };

    const handleWindowBlur = () => {
      if (!isActive) return;
      // If fullscreen exit just happened within 1.2s, ignore this blur as an OS window-frame switch artifact
      const lastFsExit = lastViolationTimesRef.current['fullscreen_exit'] || 0;
      if (Date.now() - lastFsExit < 1200) {
        return;
      }
      // Immediately shield content so questions cannot be seen or snipped in the background
      setIsShieldActive(true);
      setShieldReason('blur');
      recordViolation('blur');
    };

    const handleWindowFocus = () => {
      if (!isActive) return;
      // Lift the blackout shield when window is refocused; the warning modal stays open
      setIsShieldActive(false);
    };

    const handleVisibilityChange = () => {
      if (!isActive) return;
      if (document.visibilityState === 'hidden') {
        setIsShieldActive(true);
        setShieldReason('blur');
        recordViolation('blur');
      } else {
        setIsShieldActive(false);
      }
    };

    const safeClearClipboard = () => {
      const notice = "BoardQuest content is protected. Copying and screenshots are not allowed.";
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          navigator.clipboard
            .writeText(notice)
            .catch(() => {});
        } catch (_) {}
      }

      try {
        if (typeof document !== 'undefined' && document.hasFocus && document.hasFocus()) {
          const textArea = document.createElement("textarea");
          textArea.value = notice;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          textArea.style.top = "-9999px";
          textArea.setAttribute("readonly", "");
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }
      } catch (_) {}
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        safeClearClipboard();

        setIsShieldActive(true);
        setShieldReason('printscreen');
        recordViolation('printscreen');

        setTimeout(() => {
          setIsShieldActive(false);
        }, 1500);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!isActive) return;
      e.preventDefault();
      recordViolation('copy_attempt');
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (!isActive) return;
      e.preventDefault();
      recordViolation('copy_attempt');
    };

    const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    fsEvents.forEach(evt => document.addEventListener(evt, handleFsChange));
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);

    return () => {
      fsEvents.forEach(evt => document.removeEventListener(evt, handleFsChange));
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
    };
  }, [isActive, isCurrentlyFullscreen, isWarningModalOpen, recordViolation, dismissWarningModal]);

  const resetIntegrity = useCallback(() => {
    setStrikes(0);
    setIsShieldActive(false);
    setIsWarningModalOpen(false);
    lastViolationTimesRef.current = {};
  }, []);

  return {
    isFullscreen,
    isShieldActive,
    shieldReason,
    isWarningModalOpen,
    modalReason,
    isNativeFsSupported,
    strikes,
    maxStrikes,
    enterFullscreen,
    exitFullscreen,
    dismissWarningModal,
    recordViolation,
    resetIntegrity,
  };
}
