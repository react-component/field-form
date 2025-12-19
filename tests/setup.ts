window.MessageChannel = class {
  port1: any;
  port2: any;

  constructor() {
    const createPort = () => {
      const port = {
        onmessage: null,
        postMessage: (message: any) => {
          setTimeout(() => {
            if (port._target && typeof port._target.onmessage === 'function') {
              port._target.onmessage({ data: message });
            }
          }, 10);
        },
        _target: null,
      };
      return port;
    };

    const port1 = createPort();
    const port2 = createPort();
    port1._target = port2;
    port2._target = port1;
    this.port1 = port1;
    this.port2 = port2;
  }
} as any;
