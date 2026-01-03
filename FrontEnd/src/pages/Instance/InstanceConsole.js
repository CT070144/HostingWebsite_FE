import React, { useEffect, useState, useRef } from 'react';
import { Alert, Spinner, Button } from 'react-bootstrap';
import { useNotify } from '../../contexts/NotificationContext';
import { consoleService } from '../../services/consoleService';
import './InstanceConsole.css';

const InstanceConsole = ({ instance }) => {
      const notify = useNotify();
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [connected, setConnected] = useState(false);
      const [wsUrl, setWsUrl] = useState(null);
      const [novncReady, setNovncReady] = useState(false);
      const consoleRef = useRef(null);
      const rfbRef = useRef(null);

      useEffect(() => {
            // Simple check for window.RFB with retries
            let attempts = 0;
            const maxAttempts = 20; // 20 * 500ms = 10 seconds

            const checkRFB = () => {
                  if (window.RFB) {
                        console.log('✅ noVNC (RFB) is available');
                        setNovncReady(true);
                        return true;
                  }
                  return false;
            };

            if (checkRFB()) return;

            const interval = setInterval(() => {
                  attempts++;
                  console.log(`⏳ Checking for noVNC... attempt ${attempts}/${maxAttempts}`);

                  if (checkRFB()) {
                        clearInterval(interval);
                  } else if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        console.error('❌ noVNC not available after 10 seconds');
                        setError('noVNC library chưa sẵn sàng. Vui lòng reload trang.');
                  }
            }, 500);

            return () => clearInterval(interval);
      }, []);

      useEffect(() => {
            if (instance.status !== 'RUNNING') {
                  setError('VM phải ở trạng thái RUNNING để sử dụng console');
            }

            return () => {
                  disconnectConsole();
            };
      }, [instance.status]);

      const connectConsole = async () => {
            try {
                  setLoading(true);
                  setError(null);

                  const response = await consoleService.createConsoleSession(instance.instance_id);
                  const { ws_url } = response.data;

                  setWsUrl(ws_url);

                  const rfb = new window.RFB(consoleRef.current, ws_url, {
                        credentials: { password: '' }
                  });

                  rfb.addEventListener('connect', () => {
                        setConnected(true);
                        setLoading(false);
                        notify.notifySuccess('Đã kết nối console thành công');
                  });

                  rfb.addEventListener('disconnect', (e) => {
                        setConnected(false);
                        if (e.detail.clean) {
                              notify.notifyInfo('Đã ngắt kết nối console');
                        } else {
                              setError('Kết nối console bị ngắt: ' + (e.detail.reason || 'Không rõ'));
                        }
                  });

                  rfb.addEventListener('securityfailure', (e) => {
                        setError('Lỗi bảo mật: ' + e.detail.reason);
                        setLoading(false);
                  });

                  rfb.scaleViewport = true;
                  rfb.resizeSession = true;

                  rfbRef.current = rfb;

            } catch (err) {
                  setError('Không thể kết nối console: ' + (err.response?.data?.error || err.message));
                  setLoading(false);
                  console.error('Console connection error:', err);
            }
      };

      const disconnectConsole = () => {
            if (rfbRef.current) {
                  rfbRef.current.disconnect();
                  rfbRef.current = null;
            }
            setConnected(false);
            setWsUrl(null);
      };

      const sendCtrlAltDel = () => {
            if (rfbRef.current && connected) {
                  rfbRef.current.sendCtrlAltDel();
                  notify.notifyInfo('Đã gửi Ctrl+Alt+Del');
            }
      };

      if (instance.status !== 'RUNNING') {
            return (
                  <div className="instance-console">
                        <Alert variant="warning">
                              <i className="fas fa-exclamation-triangle me-2"></i>
                              VM phải ở trạng thái <strong>RUNNING</strong> để sử dụng console. Trạng thái hiện tại: <strong>{instance.status}</strong>
                        </Alert>
                  </div>
            );
      }

      return (
            <div className="instance-console">
                  <div className="console-toolbar mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                              <div>
                                    <h5 className="mb-0">
                                          <i className="fas fa-terminal me-2"></i>
                                          noVNC Console
                                    </h5>
                                    {connected && (
                                          <small className="text-success">
                                                <i className="fas fa-circle me-1 blink"></i>
                                                Đã kết nối
                                          </small>
                                    )}
                              </div>
                              <div className="console-actions">
                                    {!connected ? (
                                          <Button
                                                variant="primary"
                                                onClick={connectConsole}
                                                disabled={loading || !novncReady}
                                                title={!novncReady ? 'Đang tải noVNC library...' : ''}
                                          >
                                                {loading ? (
                                                      <>
                                                            <Spinner animation="border" size="sm" className="me-2" />
                                                            Đang kết nối...
                                                      </>
                                                ) : (
                                                      <>
                                                            <i className="fas fa-plug me-2"></i>
                                                            Kết nối Console
                                                      </>
                                                )}
                                          </Button>
                                    ) : (
                                          <>
                                                <Button
                                                      variant="warning"
                                                      size="sm"
                                                      onClick={sendCtrlAltDel}
                                                      className="me-2"
                                                >
                                                      <i className="fas fa-keyboard me-1"></i>
                                                      Ctrl+Alt+Del
                                                </Button>
                                                <Button
                                                      variant="danger"
                                                      size="sm"
                                                      onClick={disconnectConsole}
                                                >
                                                      <i className="fas fa-times me-1"></i>
                                                      Ngắt kết nối
                                                </Button>
                                          </>
                                    )}
                              </div>
                        </div>
                  </div>

                  {error && (
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                              <i className="fas fa-exclamation-circle me-2"></i>
                              {error}
                        </Alert>
                  )}

                  <div className="console-container">
                        <div
                              ref={consoleRef}
                              className="console-screen"
                              style={{
                                    display: connected ? 'block' : 'none',
                                    width: '100%',
                                    height: '100%'
                              }}
                        />
                        {!connected && !loading && (
                              <div className="console-placeholder">
                                    <i className="fas fa-desktop fa-4x text-muted mb-3"></i>
                                    <p className="text-muted">Nhấn "Kết nối Console" để bắt đầu</p>
                              </div>
                        )}
                  </div>

                  <div className="console-info mt-3">
                        <small className="text-muted">
                              <i className="fas fa-info-circle me-1"></i>
                              Console sử dụng noVNC qua WebSocket. Đảm bảo VM đang chạy và cổng VNC được cấu hình đúng.
                        </small>
                  </div>
            </div>
      );
};

export default InstanceConsole;
