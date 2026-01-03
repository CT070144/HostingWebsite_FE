import api from '../utils/api';

export const instanceService = {
      // Get all instances for the authenticated user
      getAllInstances: (params = {}) => api.get('/user/instances', { params }),

      // Get single instance by ID
      getInstanceById: (instanceId) => api.get(`/user/instances/${instanceId}`),

      // Configure SSH key for instance
      configureSSH: (instanceId, sshData) =>
            api.post(`/user/instances/${instanceId}/configure-ssh`, sshData),

      // Generate SSH key pair
      generateSSHKey: () => api.post('/user/ssh-keys/generate'),

      // VM lifecycle management
      startVM: (instanceId) => api.post(`/user/instances/${instanceId}/start`),

      stopVM: (instanceId) => api.post(`/user/instances/${instanceId}/stop`),

      restartVM: (instanceId) => api.post(`/user/instances/${instanceId}/restart`),

      suspendVM: (instanceId) => api.post(`/user/instances/${instanceId}/suspend`),
};
