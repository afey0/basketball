describe('Club Admin Suite', () => {
  beforeEach(() => {
    cy.session('club-admin-session', () => {
      cy.visit('/auth/login');
      cy.get('input[type="email"]').type('admin@mbc.mv');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 15000 }).should('include', '/admin');
      cy.contains('Dashboard', { timeout: 15000 }).should('be.visible');
    });
  });

  it('AD-01: Admin Login & Dashboard View', () => {
    cy.visit('/admin');
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
  });

  it('AD-02: Student Creation & Maldives ID Validation', () => {
    // Go to Students page
    cy.visit('/admin/students');
    cy.get('table.data-table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.wait(1000); // Wait for React hydration
    cy.contains('Add Student').click();

    // Fill form using label-based selectors
    cy.contains('label', 'First Name', { timeout: 10000 }).parent().find('input').type('Ali');
    cy.contains('label', 'Last Name').parent().find('input').type('Naseer');
    cy.get('input[type="date"]').type('2018-05-15');
    
    // Country dropdown should default to 'Maldives'
    cy.contains('label', 'Country').parent().find('select').should('have.value', 'Maldives');

    // Try submitting without ID Card (which is required for Maldives)
    cy.contains('label', 'Parent / Guardian').parent().find('select').select(1); // Select the first parent option
    cy.get('button[type="submit"]').click();

    // Fill invalid ID Card formats and verify errors
    cy.contains('label', 'ID Card').parent().find('input').type('B123456');
    cy.get('button[type="submit"]').click();
    cy.contains('ID Card must be in the format Axxxxxx', { timeout: 10000 }).should('be.visible');

    cy.contains('label', 'ID Card').parent().find('input').clear().type('A12345');
    cy.get('button[type="submit"]').click();
    cy.contains('ID Card must be in the format Axxxxxx').should('be.visible');

    // Submit with a valid Maldives ID format (unique for every test run to prevent DB conflicts)
    const uniqueId = 'A' + Math.floor(100000 + Math.random() * 900000);
    cy.contains('label', 'ID Card').parent().find('input').clear().type(uniqueId.toLowerCase()); // Test lowercase auto-upper
    cy.get('button[type="submit"]').click();

    // Verification of student created successfully
    cy.contains('Student added', { timeout: 10000 }).should('be.visible');
    cy.contains('Ali Naseer').should('be.visible');

    // Try creating another student with the duplicate ID Card
    cy.contains('Add Student').click();
    cy.contains('label', 'First Name').parent().find('input').type('Hussain');
    cy.contains('label', 'Last Name').parent().find('input').type('Naseer');
    cy.get('input[type="date"]').type('2017-06-20');
    cy.contains('label', 'Parent / Guardian').parent().find('select').select(1);
    cy.contains('label', 'ID Card').parent().find('input').type(uniqueId); // Duplicate ID Card
    cy.get('button[type="submit"]').click();
    cy.contains('Duplicate ID Card or Passport number found', { timeout: 10000 }).should('be.visible');
    
    // Close modal to clean up state
    cy.contains('button', 'Cancel').click();
  });

  it('AD-03: Student Creation (Other Countries)', () => {
    // Go to Students page
    cy.visit('/admin/students');
    cy.get('table.data-table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.wait(1000); // Wait for React hydration
    cy.contains('Add Student').click();

    // Fill form
    cy.contains('label', 'First Name', { timeout: 10000 }).parent().find('input').type('John');
    cy.contains('label', 'Last Name').parent().find('input').type('Doe');
    cy.get('input[type="date"]').type('2016-10-10');

    // Change country to United States
    cy.contains('label', 'Country').parent().find('select').select('United States');

    // Verify label changes to Passport and is not required (let's leave it blank)
    cy.contains('label', 'Passport').should('be.visible');
    cy.contains('label', 'Parent / Guardian').parent().find('select').select(1);
    cy.get('button[type="submit"]').click();

    // Verify student added successfully
    cy.contains('Student added', { timeout: 10000 }).should('be.visible');
    cy.contains('John Doe').should('be.visible');
  });

  it('AD-04: User Account Management (Role Restriction)', () => {
    // Navigate to Users
    cy.visit('/admin/users');
    cy.get('table.data-table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.wait(1000); // Wait for React hydration
    cy.contains('Add User Account').click();

    // Verify role selection dropdown only displays Admin and Viewer
    cy.contains('label', 'User Role', { timeout: 10000 }).parent().find('select').within(() => {
      cy.get('option').should('have.length', 2);
      cy.get('option').eq(0).should('have.text', 'Administrator (Full Access)');
      cy.get('option').eq(1).should('have.text', 'Viewer (Read-Only Access)');
    });
  });

  it('AD-05: Theme Customization Live Preview', () => {
    // Navigate to settings
    cy.visit('/admin/settings');
    cy.contains('Active Portal Theme', { timeout: 10000 }).should('be.visible');
    cy.wait(1000); // Wait for React hydration

    // Select 'Amethyst Purple' theme
    cy.contains('Active Portal Theme').parent().find('select').select('purple');

    // Verify instant live preview class applied to HTML
    cy.get('html').should('have.class', 'theme-purple');

    // Select 'Cyberpunk' theme
    cy.contains('Active Portal Theme').parent().find('select').select('cyberpunk');
    cy.get('html').should('have.class', 'theme-cyberpunk');

    // Save and refresh to check persistence
    cy.contains('Save All Settings').click();
    cy.contains('Settings saved!', { timeout: 10000 }).should('be.visible');

    cy.reload();
    cy.get('html', { timeout: 10000 }).should('have.class', 'theme-cyberpunk');

    // Revert to default for clean tests later
    cy.contains('Active Portal Theme').parent().find('select').select('default');
    cy.contains('Save All Settings').click();
  });
});
