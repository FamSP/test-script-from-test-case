import { test, expect } from '@playwright/test';

// US-04: ค้นหาสินค้าด้วยคำค้นหา (UC-06)
// TC-017 .. TC-023 — จาก SPRS-Test-Cases.docx section 2.4

test.describe('2.4 ค้นหาสินค้าด้วยคำค้นหา', () => {
  test('TC-017: ค้นหาด้วยคำค้นหาที่มีสินค้าตรงกันสำเร็จ', async ({ page }) => {
    await page.goto('/search');
    await page.locator('[data-test="input-search"]').fill('มะม่วงหาว');
    await page.locator('[data-test="input-search"]').press('Enter');
    await expect(page.locator('[data-test="product-card"]').first()).toBeVisible();
  });

  test('TC-018: ค้นหาแล้วไม่พบสินค้าที่ตรงกับเงื่อนไข', async ({ page }) => {
    await page.goto('/search');
    await page.locator('[data-test="input-search"]').fill('มะพร้าว');
    await page.locator('[data-test="input-search"]').press('Enter');
    await expect(page.getByText('ไม่พบสินค้าที่คุณค้นหา')).toBeVisible();
    await expect(page.locator('[data-test="filteredProduct"]')).toContainText('พบสินค้า 0 รายการ');
  });

  test('TC-019: กรองสินค้าตามหมวดหมู่สำเร็จ', async ({ page }) => {
    await page.goto('/search');
    const resultCount = page.locator('[data-test="filteredProduct"]');
    const before = await resultCount.innerText();

    await page.locator('[data-test="category-soap"]').click();

    await expect(resultCount).not.toHaveText(before);
    const cards = page.locator('[data-test="product-card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('TC-020: กรองสินค้าตามช่วงราคาสำเร็จ', async ({ page }) => {
    await page.goto('/search');
    const resultCount = page.locator('[data-test="filteredProduct"]');
    const before = await resultCount.innerText();

    await page.locator('[data-test="input-min-price"]').fill('100');
    await page.locator('[data-test="input-max-price"]').fill('500');
    await page.locator('[data-test="apply-price-filter"]').click();

    // ต้องรอให้ผลลัพธ์กรองเสร็จก่อนอ่านราคา ไม่งั้น allInnerTexts() อาจอ่านทันก่อนหน้าอัปเดต
    await expect(resultCount).not.toHaveText(before);

    const prices = await page.locator('[data-test="product-card"] p.font-bold.text-blue-500').allInnerTexts();
    expect(prices.length).toBeGreaterThan(0);
    for (const p of prices) {
      const value = Number(p.replace(/[^\d]/g, ''));
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(500);
    }
  });

  test('TC-021: กรองหมวดหมู่ผ่าน URL โดยตรงสำเร็จ', async ({ page }) => {
    await page.goto('/search?category=promotion');
    await expect(page.locator('[data-test="product-card"]').first()).toBeVisible();
  });

  test('TC-022: ช่องค้นหาแบบย่อบน header กด Enter ทำงานถูกต้อง', async ({ page }) => {
    // แก้ไข: เคสนี้เคยถูกบันทึกผิดว่าเป็นบั๊ก (กด Enter ไม่ทำงาน) จากการเช็คด้วยเครื่องมือ
    // เบราว์เซอร์แบบ interactive ที่จำลองปุ่ม Enter ไม่ตรงกับ keyboard event จริง — ทดสอบซ้ำด้วย
    // Playwright .press('Enter') ตรงๆ (3 ครั้งติดกัน คนละ session) แล้วพบว่าทำงานถูกต้องทุกครั้ง
    await page.goto('/');
    await page.locator('[data-test="search"] svg').click();
    await page.locator('[data-test="search-input"]').fill('มะม่วงหาว');
    await page.locator('[data-test="search-input"]').press('Enter');

    await expect(page).toHaveURL(/\/search\?keyword=/);
    await expect(page.locator('[data-test="product-card"]').first()).toBeVisible();
  });

  test.fixme('TC-023: กรอกราคาต่ำสุดมากกว่าราคาสูงสุด', async ({ page }) => {
    // ยังไม่ได้ทดสอบสด — เป็น edge case ที่ควรตรวจก่อนขึ้นระบบจริง
    await page.goto('/search');
    await page.locator('[data-test="input-min-price"]').fill('500');
    await page.locator('[data-test="input-max-price"]').fill('100');
    await page.locator('[data-test="apply-price-filter"]').click();

    // คาดหวัง: ควรมีข้อความแจ้งเตือนค่าที่กรอกไม่ถูกต้อง หรือแสดงผลลัพธ์ว่าง — ยังไม่ยืนยันว่าจริงๆ แล้วออกมาแบบไหน
    await expect(page.locator('[data-test="filteredProduct"]')).toContainText('พบสินค้า 0 รายการ');
  });
});
