import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DeleteConfirmModal = ({ isOpen, webhook, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen || !webhook) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-elevated max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
              <Icon name="AlertTriangle" size={24} className="text-error" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Delete Webhook</h3>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">
              Are you sure you want to delete this webhook? All associated request history will be permanently removed.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Webhook" size={16} className="text-muted-foreground" />
                <span className="font-medium text-foreground">{webhook?.name}</span>
              </div>
              <code className="text-xs text-muted-foreground font-mono">
                {webhook?.url}
              </code>
              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                <span>{webhook?.requestCount} requests</span>
                <span>•</span>
                <span>Created {new Date(webhook.createdAt)?.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              loading={isDeleting}
              iconName="Trash2"
              iconPosition="left"
            >
              Delete Webhook
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;