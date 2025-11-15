"use client";

import { nanoid } from 'nanoid';
import type { Socket } from 'socket.io-client';

let socketRef: Socket | null = null;
let conversationIdRef: string | null = null;

function generateConversationId() {
  try {
    const value = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : nanoid(16);
    return `conv_${value}`;
  } catch (error) {
    console.warn('Falling back to nanoid for conversation id', error);
    return `conv_${nanoid(16)}`;
  }
}

export function ensureConversationId() {
  if (conversationIdRef) return conversationIdRef;
  const generated = generateConversationId();
  conversationIdRef = generated;
  return conversationIdRef;
}

export function forceNewConversationId() {
  conversationIdRef = generateConversationId();
  return conversationIdRef;
}

export function attachSergbotSocket(socket: Socket | null) {
  socketRef = socket;
}

export function detachSergbotSocket(socket?: Socket | null) {
  if (!socket || socketRef === socket) {
    socketRef = null;
  }
}

export function resetSergbotSession() {
  try {
    socketRef?.disconnect?.();
  } catch (error) {
    console.warn('Failed to disconnect SergBot socket', error);
  }
  socketRef = null;
  conversationIdRef = null;
}

interface SergbotUserMessage {
  userId: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function emitSergbotUserMessage({ userId, message, metadata }: SergbotUserMessage) {
  const socket = socketRef;
  if (!socket) {
    throw new Error('SergBot socket is not connected.');
  }
  const conversationId = ensureConversationId();
  socket.emit('agent_user_message', {
    conversationId,
    userId,
    message,
    metadata
  });
}

export function getActiveSergbotSocket() {
  return socketRef;
}
