type MessageHandler = (data: MessageEvent) => void;

type WSOptions = {
  onMessage?: MessageHandler;
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
};

export function createReconnectingSocket(url: string, options: WSOptions = {}) {
  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  const connect = () => {
    socket = new WebSocket(url);
    socket.addEventListener('open', () => {
      reconnectAttempts = 0;
      options.onOpen?.();
    });
    socket.addEventListener('message', (event) => options.onMessage?.(event));
    socket.addEventListener('error', (event) => {
      options.onError?.(event);
      socket?.close();
    });
    socket.addEventListener('close', () => {
      options.onClose?.();
      const timeout = Math.min(1000 * 2 ** reconnectAttempts, 10000);
      setTimeout(() => {
        reconnectAttempts += 1;
        connect();
      }, timeout);
    });
  };
  connect();
  return () => socket?.close();
}
