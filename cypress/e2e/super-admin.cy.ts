describe('Super Admin Suite', () => {
  beforeEach(() => {
    // Clear cookies/localstorage
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('SU-01: Login Success & Dashboard Navigation', () => {
    cy.visit('/super-admin/login');

    // Fill in correct credentials
    cy.get('input[type="email"]').type('superadmin@bball.crm');
    cy.get('input[type="password"]').type('superadmin123');

    // Submit
    cy.get('button[type="submit"]').click();

    // Verify redirection and dashboard metrics visible
    cy.url({ timeout: 15000 }).should('include', '/super-admin');
    cy.contains('SUPER ADMIN PANEL', { timeout: 15000 }).should('be.visible');
    cy.contains('Registered Clubs').should('be.visible');
  });

  it('SU-02: Login Validation Errors', () => {
    cy.visit('/super-admin/login');

    // 1. Invalid password
    cy.get('input[type="email"]').type('superadmin@bball.crm');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible');

    // 2. Non-existent email
    cy.get('input[type="email"]').clear().type('nonexistent@bball.crm');
    cy.get('input[type="password"]').clear().type('superadmin123');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible');
  });

  it('SU-03: Club Creation (Validation & Success)', () => {
    // Log in
    cy.visit('/super-admin/login');
    cy.get('input[type="email"]').type('superadmin@bball.crm');
    cy.get('input[type="password"]').type('superadmin123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/super-admin');
    cy.contains('Registered Clubs', { timeout: 15000 }).should('be.visible');

    // Open modal
    cy.contains('Create New Club').click();
    cy.contains('Provision New Club').should('be.visible');

    // Fill in values with too short password
    cy.get('input[placeholder="e.g. Apex Basketball"]').type('Test Club Name');
    cy.get('input[placeholder="e.g. Ahmed Ali"]').type('Test Admin Name');
    cy.get('input[placeholder="admin@apex.mv"]').type('testadmin@apex.mv');
    cy.get('input[placeholder="Min 6 chars"]').type('123'); // Invalid password length

    cy.get('button').contains('Provision Club').click();
    // Verify toast error
    cy.contains('Password must be at least 6 characters', { timeout: 10000 }).should('be.visible');

    // Let's create a unique club
    const uniqueSlug = 'test-club-' + Date.now();
    const uniqueEmail = 'admin@' + uniqueSlug + '.com';

    cy.get('input[placeholder="e.g. Apex Basketball"]').clear().type('Test Automated Club');
    cy.get('input[placeholder="e.g. apex"]').clear().type(uniqueSlug);
    cy.get('input[placeholder="e.g. Ahmed Ali"]').clear().type('Test Admin');
    cy.get('input[placeholder="admin@apex.mv"]').clear().type(uniqueEmail);
    cy.get('input[placeholder="Min 6 chars"]').clear().type('admin123');

    cy.get('button').contains('Provision Club').click();

    // Verify it is created and modal closes
    cy.contains(`Club "Test Automated Club" created successfully!`, { timeout: 10000 }).should('be.visible');
    cy.contains('Test Automated Club').should('be.visible');
  });

  it('SU-04: Edit Club Branding', () => {
    // Log in
    cy.visit('/super-admin/login');
    cy.get('input[type="email"]').type('superadmin@bball.crm');
    cy.get('input[type="password"]').type('superadmin123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/super-admin');
    cy.contains('Registered Clubs', { timeout: 15000 }).should('be.visible');

    // Edit the first club in the list (click 'Edit' actions or similar)
    cy.get('table.data-table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.get('button').first().click();
    });

    cy.contains('Edit Club & Admin').should('be.visible');

    // Change name and logo
    const updatedName = 'Branded Club Name ' + Math.round(Math.random() * 1000);
    cy.get('input[placeholder="e.g. Hawks Basketball"]').clear().type(updatedName);
    cy.get('input[placeholder="e.g. https://..."]').clear().type('https://avatar.iran.liara.run/public/1');

    cy.get('button').contains('Save Changes').click();

    // Verify success toast
    cy.contains('details updated successfully!', { timeout: 10000 }).should('be.visible');
    cy.contains(updatedName).should('be.visible');
  });
});
