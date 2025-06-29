// Mock completo del SDK de Transbank para tests
const mockTransaction = {
  create: jest.fn().mockResolvedValue({
    token: 'mock_token_123456',
    url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
  }),
  commit: jest.fn().mockResolvedValue({
    buy_order: 'MOCK_ORDER_123456',
    session_id: 'MOCK_SESSION_123456',
    amount: 100000,
    authorization_code: '123456',
    response_code: 0,
    transaction_date: new Date().toISOString(),
    payment_type_code: 'VN',
    card_detail: { card_number: '****1234' },
    installments_number: 0
  })
};

module.exports = {
  WebpayPlus: {
    Transaction: jest.fn().mockImplementation(() => mockTransaction)
  },
  Environment: {
    Integration: 'integration',
    Production: 'production'
  },
  IntegrationCommerceCodes: {
    WEBPAY_PLUS: 'test_commerce_code_597055555532'
  },
  IntegrationApiKeys: {
    WEBPAY: 'test_api_key_579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'
  },
  // Exponer mock para manipulación en tests
  _mockTransaction: mockTransaction
};