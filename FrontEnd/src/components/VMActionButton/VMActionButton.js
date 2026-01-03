import React, { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import './VMActionButton.css';

const VMActionButton = ({
      action,
      icon,
      label,
      variant = 'primary',
      size = 'sm',
      disabled = false,
      onAction,
      confirmMessage,
      className = ''
}) => {
      const [loading, setLoading] = useState(false);

      const handleClick = async () => {
            if (confirmMessage && !window.confirm(confirmMessage)) {
                  return;
            }

            try {
                  setLoading(true);
                  await onAction();
            } catch (error) {
                  console.error(`Action ${action} failed:`, error);
            } finally {
                  setLoading(false);
            }
      };

      return (
            <Button
                  variant={variant}
                  size={size}
                  disabled={disabled || loading}
                  onClick={handleClick}
                  className={`vm-action-button ${className}`}
            >
                  {loading ? (
                        <>
                              <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-1"
                              />
                              <span>Đang xử lý...</span>
                        </>
                  ) : (
                        <>
                              {icon && <i className={`fas ${icon} me-1`}></i>}
                              {label}
                        </>
                  )}
            </Button>
      );
};

export default VMActionButton;
