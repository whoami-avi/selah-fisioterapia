import { chromium } from 'playwright';

async function testApp() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    console.log('Page loaded successfully');
    console.log('Page title:', await page.title());
    
    // Check if login page is visible
    const loginButton = await page.locator('button:has-text("Iniciar sesión")').first();
    const isLoginVisible = await loginButton.isVisible().catch(() => false);
    console.log('Login page visible:', isLoginVisible);
    
    if (errors.length > 0) {
      console.log('\nConsole Errors:');
      errors.forEach(e => console.log('  -', e));
    } else {
      console.log('\nNo console errors detected!');
    }
    
    if (warnings.length > 0) {
      console.log('\nConsole Warnings:');
      warnings.forEach(w => console.log('  -', w));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
  
  return errors.length === 0;
}

testApp().then(success => {
  console.log('\nTest result:', success ? 'PASSED' : 'FAILED');
  process.exit(success ? 0 : 1);
});
