// Mock del servicio de email para tests

const emailService = {
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    success: true
  }),

  sendWelcomeEmail: jest.fn().mockResolvedValue({
    messageId: 'test-welcome-message',
    success: true
  }),

  sendOrderConfirmationEmail: jest.fn().mockResolvedValue({
    messageId: 'test-order-confirmation',
    success: true
  }),

  sendOrderStatusUpdateEmail: jest.fn().mockResolvedValue({
    messageId: 'test-status-update',
    success: true
  }),

  sendDistributorApprovalEmail: jest.fn().mockResolvedValue({
    messageId: 'test-distributor-approval',
    success: true
  }),

  sendDistributorOrderNotification: jest.fn().mockResolvedValue({
    messageId: 'test-distributor-notification',
    success: true
  }),

  sendPasswordResetEmail: jest.fn().mockResolvedValue({
    messageId: 'test-password-reset',
    success: true
  }),

  sendLowStockAlert: jest.fn().mockResolvedValue({
    messageId: 'test-low-stock-alert',
    success: true
  }),

  sendNewReviewNotification: jest.fn().mockResolvedValue({
    messageId: 'test-review-notification',
    success: true
  }),

  sendPromotionalEmail: jest.fn().mockResolvedValue([{
    email: 'test@test.com',
    status: 'sent'
  }]),

  sendAbandonedCartReminder: jest.fn().mockResolvedValue({
    messageId: 'test-cart-reminder',
    success: true
  })
};

module.exports = emailService;