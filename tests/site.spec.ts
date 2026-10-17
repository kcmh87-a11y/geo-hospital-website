import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('홈의 서비스·프로젝트 동선과 로컬 이미지가 작동한다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI가 이해하는');
  await page.getByRole('link', { name: 'GEO 마케팅 알아보기' }).click();
  await expect(page).toHaveURL(/#services$/);
  await expect(page.locator('.service-card')).toHaveCount(6);
  await page.locator('.service-card').first().click();
  await expect(page.locator('#contact-service')).toHaveValue('1');
  await page.goto('/');
  await page.locator('.project-card').first().click();
  await expect(page).toHaveURL(/projects\/dental-care\/$/);
  await expect(page.getByRole('heading', { name: '샘플 산출물' })).toBeVisible();
  await expect(page.locator('.outline-tag')).toContainText('가상 프로젝트');
  expect(await page.locator('img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  expect(errors).toEqual([]);
});

test('칼럼 필터를 선택하고 본문과 구조화 데이터를 읽을 수 있다', async ({ page }) => {
  await page.goto('/insights/');
  await expect(page.locator('.insight-list .article-card')).toHaveCount(3);
  await page.getByRole('button', { name: '콘텐츠 전략', exact: true }).click();
  await expect(page.locator('[data-category]:visible')).toHaveCount(1);
  await expect(page.locator('#post-count')).toHaveText('1');
  await page.getByRole('heading', { name: '환자의 질문이 좋은 콘텐츠의 목차가 됩니다' }).click();
  await expect(page.locator('.prose h2').first()).toHaveText('질문을 진료 여정에 맞게 나누기');
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
  expect(schema['@type']).toBe('BlogPosting');
  expect(schema.headline).toBe(await page.locator('h1').innerText());
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /키워드/);
});

test('모바일 메뉴는 키보드로 닫히고 선택한 섹션으로 이동한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: '메뉴 열기' });
  await toggle.click();
  await expect(page.locator('#mobile-nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-nav')).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator('#mobile-nav').getByRole('link', { name: '전문 서비스' }).click();
  await expect(page).toHaveURL(/#services$/);
  await expect(page.locator('#mobile-nav')).toBeHidden();
});

test('문의는 필수 검증 후 문서로 저장되고 서버에 전송되지 않는다', async ({ page }) => {
  const posts: string[] = [];
  page.on('request', request => { if (request.method() === 'POST') posts.push(request.url()); });
  await page.goto('/contact/?type=agency');
  await expect(page.locator('#contact-service')).toHaveValue('6');
  await page.getByRole('button', { name: '문의 내용 정리하기' }).click();
  await expect(page.locator('#form-result')).toBeHidden();
  await page.getByLabel('성함', { exact: false }).fill('테스트 담당자');
  await page.getByLabel('병원명 / 회사명', { exact: false }).fill('샘플 대행사');
  await page.getByLabel('회신받을 이메일', { exact: false }).fill('test@example.test');
  await page.locator('#contact-message').fill('치과 콘텐츠 기획과 정기 원고 제작에 대해 협의하고 싶습니다.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '문의 내용 정리하기' }).click();
  await expect(page.locator('#form-result')).toBeVisible();
  await expect(page.locator('#form-result')).toContainText('아직 외부로 전송되지 않았습니다');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '파일로 저장' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('온율-상담문의.txt');
  const file = await readFile((await download.path())!, 'utf8');
  expect(file).toContain('샘플 대행사');
  expect(file).toContain('광고대행사 콘텐츠 제작 협업');
  expect(posts).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.getByLabel('성함', { exact: false }).fill('수정 담당자');
  await expect(page.locator('#form-result')).toBeHidden();
});

test('문의 내용 복사를 사용할 수 있다', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact/?service=2');
  await page.locator('#contact-name').fill('홍길동');
  await page.locator('#contact-company').fill('가상 의원');
  await page.locator('#contact-email').fill('hello@example.test');
  await page.locator('#contact-message').fill('AI 검색 친화형 콘텐츠 기획에 대해 문의합니다.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '문의 내용 정리하기' }).click();
  await page.getByRole('button', { name: '내용 복사', exact: true }).click();
  await expect(page.locator('.result-status')).toHaveText('문의 내용을 복사했습니다.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('가상 의원');
});

test('360px부터 데스크톱까지 가로 넘침 없이 이미지를 표시한다', async ({ page }) => {
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/contact/', '/insights/', '/projects/orthopedic-care/']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px ${path}`).toBe(true);
    }
  }
});

test('주요 페이지가 WCAG 2.2 AA 자동 접근성 점검을 통과한다', async ({ page }) => {
  for (const path of ['/', '/contact/', '/insights/', '/insights/what-is-hospital-geo/', '/projects/dental-care/']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    // Reveal scroll content before auditing to include every readable section.
    await page.locator('[data-reveal]').evaluateAll(elements=>elements.forEach(el=>el.classList.add('is-visible')));
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations, `${path}: ${JSON.stringify(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))}`).toEqual([]);
  }
});

test('전체 콘텐츠 경로와 안전한 기본 robots·사이트맵이 존재한다', async ({ request }) => {
  const routes = ['/', '/contact/', '/insights/', '/privacy/', '/projects/dental-care/', '/projects/orthopedic-care/', '/projects/internal-medicine/', '/insights/what-is-hospital-geo/', '/insights/patient-question-content/', '/insights/agency-geo-partnership/'];
  const titles = new Set<string>();
  for (const path of routes) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('lang="ko"');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('application/ld+json');
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    expect(title).toBeTruthy(); titles.add(title!);
  }
  expect(titles.size).toBe(routes.length);
  expect((await request.get('/robots.txt')).ok()).toBe(true);
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<urlset');
  expect((await request.get('/missing-page/')).status()).toBe(404);
});
