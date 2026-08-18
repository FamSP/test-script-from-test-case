import { test, expect } from '@playwright/test';

// US-02: ดูรายละเอียดสินค้า (UC-07)
// TC-007 .. TC-011 — จาก SPRS-Test-Cases.docx section 2.2

test.describe('2.2 ดูรายละเอียดสินค้า', () => {
  test('TC-007: แสดงรายละเอียดสินค้าครบถ้วนสำเร็จ', async ({ page }) => {
    await page.goto('/product/28');

    const content = page.locator('main main');
    await expect(page.locator('[data-test="product-name"]')).toBeVisible();
    await expect(content.getByText(/^฿[\d,]+$/)).toBeVisible();
    await expect(content.locator('img').first()).toBeVisible();
    await expect(content.locator('h3:has-text("รายละเอียดสินค้า") + div')).toBeVisible();
    await expect(content.getByText(/มีสินค้าทั้งหมด/)).toBeVisible();
    await expect(content.locator('div.border.border-gray-400.rounded-lg').first()).toBeVisible();
  });

  test('TC-008: ขยาย/ย่อรายละเอียดสินค้าที่ถูกตัดไว้สำเร็จ', async ({ page }) => {
    // ปุ่มนี้เป็นฟีเจอร์เฉพาะจอมือถือ (CSS: line-clamp-3 md:line-clamp-none) — ที่ desktop
    // viewport ปุ่มมีขนาด 0x0 ไม่ actionable เลย ต้องบังคับ viewport มือถือถึงจะกดได้จริง
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/product/28');

    const toggle = page.locator('[data-test="btn-description"]');
    await expect(toggle).toHaveText('แสดงเพิ่มเติม');
    await toggle.click();
    await expect(toggle).toHaveText('แสดงน้อยลง');
    await toggle.click();
    await expect(toggle).toHaveText('แสดงเพิ่มเติม');
  });

  test('TC-009: เปลี่ยนหน้ารีวิว (pagination) สำเร็จ', async ({ page }) => {
    await page.goto('/product/28');

    const page2Button = page.locator('[data-test="click-on-page"]').nth(1);
    await page2Button.click();
    await expect(page2Button).toHaveClass(/bg-blue-50/);
  });

  test('TC-010: เปิดหน้าสินค้าด้วย id ที่ไม่มีอยู่จริง [BUG]', async ({ page }) => {
    // Expected (ตามสเปคที่ตั้งใจ): ควรขึ้น "ไม่พบข้อมูลสินค้า" แล้วมีทางกลับไปหน้ารายการสินค้าล่าสุด
    // Actual (ยืนยันสดแล้ว): เด้งไปหน้า /login พร้อมข้อความ "เข้าสู่ระบบเพื่อใช้เว็บไซต์" แทน
    await page.goto('/product/non-existent-id');
    await expect(page.getByText('เข้าสู่ระบบเพื่อใช้เว็บไซต์')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-011: กดเพิ่มลงรถเข็นตอนไม่ได้ login [BUG]', async ({ page }) => {
    // Expected (ที่คาดไว้แต่แรก): ควรมีข้อความแจ้ง "กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงรถเข็น" บนหน้าเดิม
    // Actual (ยืนยันสดแล้ว): เด้งไปหน้า /login ทันที ไม่มีข้อความแจ้งเตือนบนหน้าสินค้าก่อนเลย
    await page.goto('/product/28'); // สินค้าที่มีสต็อก > 0
    await page.locator('[data-test="btn-add-to-cart"]').click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
