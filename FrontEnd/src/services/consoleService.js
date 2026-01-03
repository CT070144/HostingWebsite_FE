import api from '../utils/api';

export const consoleService = {
      // Create console session and get WebSocket URL
      createConsoleSession: (instanceId) =>
            api.post(`/user/vm/${instanceId}/console`),
};
