import { test, expect } from '@playwright/test';

// US-03: เห็นจำนวนสินค้าในสต็อกว่าพร้อมขายหรือหมด (UC-07 / UC-08)
// TC-012 .. TC-016 — จาก SPRS-Test-Cases.docx section 2.3

async function login(page) {
  await page.goto('/');
  await page.locator('[data-test="login-btn"]').click();
  await page.locator('[data-test="email"]').fill(process.env.STOREMATE_EMAIL);
  await page.locator('[data-test="password"]').fill(process.env.STOREMATE_PASSWORD);
  await page.locator('[data-test="btn-submit"]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe('2.3 เห็นจำนวนสินค้าในสต็อกว่าพร้อมขายหรือหมด', () => {
  test('TC-012: แสดงจำนวนสต็อกคงเหลือสำเร็จ', async ({ page }) => {
    await page.goto('/product/28');
    const stock = page.locator('main main').getByText(/มีสินค้าทั้งหมด/);
    await expect(stock).toBeVisible();
    const text = await stock.innerText();
    expect(text).toMatch(/\d/);
  });

  test('TC-013: สินค้าพร้อมขาย (สต็อก >= 1) เพิ่มลงรถเข็นได้สำเร็จ', async ({ page }) => {
    await login(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'พิเศษสบู่ 3' }).click();

    await expect(page.locator('[data-test="btn-add-to-cart"]')).toBeEnabled();
    await page.locator('[data-test="btn-add-to-cart"]').click();

    await expect(page.getByText('เพิ่มสินค้าเข้ารถเข็นเรียบร้อยแล้ว')).toBeVisible();

    await page.locator('[data-test="click-shop-cart"]').click();
    await expect(page).toHaveURL(/\/shopping-cart$/);
    // สินค้า "พิเศษสบู่ 3 ก้อน" คือ /product/53 — หน้าตะกร้ามี checkbox แยกต่อสินค้าด้วย data-test="checkbox-product-{id}"
    await expect(page.locator('[data-test="checkbox-product-53"]')).toBeVisible();
  });

  test('TC-014: สินค้าหมดสต็อก (0 ชิ้น) ปุ่ม "เพิ่มลงรถเข็น" ถูก disable', async ({ page }) => {
    // /product/24 ยืนยันแล้วว่าสต็อก = 0 ณ วันที่เช็ค — ถ้าข้อมูลเปลี่ยนต้องหาสินค้าที่สต็อก 0 ตัวใหม่
    await page.goto('/product/24');
    await expect(page.locator('main main').getByText(/มีสินค้าทั้งหมด/)).toHaveText(/0 ชิ้น/);
    await expect(page.locator('[data-test="btn-add-to-cart"]')).toBeDisabled();
  });

  test.fixme('TC-015: เพิ่มสินค้าเกินจำนวนสต็อกที่มีอยู่ในรถเข็น', async ({ page }) => {
    // ยังไม่ได้ทดสอบสด — ต้องหาสินค้าที่สต็อกเหลือน้อยมากพอจะทดสอบได้จริง และล้างตะกร้าก่อนเริ่ม
    // (ตะกร้าเก็บฝั่งเซิร์ฟเวอร์ผูกกับบัญชี ไม่รีเซ็ตอัตโนมัติ)
    await login(page);
    // TODO: แทนที่ด้วยสินค้าที่รู้ว่าสต็อกเหลือน้อย เช่น 2 ชิ้น
    const LOW_STOCK_PRODUCT_URL = '/product/REPLACE_ME';
    await page.goto(LOW_STOCK_PRODUCT_URL);
    // ล้างตะกร้าก่อน (ถ้ามีของค้างอยู่)
    await page.locator('[data-test="click-shop-cart"]').click();
    const clearAll = page.getByText('ลบออกทั้งหมด');
    if (await clearAll.isVisible().catch(() => false)) {
      await clearAll.click();
    }
    await page.goto(LOW_STOCK_PRODUCT_URL);
    // เพิ่มจนครบสต็อก แล้วเพิ่มอีก 1 ชิ้น
    // ... (ต้องรู้ปุ่ม/ช่องกรอกจำนวนก่อนถึงจะเขียนขั้นตอนที่แน่นอนได้)
    await expect(page.getByText(/ไม่สามารถเพิ่มจำนวนสินค้าได้/)).toBeVisible();
  });

  test('TC-016: กดเพิ่มลงรถเข็นตอนไม่ได้ login เด้งไปหน้า login [BUG]', async ({ page }) => {
    await page.goto('/product/28'); // สินค้าที่มีสต็อก > 0
    await page.locator('[data-test="btn-add-to-cart"]').click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
