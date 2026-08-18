import { test, expect } from '@playwright/test';

// US-05: รีวิวและให้คะแนนสินค้าที่ฉันซื้อ (UC-24 / UC-25 / UC-26)
// TC-024 .. TC-030 — จาก SPRS-Test-Cases.docx section 2.5
//
// หมายเหตุ: TC-025..TC-029 ยังไม่ได้ทดสอบสด — บัญชีทดสอบที่มีอยู่ไม่มีคำสั่งซื้อสถานะ
// "คำสั่งซื้อสำเร็จ" เลย (มีแค่สถานะ "ที่ต้องจัดส่ง" 1 รายการ) จึงเข้าฟอร์มเขียนรีวิวไม่ได้
// locator ด้านล่างเขียนตามโครงสร้างหน้า /orders ที่สำรวจไว้ (แท็บ, การ์ดคำสั่งซื้อ) แต่ปุ่ม
// "เขียนรีวิว" ยังไม่เคยเห็นจริงในเบราว์เซอร์ — ต้องปรับ selector หลังมีคำสั่งซื้อสำเร็จให้ทดสอบ

async function login(page) {
  await page.goto('/');
  await page.locator('[data-test="login-btn"]').click();
  await page.locator('[data-test="email"]').fill(process.env.STOREMATE_EMAIL);
  await page.locator('[data-test="password"]').fill(process.env.STOREMATE_PASSWORD);
  await page.locator('[data-test="btn-submit"]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function gotoCompletedOrders(page) {
  await page.goto('/orders?status=ALL');
  const completedTab = page.locator('*').filter({ hasText: /^คำสั่งซื้อสำเร็จ$/ }).first();
  await completedTab.click();
}

test.describe('2.5 รีวิวและให้คะแนนสินค้าที่ฉันซื้อ', () => {
  test('TC-024: ดูรีวิวที่มีอยู่แล้วได้โดยไม่ต้อง login', async ({ page }) => {
    await page.goto('/product/28');
    await expect(page.locator('main main').locator('div.border.border-gray-400.rounded-lg').first()).toBeVisible();
  });

  test.fixme('TC-025: เขียนรีวิวและให้คะแนนสินค้าที่ซื้อสำเร็จ', async ({ page }) => {
    await login(page);
    await gotoCompletedOrders(page);
    await page.getByRole('button', { name: 'เขียนรีวิว' }).first().click();
    // TODO: ยืนยัน selector ของ star rating เมื่อเห็นฟอร์มจริง
    await page.getByRole('button', { name: /5.*ดาว|★★★★★/ }).click();
    await page.getByPlaceholder(/ความคิดเห็น|รีวิว/i).fill('สินค้าคุณภาพดี ส่งไว');
    await page.getByRole('button', { name: 'ส่ง' }).click();
    await expect(page.getByText(/ขอบคุณ/)).toBeVisible();
  });

  test.fixme('TC-026: ส่งรีวิวโดยไม่กรอกคะแนนความพึงพอใจ', async ({ page }) => {
    await login(page);
    await gotoCompletedOrders(page);
    await page.getByRole('button', { name: 'เขียนรีวิว' }).first().click();
    await page.getByPlaceholder(/ความคิดเห็น|รีวิว/i).fill('รีวิวไม่มีคะแนน');
    await page.getByRole('button', { name: 'ส่ง' }).click();
    await expect(page.getByText(/กรุณา.*คะแนน/)).toBeVisible();
  });

  test.fixme('TC-027: สินค้าที่รีวิวแล้วขึ้นปุ่ม "ดูรีวิว" แทน "เขียนรีวิว"', async ({ page }) => {
    await login(page);
    await gotoCompletedOrders(page);
    await expect(page.getByRole('button', { name: 'ดูรีวิว' }).first()).toBeVisible();
  });

  test.fixme('TC-028: แก้ไขรีวิวที่เคยส่งไปแล้ว', async ({ page }) => {
    await login(page);
    await gotoCompletedOrders(page);
    await page.getByRole('button', { name: 'ดูรีวิว' }).first().click();
    await page.getByRole('button', { name: 'แก้ไข' }).click();
    await page.getByPlaceholder(/ความคิดเห็น|รีวิว/i).fill('แก้ไขรีวิว: ใช้งานมาสักพักแล้วยังพอใจ');
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(page.getByText(/แก้ไข.*สำเร็จ/)).toBeVisible();
  });

  test.fixme('TC-029: ลบรีวิวที่เคยส่งไปแล้ว', async ({ page }) => {
    await login(page);
    await gotoCompletedOrders(page);
    await page.getByRole('button', { name: 'ดูรีวิว' }).first().click();
    await page.getByRole('button', { name: 'ลบ' }).click();
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await expect(page.getByText(/ลบ.*สำเร็จ/)).toBeVisible();
  });

  test('TC-030: ผู้เยี่ยมชม (ไม่ login) เปิดหน้าคำสั่งซื้อของตัวเองไม่ได้', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login$/);
  });
});
