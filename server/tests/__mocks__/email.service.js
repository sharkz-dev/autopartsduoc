// Mock del servicio de email para tests
module.exports = {
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-message-id-123',
    response: '250 Message accepted'
  }),
  
  sendWelcomeEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-welcome-id-123',
    response: '250 Welcome email sent'
  }),
  
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-order-confirmation-123',
    response: '250 Order confirmation sent'
  }),
  
  sendOrderStatusUpdateEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-status-update-123',
    response: '250 Status update sent'
  }),
  
  sendDistributorApprovalEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-distributor-approval-123',
    response: '250 Distributor approval sent'
  }),
  
  sendPasswordResetEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-password-reset-123',
    response: '250 Password reset sent'
  }),
  
  sendLowStockAlert: jest.fn().mockResolvedValue({
    messageId: 'mock-low-stock-123',
    response: '250 Low stock alert sent'
  }),
  
  sendNewReviewNotification: jest.fn().mockResolvedValue({
    messageId: 'mock-review-notification-123',
    response: '250 Review notification sent'
  }),
  
  sendPromotionalEmail: jest.fn().mockResolvedValue([
    { email: 'test@example.com', status: 'sent' }
  ]),
  
  sendAbandonedCartReminder: jest.fn().mockResolvedValue({
    messageId: 'mock-cart-reminder-123',
    response: '250 Cart reminder sent'
  })
};