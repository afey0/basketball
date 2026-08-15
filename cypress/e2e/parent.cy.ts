describe('Parent Portal Suite', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  const loginParent = () => {
    cy.visit('/auth/login');
    cy.get('input[type="email"]').type('mohamed@gmail.com');
    cy.get('input[type="password"]').type('parent123');
    cy.get('button[type="submit"]').click();
    // Use 30 seconds timeout to allow Next.js on-demand compiler to finish compiling /portal and /admin
    cy.url({ timeout: 30000 }).should('include', '/portal');
    cy.contains('Welcome back,', { timeout: 30000 }).should('be.visible');
  };

  it('PT-01: Parent Login & Portal Scoping', () => {
    loginParent();
  });

  it('PT-02: Student Profile & Scoping Verification', () => {
    loginParent();

    // Check that we can see their children on the portal dashboard
    cy.contains('Ismail Hassan').should('be.visible');
    cy.contains('Hawwa Hassan').should('be.visible');
    cy.contains('Ahmed Hassan').should('be.visible');
    cy.contains('Aishath Mohamed').should('be.visible');

    // Verify parent cannot see other parents' kids (e.g. Khalid Noor)
    cy.contains('Khalid Noor').should('not.exist');
  });

  it('PT-03: View Attendance & Invoices', () => {
    loginParent();

    // Click on the 'Profile' link button for Ismail Hassan
    cy.contains('Ismail Hassan').parents().eq(2).contains('Profile').click();

    // Verify view details (with 30s timeout for profile page compile)
    cy.url({ timeout: 30000 }).should('include', '/portal/profile');
    cy.contains('Ismail Hassan', { timeout: 10000 }).should('be.visible');
    cy.contains('Date of Birth').should('be.visible');
    cy.contains('MALE').should('be.visible');
    cy.contains('Training Group').should('be.visible');

    // Verify that Payments page loads (with 30s timeout for payments page compile)
    cy.visit('/portal');
    cy.contains('Welcome back,', { timeout: 10000 }).should('be.visible');
    cy.contains('Ismail Hassan').parents().eq(2).contains('View Payments').click();
    cy.url({ timeout: 30000 }).should('include', '/portal/payments');
  });
});
